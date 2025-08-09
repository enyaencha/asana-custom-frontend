// App.jsx
import React, { useState, useEffect } from 'react';
import { AsanaProvider, useAsana } from './context/AsanaContext.jsx';
import Dashboard from './components/Dashboard';
import Navigation from './components/Navigation';
import ProjectCard from './components/ProjectCard';
import TaskItem from './components/TaskItem';
import Modal from './components/Modal';
import ProjectForm from './components/ProjectForm';
import TaskForm from './components/TaskForm';
import ThemeManager from './components/ThemeManager';
import AIInsightsDashboard from './components/AIInsightsDashboard';
import NotificationCenter from './components/NotificationCenter';
import SettingsPage from './components/SettingsPage';
import { themeApi, notificationApi, activityApi } from './services/asanaApi';

// Connection Status Component
const ConnectionStatus = () => {
    const { serverStatus, error, checkServerConnection, setError, setServerStatus } = useAsana();

    if (serverStatus === 'checking') {
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
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔄</div>
                    <h1 style={{
                        color: '#3182ce',
                        fontSize: '1.5rem',
                        fontWeight: '600',
                        marginBottom: '1rem'
                    }}>
                        Connecting to Server...
                    </h1>
                    <p style={{ color: '#718096' }}>
                        Checking connection to localhost:3001
                    </p>
                </div>
            </div>
        );
    }

    if (serverStatus === 'disconnected') {
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
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
                    <h1 style={{
                        color: '#e53e3e',
                        fontSize: '1.5rem',
                        fontWeight: '600',
                        marginBottom: '1rem'
                    }}>
                        Server Connection Error
                    </h1>
                    <p style={{ color: '#718096', marginBottom: '1rem' }}>
                        Make sure your server is running at localhost:3001
                    </p>
                    <div style={{
                        backgroundColor: '#f7fafc',
                        padding: '1rem',
                        borderRadius: '6px',
                        marginBottom: '1rem',
                        textAlign: 'left'
                    }}>
                        <p style={{ margin: '0 0 0.5rem 0', fontWeight: '600' }}>To start your server:</p>
                        <code style={{
                            display: 'block',
                            padding: '0.5rem',
                            backgroundColor: '#1a202c',
                            color: '#e2e8f0',
                            borderRadius: '4px',
                            fontSize: '0.875rem'
                        }}>
                            node server.js
                        </code>
                    </div>
                    <button
                        onClick={async () => {
                            setServerStatus('checking');
                            const isConnected = await checkServerConnection();
                            if (!isConnected) {
                                setTimeout(() => setServerStatus('disconnected'), 1000);
                            }
                        }}
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
                        🔄 Check Again
                    </button>
                </div>
            </div>
        );
    }

    return null;
};

// Loading Component
const LoadingScreen = () => {
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
};

// Error Screen Component
const ErrorScreen = () => {
    const { error, checkServerConnection, loadUserData } = useAsana();

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            backgroundColor: '#f8f9fa'
        }}>
            <div style={{
                textAlign: 'center',
                backgroundColor: 'white',
                padding: '3rem',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                maxWidth: '500px'
            }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
                <h2 style={{ color: '#e53e3e', marginBottom: '1rem' }}>Connection Error</h2>
                <p style={{ color: '#666', marginBottom: '2rem' }}>
                    {error}
                    <br /><br />
                    <strong>Troubleshooting:</strong><br />
                    1. Make sure your server is running: <code>node server.js</code><br />
                    2. Check that port 3001 is not blocked<br />
                    3. Verify your .env file has VITE_ASANA_TOKEN set
                </p>
                <button
                    onClick={async () => {
                        const isConnected = await checkServerConnection();
                        if (isConnected) {
                            loadUserData();
                        }
                    }}
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
                    🔄 Retry Connection
                </button>
            </div>
        </div>
    );
};

// Main Dashboard App Component

