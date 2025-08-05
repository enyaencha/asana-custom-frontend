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
    const [user, setUser] = useState(null);
    const [workspaces, setWorkspaces] = useState([]);
    const [projects, setProjects] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [workspaceUsers, setWorkspaceUsers] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [serverStatus, setServerStatus] = useState('checking');

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

    const loadUserData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [userData, workspacesData] = await Promise.all([
                api.get('/users/me'),
                api.get('/workspaces')
            ]);

            setUser(userData.data);
            setWorkspaces(workspacesData.data);

            if (workspacesData.data?.length > 0) {
                const workspaceId = workspacesData.data[0].gid;

                const [projectsData, usersData] = await Promise.all([
                    api.get(`/projects?workspace=${workspaceId}&opt_fields=name,notes,public,color,archived,created_at,modified_at,owner`),
                    api.get(`/workspaces/${workspaceId}/users`)
                ]);

                setProjects(projectsData.data || []);
                setWorkspaceUsers(usersData.data || []);
            } else {
                setProjects([]);
                setWorkspaceUsers([]);
            }

            setLoading(false);
        } catch (err) {
            setError(`Failed to load data: ${err.message}`);
            setLoading(false);
        }
    };

    const loadProjectTasks = async (project) => {
        try {
            setLoading(true);
            const tasksData = await api.get(`/tasks?project=${project.gid}&opt_fields=name,notes,completed,assignee,due_on,due_at,created_at,modified_at,priority,tags`);
            setTasks(tasksData.data || []);
            setSelectedProject(project);
            setLoading(false);
        } catch (err) {
            setError(`Failed to load tasks: ${err.message}`);
            setLoading(false);
        }
    };

    const createProject = async (projectData) => {
        try {
            await api.post('/projects', projectData);
            await loadUserData();
            return true;
        } catch (error) {
            throw error;
        }
    };

    const updateProject = async (projectId, projectData) => {
        try {
            await api.put(`/projects/${projectId}`, projectData);
            await loadUserData();
            return true;
        } catch (error) {
            throw error;
        }
    };

    const deleteProject = async (project) => {
        try {
            await api.delete(`/projects/${project.gid}`);
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
            await api.post('/tasks', taskData);
            if (selectedProject) {
                await loadProjectTasks(selectedProject);
            }
            return true;
        } catch (error) {
            throw error;
        }
    };

    const updateTask = async (taskId, taskData) => {
        try {
            await api.put(`/tasks/${taskId}`, taskData);
            if (selectedProject) {
                await loadProjectTasks(selectedProject);
            }
            return true;
        } catch (error) {
            throw error;
        }
    };

    const deleteTask = async (task) => {
        try {
            await api.delete(`/tasks/${task.gid}`);
            setTasks(tasks.filter(t => t.gid !== task.gid));
            return true;
        } catch (error) {
            throw error;
        }
    };

    const toggleTaskComplete = async (task) => {
        try {
            await api.put(`/tasks/${task.gid}`, { completed: !task.completed });
            setTasks(tasks.map(t =>
                t.gid === task.gid ? { ...t, completed: !t.completed } : t
            ));
        } catch (error) {
            throw error;
        }
    };

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
        user,
        workspaces,
        projects,
        tasks,
        workspaceUsers,
        selectedProject,
        loading,
        error,
        serverStatus,

        loadUserData,
        loadProjectTasks,
        createProject,
        updateProject,
        deleteProject,
        createTask,
        updateTask,
        deleteTask,
        toggleTaskComplete,
        checkServerConnection,

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
