// context/AsanaContext.jsx - FIXED: Maintains page state during task updates
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AsanaContext = createContext();

export const useAsana = () => {
    const context = useContext(AsanaContext);
    if (!context) {
        throw new Error('useAsana must be used within an AsanaProvider');
    }
    return context;
};

export const AsanaProvider = ({ children }) => {
    // Your original state - UNCHANGED
    const [user, setUser] = useState(null);
    const [workspaces, setWorkspaces] = useState([]);
    const [projects, setProjects] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [workspaceUsers, setWorkspaceUsers] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [selectedWorkspace, setSelectedWorkspace] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [serverStatus, setServerStatus] = useState('checking');

    // Enhanced: Local MySQL server status and sync management
    const [localDBAvailable, setLocalDBAvailable] = useState(false);
    const [syncStatus, setSyncStatus] = useState('idle');
    const [queueStats, setQueueStats] = useState({ pending: 0, failed: 0, completed: 0 });

    // NEW: Track page state to prevent blank pages
    const [isUpdating, setIsUpdating] = useState(false);
    const [lastError, setLastError] = useState(null);

    console.log('🚀 AsanaProvider starting - Local MySQL First + Sync Queue...');

    // Local server configuration
    const LOCAL_SERVER_URL = import.meta.env.VITE_LOCAL_SERVER_URL || 'http://localhost:3002/api';

    // Enhanced: Check local MySQL server availability
    const checkLocalDB = async () => {
        try {
            const response = await fetch('http://localhost:3002/health', { timeout: 2000 });
            const isAvailable = response.ok;
            setLocalDBAvailable(isAvailable);

            if (isAvailable) {
                console.log('📦 Local MySQL server connected');
                // Get sync queue stats
                await updateQueueStats();
            } else {
                console.log('🌐 Local MySQL server unavailable');
            }
            return isAvailable;
        } catch (error) {
            setLocalDBAvailable(false);
            console.log('🌐 Local MySQL server not running - operating in online-only mode');
            return false;
        }
    };

    // NEW: Update sync queue statistics
    const updateQueueStats = async () => {
        if (!localDBAvailable) return;

        try {
            const response = await fetch(`${LOCAL_SERVER_URL}/sync/queue`);
            if (response.ok) {
                const data = await response.json();
                const stats = { pending: 0, failed: 0, completed: 0 };

                data.data.forEach(item => {
                    if (item.status === 'pending') stats.pending++;
                    else if (item.status === 'failed') stats.failed++;
                    else if (item.status === 'completed') stats.completed++;
                });

                setQueueStats(stats);
            }
        } catch (error) {
            console.warn('Failed to update queue stats:', error.message);
        }
    };

    // NEW: Smart server selection - Local MySQL first, then main server
    const makeRequest = async (method, endpoint, data = null) => {
        const isLocalEndpoint = (endpoint) => {
            return endpoint.includes('/workspaces') ||
                endpoint.includes('/projects') ||
                endpoint.includes('/tasks') ||
                endpoint.includes('/users');
        };

        // For data retrieval, try local MySQL first if available
        if (method === 'GET' && localDBAvailable && isLocalEndpoint(endpoint)) {
            try {
                const localUrl = `${LOCAL_SERVER_URL}${endpoint}`;
                const response = await fetch(localUrl);

                if (response.ok) {
                    const result = await response.json();
                    console.log(`📦 Loaded from local MySQL: ${endpoint}`);
                    return result;
                }
            } catch (localError) {
                console.warn(`Local MySQL failed for ${endpoint}, falling back to main server`);
            }
        }

        // Fallback to main server or for non-cacheable operations
        try {
            let result;
            switch (method) {
                case 'GET':
                    result = await api.get(endpoint);
                    break;
                case 'POST':
                    result = await api.post(endpoint, data);
                    break;
                case 'PUT':
                    result = await api.put(endpoint, data);
                    break;
                case 'DELETE':
                    result = await api.delete(endpoint);
                    break;
                default:
                    throw new Error(`Unsupported method: ${method}`);
            }
            console.log(`🌐 Loaded from main server: ${endpoint}`);
            return result;
        } catch (mainError) {
            // If both local and main server fail, throw the main server error
            throw mainError;
        }
    };

    // FIXED: Update local database directly and queue for sync with proper payload handling
    const updateLocalAndQueue = async (operation, resourceType, resourceId, data, priority = 'medium') => {
        if (!localDBAvailable) {
            // If local DB unavailable, go directly to main server
            return await makeRequest(operation, `/${resourceType}s/${resourceId}`, data);
        }

        try {
            // Clean the data payload - ensure it's in the right format for local server
            const cleanData = { ...data };

            // If data contains custom_fields object, flatten it to individual fields
            if (cleanData.custom_fields && typeof cleanData.custom_fields === 'object') {
                if (cleanData.custom_fields.priority) {
                    cleanData.priority = cleanData.custom_fields.priority;
                }
                if (cleanData.custom_fields.progress) {
                    cleanData.progress = cleanData.custom_fields.progress;
                }
                // Remove the custom_fields object since we've extracted the values
                delete cleanData.custom_fields;
            }

            console.log('📝 Cleaned data for local server:', cleanData);

            // 1. Update local database immediately
            let localEndpoint;
            let localMethod = operation;

            switch (resourceType) {
                case 'task':
                    localEndpoint = `${LOCAL_SERVER_URL}/tasks/${resourceId}`;
                    break;
                case 'project':
                    localEndpoint = `${LOCAL_SERVER_URL}/projects/${resourceId}`;
                    break;
                default:
                    throw new Error(`Unsupported resource type: ${resourceType}`);
            }

            // Update local database
            const localResponse = await fetch(localEndpoint, {
                method: localMethod,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cleanData)
            });

            if (localResponse.ok) {
                const result = await localResponse.json();
                console.log(`✅ Updated local ${resourceType} ${resourceId}`);

                // 2. Queue for main server sync (happens automatically in local server)
                console.log(`📤 Queued ${resourceType} ${resourceId} for main server sync`);

                // 3. Update queue stats quietly (don't block UI)
                setTimeout(() => updateQueueStats(), 100);

                return result;
            } else {
                const errorText = await localResponse.text();
                console.error(`❌ Local server error (${localResponse.status}):`, errorText);
                throw new Error(`Local update failed: ${localResponse.statusText}`);
            }

        } catch (localError) {
            console.error(`❌ Local update failed for ${resourceType} ${resourceId}:`, localError.message);

            // Fallback to direct main server update
            return await makeRequest(operation, `/${resourceType}s/${resourceId}`, data);
        }
    };

    // NEW: Process sync queue manually
    const processSyncQueue = async () => {
        if (!localDBAvailable) return false;

        try {
            setSyncStatus('syncing');
            const response = await fetch(`${LOCAL_SERVER_URL}/sync/process`, {
                method: 'POST'
            });

            if (response.ok) {
                const result = await response.json();
                console.log(`🔄 Processed ${result.processed} sync items, ${result.failed} failed`);

                await updateQueueStats();
                setSyncStatus(result.failed > 0 ? 'partial' : 'success');

                setTimeout(() => setSyncStatus('idle'), 3000);
                return true;
            } else {
                setSyncStatus('error');
                setTimeout(() => setSyncStatus('idle'), 3000);
                return false;
            }
        } catch (error) {
            console.error('❌ Sync queue processing failed:', error);
            setSyncStatus('error');
            setTimeout(() => setSyncStatus('idle'), 3000);
            return false;
        }
    };

    // Your original checkServerConnection - UNCHANGED
    const checkServerConnection = async () => {
        try {
            console.log('🔍 Checking server connection...');
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const response = await fetch('http://localhost:3001/api/users/me', {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            console.log('📡 Server response status:', response.status);

            if (response.ok) {
                setServerStatus('connected');
                return true;
            } else {
                const errorText = await response.text();
                setServerStatus('disconnected');
                setError(`Server error: ${response.status} - ${errorText}`);
                return false;
            }
        } catch (error) {
            setServerStatus('disconnected');
            if (error.name === 'AbortError') {
                setError('Connection timeout: Server took too long to respond');
            } else {
                setError(`Connection failed: ${error.message}`);
            }
            return false;
        }
    };

    // Enhanced: Load data with smart server selection
    const loadProjects = async (workspaceId = null, silent = false) => {
        try {
            if (!silent) setLoading(true);
            setError(null);

            let endpoint;
            if (workspaceId) {
                endpoint = `/workspaces/${workspaceId}/projects`;
            } else if (workspaces.length > 0) {
                endpoint = `/workspaces/${workspaces[0].gid}/projects`;
            } else {
                throw new Error('No workspace available');
            }

            const projectsData = await makeRequest('GET', endpoint);
            const projects = projectsData.data || [];
            setProjects(projects);

            console.log(`✅ Loaded ${projects.length} projects`);
        } catch (err) {
            console.error('Error loading projects:', err);
            if (!silent) {
                setError(`Failed to load projects: ${err.message}`);
            }
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const loadAllWorkspaceProjects = async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            setError(null);

            let allProjects = [];

            for (const workspace of workspaces) {
                try {
                    const projectsData = await makeRequest('GET', `/workspaces/${workspace.gid}/projects`);
                    if (projectsData.data) {
                        const projectsWithWorkspace = projectsData.data.map(project => ({
                            ...project,
                            workspace: workspace
                        }));
                        allProjects = [...allProjects, ...projectsWithWorkspace];
                    }
                } catch (workspaceError) {
                    console.warn(`Failed to load projects from workspace ${workspace.name}:`, workspaceError);
                }
            }

            setProjects(allProjects);
        } catch (err) {
            console.error('Error loading all workspace projects:', err);
            if (!silent) {
                setError(`Failed to load projects: ${err.message}`);
            }
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const loadUserData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [userData, workspacesData] = await Promise.all([
                makeRequest('GET', '/users/me'),
                makeRequest('GET', '/workspaces')
            ]);

            setUser(userData.data);
            setWorkspaces(workspacesData.data || []);

            if (workspacesData.data?.length > 0) {
                const firstWorkspace = workspacesData.data[0];
                setSelectedWorkspace(firstWorkspace);
                await loadProjects(firstWorkspace.gid);

                try {
                    const usersData = await makeRequest('GET', `/workspaces/${firstWorkspace.gid}/users`);
                    setWorkspaceUsers(usersData.data || []);
                } catch (usersError) {
                    console.warn('Failed to load workspace users:', usersError);
                    setWorkspaceUsers([]);
                }
            } else {
                setProjects([]);
                setWorkspaceUsers([]);
            }

        } catch (err) {
            setError(`Failed to load data: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // FIXED: Load project tasks without disrupting page state
    const loadProjectTasks = async (project, silent = false) => {
        try {
            if (!silent) setLoading(true);

            const tasksData = await makeRequest('GET', `/projects/${project.gid}/tasks`);
            const tasks = tasksData.data || [];
            setTasks(tasks);

            // Only update selected project if not doing a silent refresh
            if (!silent) {
                setSelectedProject(project);
            }

            console.log(`✅ Loaded ${tasks.length} tasks for project ${project.name}`);
        } catch (err) {
            const errorMsg = `Failed to load tasks: ${err.message}`;
            setLastError(errorMsg);
            if (!silent) {
                setError(errorMsg);
            }
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const handleWorkspaceChange = async (workspace) => {
        try {
            setSelectedWorkspace(workspace);

            if (workspace) {
                await loadProjects(workspace.gid);

                try {
                    const usersData = await makeRequest('GET', `/workspaces/${workspace.gid}/users`);
                    setWorkspaceUsers(usersData.data || []);
                } catch (usersError) {
                    console.warn('Failed to load workspace users:', usersError);
                    setWorkspaceUsers([]);
                }
            } else {
                await loadAllWorkspaceProjects();

                let allUsers = [];
                for (const ws of workspaces) {
                    try {
                        const usersData = await makeRequest('GET', `/workspaces/${ws.gid}/users`);
                        if (usersData.data) {
                            allUsers = [...allUsers, ...usersData.data];
                        }
                    } catch (usersError) {
                        console.warn(`Failed to load users from workspace ${ws.name}:`, usersError);
                    }
                }
                const uniqueUsers = allUsers.filter((user, index, arr) =>
                    arr.findIndex(u => u.gid === user.gid) === index
                );
                setWorkspaceUsers(uniqueUsers);
            }

            setSelectedProject(null);
            setTasks([]);

        } catch (err) {
            setError(`Failed to change workspace: ${err.message}`);
        }
    };

    const loadAllWorkspacesData = async () => {
        console.log('🔄 Loading all workspaces data...');
        try {
            setLoading(true);
            setError(null);

            if (workspaces.length === 0) {
                await loadUserData();
            }

            await loadAllWorkspaceProjects();

            console.log('✅ All workspaces data loaded');
        } catch (err) {
            console.error('❌ Error loading all workspaces data:', err);
            setError(`Failed to load all workspaces data: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // NEW: Pull all data from Asana and populate local database
    const pullAllDataFromAsana = async () => {
        if (!localDBAvailable) {
            console.log('📴 Local database not available for data pull');
            return false;
        }

        try {
            console.log('🚀 Starting full data pull from Asana to local database...');
            setSyncStatus('syncing');

            const response = await fetch(`${LOCAL_SERVER_URL}/sync/all`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                const result = await response.json();
                console.log('✅ Full data pull completed:', result.results);
                setSyncStatus('success');

                // Reload data from local database
                await loadUserData();

                setTimeout(() => setSyncStatus('idle'), 3000);
                return true;
            } else {
                console.error('❌ Data pull failed');
                setSyncStatus('error');
                setTimeout(() => setSyncStatus('idle'), 3000);
                return false;
            }
        } catch (error) {
            console.error('❌ Data pull error:', error);
            setSyncStatus('error');
            setTimeout(() => setSyncStatus('idle'), 3000);
            return false;
        }
    };

    // ENHANCED CRUD OPERATIONS - Local DB First + Sync Queue

    const createProject = async (projectData) => {
        try {
            console.log('🏗️ Creating project locally first:', projectData);

            if (selectedWorkspace) {
                projectData.workspace = selectedWorkspace.gid;
            }

            // Generate temporary local ID for immediate UI update
            const tempProjectId = `local_${Date.now()}`;
            const tempProject = {
                gid: tempProjectId,
                name: projectData.name,
                notes: projectData.notes || '',
                color: projectData.color || null,
                workspace: { gid: projectData.workspace },
                public: projectData.public || false,
                archived: projectData.archived || false,
                created_at: new Date().toISOString(),
                sync_status: 'pending'
            };

            // 1. Add to UI immediately (optimistic update)
            setProjects(prevProjects => [tempProject, ...prevProjects]);

            // 2. Try local MySQL first
            if (localDBAvailable) {
                try {
                    const response = await fetch(`${LOCAL_SERVER_URL}/projects`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            ...projectData,
                            gid: tempProjectId // Use temp ID for local storage
                        })
                    });

                    if (response.ok) {
                        console.log('✅ Project created in local MySQL and queued for sync');

                        // Update project status to show it's syncing
                        setProjects(prevProjects =>
                            prevProjects.map(p =>
                                p.gid === tempProjectId
                                    ? { ...p, sync_status: 'syncing' }
                                    : p
                            )
                        );

                        // Update queue stats
                        setTimeout(() => updateQueueStats(), 100);
                        return true;
                    }
                } catch (localError) {
                    console.warn('Local project creation failed, trying main server:', localError.message);
                }
            }

            // 3. Fallback to main server if local fails
            try {
                const result = await api.post('/projects', projectData);
                const newProject = result.data;

                // Replace temp project with real project from server
                setProjects(prevProjects =>
                    prevProjects.map(p =>
                        p.gid === tempProjectId
                            ? { ...newProject, sync_status: 'synced' }
                            : p
                    )
                );

                console.log('✅ Project created on main server');
                return true;
            } catch (serverError) {
                // Remove failed project from UI
                setProjects(prevProjects =>
                    prevProjects.filter(p => p.gid !== tempProjectId)
                );
                throw serverError;
            }

        } catch (error) {
            console.error('❌ Project creation failed:', error);
            throw error;
        }
    };

    const updateProject = async (projectId, projectData) => {
        try {
            // Update local DB first, then queue for sync
            await updateLocalAndQueue('PUT', 'project', projectId, projectData, 'high');

            // Refresh projects list silently
            if (selectedWorkspace) {
                await loadProjects(selectedWorkspace.gid, true);
            } else {
                await loadAllWorkspaceProjects(true);
            }

            return true;
        } catch (error) {
            throw error;
        }
    };

    const deleteProject = async (project) => {
        try {
            // Update local DB first, then queue for sync
            await updateLocalAndQueue('DELETE', 'project', project.gid, null, 'high');

            // Update UI immediately
            setProjects(projects.filter(p => p.gid !== project.gid));

            if (selectedProject?.gid === project.gid) {
                setTasks([]);
                setSelectedProject(null);
            }
            return true;
        } catch (error) {
            throw error;
        }
    };

    const createTask = async (taskData) => {
        try {
            console.log('📝 Creating task locally first:', taskData);

            // Generate temporary local ID for immediate UI update
            const tempTaskId = `local_${Date.now()}`;
            const tempTask = {
                gid: tempTaskId,
                name: taskData.name,
                notes: taskData.notes || '',
                completed: false,
                assignee: taskData.assignee ? { gid: taskData.assignee } : null,
                due_on: taskData.due_on || null,
                projects: Array.isArray(taskData.projects) ? taskData.projects.map(p => ({ gid: p })) : [{ gid: taskData.projects }],
                custom_fields: [],
                created_at: new Date().toISOString(),
                sync_status: 'pending'
            };

            // Handle custom fields properly
            if (taskData.custom_fields) {
                tempTask.priority = taskData.custom_fields.priority || 'Medium';
                tempTask.progress = taskData.custom_fields.progress || 'Not Started';

                // Create custom fields array for UI
                tempTask.custom_fields = [
                    {
                        gid: "1208011690719461",
                        name: "Priority",
                        type: "enum",
                        enum_value: { name: tempTask.priority }
                    },
                    {
                        gid: "1208011690719462",
                        name: "Task Progress",
                        type: "enum",
                        enum_value: { name: tempTask.progress }
                    }
                ];
            }

            // 1. Add to UI immediately (optimistic update)
            setTasks(prevTasks => [tempTask, ...prevTasks]);

            // 2. Try local MySQL first
            if (localDBAvailable) {
                try {
                    // Clean data for local server
                    const cleanTaskData = { ...taskData };

                    // Extract custom fields for local storage
                    if (cleanTaskData.custom_fields) {
                        if (cleanTaskData.custom_fields.priority) {
                            cleanTaskData.priority = cleanTaskData.custom_fields.priority;
                        }
                        if (cleanTaskData.custom_fields.progress) {
                            cleanTaskData.progress = cleanTaskData.custom_fields.progress;
                        }
                        delete cleanTaskData.custom_fields;
                    }

                    const response = await fetch(`${LOCAL_SERVER_URL}/tasks`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            ...cleanTaskData,
                            gid: tempTaskId // Use temp ID for local storage
                        })
                    });

                    if (response.ok) {
                        console.log('✅ Task created in local MySQL and queued for sync');

                        // Update task status to show it's syncing
                        setTasks(prevTasks =>
                            prevTasks.map(t =>
                                t.gid === tempTaskId
                                    ? { ...t, sync_status: 'syncing' }
                                    : t
                            )
                        );

                        // Update queue stats
                        setTimeout(() => updateQueueStats(), 100);
                        return true;
                    }
                } catch (localError) {
                    console.warn('Local task creation failed, trying main server:', localError.message);
                }
            }

            // 3. Fallback to main server if local fails
            try {
                const result = await api.post('/tasks', taskData);
                const newTask = result.data;

                // Replace temp task with real task from server
                setTasks(prevTasks =>
                    prevTasks.map(t =>
                        t.gid === tempTaskId
                            ? { ...newTask, sync_status: 'synced' }
                            : t
                    )
                );

                console.log('✅ Task created on main server');
                return true;
            } catch (serverError) {
                // Remove failed task from UI
                setTasks(prevTasks =>
                    prevTasks.filter(t => t.gid !== tempTaskId)
                );
                throw serverError;
            }

        } catch (error) {
            console.error('❌ Task creation failed:', error);
            throw error;
        }
    };

    // COMPLETELY FIXED: Local-first task updates that maintain page state
    const updateTask = async (taskId, taskData) => {
        try {
            console.log('📝 Updating task locally first:', taskId, taskData);
            setIsUpdating(true);
            setLastError(null);

            // 1. Create optimistic update
            const originalTasks = [...tasks];

            // Apply optimistic update to UI
            setTasks(prevTasks =>
                prevTasks.map(task => {
                    if (task.gid === taskId) {
                        const updatedTask = { ...task, ...taskData };

                        // Handle custom fields properly for UI
                        if (taskData.custom_fields) {
                            updatedTask.custom_fields = Array.isArray(task.custom_fields)
                                ? task.custom_fields.map(field => {
                                    if (field.name === 'Priority' && taskData.custom_fields.priority) {
                                        return { ...field, enum_value: { name: taskData.custom_fields.priority } };
                                    }
                                    if (field.name === 'Task Progress' && taskData.custom_fields.progress) {
                                        return { ...field, enum_value: { name: taskData.custom_fields.progress } };
                                    }
                                    return field;
                                })
                                : [];
                        }

                        return updatedTask;
                    }
                    return task;
                })
            );

            // 2. Clean the task data for local server
            const cleanTaskData = { ...taskData };

            // Handle custom fields properly
            if (cleanTaskData.custom_fields && typeof cleanTaskData.custom_fields === 'object') {
                // Extract priority and progress from custom_fields
                if (cleanTaskData.custom_fields.priority) {
                    cleanTaskData.priority = cleanTaskData.custom_fields.priority;
                }
                if (cleanTaskData.custom_fields.progress) {
                    cleanTaskData.progress = cleanTaskData.custom_fields.progress;
                }
                // Remove custom_fields object
                delete cleanTaskData.custom_fields;
            }

            // 3. Update local DB and queue for sync
            await updateLocalAndQueue('PUT', 'task', taskId, cleanTaskData, 'high');

            console.log('✅ Task updated locally and queued for sync');

            // 4. Optional: Silently refresh task data in background to sync with server
            if (selectedProject) {
                setTimeout(async () => {
                    try {
                        await loadProjectTasks(selectedProject, true);
                    } catch (refreshError) {
                        console.warn('Background task refresh failed:', refreshError.message);
                    }
                }, 1000);
            }

            return true;
        } catch (error) {
            console.error('❌ Task update failed:', error);
            setLastError(`Task update failed: ${error.message}`);

            // Revert optimistic update on error by refreshing from server
            if (selectedProject) {
                try {
                    await loadProjectTasks(selectedProject, true);
                } catch (refreshError) {
                    console.error('Failed to refresh tasks after error:', refreshError.message);
                }
            }
            throw error;
        } finally {
            setIsUpdating(false);
        }
    };

    const deleteTask = async (task) => {
        try {
            // Update local DB first, then queue for sync
            await updateLocalAndQueue('DELETE', 'task', task.gid, null, 'high');

            // Update UI immediately
            setTasks(tasks.filter(t => t.gid !== task.gid));
            return true;
        } catch (error) {
            throw error;
        }
    };

    // ENHANCED: Local-first task completion toggle that maintains page state
    const toggleTaskComplete = async (task) => {
        try {
            console.log('🔄 Toggling task completion locally first:', task.gid);

            const newCompleted = !task.completed;

            // 1. Update UI immediately (optimistic update)
            setTasks(prevTasks =>
                prevTasks.map(t =>
                    t.gid === task.gid ? { ...t, completed: newCompleted } : t
                )
            );

            // 2. Update local DB and queue for sync
            await updateLocalAndQueue('PUT', 'task', task.gid, { completed: newCompleted }, 'high');

            console.log('✅ Task completion toggled locally and queued for sync');
        } catch (error) {
            console.error('❌ Toggle completion failed:', error);

            // Revert on error
            setTasks(prevTasks =>
                prevTasks.map(t =>
                    t.gid === task.gid ? { ...t, completed: task.completed } : t
                )
            );
            throw error;
        }
    };

    // NEW: Quick task update functions for common operations
    const updateTaskPriority = async (taskId, priority) => {
        return await updateTask(taskId, {
            custom_fields: { priority }
        });
    };

    const updateTaskProgress = async (taskId, progress) => {
        return await updateTask(taskId, {
            custom_fields: { progress }
        });
    };

    // NEW: Refresh current data without changing page state
    const refreshCurrentData = async () => {
        try {
            if (selectedProject) {
                await loadProjectTasks(selectedProject, true);
            }
            if (selectedWorkspace) {
                await loadProjects(selectedWorkspace.gid, true);
            }
        } catch (error) {
            console.warn('Background refresh failed:', error.message);
        }
    };

    // Initialize local DB check
    useEffect(() => {
        checkLocalDB();
    }, []);

    // Auto-update queue stats every 30 seconds
    useEffect(() => {
        if (localDBAvailable) {
            const interval = setInterval(updateQueueStats, 30000);
            return () => clearInterval(interval);
        }
    }, [localDBAvailable]);

    // Your original initialization - UNCHANGED
    useEffect(() => {
        const initializeApp = async () => {
            const isConnected = await checkServerConnection();
            if (isConnected) {
                await loadUserData();
            } else {
                setError('Cannot connect to server at localhost:3001. Please make sure your server is running with "node server.js"');
                setLoading(false);
            }
        };

        const loadingTimeout = setTimeout(() => {
            if (loading && !user) {
                setError('Loading timeout: The application took too long to load. Please check your server connection.');
                setLoading(false);
            }
        }, 30000);

        initializeApp();

        return () => clearTimeout(loadingTimeout);
    }, []);

    const value = {
        // Your original state
        user,
        workspaces,
        projects,
        tasks,
        workspaceUsers,
        selectedProject,
        selectedWorkspace,
        loading,
        error,
        serverStatus,

        // Enhanced: Local DB and sync management
        localDBAvailable,
        syncStatus,
        queueStats,
        isUpdating,
        lastError,
        pullAllDataFromAsana,
        processSyncQueue,
        updateQueueStats,
        refreshCurrentData,

        // Your original functions
        loadUserData,
        loadProjects,
        loadAllWorkspaceProjects,
        loadAllWorkspacesData,
        loadProjectTasks,
        handleWorkspaceChange,
        createProject,
        updateProject,
        deleteProject,
        createTask,
        updateTask,
        deleteTask,
        toggleTaskComplete,
        checkServerConnection,

        // NEW: Enhanced task update functions
        updateTaskPriority,
        updateTaskProgress,

        // Your original setters
        setSelectedWorkspace,
        setError,
        setLoading,
        setServerStatus
    };

    return (
        <AsanaContext.Provider value={value}>
            {children}
        </AsanaContext.Provider>
    );
};