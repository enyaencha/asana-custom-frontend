import React, { useState, useEffect } from 'react';

// Enhanced API helper functions
const api = {
    get: async (endpoint) => {
        const response = await fetch(`http://localhost:3001/api${endpoint}`);
        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        return response.json();
    },

    post: async (endpoint, data) => {
        const response = await fetch(`http://localhost:3001/api${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        return response.json();
    },

    put: async (endpoint, data) => {
        const response = await fetch(`http://localhost:3001/api${endpoint}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        return response.json();
    },

    delete: async (endpoint) => {
        const response = await fetch(`http://localhost:3001/api${endpoint}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        return response.json();
    }
};

// Modal Component
const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '2rem',
                minWidth: '500px',
                maxWidth: '90vw',
                maxHeight: '90vh',
                overflow: 'auto',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1.5rem'
                }}>
                    <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600' }}>{title}</h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '1.5rem',
                            cursor: 'pointer',
                            color: '#666'
                        }}
                    >
                        ×
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
};

// Project Form Component
const ProjectForm = ({ project, workspaceId, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        name: project?.name || '',
        notes: project?.notes || '',
        color: project?.color || '',
        workspace: workspaceId
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (project) {
                // Update existing project
                await api.put(`/projects/${project.gid}`, formData);
            } else {
                // Create new project
                await api.post('/projects', formData);
            }
            onSave();
        } catch (error) {
            alert(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Project Name *
                </label>
                <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '1rem'
                    }}
                />
            </div>

            <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Description
                </label>
                <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows="3"
                    style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '1rem',
                        resize: 'vertical'
                    }}
                />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Color
                </label>
                <select
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '1rem'
                    }}
                >
                    <option value="">Default (no color)</option>
                    <option value="dark-blue">Dark Blue</option>
                    <option value="light-blue">Light Blue</option>
                    <option value="dark-green">Dark Green</option>
                    <option value="light-green">Light Green</option>
                    <option value="dark-red">Dark Red</option>
                    <option value="light-red">Light Red</option>
                    <option value="dark-orange">Dark Orange</option>
                    <option value="light-orange">Light Orange</option>
                    <option value="dark-purple">Dark Purple</option>
                    <option value="light-purple">Light Purple</option>
                    <option value="dark-pink">Dark Pink</option>
                    <option value="light-pink">Light Pink</option>
                </select>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                    type="button"
                    onClick={onCancel}
                    style={{
                        padding: '0.75rem 1.5rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        backgroundColor: 'white',
                        cursor: 'pointer'
                    }}
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        padding: '0.75rem 1.5rem',
                        border: 'none',
                        borderRadius: '6px',
                        backgroundColor: '#3182ce',
                        color: 'white',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.7 : 1
                    }}
                >
                    {loading ? 'Saving...' : (project ? 'Update Project' : 'Create Project')}
                </button>
            </div>
        </form>
    );
};

// Task Form Component
const TaskForm = ({ task, projectId, workspaceUsers, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        name: task?.name || '',
        notes: task?.notes || '',
        due_date: task?.due_date || '',
        assignee: task?.assignee?.gid || '',
        projects: projectId
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const submitData = { ...formData };
            if (!submitData.assignee) delete submitData.assignee;
            if (!submitData.due_date) delete submitData.due_date;

            if (task) {
                // Update existing task
                await api.put(`/tasks/${task.gid}`, submitData);
            } else {
                // Create new task
                await api.post('/tasks', submitData);
            }
            onSave();
        } catch (error) {
            alert(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Task Name *
                </label>
                <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '1rem'
                    }}
                />
            </div>

            <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Description
                </label>
                <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows="3"
                    style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '1rem',
                        resize: 'vertical'
                    }}
                />
            </div>

            <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Due Date
                </label>
                <input
                    type="date"
                    value={formData.due_date || ''}  // Handle null/undefined
                    onChange={(e) => {
                        console.log('📅 Date changed to:', e.target.value); // Debug log
                        setFormData({ ...formData, due_date: e.target.value });
                    }}
                    style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '1rem'
                    }}
                />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Assignee
                </label>
                <select
                    value={formData.assignee}
                    onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
                    style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '1rem'
                    }}
                >
                    <option value="">Unassigned</option>
                    {workspaceUsers.map(user => (
                        <option key={user.gid} value={user.gid}>
                            {user.name}
                        </option>
                    ))}
                </select>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                    type="button"
                    onClick={onCancel}
                    style={{
                        padding: '0.75rem 1.5rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        backgroundColor: 'white',
                        cursor: 'pointer'
                    }}
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        padding: '0.75rem 1.5rem',
                        border: 'none',
                        borderRadius: '6px',
                        backgroundColor: '#3182ce',
                        color: 'white',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.7 : 1
                    }}
                >
                    {loading ? 'Saving...' : (task ? 'Update Task' : 'Create Task')}
                </button>
            </div>
        </form>
    );
};

// Enhanced Project Card with actions
const ProjectCard = ({ project, onClick, onEdit, onDelete, onArchive }) => (
    <div style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        border: '1px solid #e2e8f0',
        position: 'relative'
    }}>
        {/* Action buttons */}
        <div style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            display: 'flex',
            gap: '0.5rem'
        }}>
            <button
                onClick={(e) => { e.stopPropagation(); onEdit(project); }}
                style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.25rem',
                    borderRadius: '4px',
                    fontSize: '1rem'
                }}
                title="Edit Project"
            >
                ✏️
            </button>
            <button
                onClick={(e) => { e.stopPropagation(); onArchive(project); }}
                style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.25rem',
                    borderRadius: '4px',
                    fontSize: '1rem'
                }}
                title={project.archived ? "Unarchive Project" : "Archive Project"}
            >
                {project.archived ? '📂' : '📁'}
            </button>
            <button
                onClick={(e) => { e.stopPropagation(); onDelete(project); }}
                style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.25rem',
                    borderRadius: '4px',
                    fontSize: '1rem',
                    color: '#e53e3e'
                }}
                title="Delete Project"
            >
                🗑️
            </button>
        </div>

        <div
            onClick={() => onClick(project)}
            style={{ cursor: 'pointer', paddingRight: '3rem' }}
        >
            <h4 style={{
                color: '#2d3748',
                fontSize: '1.125rem',
                fontWeight: '600',
                margin: '0 0 0.5rem 0',
                opacity: project.archived ? 0.6 : 1
            }}>
                📁 {project.name}
            </h4>
            <p style={{ color: '#718096', fontSize: '0.875rem', margin: '0.25rem 0' }}>
                Owner: {project.owner?.name || 'No owner'}
            </p>
            <p style={{ color: '#718096', fontSize: '0.875rem', margin: '0.25rem 0' }}>
                Created: {new Date(project.created_at).toLocaleDateString()}
            </p>
            {project.notes && (
                <p style={{ color: '#4a5568', fontSize: '0.875rem', margin: '0.5rem 0 0 0', fontStyle: 'italic' }}>
                    {project.notes.substring(0, 80)}{project.notes.length > 80 ? '...' : ''}
                </p>
            )}
            {project.archived && (
                <span style={{
                    backgroundColor: '#fed7d7',
                    color: '#742a2a',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    marginTop: '0.5rem',
                    display: 'inline-block'
                }}>
          Archived
        </span>
            )}
        </div>
    </div>
);

// Enhanced Task Item with actions
const TaskItem = ({ task, onEdit, onDelete, onToggleComplete }) => (
    <div style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        border: '1px solid #e2e8f0',
        opacity: task.completed ? 0.6 : 1
    }}>
        <div style={{ flex: 1 }}>
            <h4 style={{
                color: '#2d3748',
                fontSize: '1.125rem',
                fontWeight: '600',
                margin: '0 0 0.5rem 0',
                textDecoration: task.completed ? 'line-through' : 'none'
            }}>
                {task.completed ? '✅' : '⏳'} {task.name}
            </h4>
            <p style={{ color: '#718096', fontSize: '0.875rem', margin: '0.25rem 0' }}>
                Assignee: {task.assignee?.name || 'Unassigned'}
            </p>
            <p style={{ color: '#718096', fontSize: '0.875rem', margin: '0.25rem 0' }}>
                Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}
            </p>
            {task.notes && (
                <p style={{ color: '#4a5568', fontSize: '0.875rem', margin: '0.5rem 0 0 0', fontStyle: 'italic' }}>
                    {task.notes.substring(0, 100)}{task.notes.length > 100 ? '...' : ''}
                </p>
            )}
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
            <button
                onClick={() => onToggleComplete(task)}
                style={{
                    backgroundColor: task.completed ? '#ed8936' : '#48bb78',
                    color: 'white',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                }}
            >
                {task.completed ? 'Reopen' : 'Complete'}
            </button>
            <button
                onClick={() => onEdit(task)}
                style={{
                    backgroundColor: '#3182ce',
                    color: 'white',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                }}
            >
                Edit
            </button>
            <button
                onClick={() => onDelete(task)}
                style={{
                    backgroundColor: '#e53e3e',
                    color: 'white',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                }}
            >
                Delete
            </button>
        </div>
    </div>
);

// Main App Component
function App() {
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
        if (!confirm(`Are you sure you want to delete "${project.name}"? This action cannot be undone.`)) {
            return;
        }

        try {
            await api.delete(`/projects/${project.gid}`);
            await loadUserData(); // Reload projects
        } catch (err) {
            alert(`Error deleting project: ${err.message}`);
        }
    };

    const handleArchiveProject = async (project) => {
        try {
            await api.put(`/projects/${project.gid}`, { archived: !project.archived });
            await loadUserData(); // Reload projects
        } catch (err) {
            alert(`Error archiving project: ${err.message}`);
        }
    };

    const handleSaveProject = async () => {
        setShowProjectModal(false);
        setEditingProject(null);
        await loadUserData(); // Reload projects
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
                await loadProjectTasks(selectedProject); // Reload tasks
            }
        } catch (err) {
            alert(`Error deleting task: ${err.message}`);
        }
    };

    const handleToggleTaskComplete = async (task) => {
        try {
            await api.put(`/tasks/${task.gid}/toggle`, { completed: !task.completed });
            if (selectedProject) {
                await loadProjectTasks(selectedProject); // Reload tasks
            }
        } catch (err) {
            alert(`Error updating task: ${err.message}`);
        }
    };

    const handleSaveTask = async () => {
        setShowTaskModal(false);
        setEditingTask(null);
        if (selectedProject) {
            await loadProjectTasks(selectedProject); // Reload tasks
        }
    };

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

            {/* Project Modal */}
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

            {/* Task Modal */}
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