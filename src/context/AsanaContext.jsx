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
    const [selectedWorkspace, setSelectedWorkspace] = useState(null);
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

    const loadProjects = async (workspaceId = null) => {
        try {
            setLoading(true);
            setError(null);

            let endpoint;
            if (workspaceId) {
                endpoint = `/projects?workspace=${workspaceId}&opt_fields=name,notes,public,color,archived,created_at,modified_at,owner,workspace`;
            } else if (workspaces.length > 0) {
                // If no workspace specified, use the first one
                endpoint = `/projects?workspace=${workspaces[0].gid}&opt_fields=name,notes,public,color,archived,created_at,modified_at,owner,workspace`;
            } else {
                throw new Error('No workspace available');
            }

            const projectsData = await api.get(endpoint);
            setProjects(projectsData.data || []);
        } catch (err) {
            console.error('Error loading projects:', err);
            setError(`Failed to load projects: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const loadAllWorkspaceProjects = async () => {
        try {
            setLoading(true);
            setError(null);

            let allProjects = [];

            // Load projects from all workspaces
            for (const workspace of workspaces) {
                try {
                    const projectsData = await api.get(`/projects?workspace=${workspace.gid}&opt_fields=name,notes,public,color,archived,created_at,modified_at,owner,workspace`);
                    if (projectsData.data) {
                        // Add workspace info to each project
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
            setError(`Failed to load projects: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const loadUserData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Load user and workspaces data
            const [userData, workspacesData] = await Promise.all([
                api.get('/users/me'),
                api.get('/workspaces')
            ]);

            setUser(userData.data);
            setWorkspaces(workspacesData.data || []);

            if (workspacesData.data?.length > 0) {
                // Set the first workspace as selected by default
                const firstWorkspace = workspacesData.data[0];
                setSelectedWorkspace(firstWorkspace);

                // Load projects for the first workspace
                await loadProjects(firstWorkspace.gid);

                // Load workspace users
                try {
                    const usersData = await api.get(`/workspaces/${firstWorkspace.gid}/users`);
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

    const loadProjectTasks = async (project) => {
        try {
            setLoading(true);
            const tasksData = await api.get(`/tasks?project=${project.gid}&opt_fields=name,notes,completed,assignee,due_on,due_at,created_at,modified_at,custom_fields,tags`);
            setTasks(tasksData.data || []);
            setSelectedProject(project);
        } catch (err) {
            setError(`Failed to load tasks: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleWorkspaceChange = async (workspace) => {
        try {
            setSelectedWorkspace(workspace);

            if (workspace) {
                // Load projects for the selected workspace
                await loadProjects(workspace.gid);

                // Load workspace users
                try {
                    const usersData = await api.get(`/workspaces/${workspace.gid}/users`);
                    setWorkspaceUsers(usersData.data || []);
                } catch (usersError) {
                    console.warn('Failed to load workspace users:', usersError);
                    setWorkspaceUsers([]);
                }
            } else {
                // Load projects from all workspaces
                await loadAllWorkspaceProjects();

                // Load users from all workspaces
                let allUsers = [];
                for (const ws of workspaces) {
                    try {
                        const usersData = await api.get(`/workspaces/${ws.gid}/users`);
                        if (usersData.data) {
                            allUsers = [...allUsers, ...usersData.data];
                        }
                    } catch (usersError) {
                        console.warn(`Failed to load users from workspace ${ws.name}:`, usersError);
                    }
                }
                // Remove duplicates based on gid
                const uniqueUsers = allUsers.filter((user, index, arr) =>
                    arr.findIndex(u => u.gid === user.gid) === index
                );
                setWorkspaceUsers(uniqueUsers);
            }

            // Clear selected project and tasks when switching workspaces
            setSelectedProject(null);
            setTasks([]);

        } catch (err) {
            setError(`Failed to change workspace: ${err.message}`);
        }
    };

    const createProject = async (projectData) => {
        try {
            // If a workspace is selected, add it to the project data
            if (selectedWorkspace) {
                projectData.workspace = selectedWorkspace.gid;
            }

            await api.post('/projects', projectData);

            // Reload projects for current workspace context
            if (selectedWorkspace) {
                await loadProjects(selectedWorkspace.gid);
            } else {
                await loadAllWorkspaceProjects();
            }

            return true;
        } catch (error) {
            throw error;
        }
    };

    const updateProject = async (projectId, projectData) => {
        try {
            await api.put(`/projects/${projectId}`, projectData);

            // Reload projects for current workspace context
            if (selectedWorkspace) {
                await loadProjects(selectedWorkspace.gid);
            } else {
                await loadAllWorkspaceProjects();
            }

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
        // State
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

        // Functions
        loadUserData,
        loadProjects,
        loadAllWorkspaceProjects,
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

        // Setters
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