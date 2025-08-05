import React, { useState, useEffect } from 'react';

// Use your existing API service with proper error handling
const api = {
    get: async (url) => {
        try {
            const response = await fetch(`http://localhost:3001/api${url}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
            }
            return response.json();
        } catch (error) {
            console.error('API GET Error:', error);
            throw error;
        }
    },
    post: async (url, data) => {
        try {
            const response = await fetch(`http://localhost:3001/api${url}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
            }
            return response.json();
        } catch (error) {
            console.error('API POST Error:', error);
            throw error;
        }
    },
    put: async (url, data) => {
        try {
            const response = await fetch(`http://localhost:3001/api${url}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
            }
            return response.json();
        } catch (error) {
            console.error('API PUT Error:', error);
            throw error;
        }
    },
    delete: async (url) => {
        try {
            const response = await fetch(`http://localhost:3001/api${url}`, {
                method: 'DELETE'
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
            }
            return response.json();
        } catch (error) {
            console.error('API DELETE Error:', error);
            throw error;
        }
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
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '2rem',
                maxWidth: '500px',
                width: '90%',
                maxHeight: '80vh',
                overflow: 'auto'
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
const ProjectForm = ({ workspaceId, project, onSave, onCancel }) => {
    const [name, setName] = useState(project?.name || '');
    const [notes, setNotes] = useState(project?.notes || '');
    const [isPublic, setIsPublic] = useState(project?.public !== false);
    const [color, setColor] = useState(project?.color || 'dark-blue');
    const [archived, setArchived] = useState(project?.archived || false);
    const [loading, setLoading] = useState(false);

    // Debug log to see what project data we're getting
    console.log('Project data:', project);

    // Real Asana project colors (using actual Asana API color values)
    const projectColors = [
        { value: 'dark-pink', label: 'Dark Pink', color: '#e91e63' },
        { value: 'dark-green', label: 'Dark Green', color: '#00c875' },
        { value: 'dark-orange', label: 'Dark Orange', color: '#ff9500' },
        { value: 'dark-purple', label: 'Dark Purple', color: '#7b68ee' },
        { value: 'dark-warm-gray', label: 'Dark Warm Gray', color: '#8b7765' },
        { value: 'light-pink', label: 'Light Pink', color: '#ffc0cb' },
        { value: 'light-green', label: 'Light Green', color: '#90ee90' },
        { value: 'light-orange', label: 'Light Orange', color: '#ffd700' },
        { value: 'light-purple', label: 'Light Purple', color: '#dda0dd' },
        { value: 'light-warm-gray', label: 'Light Warm Gray', color: '#d3d3d3' },
        { value: 'dark-blue', label: 'Dark Blue', color: '#4169e1' },
        { value: 'dark-red', label: 'Dark Red', color: '#dc143c' },
        { value: 'dark-teal', label: 'Dark Teal', color: '#008b8b' },
        { value: 'light-blue', label: 'Light Blue', color: '#87ceeb' },
        { value: 'light-red', label: 'Light Red', color: '#ffa07a' },
        { value: 'light-teal', label: 'Light Teal', color: '#20b2aa' }
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;

        setLoading(true);
        try {
            const projectData = {
                name: name.trim(),
                notes: notes.trim(),
                public: isPublic,
                color: color,
                archived: archived
            };

            if (!project) {
                projectData.workspace = workspaceId;
            }

            console.log('Sending project data:', projectData);
            console.log('Project archived status changing from', project?.archived, 'to', archived);

            let response;
            if (project) {
                response = await api.put(`/projects/${project.gid}`, projectData);
            } else {
                response = await api.post('/projects', projectData);
            }

            console.log('API response:', response);
            onSave();
        } catch (error) {
            console.error('Error saving project:', error);
            alert(`Error saving project: ${error.message}\n\nPlease check the server console for detailed logs.`);
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
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '1rem',
                        boxSizing: 'border-box'
                    }}
                />
            </div>

            <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Description
                </label>
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Add project description..."
                    style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '1rem',
                        resize: 'vertical',
                        boxSizing: 'border-box'
                    }}
                />
            </div>

            <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Project Color
                </label>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '0.5rem',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    backgroundColor: '#f9fafb'
                }}>
                    {projectColors.map((colorOption) => (
                        <label
                            key={colorOption.value}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                cursor: 'pointer',
                                padding: '0.5rem',
                                borderRadius: '6px',
                                backgroundColor: color === colorOption.value ? '#e0e7ff' : 'white',
                                border: color === colorOption.value ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                                transition: 'all 0.2s'
                            }}
                        >
                            <input
                                type="radio"
                                name="color"
                                value={colorOption.value}
                                checked={color === colorOption.value}
                                onChange={(e) => setColor(e.target.value)}
                                style={{ marginRight: '0.5rem' }}
                            />
                            <div
                                style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '50%',
                                    backgroundColor: colorOption.color,
                                    marginRight: '0.75rem',
                                    border: '2px solid #fff',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}
                            />
                            <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                                {colorOption.label}
                            </span>
                        </label>
                    ))}
                </div>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0.5rem 0 0 0' }}>
                    Current selection: {color}
                </p>
            </div>

            <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input
                        type="checkbox"
                        checked={isPublic}
                        onChange={(e) => setIsPublic(e.target.checked)}
                        style={{ marginRight: '0.5rem' }}
                    />
                    <span>🌐 Make this project public to the team</span>
                </label>
            </div>

            {project && (
                <div style={{ marginBottom: '2rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={archived}
                            onChange={(e) => setArchived(e.target.checked)}
                            style={{ marginRight: '0.5rem' }}
                        />
                        <span>
                            {archived ? '📦 Unarchive this project' : '📦 Archive this project'}
                        </span>
                    </label>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0.25rem 0 0 1.5rem' }}>
                        {archived
                            ? 'Check to restore this project to active status'
                            : 'Archived projects are hidden from most views but can be restored later'
                        }
                    </p>
                </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                    type="button"
                    onClick={onCancel}
                    style={{
                        padding: '0.75rem 1.5rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        background: 'white',
                        cursor: 'pointer',
                        fontWeight: '500'
                    }}
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={loading || !name.trim()}
                    style={{
                        padding: '0.75rem 1.5rem',
                        backgroundColor: loading ? '#9ca3af' : '#3182ce',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontWeight: '500'
                    }}
                >
                    {loading ? 'Saving...' : (project ? 'Update' : 'Create')} Project
                </button>
            </div>
        </form>
    );
};

// Task Form Component
const TaskForm = ({ projectId, task, workspaceUsers = [], onSave, onCancel }) => {
    const [name, setName] = useState(task?.name || '');
    const [notes, setNotes] = useState(task?.notes || '');
    const [assignee, setAssignee] = useState(task?.assignee?.gid || '');
    const [dueDate, setDueDate] = useState(task?.due_on || '');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;

        setLoading(true);
        try {
            const taskData = {
                name: name.trim(),
                notes: notes.trim(),
                assignee: assignee || null,
                due_on: dueDate || null
            };

            if (!task) {
                taskData.projects = [projectId];
            }

            if (task) {
                await api.put(`/tasks/${task.gid}`, taskData);
            } else {
                await api.post('/tasks', taskData);
            }

            onSave();
        } catch (error) {
            console.error('Error saving task:', error);
            alert(`Error saving task: ${error.message}\n\nPlease check the server console for detailed logs.`);
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
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '1rem',
                        boxSizing: 'border-box'
                    }}
                />
            </div>

            <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Description
                </label>
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '1rem',
                        resize: 'vertical',
                        boxSizing: 'border-box'
                    }}
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                        Assignee
                    </label>
                    <select
                        value={assignee}
                        onChange={(e) => setAssignee(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '1rem',
                            boxSizing: 'border-box'
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

                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                        Due Date
                    </label>
                    <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '1rem',
                            boxSizing: 'border-box'
                        }}
                    />
                </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                    type="button"
                    onClick={onCancel}
                    style={{
                        padding: '0.75rem 1.5rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        background: 'white',
                        cursor: 'pointer'
                    }}
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={loading || !name.trim()}
                    style={{
                        padding: '0.75rem 1.5rem',
                        backgroundColor: loading ? '#9ca3af' : '#3182ce',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                >
                    {loading ? 'Saving...' : (task ? 'Update' : 'Create')} Task
                </button>
            </div>
        </form>
    );
};

