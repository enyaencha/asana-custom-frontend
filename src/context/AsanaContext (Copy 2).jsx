// context/AsanaContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { localDB } from '../utils/LocalDatabase.js';

const AsanaContext = createContext();

export const useAsana = () => {
    const context = useContext(AsanaContext);
    if (!context) {
        throw new Error('useAsana must be used within an AsanaProvider');
    }
    return context;
};

export const AsanaProvider = ({ children }) => {
    // Core state
    const [user, setUser] = useState(null);
    const [workspaces, setWorkspaces] = useState([]);
    const [projects, setProjects] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [workspaceUsers, setWorkspaceUsers] = useState([]);
    const [selectedWorkspace, setSelectedWorkspace] = useState(null);
    const [selectedProject, setSelectedProject] = useState(null);

    // Loading and error states
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [serverStatus, setServerStatus] = useState('checking');

    // Offline state
    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    const [syncStatus, setSyncStatus] = useState('idle');
    const [cacheInfo, setCacheInfo] = useState({});

    // API base URL
    const API_BASE = 'http://localhost:3001/api';

    // Initialize
    useEffect(() => {
        initializeApp();
        setupOfflineListeners();

        // Update cache info periodically
        const cacheInterval = setInterval(updateCacheInfo, 30000);
        return () => clearInterval(cacheInterval);
    }, []);

    const setupOfflineListeners = () => {
        const handleOnline = () => {
            setIsOffline(false);
            console.log('🌐 Back online');
            syncWithServer();
        };

        const handleOffline = () => {
            setIsOffline(true);
            console.log('📴 Gone offline');
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    };

    const initializeApp = async () => {
        try {
            setLoading(true);

            // Load data from local database first (instant UI)
            await loadFromLocalDatabase();

            // Check server connection
            const isServerOnline = await checkServerConnection();

            if (isServerOnline && navigator.onLine) {
                // Sync with server if online
                await syncWithServer();
            } else {
                // We're offline or server is down, use cached data
                console.log('📱 Working offline with cached data');
                setServerStatus('disconnected');
            }

        } catch (error) {
            console.error('Initialization error:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const loadFromLocalDatabase = async () => {
        try {
            // Load all data from local database
            const [cachedUser, cachedWorkspaces, cachedProjects, cachedTasks] = await Promise.all([
                localDB.getUsers().then(users => users[0] || null),
                localDB.getWorkspaces(),
                localDB.getProjects(),
                localDB.getTasks()
            ]);

            if (cachedUser) setUser(cachedUser);
            if (cachedWorkspaces.length > 0) setWorkspaces(cachedWorkspaces);
            if (cachedProjects.length > 0) setProjects(cachedProjects);
            if (cachedTasks.length > 0) setTasks(cachedTasks);

            console.log(`📱 Loaded from cache: ${cachedProjects.length} projects, ${cachedTasks.length} tasks`);

            // Update cache info
            await updateCacheInfo();

        } catch (error) {
            console.error('Error loading from local database:', error);
        }
    };

    const syncWithServer = async () => {
        if (!navigator.onLine) return;

        try {
            setSyncStatus('syncing');

            // Sync pending changes first
            await localDB.forceSyncAll();

            // Fetch fresh data from server
            await loadUserData();

            setSyncStatus('success');
            setTimeout(() => setSyncStatus('idle'), 2000);

        } catch (error) {
            console.error('Sync error:', error);
            setSyncStatus('error');
            setTimeout(() => setSyncStatus('idle'), 5000);
        }
    };

    const updateCacheInfo = async () => {
        try {
            const info = await localDB.getCacheInfo();
            setCacheInfo(info);
        } catch (error) {
            console.error('Error updating cache info:', error);
        }
    };

    const checkServerConnection = async () => {
        try {
            setServerStatus('checking');
            const response = await fetch(`${API_BASE}/health`, {
                method: 'GET',
                timeout: 5000
            });

            if (response.ok) {
                setServerStatus('connected');
                return true;
            } else {
                setServerStatus('disconnected');
                return false;
            }
        } catch (error) {
            setServerStatus('disconnected');
            return false;
        }
    };

    const makeRequest = async (endpoint, options = {}) => {
        const url = `${API_BASE}${endpoint}`;

        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`API Error ${endpoint}:`, error);
            throw error;
        }
    };

    // Enhanced data loading with caching
    const loadUserData = async () => {
        try {
            if (!navigator.onLine) {
                // Load from cache when offline
                await loadFromLocalDatabase();
                return;
            }

            // Fetch user info
            const userData = await makeRequest('/users/me');
            const userInfo = userData.data;
            await localDB.saveUser(userInfo);
            setUser(userInfo);

            // Fetch workspaces
            const workspacesData = await makeRequest('/workspaces');
            const workspacesList = workspacesData.data || [];

            for (const workspace of workspacesList) {
                await localDB.saveWorkspace(workspace);
            }
            setWorkspaces(workspacesList);

            // Load projects and tasks for first workspace
            if (workspacesList.length > 0) {
                const firstWorkspace = workspacesList[0];
                setSelectedWorkspace(firstWorkspace);
                await loadProjects(firstWorkspace.gid);
                await loadWorkspaceUsers(firstWorkspace.gid);
            }

        } catch (error) {
            console.error('Error loading user data:', error);
            // Fall back to cached data
            await loadFromLocalDatabase();
            throw error;
        }
    };

    const loadProjects = async (workspaceId) => {
        try {
            if (!navigator.onLine) {
                // Load from cache
                const cachedProjects = await localDB.getProjects(workspaceId);
                setProjects(cachedProjects);
                return;
            }

            const projectsData = await makeRequest(`/projects?workspace=${workspaceId}`);
            const projectsList = projectsData.data || [];

            // Save to local database
            for (const project of projectsList) {
                await localDB.saveProject(project);
            }

            setProjects(projectsList);

        } catch (error) {
            console.error('Error loading projects:', error);
            // Fall back to cached data
            const cachedProjects = await localDB.getProjects(workspaceId);
            setProjects(cachedProjects);
        }
    };

    const loadAllWorkspacesData = async () => {
        try {
            if (!navigator.onLine) {
                const cachedProjects = await localDB.getProjects();
                const cachedTasks = await localDB.getTasks();
                setProjects(cachedProjects);
                setTasks(cachedTasks);
                return;
            }

            const allProjects = [];
            const allTasks = [];

            for (const workspace of workspaces) {
                try {
                    const projectsData = await makeRequest(`/projects?workspace=${workspace.gid}`);
                    const workspaceProjects = projectsData.data || [];

                    for (const project of workspaceProjects) {
                        await localDB.saveProject(project);
                        allProjects.push(project);

                        // Load tasks for each project
                        try {
                            const tasksData = await makeRequest(`/tasks?project=${project.gid}`);
                            const projectTasks = tasksData.data || [];

                            for (const task of projectTasks) {
                                await localDB.saveTask(task);
                                allTasks.push(task);
                            }
                        } catch (taskError) {
                            console.error(`Error loading tasks for project ${project.gid}:`, taskError);
                        }
                    }
                } catch (projectError) {
                    console.error(`Error loading projects for workspace ${workspace.gid}:`, projectError);
                }
            }

            setProjects(allProjects);
            setTasks(allTasks);

        } catch (error) {
            console.error('Error loading all workspaces data:', error);
            // Fall back to cached data
            const cachedProjects = await localDB.getProjects();
            const cachedTasks = await localDB.getTasks();
            setProjects(cachedProjects);
            setTasks(cachedTasks);
        }
    };

    const loadProjectTasks = async (project) => {
        try {
            setSelectedProject(project);

            if (!navigator.onLine) {
                // Load from cache
                const cachedTasks = await localDB.getTasks(project.gid);
                setTasks(cachedTasks);
                return;
            }

            const tasksData = await makeRequest(`/tasks?project=${project.gid}`);
            const tasksList = tasksData.data || [];

            // Save to local database
            for (const task of tasksList) {
                await localDB.saveTask(task);
            }

            setTasks(tasksList);

        } catch (error) {
            console.error('Error loading project tasks:', error);
            // Fall back to cached data
            const cachedTasks = await localDB.getTasks(project.gid);
            setTasks(cachedTasks);
        }
    };

    const loadWorkspaceUsers = async (workspaceId) => {
        try {
            if (!navigator.onLine) {
                // Load from cache
                const cachedUsers = await localDB.getUsers();
                setWorkspaceUsers(cachedUsers);
                return;
            }

            const usersData = await makeRequest(`/workspaces/${workspaceId}/users`);
            const usersList = usersData.data || [];

            // Save to local database
            for (const user of usersList) {
                await localDB.saveUser(user);
            }

            setWorkspaceUsers(usersList);

        } catch (error) {
            console.error('Error loading workspace users:', error);
            // Fall back to cached data
            const cachedUsers = await localDB.getUsers();
            setWorkspaceUsers(cachedUsers);
        }
    };

    // Enhanced CRUD operations with offline support
    const createProject = async (projectData) => {
        try {
            // Generate temporary ID for offline creation
            const tempId = `temp_${Date.now()}`;
            const project = {
                ...projectData,
                gid: tempId,
                created_at: new Date().toISOString(),
                modified_at: new Date().toISOString(),
                isTemporary: true
            };

            // Save locally immediately
            await localDB.saveProject(project);

            // Update UI immediately
            setProjects(prev => [project, ...prev]);

            if (navigator.onLine) {
                try {
                    // Try to sync with server
                    const response = await makeRequest('/projects', {
                        method: 'POST',
                        body: JSON.stringify(projectData)
                    });

                    // Replace temporary project with real one
                    const realProject = response.data;
                    await localDB.saveProject(realProject);

                    setProjects(prev =>
                        prev.map(p => p.gid === tempId ? realProject : p)
                    );

                    console.log('✅ Project created and synced');
                } catch (syncError) {
                    console.log('📱 Project created offline, will sync later');
                    // Keep the temporary project, it will sync later
                }
            } else {
                console.log('📱 Project created offline, will sync when online');
            }

            return project;

        } catch (error) {
            console.error('Error creating project:', error);
            throw error;
        }
    };

    const updateProject = async (projectId, projectData) => {
        try {
            // Update locally immediately
            const updatedProject = {
                ...projectData,
                gid: projectId,
                modified_at: new Date().toISOString()
            };

            await localDB.saveProject(updatedProject);

            // Update UI immediately
            setProjects(prev =>
                prev.map(p => p.gid === projectId ? updatedProject : p)
            );

            console.log('✅ Project updated locally');
            return updatedProject;

        } catch (error) {
            console.error('Error updating project:', error);
            throw error;
        }
    };

    const deleteProject = async (project) => {
        try {
            // Remove locally immediately
            await localDB.deleteProject(project.gid);

            // Update UI immediately
            setProjects(prev => prev.filter(p => p.gid !== project.gid));

            // Also remove associated tasks
            const projectTasks = await localDB.getTasks(project.gid);
            for (const task of projectTasks) {
                await localDB.deleteTask(task.gid);
            }
            setTasks(prev => prev.filter(t => t.projectId !== project.gid));

            console.log('✅ Project deleted locally');

        } catch (error) {
            console.error('Error deleting project:', error);
            throw error;
        }
    };

    const createTask = async (taskData) => {
        try {
            // Generate temporary ID for offline creation
            const tempId = `temp_${Date.now()}`;
            const task = {
                ...taskData,
                gid: tempId,
                created_at: new Date().toISOString(),
                modified_at: new Date().toISOString(),
                completed: false,
                isTemporary: true
            };

            // Save locally immediately
            await localDB.saveTask(task);

            // Update UI immediately
            setTasks(prev => [task, ...prev]);

            console.log('✅ Task created locally');
            return task;

        } catch (error) {
            console.error('Error creating task:', error);
            throw error;
        }
    };

    const updateTask = async (taskId, taskData) => {
        try {
            // Get current task
            const currentTask = await localDB.getById('tasks', taskId);
            if (!currentTask) {
                throw new Error('Task not found');
            }

            // Update locally immediately
            const updatedTask = {
                ...currentTask,
                ...taskData,
                modified_at: new Date().toISOString()
            };

            await localDB.saveTask(updatedTask);

            // Update UI immediately
            setTasks(prev =>
                prev.map(t => t.gid === taskId ? updatedTask : t)
            );

            console.log('✅ Task updated locally');
            return updatedTask;

        } catch (error) {
            console.error('Error updating task:', error);
            throw error;
        }
    };

    const deleteTask = async (task) => {
        try {
            // Remove locally immediately
            await localDB.deleteTask(task.gid);

            // Update UI immediately
            setTasks(prev => prev.filter(t => t.gid !== task.gid));

            console.log('✅ Task deleted locally');

        } catch (error) {
            console.error('Error deleting task:', error);
            throw error;
        }
    };

    const toggleTaskComplete = async (task) => {
        try {
            const newCompleted = !task.completed;

            // Update locally using optimized field update
            await localDB.updateTaskField(task.gid, 'completed', newCompleted);

            // Update UI immediately
            setTasks(prev =>
                prev.map(t =>
                    t.gid === task.gid
                        ? { ...t, completed: newCompleted, modified_at: new Date().toISOString() }
                        : t
                )
            );

            console.log(`✅ Task ${newCompleted ? 'completed' : 'reopened'} locally`);

        } catch (error) {
            console.error('Error toggling task completion:', error);
            throw error;
        }
    };

    const updateTaskPriority = async (taskId, priority) => {
        try {
            // Update locally using optimized field update
            await localDB.updateTaskField(taskId, 'custom_fields', { priority });

            // Update UI immediately
            setTasks(prev =>
                prev.map(t => {
                    if (t.gid === taskId) {
                        const updatedCustomFields = t.custom_fields || [];
                        // Simulate the server response format
                        const priorityField = updatedCustomFields.find(f => f.name === "Priority") || {};
                        priorityField.name = "Priority";
                        priorityField.enum_value = { name: priority };

                        return {
                            ...t,
                            custom_fields: [
                                ...updatedCustomFields.filter(f => f.name !== "Priority"),
                                priorityField
                            ],
                            modified_at: new Date().toISOString()
                        };
                    }
                    return t;
                })
            );

            console.log(`✅ Task priority updated to ${priority} locally`);

        } catch (error) {
            console.error('Error updating task priority:', error);
            throw error;
        }
    };

    const updateTaskProgress = async (taskId, progress) => {
        try {
            // Update locally using optimized field update
            await localDB.updateTaskField(taskId, 'custom_fields', { progress });

            // Update UI immediately
            setTasks(prev =>
                prev.map(t => {
                    if (t.gid === taskId) {
                        const updatedCustomFields = t.custom_fields || [];
                        // Simulate the server response format
                        const progressField = updatedCustomFields.find(f => f.name === "Task Progress") || {};
                        progressField.name = "Task Progress";
                        progressField.enum_value = { name: progress };

                        return {
                            ...t,
                            custom_fields: [
                                ...updatedCustomFields.filter(f => f.name !== "Task Progress"),
                                progressField
                            ],
                            modified_at: new Date().toISOString()
                        };
                    }
                    return t;
                })
            );

            console.log(`✅ Task progress updated to ${progress} locally`);

        } catch (error) {
            console.error('Error updating task progress:', error);
            throw error;
        }
    };

    // Sync management functions
    const forceSyncNow = async () => {
        if (!navigator.onLine) {
            throw new Error('Cannot sync while offline');
        }

        setSyncStatus('syncing');
        try {
            await localDB.forceSyncAll();
            await syncWithServer(); // Refresh data from server
            setSyncStatus('success');
            console.log('✅ Force sync completed');
        } catch (error) {
            setSyncStatus('error');
            console.error('❌ Force sync failed:', error);
            throw error;
        }
    };

    const getSyncQueueStatus = () => {
        return localDB.getSyncQueueStatus();
    };

    const clearSyncQueue = async () => {
        await localDB.clearFailedSyncItems();
        await updateCacheInfo();
    };

    const updateSyncSettings = async (settings) => {
        await localDB.updateSyncSettings(settings);
        await updateCacheInfo();
    };

    const clearLocalCache = async () => {
        await localDB.clearCache();
        setProjects([]);
        setTasks([]);
        setWorkspaceUsers([]);
        await updateCacheInfo();
        console.log('🗑️ Local cache cleared');
    };

    // Helper functions for workspace management
    const handleWorkspaceChange = async (workspace) => {
        setSelectedWorkspace(workspace);
        if (workspace) {
            await loadProjects(workspace.gid);
            await loadWorkspaceUsers(workspace.gid);
        } else {
            await loadAllWorkspacesData();
        }
    };

    const contextValue = {
        // Core state
        user,
        workspaces,
        projects,
        tasks,
        workspaceUsers,
        selectedWorkspace,
        selectedProject,

        // Loading and error states
        loading,
        error,
        serverStatus,

        // Offline state
        isOffline,
        syncStatus,
        cacheInfo,

        // Core functions
        checkServerConnection,
        loadUserData,
        loadProjects,
        loadAllWorkspacesData,
        loadProjectTasks,
        loadWorkspaceUsers,
        handleWorkspaceChange,

        // CRUD operations
        createProject,
        updateProject,
        deleteProject,
        createTask,
        updateTask,
        deleteTask,
        toggleTaskComplete,
        updateTaskPriority,
        updateTaskProgress,

        // Sync management
        forceSyncNow,
        getSyncQueueStatus,
        clearSyncQueue,
        updateSyncSettings,
        clearLocalCache,
        updateCacheInfo,

        // Setters
        setSelectedWorkspace,
        setSelectedProject,
        setError,
        setServerStatus
    };

    return (
        <AsanaContext.Provider value={contextValue}>
            {children}
        </AsanaContext.Provider>
    );
};