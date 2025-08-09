// components/TaskForm.jsx
import React, { useState } from 'react';
import { useAsana } from '../context/AsanaContext.jsx';

const TaskForm = ({ task, onSave, onCancel }) => {
    const { selectedProject, workspaceUsers, createTask, updateTask } = useAsana();

    // Extract initial values from task custom fields
    const extractPriorityFromTask = (task) => {
        if (!task?.custom_fields) return 'None';
        const priorityField = task.custom_fields.find(field => field.name === "Priority");
        return priorityField?.enum_value?.name || 'None';
    };

    const extractProgressFromTask = (task) => {
        if (!task?.custom_fields) return 'Not Started';
        const progressField = task.custom_fields.find(field => field.name === "Task Progress");
        return progressField?.enum_value?.name || 'Not Started';
    };

    const [name, setName] = useState(task?.name || '');
    const [notes, setNotes] = useState(task?.notes || '');
    const [assignee, setAssignee] = useState(task?.assignee?.gid || '');
    const [dueDate, setDueDate] = useState(task?.due_on || '');
    const [priority, setPriority] = useState(extractPriorityFromTask(task));
    const [progress, setProgress] = useState(extractProgressFromTask(task));
    const [loading, setLoading] = useState(false);

    // Priority options with visual indicators
    const priorityOptions = [
        { value: 'None', label: 'No Priority', color: '#9ca3af', icon: '⚪' },
        { value: 'Low', label: 'Low Priority', color: '#10b981', icon: '🔵' },
        { value: 'Medium', label: 'Medium Priority', color: '#c5800b', icon: '🟡' },
        { value: 'High', label: 'High Priority', color: '#ef0909', icon: '🔴' }
    ];

    // Progress options with visual indicators
    const progressOptions = [
        { value: 'Not Started', label: 'Not Started', color: '#6b7280', icon: '⭕' },
        { value: 'In Progress', label: 'In Progress', color: '#d97706', icon: '🟡' },
        { value: 'Waiting', label: 'Waiting', color: '#ca8a04', icon: '⏸️' },
        { value: 'Deferred', label: 'Deferred', color: '#ea580c', icon: '⏭️' },
        { value: 'Done', label: 'Done', color: '#065f46', icon: '✅' }
    ];

    const getPriorityStyle = (priorityValue) => {
        const option = priorityOptions.find(opt => opt.value === priorityValue);
        return {
            color: option?.color || '#9ca3af',
            fontWeight: priorityValue !== 'None' ? '500' : 'normal'
        };
    };

    const getProgressStyle = (progressValue) => {
        const option = progressOptions.find(opt => opt.value === progressValue);
        return {
            color: option?.color || '#6b7280',
            fontWeight: progressValue !== 'Not Started' ? '500' : 'normal'
        };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;

        setLoading(true);
        try {
            const taskData = {
                name: name.trim(),
                notes: notes.trim(),
                assignee: assignee || null,
                due_on: dueDate || null,
                // Send custom fields for priority and progress
                custom_fields: {
                    priority: priority === 'None' ? null : priority,
                    progress: progress
                }
            };

            if (!task) {
                taskData.projects = [selectedProject?.gid];
            }

            if (task) {
                await updateTask(task.gid, taskData);
            } else {
                await createTask(taskData);
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
        <div style={{ maxWidth: '600px' }}>
            <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Task Name *
                </label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Enter task name..."
                    style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '1rem',
                        boxSizing: 'border-box',
                        transition: 'border-color 0.2s',
                        outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3182ce'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
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
                    placeholder="Add task description..."
                    style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '1rem',
                        resize: 'vertical',
                        boxSizing: 'border-box',
                        transition: 'border-color 0.2s',
                        outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3182ce'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />
            </div>

            {/* Priority and Progress in a grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                {/* Priority Selection */}
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                        Priority
                    </label>
                    <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '1rem',
                            boxSizing: 'border-box',
                            backgroundColor: 'white',
                            cursor: 'pointer',
                            outline: 'none',
                            transition: 'border-color 0.2s',
                            ...getPriorityStyle(priority)
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#3182ce'}
                        onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                    >
                        {priorityOptions.map(option => (
                            <option
                                key={option.value}
                                value={option.value}
                                style={{ color: option.color }}
                            >
                                {option.icon} {option.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Progress Selection */}
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                        Progress
                    </label>
                    <select
                        value={progress}
                        onChange={(e) => setProgress(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '1rem',
                            boxSizing: 'border-box',
                            backgroundColor: 'white',
                            cursor: 'pointer',
                            outline: 'none',
                            transition: 'border-color 0.2s',
                            ...getProgressStyle(progress)
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#3182ce'}
                        onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                    >
                        {progressOptions.map(option => (
                            <option
                                key={option.value}
                                value={option.value}
                                style={{ color: option.color }}
                            >
                                {option.icon} {option.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Status Preview */}
            <div style={{
                marginBottom: '1rem',
                padding: '0.75rem',
                backgroundColor: '#f8fafc',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                gap: '1rem',
                alignItems: 'center',
                fontSize: '0.875rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1rem' }}>
                        {priorityOptions.find(opt => opt.value === priority)?.icon}
                    </span>
                    <span style={getPriorityStyle(priority)}>
                        {priorityOptions.find(opt => opt.value === priority)?.label}
                    </span>
                </div>
                <div style={{ width: '1px', height: '20px', backgroundColor: '#d1d5db' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1rem' }}>
                        {progressOptions.find(opt => opt.value === progress)?.icon}
                    </span>
                    <span style={getProgressStyle(progress)}>
                        {progressOptions.find(opt => opt.value === progress)?.label}
                    </span>
                </div>
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
                            boxSizing: 'border-box',
                            backgroundColor: 'white',
                            cursor: 'pointer',
                            outline: 'none',
                            transition: 'border-color 0.2s'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#3182ce'}
                        onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                    >
                        <option value="">👤 Unassigned</option>
                        {workspaceUsers.map(user => (
                            <option key={user.gid} value={user.gid}>
                                👨‍💼 {user.name}
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
                            boxSizing: 'border-box',
                            cursor: 'pointer',
                            outline: 'none',
                            transition: 'border-color 0.2s'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#3182ce'}
                        onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                    />
                    {dueDate && (
                        <div style={{
                            marginTop: '0.25rem',
                            fontSize: '0.75rem',
                            color: '#6b7280'
                        }}>
                            📅 Due: {new Date(dueDate).toLocaleDateString('en-US', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                        })}
                        </div>
                    )}
                </div>
            </div>

            {/* Task Summary Preview */}
            {name.trim() && (
                <div style={{
                    marginBottom: '1.5rem',
                    padding: '1rem',
                    backgroundColor: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0'
                }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
                        📋 Task Preview
                    </h4>
                    <div style={{ fontSize: '0.875rem', color: '#4b5563' }}>
                        <div style={{ marginBottom: '0.25rem' }}>
                            <strong>Name:</strong> {name}
                        </div>
                        <div style={{ marginBottom: '0.25rem' }}>
                            <strong>Priority:</strong>
                            <span style={{ marginLeft: '0.5rem', ...getPriorityStyle(priority) }}>
                                {priorityOptions.find(opt => opt.value === priority)?.icon} {priorityOptions.find(opt => opt.value === priority)?.label}
                            </span>
                        </div>
                        <div style={{ marginBottom: '0.25rem' }}>
                            <strong>Progress:</strong>
                            <span style={{ marginLeft: '0.5rem', ...getProgressStyle(progress) }}>
                                {progressOptions.find(opt => opt.value === progress)?.icon} {progressOptions.find(opt => opt.value === progress)?.label}
                            </span>
                        </div>
                        <div style={{ marginBottom: '0.25rem' }}>
                            <strong>Assignee:</strong> {assignee ? workspaceUsers.find(u => u.gid === assignee)?.name || 'Unknown' : 'Unassigned'}
                        </div>
                        <div>
                            <strong>Due Date:</strong> {dueDate ? new Date(dueDate).toLocaleDateString() : 'No due date'}
                        </div>
                    </div>
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
                        transition: 'all 0.2s',
                        fontWeight: '500'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#f9fafb';
                        e.target.style.borderColor = '#9ca3af';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'white';
                        e.target.style.borderColor = '#d1d5db';
                    }}
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading || !name.trim()}
                    style={{
                        padding: '0.75rem 1.5rem',
                        backgroundColor: loading ? '#9ca3af' : '#3182ce',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        transition: 'background-color 0.2s',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                    onMouseEnter={(e) => {
                        if (!loading && name.trim()) {
                            e.target.style.backgroundColor = '#2563eb';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (!loading && name.trim()) {
                            e.target.style.backgroundColor = '#3182ce';
                        }
                    }}
                >
                    {loading && (
                        <div style={{
                            width: '16px',
                            height: '16px',
                            border: '2px solid #ffffff40',
                            borderTop: '2px solid #ffffff',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                        }} />
                    )}
                    {loading ? 'Saving...' : (task ? '✏️ Update' : '➕ Create')} Task
                </button>
            </div>

            <style jsx>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default TaskForm;