// Enhanced Project Card Component
const ProjectCard = ({ project, onClick, onEdit, onDelete, taskCount = 0 }) => {
    const getProjectColor = (colorName) => {
        const colorMap = {
            'dark-pink': '#e91e63',
            'dark-green': '#00c875',
            'dark-orange': '#ff9500',
            'dark-purple': '#7b68ee',
            'dark-warm-gray': '#8b7765',
            'light-pink': '#ffc0cb',
            'light-green': '#90ee90',
            'light-orange': '#ffd700',
            'light-purple': '#dda0dd',
            'light-warm-gray': '#d3d3d3',
            'dark-blue': '#4169e1',
            'dark-red': '#dc143c',
            'dark-teal': '#008b8b',
            'light-blue': '#87ceeb',
            'light-red': '#ffa07a',
            'light-teal': '#20b2aa'
        };
        return colorMap[colorName] || '#4169e1'; // default to dark-blue
    };

    return (
        <div style={{
            backgroundColor: 'white',
            border: '1px solid #e2e8f0',
            borderLeft: `4px solid ${getProjectColor(project.color)}`,
            borderRadius: '12px',
            padding: '1.5rem',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            transition: 'all 0.2s',
            position: 'relative',
            opacity: project.archived ? 0.6 : 1
        }}>
            <div style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                display: 'flex',
                gap: '0.5rem'
            }}>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onEdit(project);
                    }}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        padding: '0.25rem',
                        borderRadius: '4px',
                        ':hover': { backgroundColor: '#f3f4f6' }
                    }}
                    title="Edit project"
                >
                    ✏️
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Are you sure you want to delete "${project.name}"?`)) {
                            onDelete(project);
                        }
                    }}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        padding: '0.25rem',
                        borderRadius: '4px'
                    }}
                    title="Delete project"
                >
                    🗑️
                </button>
            </div>

            <div onClick={() => onClick(project)} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <h3 style={{
                        fontSize: '1.25rem',
                        fontWeight: '600',
                        color: project.archived ? '#9ca3af' : '#2d3748',
                        margin: '0 2rem 0 0',
                        flex: 1,
                        textDecoration: project.archived ? 'line-through' : 'none'
                    }}>
                        {project.name}
                    </h3>
                    {project.archived && (
                        <span style={{
                            backgroundColor: '#fef2f2',
                            color: '#dc2626',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            whiteSpace: 'nowrap',
                            border: '1px solid #fecaca'
                        }}>
                            📦 ARCHIVED
                        </span>
                    )}
                </div>

                {project.notes && (
                    <p style={{
                        color: project.archived ? '#9ca3af' : '#718096',
                        fontSize: '0.875rem',
                        margin: '0 0 1rem 0',
                        lineHeight: '1.4'
                    }}>
                        {project.notes}
                    </p>
                )}

                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '1rem'
                }}>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.25rem'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            color: project.archived ? '#9ca3af' : '#718096',
                            fontSize: '0.875rem'
                        }}>
                            <span>📋</span>
                            <span>{taskCount} tasks</span>
                        </div>
                        {project.created_at && (
                            <div style={{
                                color: project.archived ? '#9ca3af' : '#718096',
                                fontSize: '0.75rem'
                            }}>
                                📅 Created {new Date(project.created_at).toLocaleDateString()}
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        {project.public && (
                            <span style={{
                                backgroundColor: project.archived ? '#f3f4f6' : '#e6fffa',
                                color: project.archived ? '#6b7280' : '#234e52',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                fontWeight: '500'
                            }}>
                                🌐 Public
                            </span>
                        )}
                        <div
                            style={{
                                width: '14px',
                                height: '14px',
                                borderRadius: '50%',
                                backgroundColor: getProjectColor(project.color),
                                border: '2px solid #fff',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                opacity: project.archived ? 0.5 : 1
                            }}
                            title={`Project color: ${project.color}`}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

// Enhanced Task Item Component
const TaskItem = ({ task, onEdit, onDelete, onToggleComplete }) => {
    const handleToggleComplete = async () => {
        try {
            await api.put(`/tasks/${task.gid}`, { completed: !task.completed });
            onToggleComplete(task);
        } catch (error) {
            console.error('Error updating task:', error);
            alert(`Error updating task: ${error.message}`);
        }
    };

    return (
        <div style={{
            backgroundColor: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            opacity: task.completed ? 0.7 : 1
        }}>
            <input
                type="checkbox"
                checked={task.completed || false}
                onChange={handleToggleComplete}
                style={{ cursor: 'pointer' }}
            />

            <div style={{ flex: 1 }}>
                <h4 style={{
                    margin: '0 0 0.25rem 0',
                    fontSize: '1rem',
                    fontWeight: '500',
                    color: task.completed ? '#718096' : '#2d3748',
                    textDecoration: task.completed ? 'line-through' : 'none'
                }}>
                    {task.name}
                </h4>

                {task.notes && (
                    <p style={{
                        margin: '0 0 0.5rem 0',
                        fontSize: '0.875rem',
                        color: '#718096',
                        lineHeight: '1.4'
                    }}>
                        {task.notes}
                    </p>
                )}

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', fontSize: '0.75rem', flexWrap: 'wrap' }}>
                    {task.assignee && (
                        <span style={{ color: '#718096' }}>
                            👤 {task.assignee.name}
                        </span>
                    )}

                    {task.due_on && (
                        <span style={{
                            color: new Date(task.due_on) < new Date() && !task.completed ? '#dc2626' : '#718096',
                            fontWeight: new Date(task.due_on) < new Date() && !task.completed ? '600' : 'normal'
                        }}>
                            📅 Due {new Date(task.due_on).toLocaleDateString()}
                            {new Date(task.due_on) < new Date() && !task.completed && ' (Overdue)'}
                        </span>
                    )}

                    {task.created_at && (
                        <span style={{ color: '#9ca3af' }}>
                            📝 Created {new Date(task.created_at).toLocaleDateString()}
                        </span>
                    )}

                    {task.priority && task.priority !== 'normal' && (
                        <span style={{
                            backgroundColor: task.priority === 'high' ? '#fef2f2' : '#f0f9ff',
                            color: task.priority === 'high' ? '#dc2626' : '#2563eb',
                            padding: '0.125rem 0.5rem',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: '500'
                        }}>
                            {task.priority === 'high' ? '🔴 High' : '🔵 Low'}
                        </span>
                    )}
                </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                    onClick={() => onEdit(task)}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        padding: '0.25rem'
                    }}
                    title="Edit task"
                >
                    ✏️
                </button>
                <button
                    onClick={() => {
                        if (window.confirm(`Are you sure you want to delete "${task.name}"?`)) {
                            onDelete(task);
                        }
                    }}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        padding: '0.25rem'
                    }}
                    title="Delete task"
                >
                    🗑️
                </button>
            </div>
        </div>
    );
};

// Simple Navigation Component
const Navigation = ({ currentView, projects, tasks, onNavigate }) => {
    const navItems = [
        { path: 'dashboard', icon: '📊', label: 'Dashboard' },
        { path: 'projects', icon: '📁', label: 'Projects', count: projects.length },
        ...(tasks.length > 0 ? [{ path: 'tasks', icon: '✅', label: 'Tasks', count: tasks.length }] : [])
    ];

    return (
        <nav>
            {navItems.map((item) => {
                const isActive = currentView === item.path;
                return (
                    <button
                        key={item.path}
                        onClick={() => onNavigate(item.path)}
                        style={{
                            display: 'block',
                            width: '100%',
                            padding: '0.75rem 2rem',
                            textDecoration: 'none',
                            background: isActive ? '#ebf8ff' : 'none',
                            borderLeft: isActive ? '3px solid #3182ce' : '3px solid transparent',
                            color: isActive ? '#3182ce' : '#4a5568',
                            fontSize: '1rem',
                            fontWeight: isActive ? '600' : '400',
                            border: 'none',
                            borderLeft: isActive ? '3px solid #3182ce' : '3px solid transparent',
                            textAlign: 'left',
                            cursor: 'pointer'
                        }}
                    >
                        <span style={{ marginRight: '0.75rem' }}>{item.icon}</span>
                        {item.label}
                        {item.count !== undefined && (
                            <span style={{
                                marginLeft: '0.5rem',
                                backgroundColor: isActive ? '#3182ce' : '#e2e8f0',
                                color: isActive ? 'white' : '#4a5568',
                                padding: '0.125rem 0.5rem',
                                borderRadius: '12px',
                                fontSize: '0.75rem'
                            }}>
                                {item.count}
                            </span>
                        )}
                    </button>
                );
            })}
        </nav>
    );
};

// Dashboard Component
const Dashboard = ({ projects, tasks, workspaces, onCreateProject, onProjectClick }) => {
    const completedTasks = tasks.filter(t => t.completed).length;
    const pendingTasks = tasks.filter(t => !t.completed).length;

    return (
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
                    <h3 style={{ color: '#718096', fontSize: '0.875rem', fontWeight: '600', margin: '0 0 0.5rem 0' }}>PENDING</h3>
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
                        onClick={onCreateProject}
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
                            onClick={onProjectClick}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

// Main App Component with state-based navigation
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

    // Check if server is running
    const [serverStatus, setServerStatus] = useState('checking');

    const checkServerConnection = async () => {
        try {
            console.log('🔍 Checking server connection...');

            // Add timeout to prevent hanging
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

            const response = await fetch('http://localhost:3001/api/users/me', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            console.log('📡 Server response status:', response.status);

            if (response.ok) {
                console.log('✅ Server connected successfully');
                setServerStatus('connected');
                return true;
            } else {
                console.log('❌ Server responded with error:', response.status);
                const errorText = await response.text();
                console.log('❌ Error details:', errorText);
                setServerStatus('disconnected');
                setError(`Server error: ${response.status} - ${errorText}`);
                return false;
            }
        } catch (error) {
            console.log('❌ Server connection failed:', error.message);
            setServerStatus('disconnected');
            if (error.name === 'AbortError') {
                setError('Connection timeout: Server took too long to respond');
            } else {
                setError(`Connection failed: ${error.message}`);
            }
            return false;
        }
    };

    useEffect(() => {
        const initializeApp = async () => {
            console.log('🚀 Initializing app...');
            const isConnected = await checkServerConnection();
            if (isConnected) {
                console.log('🔄 Connection successful, loading data...');
                await loadUserData();
            } else {
                console.log('❌ Connection failed, stopping initialization');
                setError('Cannot connect to server at localhost:3001. Please make sure your server is running with "node server.js"');
                setLoading(false);
            }
        };

        // Add a timeout to prevent infinite loading
        const loadingTimeout = setTimeout(() => {
            if (loading && !user) {
                console.log('⏰ Loading timeout reached');
                setError('Loading timeout: The application took too long to load. Please check your server connection.');
                setLoading(false);
            }
        }, 30000); // 30 second timeout

        initializeApp();

        return () => clearTimeout(loadingTimeout);
    }, []); // Empty dependency array to run only once

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

    const loadUserData = async () => {
        try {
            console.log('🔄 Starting to load user data...');
            setLoading(true);
            setError(null);

            console.log('📡 Fetching user and workspaces...');
            const [userData, workspacesData] = await Promise.all([
                api.get('/users/me'),
                api.get('/workspaces')
            ]);

            console.log('👤 User data:', userData);
            console.log('🏢 Workspaces data:', workspacesData);

            setUser(userData.data);
            setWorkspaces(workspacesData.data);

            if (workspacesData.data && workspacesData.data.length > 0) {
                const workspaceId = workspacesData.data[0].gid;
                console.log('🏢 Using workspace:', workspaceId);

                console.log('📁 Fetching projects and users...');
                const [projectsData, usersData] = await Promise.all([
                    api.get(`/projects?workspace=${workspaceId}&opt_fields=name,notes,public,color,archived,created_at,modified_at,owner`),
                    api.get(`/workspaces/${workspaceId}/users`)
                ]);

                console.log('📁 Projects data:', projectsData);
                console.log('👥 Users data:', usersData);

                setProjects(projectsData.data || []);
                setWorkspaceUsers(usersData.data || []);
            } else {
                console.log('⚠️ No workspaces found');
                setProjects([]);
                setWorkspaceUsers([]);
            }

            console.log('✅ Data loading completed successfully');
            setLoading(false);
        } catch (err) {
            console.error('❌ Error loading user data:', err);
            setError(`Failed to load data: ${err.message}`);
            setLoading(false);
        }
    };

    const loadProjectTasks = async (project) => {
        try {
            setLoading(true);
            // Get tasks with additional fields including due dates, assignee, completion status, etc.
            const tasksData = await api.get(`/tasks?project=${project.gid}&opt_fields=name,notes,completed,assignee,due_on,due_at,created_at,modified_at,priority,tags`);

            console.log('Tasks from API:', tasksData.data);
            setTasks(tasksData.data);
            setSelectedProject(project);
            setCurrentView('tasks');
            setLoading(false);
        } catch (err) {
            console.error('Error loading tasks:', err);
            setError(err.message);
            setLoading(false);
        }
    };

    const handleNavigate = (view) => {
        setCurrentView(view);
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
            await api.delete(`/projects/${project.gid}`);
            setProjects(projects.filter(p => p.gid !== project.gid));

            // If we're viewing tasks for the deleted project, clear them
            if (selectedProject?.gid === project.gid) {
                setTasks([]);
                setSelectedProject(null);
                setCurrentView('dashboard');
            }
        } catch (error) {
            console.error('Error deleting project:', error);
            alert(`Error deleting project: ${error.message}\n\nPlease check the server console for detailed logs.`);
        }
    };

    const handleSaveProject = async () => {
        setShowProjectModal(false);
        setEditingProject(null);
        // Reload projects to get the updated list
        await loadUserData();
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
            await api.delete(`/tasks/${task.gid}`);
            setTasks(tasks.filter(t => t.gid !== task.gid));
        } catch (error) {
            console.error('Error deleting task:', error);
            alert(`Error deleting task: ${error.message}\n\nPlease check the server console for detailed logs.`);
        }
    };

    const handleToggleTaskComplete = (task) => {
        setTasks(tasks.map(t =>
            t.gid === task.gid ? { ...t, completed: !t.completed } : t
        ));
    };

    const handleSaveTask = async () => {
        setShowTaskModal(false);
        setEditingTask(null);
        // Reload tasks for the current project
        if (selectedProject) {
            await loadProjectTasks(selectedProject);
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
                            setError(null);
                            setLoading(true);
                            setServerStatus('checking');
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
    }

    const renderCurrentView = () => {
        switch (currentView) {
            case 'dashboard':
                return (
                    <Dashboard
                        projects={projects}
                        tasks={tasks}
                        workspaces={workspaces}
                        onCreateProject={handleCreateProject}
                        onProjectClick={loadProjectTasks}
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
                            <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: '600' }}>
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
                                        backgroundColor: '#48bb78',
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
                                                backgroundColor: '#48bb78',
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
                                        onToggleComplete={handleToggleTaskComplete}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                );

            default:
                return null;
        }
    };

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
                            color: '#2d3748',
                            margin: 0
                        }}>
                            🚀 Enhanced Asana Dashboard
                        </h1>
                    </button>
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
                    <Navigation
                        currentView={currentView}
                        onNavigate={handleNavigate}
                        projects={projects}
                        tasks={tasks}
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
                    workspaceId={workspaces[0]?.gid}
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
                    projectId={selectedProject?.gid}
                    task={editingTask}
                    workspaceUsers={workspaceUsers}
                    onSave={handleSaveTask}
                    onCancel={() => setShowTaskModal(false)}
                />
            </Modal>
        </div>
    );
}

export default App;