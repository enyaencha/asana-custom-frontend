// context/AsanaContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const AsanaContext = createContext(null);

// Move hook outside of the component for Vite compatibility
const useAsana = () => {
    const context = useContext(AsanaContext);
    if (!context) {
        throw new Error('useAsana must be used within an AsanaProvider');
    }
    return context;
};

// Main provider component
function AsanaProvider({ children }) {
    console.log('🚀 AsanaProvider starting...');

    // Basic state
    const [users, setUsers] = useState([]);
    const [workspaces, setWorkspaces] = useState([]);
    const [projects, setProjects] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [currentWorkspace, setCurrentWorkspace] = useState(null);
    const [currentProject, setCurrentProject] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    // API Configuration
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

    console.log('✅ State initialized, API URL:', API_BASE_URL);

    // Helper function to make API calls
    const makeApiCall = async (endpoint, options = {}) => {
        const url = `${API_BASE_URL}${endpoint}`;
        console.log(`🌐 API Call: ${options.method || 'GET'} ${url}`);

        try {
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
                ...options,
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log(`✅ API Success: ${endpoint}`);
            return data;
        } catch (error) {
            console.error(`❌ API Error: ${endpoint}`, error.message);
            throw error;
        }
    };

    // Load users
    const loadUsers = async () => {
        console.log('👥 Loading users...');
        setLoading(true);
        setError(null);

        try {
            const response = await makeApiCall('/users');
            const userData = response.data || [];
            setUsers(userData);
            console.log(`✅ Loaded ${userData.length} users`);
        } catch (error) {
            console.error('❌ Error loading users:', error);
            setError('Failed to load users: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Load workspaces
    const loadWorkspaces = async () => {
        console.log('🏢 Loading workspaces...');
        setLoading(true);
        setError(null);

        try {
            const response = await makeApiCall('/workspaces');
            const workspaceData = response.data || [];
            setWorkspaces(workspaceData);

            // Set first workspace as current if none selected
            if (workspaceData.length > 0 && !currentWorkspace) {
                setCurrentWorkspace(workspaceData[0]);
                console.log('🎯 Set current workspace:', workspaceData[0].name);
            }

            console.log(`✅ Loaded ${workspaceData.length} workspaces`);
        } catch (error) {
            console.error('❌ Error loading workspaces:', error);
            setError('Failed to load workspaces: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Load projects
    const loadProjects = async (workspaceGid = null) => {
        const targetWorkspace = workspaceGid || currentWorkspace?.gid;
        if (!targetWorkspace) {
            console.log('⚠️ No workspace selected for loading projects');
            return;
        }

        console.log(`📁 Loading projects for workspace: ${targetWorkspace}`);
        setLoading(true);
        setError(null);

        try {
            const response = await makeApiCall(`/workspaces/${targetWorkspace}/projects`);
            const projectData = response.data || [];
            setProjects(projectData);
            console.log(`✅ Loaded ${projectData.length} projects`);
        } catch (error) {
            console.error('❌ Error loading projects:', error);
            setError('Failed to load projects: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Load tasks
    const loadTasks = async (projectGid = null) => {
        const targetProject = projectGid || currentProject?.gid;
        if (!targetProject) {
            console.log('⚠️ No project selected for loading tasks');
            return;
        }

        console.log(`📋 Loading tasks for project: ${targetProject}`);
        setLoading(true);
        setError(null);

        try {
            const response = await makeApiCall(`/projects/${targetProject}/tasks`);
            const taskData = response.data || [];
            setTasks(taskData);
            console.log(`✅ Loaded ${taskData.length} tasks`);
        } catch (error) {
            console.error('❌ Error loading tasks:', error);
            setError('Failed to load tasks: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Simple task operations
    const updateTaskPriority = async (taskId, priority) => {
        console.log(`🎯 Updating task ${taskId} priority to: ${priority}`);

        // Update local state immediately
        setTasks(prevTasks =>
            prevTasks.map(task =>
                task.gid === taskId ? { ...task, priority } : task
            )
        );

        try {
            await makeApiCall(`/tasks/${taskId}`, {
                method: 'PUT',
                body: JSON.stringify({ priority })
            });
            console.log('✅ Priority updated successfully');
        } catch (error) {
            console.error('❌ Failed to update priority:', error);
        }
    };

    const updateTaskProgress = async (taskId, progress) => {
        console.log(`🎯 Updating task ${taskId} progress to: ${progress}`);

        // Update local state immediately
        setTasks(prevTasks =>
            prevTasks.map(task =>
                task.gid === taskId ? { ...task, progress } : task
            )
        );

        try {
            await makeApiCall(`/tasks/${taskId}`, {
                method: 'PUT',
                body: JSON.stringify({ progress })
            });
            console.log('✅ Progress updated successfully');
        } catch (error) {
            console.error('❌ Failed to update progress:', error);
        }
    };

    const toggleTaskComplete = async (task) => {
        const newStatus = !task.completed;
        console.log(`🎯 Toggling task ${task.gid} completion to: ${newStatus}`);

        // Update local state immediately
        setTasks(prevTasks =>
            prevTasks.map(t =>
                t.gid === task.gid ? { ...t, completed: newStatus } : t
            )
        );

        try {
            await makeApiCall(`/tasks/${task.gid}`, {
                method: 'PUT',
                body: JSON.stringify({ completed: newStatus })
            });
            console.log('✅ Task completion toggled successfully');
        } catch (error) {
            console.error('❌ Failed to toggle completion:', error);
        }
    };

    const createTask = async (taskData) => {
        console.log('📝 Creating new task:', taskData.name);

        const tempId = `temp_${Date.now()}`;
        const newTask = {
            ...taskData,
            gid: tempId,
            created_at: new Date().toISOString()
        };

        // Add to local state immediately
        setTasks(prevTasks => [newTask, ...prevTasks]);

        try {
            const response = await makeApiCall('/tasks', {
                method: 'POST',
                body: JSON.stringify(taskData)
            });

            const createdTask = response.data;

            // Update local state with real task data
            setTasks(prevTasks =>
                prevTasks.map(task =>
                    task.gid === tempId ? createdTask : task
                )
            );

            console.log('✅ Task created successfully');
            return createdTask;
        } catch (error) {
            console.error('❌ Failed to create task:', error);
            // Remove the temp task on error
            setTasks(prevTasks =>
                prevTasks.filter(task => task.gid !== tempId)
            );
            throw error;
        }
    };

    const updateTask = async (taskId, taskData) => {
        console.log('📝 Updating task:', taskId);

        // Update local state immediately
        setTasks(prevTasks =>
            prevTasks.map(task =>
                task.gid === taskId ? { ...task, ...taskData } : task
            )
        );

        try {
            const response = await makeApiCall(`/tasks/${taskId}`, {
                method: 'PUT',
                body: JSON.stringify(taskData)
            });

            const updatedTask = response.data;

            // Update local state with server response
            setTasks(prevTasks =>
                prevTasks.map(task =>
                    task.gid === taskId ? updatedTask : task
                )
            );

            console.log('✅ Task updated successfully');
            return updatedTask;
        } catch (error) {
            console.error('❌ Failed to update task:', error);
            throw error;
        }
    };

    const deleteTask = async (taskId) => {
        console.log('🗑️ Deleting task:', taskId);

        // Remove from local state immediately
        const taskToDelete = tasks.find(t => t.gid === taskId);
        setTasks(prevTasks => prevTasks.filter(task => task.gid !== taskId));

        try {
            await makeApiCall(`/tasks/${taskId}`, {
                method: 'DELETE'
            });
            console.log('✅ Task deleted successfully');
        } catch (error) {
            console.error('❌ Failed to delete task:', error);
            // Restore task on error
            if (taskToDelete) {
                setTasks(prevTasks => [taskToDelete, ...prevTasks]);
            }
            throw error;
        }
    };

    // Workspace/Project switching
    const switchWorkspace = async (workspace) => {
        console.log('🔄 Switching to workspace:', workspace.name);
        setCurrentWorkspace(workspace);
        setCurrentProject(null);
        setProjects([]);
        setTasks([]);
        await loadProjects(workspace.gid);
    };

    const switchProject = async (project) => {
        console.log('🔄 Switching to project:', project.name);
        setCurrentProject(project);
        setTasks([]);
        await loadTasks(project.gid);
    };

    // Debug function
    const debugContextState = () => {
        const state = {
            users: users.length,
            workspaces: workspaces.length,
            projects: projects.length,
            tasks: tasks.length,
            currentWorkspace: currentWorkspace?.name,
            currentProject: currentProject?.name,
            loading,
            error,
            isOnline
        };
        console.log('🐛 Context State:', state);
        return state;
    };

    // Initialize on mount
    useEffect(() => {
        console.log('🚀 AsanaContext mounting, loading initial data...');
        loadUsers();
        loadWorkspaces();
    }, []);

    // Monitor online status
    useEffect(() => {
        const handleOnline = () => {
            console.log('🌐 Connection restored');
            setIsOnline(true);
        };

        const handleOffline = () => {
            console.log('📴 Connection lost');
            setIsOnline(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const contextValue = {
        // State
        users,
        workspaces,
        projects,
        tasks,
        currentWorkspace,
        currentProject,
        loading,
        error,
        isOnline,

        // Navigation
        switchWorkspace,
        switchProject,

        // Data loading
        loadUsers,
        loadWorkspaces,
        loadProjects,
        loadTasks,

        // Task operations
        updateTaskPriority,
        updateTaskProgress,
        toggleTaskComplete,
        createTask,
        updateTask,
        deleteTask,

        // Debug
        debugContextState
    };

    console.log('✅ AsanaProvider context value created');

    return (
        <AsanaContext.Provider value={contextValue}>
            {children}
        </AsanaContext.Provider>
    );
}

// Named exports for Vite compatibility
export { AsanaProvider, useAsana };