const DashboardApp = () => {
    const {
        user,
        workspaces,
        projects,
        tasks,
        selectedProject,
        selectedWorkspace,
        loading,
        error,
        serverStatus,
        loadProjectTasks,
        deleteProject,
        deleteTask,
        handleWorkspaceChange
    } = useAsana();

    // Get the current workspace (selected or first one from workspaces array)
    const currentWorkspace = selectedWorkspace || (workspaces && workspaces.length > 0 ? workspaces[0] : null);

    // Enhanced State Management
    const [currentView, setCurrentView] = useState('dashboard');
    const [showProjectModal, setShowProjectModal] = useState(false);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const [editingTask, setEditingTask] = useState(null);

    // New Feature States
    const [currentTheme, setCurrentTheme] = useState(null);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [activityLog, setActivityLog] = useState([]);

    // Load initial data and theme
    useEffect(() => {
        loadInitialData();
        // Load saved theme from localStorage
        const savedTheme = localStorage.getItem('asana-theme');
        if (savedTheme) {
            try {
                setCurrentTheme(JSON.parse(savedTheme));
            } catch (e) {
                console.error('Error loading saved theme:', e);
            }
        }
    }, []);

    // Apply theme to document
    useEffect(() => {
        if (currentTheme) {
            document.documentElement.style.setProperty('--primary-color', currentTheme.primary);
            document.documentElement.style.setProperty('--secondary-color', currentTheme.secondary);
            document.documentElement.style.setProperty('--background-color', currentTheme.background);
            // Save theme to localStorage
            localStorage.setItem('asana-theme', JSON.stringify(currentTheme));
        }
    }, [currentTheme]);

    const loadInitialData = async () => {
        try {
            // Load notifications
            const notifResponse = await notificationApi.getNotifications();
            setNotifications(notifResponse.data || []);

            // Load activity log
            const activityResponse = await activityApi.getActivityLog(10);
            setActivityLog(activityResponse.data || []);
        } catch (error) {
            console.error('Error loading initial data:', error);
        }
    };

    // Show connection status if not connected
    if (serverStatus !== 'connected') {
        return <ConnectionStatus />;
    }

    // Show loading screen
    if (loading && !user) {
        return <LoadingScreen />;
    }

    // Show error screen
    if (error && !user) {
        return <ErrorScreen />;
    }

    const handleNavigate = (view) => {
        setCurrentView(view);
    };

    const handleThemeChange = (theme) => {
        setCurrentTheme(theme);
        // Show success notification
        notificationApi.createNotification(
            'Theme Changed',
            `Successfully switched to ${theme.name} theme`,
            'success'
        ).then(() => {
            loadInitialData(); // Reload notifications
        });
    };

    const handleCreateProject = () => {
        setEditingProject(null);
        setShowProjectModal(true);
    };

    const handleEditProject = (project) => {
        setEditingProject(project);
        setShowProjectModal(true);
    };

    const handleDeleteProject = async (project) => {
        try {
            await deleteProject(project);
            if (selectedProject?.gid === project.gid) {
                setCurrentView('dashboard');
            }
            // Add success notification
            await notificationApi.createNotification(
                'Project Deleted',
                `Successfully deleted project "${project.name}"`,
                'success'
            );
            loadInitialData();
        } catch (error) {
            alert(`Error deleting project: ${error.message}\n\nPlease check the server console for detailed logs.`);
        }
    };

    const handleSaveProject = () => {
        setShowProjectModal(false);
        setEditingProject(null);
        loadInitialData(); // Reload to show new activity
    };

    const handleCreateTask = () => {
        if (!selectedProject) {
            alert('Please select a project first');
            return;
        }
        setEditingTask(null);
        setShowTaskModal(true);
    };

    const handleEditTask = (task) => {
        setEditingTask(task);
        setShowTaskModal(true);
    };

    const handleDeleteTask = async (task) => {
        try {
            await deleteTask(task);
            // Add success notification
            await notificationApi.createNotification(
                'Task Deleted',
                `Successfully deleted task "${task.name}"`,
                'success'
            );
            loadInitialData();
        } catch (error) {
            alert(`Error deleting task: ${error.message}\n\nPlease check the server console for detailed logs.`);
        }
    };

    const handleSaveTask = () => {
        setShowTaskModal(false);
        setEditingTask(null);
        loadInitialData(); // Reload to show new activity
    };

    const handleProjectClick = (project) => {
        loadProjectTasks(project);
        setCurrentView('tasks');
    };

    const getUnreadNotificationCount = () => {
        return notifications.filter(n => !n.read).length;
    };

    const renderCurrentView = () => {
        switch (currentView) {
            case 'dashboard':
                return (
                    <Dashboard
                        onCreateProject={handleCreateProject}
                        onProjectClick={handleProjectClick}
                    />
                );

            case 'projects':
                return (
                    <div>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '2rem'
                        }}>
                            <h2 style={{
                                margin: 0,
                                fontSize: '2rem',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}>
                                📁 All Projects ({projects.length})
                                {selectedWorkspace && (
                                    <span style={{
                                        fontSize: '1.25rem',
                                        fontWeight: '400',
                                        color: '#718096'
                                    }}>
                                        in {selectedWorkspace.name}
                                    </span>
                                )}
                            </h2>
                            <button
                                onClick={handleCreateProject}
                                style={{
                                    backgroundColor: currentTheme?.primary || '#ce3156',
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
                                    onClick={handleProjectClick}
                                    onEdit={handleEditProject}
                                    onDelete={handleDeleteProject}
                                    showWorkspace={!selectedWorkspace} // Show workspace info when viewing all workspaces
                                />
                            ))}
                        </div>
                    </div>
                );

            case 'tasks':
                return (
                    <div>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '2rem'
                        }}>
                            <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: '600' }}>
                                ✅ Tasks {selectedProject && `in "${selectedProject.name}"`}
                            </h2>
                            {selectedProject && (
                                <button
                                    onClick={handleCreateTask}
                                    style={{
                                        backgroundColor: currentTheme?.secondary || '#48bb78',
                                        color: 'white',
                                        border: 'none',
                                        padding: '0.75rem 1.5rem',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontWeight: '500'
                                    }}
                                >
                                    + Add Task
                                </button>
                            )}
                        </div>

                        {tasks.length === 0 ? (
                            <div style={{
                                textAlign: 'center',
                                padding: '3rem',
                                backgroundColor: 'white',
                                borderRadius: '12px',
                                border: '1px solid #e2e8f0'
                            }}>
                                {selectedProject ? (
                                    <>
                                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
                                        <h3 style={{ color: '#4a5568', marginBottom: '1rem' }}>
                                            No tasks in this project yet
                                        </h3>
                                        <p style={{ color: '#718096', marginBottom: '2rem' }}>
                                            Get started by adding your first task to "{selectedProject.name}"
                                        </p>
                                        <button
                                            onClick={handleCreateTask}
                                            style={{
                                                backgroundColor: currentTheme?.secondary || '#48bb78',
                                                color: 'white',
                                                border: 'none',
                                                padding: '0.75rem 2rem',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontWeight: '500',
                                                fontSize: '1rem'
                                            }}
                                        >
                                            + Add First Task
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📂</div>
                                        <h3 style={{ color: '#4a5568', marginBottom: '1rem' }}>
                                            Select a project to view tasks
                                        </h3>
                                        <p style={{ color: '#718096' }}>
                                            Choose a project from the dashboard or projects page to see its tasks
                                        </p>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {tasks.map(task => (
                                    <TaskItem
                                        key={task.gid}
                                        task={task}
                                        onEdit={handleEditTask}
                                        onDelete={handleDeleteTask}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                );

            case 'insights':
                return <AIInsightsDashboard workspace={currentWorkspace} />;

            case 'themes':
                return (
                    <ThemeManager
                        onThemeChange={handleThemeChange}
                        currentTheme={currentTheme}
                    />
                );

            case 'settings':
                return (
                    <SettingsPage
                        currentTheme={currentTheme}
                        onThemeChange={handleThemeChange}
                    />
                );

            case 'activity':
                return (
                    <div>
                        <h2 style={{
                            margin: '0 0 2rem 0',
                            fontSize: '2rem',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            📋 Activity Log
                        </h2>
                        <div style={{
                            backgroundColor: 'white',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            overflow: 'hidden'
                        }}>
                            {activityLog.length === 0 ? (
                                <div style={{
                                    padding: '3rem',
                                    textAlign: 'center',
                                    color: '#718096'
                                }}>
                                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
                                    <p>No recent activity to display</p>
                                </div>
                            ) : (
                                activityLog.map((activity, index) => (
                                    <div
                                        key={activity.id || index}
                                        style={{
                                            padding: '1rem 1.5rem',
                                            borderBottom: index < activityLog.length - 1 ? '1px solid #e2e8f0' : 'none',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <div>
                                            <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>
                                                {activity.details || activity.action}
                                            </div>
                                            <div style={{ fontSize: '0.875rem', color: '#718096' }}>
                                                {activity.entityType} • {activity.userId}
                                            </div>
                                        </div>
                                        <div style={{ fontSize: '0.875rem', color: '#a0aec0' }}>
                                            {new Date(activity.timestamp).toLocaleDateString()}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: currentTheme?.background || '#f8f9fa',
            transition: 'background-color 0.3s ease'
        }}>
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
                    <button
                        onClick={() => setCurrentView('dashboard')}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            textDecoration: 'none'
                        }}
                    >
                        <h1 style={{
                            fontSize: '1.75rem',
                            fontWeight: '700',
                            color: currentTheme?.primary || '#2d3748',
                            margin: 0,
                            transition: 'color 0.3s ease'
                        }}>
                            🚀 Enhanced Asana Dashboard
                        </h1>
                    </button>

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem'
                    }}>
                        <div style={{ color: '#718096', fontWeight: '500' }}>
                            Welcome, {user?.name}! 👋
                        </div>

                        {/* Notification Bell */}
                        <button
                            onClick={() => setShowNotifications(true)}
                            style={{
                                position: 'relative',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '1.5rem',
                                padding: '0.5rem',
                                borderRadius: '6px',
                                transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#f7fafc'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                        >
                            🔔
                            {getUnreadNotificationCount() > 0 && (
                                <span style={{
                                    position: 'absolute',
                                    top: '0.25rem',
                                    right: '0.25rem',
                                    backgroundColor: '#e53e3e',
                                    color: 'white',
                                    borderRadius: '50%',
                                    width: '18px',
                                    height: '18px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.75rem',
                                    fontWeight: '600'
                                }}>
                                    {getUnreadNotificationCount()}
                                </span>
                            )}
                        </button>
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
                    <Navigation
                        currentView={currentView}
                        onNavigate={handleNavigate}
                        currentTheme={currentTheme}
                    />
                </aside>

                {/* Main Content */}
                <main style={{ flex: 1, padding: '2rem' }}>
                    {renderCurrentView()}
                </main>
            </div>

            {/* Project Modal */}
            <Modal
                isOpen={showProjectModal}
                onClose={() => setShowProjectModal(false)}
                title={editingProject ? 'Edit Project' : 'Create New Project'}
            >
                <ProjectForm
                    project={editingProject}
                    onSave={handleSaveProject}
                    onCancel={() => setShowProjectModal(false)}
                />
            </Modal>

            {/* Task Modal */}
            <Modal
                isOpen={showTaskModal}
                onClose={() => setShowTaskModal(false)}
                title={editingTask ? 'Edit Task' : 'Create New Task'}
            >
                <TaskForm
                    task={editingTask}
                    onSave={handleSaveTask}
                    onCancel={() => setShowTaskModal(false)}
                />
            </Modal>

            {/* Notification Center */}
            <NotificationCenter
                isOpen={showNotifications}
                onClose={() => setShowNotifications(false)}
            />
        </div>
    );
};

// Main App with Provider
function App() {
    return (
        <AsanaProvider>
            <DashboardApp />
        </AsanaProvider>
    );
}

export default App;