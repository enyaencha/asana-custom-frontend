import React, { useState, useEffect } from 'react';
import api from './services/api';
import Modal from './components/Modal';
import ProjectForm from './components/ProjectForm';
import TaskForm from './components/TaskForm';
import ProjectCard from './components/ProjectCard';
import TaskItem from './components/TaskItem';

function App() {
    // State management
    const [user, setUser] = useState(null);
    const [workspaces, setWorkspaces] = useState([]);
    const [projects, setProjects] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [workspaceUsers, setWorkspaceUsers] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [currentView, setCurrentView] = useState('dashboard');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Modal states
    const [showProjectModal, setShowProjectModal] = useState(false);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const [editingTask, setEditingTask] = useState(null);

    // Check if API token is available
    const hasToken = import.meta.env.VITE_ASANA_TOKEN;

    if (!hasToken) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f8f9fa'
            }}>
                <div style={{
                    backgroundColor: 'white',
                    padding: '3rem',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    maxWidth: '500px',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔑</div>
                    <h1 style={{
                        color: '#e53e3e',
                        fontSize: '1.5rem',
                        fontWeight: '600',
                        marginBottom: '1rem'
                    }}>
                        API Token Required
                    </h1>
                    <p style={{
                        color: '#718096',
                        marginBottom: '2rem',
                        lineHeight: '1.6'
                    }}>
                        Please add your Asana Personal Access Token to the .env file to get started.
                    </p>
                    <code style={{
                        display: 'block',
                        padding: '1rem',
                        backgroundColor: '#1a202c',
                        color: '#e2e8f0',
                        borderRadius: '6px',
                        fontSize: '0.875rem'
                    }}>
                        VITE_ASANA_TOKEN=your_token_here
                    </code>
                </div>
            </div>
        );
    }

    // Load initial data
    useEffect(() => {
        loadUserData();
    }, []);

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

            // Load projects and users from first workspace
            if (workspacesData.data.length > 0) {
                const workspaceId = workspacesData.data[0].gid;
                const [projectsData, usersData] = await Promise.all([
                    api.get(`/projects?workspace=${workspaceId}`),
                    api.get(`/workspaces/${workspaceId}/users`)
                ]);
                setProjects(projectsData.data);
                setWorkspaceUsers(usersData.data);
            }

            setLoading(false);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    const loadProjectTasks = async (project) => {
        try {
            setLoading(true);
            const tasksData = await api.get(`/tasks?project=${project.gid}`);
            setTasks(tasksData.data);
            setSelectedProject(project);
            setCurrentView('tasks');
            setLoading(false);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    // Project CRUD operations
    const handleCreateProject = () => {
        setEditingProject(null);
        setShowProjectModal(true);
    };

    const handleEditProject = (project) => {
        setEditingProject(project);
        setShowProjectModal(true);
    };

    const handleDeleteProject = async (project) => {
        if (!confirm(`Are you sure you want to delete "${project.name}"?`)) {
            return;
        }

        try {
            await api.delete(`/projects/${project.gid}`);
            await loadUserData();
        } catch (err) {
            alert(`Error deleting project: ${err.message}`);
        }
    };

    const handleArchiveProject = async (project) => {
        try {
            await api.put(`/projects/${project.gid}`, { archived: !project.archived });
            await loadUserData();
        } catch (err) {
            alert(`Error archiving project: ${err.message}`);
        }
    };

    const handleSaveProject = async () => {
        setShowProjectModal(false);
        setEditingProject(null);
        await loadUserData();
    };

    // Task CRUD operations
    const handleCreateTask = () => {
        setEditingTask(null);
        setShowTaskModal(true);
    };

    const handleEditTask = (task) => {
        setEditingTask(task);
        setShowTaskModal(true);
    };

    const handleDeleteTask = async (task) => {
        if (!confirm(`Are you sure you want to delete "${task.name}"?`)) {
            return;
        }

        try {
            await api.delete(`/tasks/${task.gid}`);
            if (selectedProject) {
                await loadProjectTasks(selectedProject);
            }
        } catch (err) {
            alert(`Error deleting task: ${err.message}`);
        }
    };

    const handleToggleTaskComplete = async (task) => {
        try {
            await api.put(`/tasks/${task.gid}/toggle`, { completed: !task.completed });
            if (selectedProject) {
                await loadProjectTasks(selectedProject);
            }
        } catch (err) {
            alert(`Error updating task: ${err.message}`);
        }
    };

    const handleSaveTask = async () => {
        setShowTaskModal(false);
        setEditingTask(null);
        if (selectedProject) {
            await loadProjectTasks(selectedProject);
        }
    };

    // Loading state
    if (loading && !user) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                backgroundColor: '#f8f9fa'
            }}>
                <div style={{ textAlign: 'center', color: '#666' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔄</div>
                    <p style={{ fontSize: '1.25rem' }}>Loading your Asana data...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error && !user) {
        return (
            <div style={{ padding: '2rem', backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
                <div style={{
                    padding: '2rem',
                    backgroundColor: '#f8d7da',
                    borderRadius: '8px',
                    color: '#721c24',
                    textAlign: 'center'
                }}>
                    <h2>❌ Connection Error</h2>
                    <p>{error}</p>
                    <button
                        onClick={loadUserData}
                        style={{
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            marginTop: '1rem'
                        }}
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    const completedTasks = tasks.filter(t => t.completed).length;
    const pendingTasks = tasks.filter(t => !t.completed).length;

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
            {/* Header */}
            <header style={{
                backgroundColor: 'white',
                borderBottom: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                padding: '1rem 2rem'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    maxWidth: '1400px',
                    margin: '0 auto'
                }}>
                    <h1 style={{
                        fontSize: '1.75rem',
                        fontWeight: '700',
                        color: '#2d3748',
                        margin: 0
                    }}>
                        🚀 Custom Asana Dashboard
                    </h1>
                    <div style={{ color: '#718096', fontWeight: '500' }}>
                        Welcome, {user?.name}! 👋
                    </div>
                </div>
            </header>

            <div style={{ display: 'flex', minHeight: 'calc(100vh - 80px)' }}>
                {/* Sidebar */}
                <aside style={{
                    width: '280px',
                    backgroundColor: 'white',
                    borderRight: '1px solid #e2e8f0',
                    padding: '2rem 0'
                }}>
                    <nav>
                        <button
                            onClick={() => setCurrentView('dashboard')}
                            style={{
                                display: 'block',
                                width: '100%',
                                padding: '0.75rem 2rem',
                                textAlign: 'left',
                                background: currentView === 'dashboard' ? '#ebf8ff' : 'none',
                                border: 'none',
                                borderLeft: currentView === 'dashboard' ? '3px solid #3182ce' : '3px solid transparent',
                                color: currentView === 'dashboard' ? '#3182ce' : '#4a5568',
                                cursor: 'pointer',
                                fontSize: '1rem',
                                fontWeight: currentView === 'dashboard' ? '600' : '400'
                            }}
                        >
                            📊 Dashboard
                        </button>
                        <button
                            onClick={() => setCurrentView('projects')}
                            style={{
                                display: 'block',
                                width: '100%',
                                padding: '0.75rem 2rem',
                                textAlign: 'left',
                                background: currentView === 'projects' ? '#ebf8ff' : 'none',
                                border: 'none',
                                borderLeft: currentView === 'projects' ? '3px solid #3182ce' : '3px solid transparent',
                                color: currentView === 'projects' ? '#3182ce' : '#4a5568',
                                cursor: 'pointer',
                                fontSize: '1rem',
                                fontWeight: currentView === 'projects' ? '600' : '400'
                            }}
                        >
                            📁 Projects ({projects.length})
                        </button>
                        {selectedProject && (
                            <button
                                onClick={() => setCurrentView('tasks')}
                                style={{
                                    display: 'block',
                                    width: '100%',
                                    padding: '0.75rem 2rem',
                                    textAlign: 'left',
                                    background: currentView === 'tasks' ? '#ebf8ff' : 'none',
                                    border: 'none',
                                    borderLeft: currentView === 'tasks' ? '3px solid #3182ce' : '3px solid transparent',
                                    color: currentView === 'tasks' ? '#3182ce' : '#4a5568',
                                    cursor: 'pointer',
                                    fontSize: '1rem',
                                    fontWeight: currentView === 'tasks' ? '600' : '400'
                                }}
                            >
                                ✅ Tasks ({tasks.length})
                            </button>
                        )}
                    </nav>
                </aside>

                {/* Main Content */}
                <main style={{ flex: 1, padding: '2rem' }}>
                    {error && (
                        <div style={{
                            padding: '1rem',
                            backgroundColor: '#f8d7da',
                            borderRadius: '6px',
                            color: '#721c24',
                            marginBottom: '1rem'
                        }}>
                            Error: {error}
                        </div>
                    )}

                    {currentView === 'dashboard' && (
                        <div>
                            <h2 style={{
                                fontSize: '2rem',
                                fontWeight: '600',
                                color: '#2d3748',
                                marginBottom: '2rem'
                            }}>
                                📊 Dashboard Overview
                            </h2>

                            {/* Stats Grid */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                                gap: '1.5rem',
                                marginBottom: '3rem'
                            }}>
                                <div style={{
                                    backgroundColor: 'white',
                                    padding: '2rem',
                                    borderRadius: '12px',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                    textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏢</div>
                                    <h3 style={{ color: '#718096', fontSize: '0.875rem', fontWeight: '600', margin: '0 0 0.5rem 0' }}>WORKSPACES</h3>
                                    <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#3182ce' }}>{workspaces.length}</div>
                                </div>
                                <div style={{
                                    backgroundColor: 'white',
                                    padding: '2rem',
                                    borderRadius: '12px',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                    textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📁</div>
                                    <h3 style={{ color: '#718096', fontSize: '0.875rem', fontWeight: '600', margin: '0 0 0.5rem 0' }}>PROJECTS</h3>
                                    <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#48bb78' }}>{projects.length}</div>
                                </div>
                                <div style={{
                                    backgroundColor: 'white',
                                    padding: '2rem',
                                    borderRadius: '12px',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                    textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
                                    <h3 style={{ color: '#718096', fontSize: '0.875rem', fontWeight: '600', margin: '0 0 0.5rem 0' }}>PENDING TASKS</h3>
                                    <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#ed8936' }}>{pendingTasks}</div>
                                </div>
                                <div style={{
                                    backgroundColor: 'white',
                                    padding: '2rem',
                                    borderRadius: '12px',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                    textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
                                    <h3 style={{ color: '#718096', fontSize: '0.875rem', fontWeight: '600', margin: '0 0 0.5rem 0' }}>COMPLETED</h3>
                                    <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#38a169' }}>{completedTasks}</div>
                                </div>
                            </div>

                            {/* Recent Projects */}
                            <div>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '1.5rem'
                                }}>
                                    <h3 style={{
                                        fontSize: '1.5rem',
                                        fontWeight: '600',
                                        color: '#2d3748',
                                        margin: 0
                                    }}>
                                        📂 Recent Projects
                                    </h3>
                                    <button
                                        onClick={handleCreateProject}
                                        style={{
                                            backgroundColor: '#3182ce',
                                            color: 'white',
                                            border: 'none',
                                            padding: '0.75rem 1.5rem',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontWeight: '500'
                                        }}
                                    >
                                        + New Project
                                    </button>
                                </div>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                                    gap: '1.5rem'
                                }}>
                                    {projects.slice(0, 6).map(project => (
                                        <ProjectCard
                                            key={project.gid}
                                            project={project}
                                            onClick={loadProjectTasks}
                                            onEdit={handleEditProject}
                                            onDelete={handleDeleteProject}
                                            onArchive={handleArchiveProject}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {currentView === 'projects' && (
                        <div>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '2rem'
                            }}>
                                <h2 style={{
                                    fontSize: '2rem',
                                    fontWeight: '600',
                                    color: '#2d3748',
                                    margin: 0
                                }}>
                                    📁 All Projects ({projects.length})
                                </h2>
                                <button
                                    onClick={handleCreateProject}
                                    style={{
                                        backgroundColor: '#3182ce',
                                        color: 'white',
                                        border: 'none',
                                        padding: '0.75rem 1.5rem',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontWeight: '500'
                                    }}
                                >
                                    + New Project
                                </button>
                            </div>

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                                gap: '1.5rem'
                            }}>
                                {projects.map(project => (
                                    <ProjectCard
                                        key={project.gid}
                                        project={project}
                                        onClick={loadProjectTasks}
                                        onEdit={handleEditProject}
                                        onDelete={handleDeleteProject}
                                        onArchive={handleArchiveProject}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {currentView === 'tasks' && selectedProject && (
                        <div>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '2rem'
                            }}>
                                <h2 style={{
                                    fontSize: '2rem',
                                    fontWeight: '600',
                                    color: '#2d3748',
                                    margin: 0
                                }}>
                                    ✅ Tasks in "{selectedProject.name}"
                                </h2>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <div style={{ color: '#718096' }}>
                                        {tasks.length} total • {pendingTasks} pending • {completedTasks} completed
                                    </div>
                                    <button
                                        onClick={handleCreateTask}
                                        style={{
                                            backgroundColor: '#3182ce',
                                            color: 'white',
                                            border: 'none',
                                            padding: '0.75rem 1.5rem',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontWeight: '500'
                                        }}
                                    >
                                        + New Task
                                    </button>
                                </div>
                            </div>

                            {loading ? (
                                <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
                                    <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔄</div>
                                    <p>Loading tasks...</p>
                                </div>
                            ) : tasks.length === 0 ? (
                                <div style={{
                                    textAlign: 'center',
                                    padding: '3rem',
                                    color: '#718096'
                                }}>
                                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
                                    <h3>No tasks found</h3>
                                    <p>This project doesn't have any tasks yet.</p>
                                    <button
                                        onClick={handleCreateTask}
                                        style={{
                                            backgroundColor: '#3182ce',
                                            color: 'white',
                                            border: 'none',
                                            padding: '0.75rem 1.5rem',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            marginTop: '1rem'
                                        }}
                                    >
                                        Create First Task
                                    </button>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {tasks.map(task => (
                                        <TaskItem
                                            key={task.gid}
                                            task={task}
                                            onEdit={handleEditTask}
                                            onDelete={handleDeleteTask}
                                            onToggleComplete={handleToggleTaskComplete}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>

            {/* Modals */}
            <Modal
                isOpen={showProjectModal}
                onClose={() => setShowProjectModal(false)}
                title={editingProject ? 'Edit Project' : 'Create New Project'}
            >
                <ProjectForm
                    project={editingProject}
                    workspaceId={workspaces[0]?.gid}
                    onSave={handleSaveProject}
                    onCancel={() => setShowProjectModal(false)}
                />
            </Modal>

            <Modal
                isOpen={showTaskModal}
                onClose={() => setShowTaskModal(false)}
                title={editingTask ? 'Edit Task' : 'Create New Task'}
            >
                <TaskForm
                    task={editingTask}
                    projectId={selectedProject?.gid}
                    workspaceUsers={workspaceUsers}
                    onSave={handleSaveTask}
                    onCancel={() => setShowTaskModal(false)}
                />
            </Modal>
        </div>
    );
}

export default App;
