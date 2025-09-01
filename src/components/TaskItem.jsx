// components/TaskItem.jsx
import React, { useState } from 'react';
import { useAsana } from '../context/AsanaContext.jsx';

const TaskItem = ({ task, onEdit, onDelete, showProject = false }) => {
    const { toggleTaskComplete, workspaceUsers, updateTask } = useAsana();

    // State for inline editing
    const [editingPriority, setEditingPriority] = useState(false);
    const [editingProgress, setEditingProgress] = useState(false);
    const [updating, setUpdating] = useState(false);

    // Priority and Progress options (same as TaskForm)
    const priorityOptions = [
        { value: 'None', label: 'No Priority', color: '#9ca3af', icon: '⚪' },
        { value: 'Low', label: 'Low Priority', color: '#10b981', icon: '🔵' },
        { value: 'Medium', label: 'Medium Priority', color: '#c5800b', icon: '🟡' },
        { value: 'High', label: 'High Priority', color: '#ef0909', icon: '🔴' }
    ];

    const progressOptions = [
        { value: 'Not Started', label: 'Not Started', color: '#6b7280', icon: '⭕' },
        { value: 'In Progress', label: 'In Progress', color: '#d97706', icon: '🟡' },
        { value: 'Waiting', label: 'Waiting', color: '#ca8a04', icon: '⏸️' },
        { value: 'Deferred', label: 'Deferred', color: '#ea580c', icon: '⏭️' },
        { value: 'Done', label: 'Done', color: '#065f46', icon: '✅' }
    ];

    // Extract functions
    const extractPriority = (task) => {
        const priorityField = task.custom_fields?.find(field => field.name === "Priority");
        const priority = priorityField?.enum_value?.name;
        return priority || 'None';
    };

    const extractTaskProgress = (task) => {
        const progressField = task.custom_fields?.find(field => field.name === "Task Progress");
        return progressField?.enum_value?.name || 'Not Started';
    };

    const extractAssignee = (task) => {
        if (task.assignee) {
            if (task.assignee.name) {
                return task.assignee.name;
            }
            if (task.assignee.gid && workspaceUsers) {
                const user = workspaceUsers.find(u => u.gid === task.assignee.gid);
                return user?.name || `User ${task.assignee.gid}`;
            }
            return 'Assigned';
        }
        return null;
    };

    // Handle priority update
    const handlePriorityUpdate = async (newPriority) => {
        if (updating) return;

        setUpdating(true);
        try {
            const updateData = {
                custom_fields: {
                    priority: newPriority === 'None' ? null : newPriority
                }
            };

            await updateTask(task.gid, updateData);
            setEditingPriority(false);
        } catch (error) {
            console.error('Error updating priority:', error);
            alert(`Error updating priority: ${error.message}`);
        } finally {
            setUpdating(false);
        }
    };

    // Handle progress update
    const handleProgressUpdate = async (newProgress) => {
        if (updating) return;

        setUpdating(true);
        try {
            const updateData = {
                custom_fields: {
                    progress: newProgress
                }
            };

            await updateTask(task.gid, updateData);
            setEditingProgress(false);
        } catch (error) {
            console.error('Error updating progress:', error);
            alert(`Error updating progress: ${error.message}`);
        } finally {
            setUpdating(false);
        }
    };

    const handleToggleComplete = async () => {
        try {
            await toggleTaskComplete(task);
        } catch (error) {
            console.error('Error toggling task:', error);
            alert(`Error updating task: ${error.message}`);
        }
    };

    // Priority configuration
    const getPriorityConfig = (priority) => {
        const option = priorityOptions.find(opt => opt.value === priority);
        if (!option || priority === 'None') return null;

        return {
            label: option.label,
            icon: option.icon,
            bgColor: priority === 'high' ? '#fef2f2' : priority === 'medium' ? '#fffbeb' : '#eff6ff',
            textColor: option.color,
            borderColor: priority === 'high' ? '#fecaca' : priority === 'medium' ? '#fed7aa' : '#bfdbfe'
        };
    };

    // Progress configuration
    const getProgressConfig = (progress) => {
        const option = progressOptions.find(opt => opt.value === progress);
        if (!option || progress === 'Not Started') return null;

        return {
            label: option.label,
            icon: option.icon,
            bgColor: progress === 'Done' ? '#d1fae5' : progress === 'In Progress' ? '#fef3c7' :
                progress === 'Waiting' ? '#fef9c3' : '#fed7aa',
            textColor: option.color,
            borderColor: progress === 'Done' ? '#34d399' : progress === 'In Progress' ? '#fcd34d' :
                progress === 'Waiting' ? '#fde047' : '#fb923c'
        };
    };

    // Due date status
    const getDueDateStatus = () => {
        if (!task.due_on || task.completed) return null;

        const dueDate = new Date(task.due_on);
        const today = new Date();
        const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
        const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

        if (dueDate < today) {
            return { status: 'overdue', color: '#dc2626', bgColor: '#fef2f2' };
        } else if (dueDate <= tomorrow) {
            return { status: 'due-soon', color: '#d97706', bgColor: '#fffbeb' };
        } else if (dueDate <= nextWeek) {
            return { status: 'upcoming', color: '#059669', bgColor: '#ecfdf5' };
        }
        return { status: 'future', color: '#6b7280', bgColor: 'transparent' };
    };

    // Extract values
    const taskPriority = extractPriority(task);
    const taskProgress = extractTaskProgress(task);
    const taskAssignee = extractAssignee(task);
    const priorityConfig = getPriorityConfig(taskPriority);
    const progressConfig = getProgressConfig(taskProgress);
    const dueDateStatus = getDueDateStatus();

    // Priority dropdown component
    const PriorityDropdown = () => (
        <div style={{
            position: 'absolute',
            top: '100%',
            left: '0',
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            zIndex: 1000,
            minWidth: '150px',
            marginTop: '4px'
        }}>
            {priorityOptions.map(option => (
                <button
                    key={option.value}
                    onClick={() => handlePriorityUpdate(option.value)}
                    disabled={updating}
                    style={{
                        width: '100%',
                        padding: '0.5rem 0.75rem',
                        border: 'none',
                        backgroundColor: 'transparent',
                        cursor: updating ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.75rem',
                        color: option.color,
                        fontWeight: taskPriority === option.value ? '600' : 'normal',
                        opacity: updating ? 0.5 : 1
                    }}
                    onMouseEnter={(e) => {
                        if (!updating) e.target.style.backgroundColor = '#f9fafb';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                    }}
                >
                    <span>{option.icon}</span>
                    <span>{option.label}</span>
                    {taskPriority === option.value && <span style={{ marginLeft: 'auto' }}>✓</span>}
                </button>
            ))}
        </div>
    );

    // Progress dropdown component
    const ProgressDropdown = () => (
        <div style={{
            position: 'absolute',
            top: '100%',
            left: '0',
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            zIndex: 1000,
            minWidth: '150px',
            marginTop: '4px'
        }}>
            {progressOptions.map(option => (
                <button
                    key={option.value}
                    onClick={() => handleProgressUpdate(option.value)}
                    disabled={updating}
                    style={{
                        width: '100%',
                        padding: '0.5rem 0.75rem',
                        border: 'none',
                        backgroundColor: 'transparent',
                        cursor: updating ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.75rem',
                        color: option.color,
                        fontWeight: taskProgress === option.value ? '600' : 'normal',
                        opacity: updating ? 0.5 : 1
                    }}
                    onMouseEnter={(e) => {
                        if (!updating) e.target.style.backgroundColor = '#f9fafb';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                    }}
                >
                    <span>{option.icon}</span>
                    <span>{option.label}</span>
                    {taskProgress === option.value && <span style={{ marginLeft: 'auto' }}>✓</span>}
                </button>
            ))}
        </div>
    );

    return (
        <div style={{
            backgroundColor: 'white',
            border: `1px solid ${task.completed ? '#e5e7eb' : '#e2e8f0'}`,
            borderLeft: priorityConfig ? `4px solid ${priorityConfig.textColor}` : '4px solid transparent',
            borderRadius: '8px',
            padding: '1.25rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '1rem',
            opacity: task.completed ? 0.7 : 1,
            transition: 'all 0.2s ease',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            position: 'relative'
        }}>
            {/* Completion Checkbox */}
            <div style={{ marginTop: '0.125rem' }}>
                <input
                    type="checkbox"
                    checked={task.completed || false}
                    onChange={handleToggleComplete}
                    style={{
                        cursor: 'pointer',
                        width: '18px',
                        height: '18px',
                        accentColor: '#10b981'
                    }}
                />
            </div>

            {/* Main Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
                {/* Task Name */}
                <h4 style={{
                    margin: '0 0 0.5rem 0',
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    color: task.completed ? '#9ca3af' : '#1f2937',
                    textDecoration: task.completed ? 'line-through' : 'none',
                    lineHeight: '1.4',
                    wordBreak: 'break-word'
                }}>
                    {task.name}
                    {showProject && task.projects && task.projects.length > 0 && (
                        <span style={{
                            marginLeft: '0.5rem',
                            fontSize: '0.75rem',
                            fontWeight: '400',
                            color: '#6b7280',
                            backgroundColor: '#f3f4f6',
                            padding: '0.125rem 0.5rem',
                            borderRadius: '12px'
                        }}>
                            📁 {task.projects[0].name}
                        </span>
                    )}
                </h4>

                {/* Task Notes */}
                {task.notes && (
                    <p style={{
                        margin: '0 0 0.75rem 0',
                        fontSize: '0.875rem',
                        color: task.completed ? '#9ca3af' : '#6b7280',
                        lineHeight: '1.5',
                        wordBreak: 'break-word'
                    }}>
                        {task.notes}
                    </p>
                )}

                {/* Task Metadata */}
                <div style={{
                    display: 'flex',
                    gap: '1rem',
                    alignItems: 'center',
                    fontSize: '0.8rem',
                    flexWrap: 'wrap',
                    marginBottom: '0.5rem'
                }}>
                    {/* Assignee */}
                    {taskAssignee && (
                        <span style={{
                            color: '#6b7280',
                            backgroundColor: '#f9fafb',
                            border: '1px solid #e5e7eb',
                            padding: '0.125rem 0.5rem',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                        }}>
                            <span>👤</span>
                            <span>{taskAssignee}</span>
                        </span>
                    )}

                    {/* Due Date */}
                    {task.due_on && (
                        <span style={{
                            color: dueDateStatus?.color || '#6b7280',
                            backgroundColor: dueDateStatus?.bgColor || 'transparent',
                            padding: dueDateStatus?.bgColor !== 'transparent' ? '0.25rem 0.5rem' : '0',
                            borderRadius: '12px',
                            fontWeight: dueDateStatus?.status === 'overdue' ? '600' : 'normal',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                        }}>
                            <span>📅</span>
                            <span>
                                Due {new Date(task.due_on).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: new Date(task.due_on).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                            })}
                                {dueDateStatus?.status === 'overdue' && ' (Overdue)'}
                                {dueDateStatus?.status === 'due-soon' && ' (Due Soon)'}
                            </span>
                        </span>
                    )}

                    {/* Creation Date */}
                    {task.created_at && (
                        <span style={{
                            color: '#9ca3af',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                        }}>
                            <span>📝</span>
                            <span>
                                Created {new Date(task.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric'
                            })}
                            </span>
                        </span>
                    )}

                    {/* Clickable Priority */}
                    <div style={{ position: 'relative' }}>
                        {priorityConfig ? (
                            <button
                                onClick={() => setEditingPriority(!editingPriority)}
                                disabled={updating}
                                style={{
                                    backgroundColor: priorityConfig.bgColor,
                                    color: priorityConfig.textColor,
                                    border: `1px solid ${priorityConfig.borderColor}`,
                                    padding: '0.125rem 0.5rem',
                                    borderRadius: '12px',
                                    fontSize: '0.75rem',
                                    fontWeight: '600',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    cursor: updating ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s',
                                    opacity: updating ? 0.5 : 1
                                }}
                                onMouseEnter={(e) => {
                                    if (!updating) {
                                        e.target.style.transform = 'scale(1.05)';
                                        e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.transform = 'scale(1)';
                                    e.target.style.boxShadow = 'none';
                                }}
                                title="Click to change priority"
                            >
                                <span>{priorityConfig.icon}</span>
                                <span>{priorityConfig.label}</span>
                                <span style={{ fontSize: '0.6rem' }}>▼</span>
                            </button>
                        ) : (
                            <button
                                onClick={() => setEditingPriority(!editingPriority)}
                                disabled={updating}
                                style={{
                                    backgroundColor: '#f3f4f6',
                                    color: '#9ca3af',
                                    border: '1px solid #e5e7eb',
                                    padding: '0.125rem 0.5rem',
                                    borderRadius: '12px',
                                    fontSize: '0.75rem',
                                    fontWeight: '500',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    cursor: updating ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s',
                                    opacity: updating ? 0.5 : 1
                                }}
                                onMouseEnter={(e) => {
                                    if (!updating) {
                                        e.target.style.backgroundColor = '#e5e7eb';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = '#f3f4f6';
                                }}
                                title="Click to set priority"
                            >
                                <span>⚪</span>
                                <span>No Priority</span>
                                <span style={{ fontSize: '0.6rem' }}>▼</span>
                            </button>
                        )}
                        {editingPriority && <PriorityDropdown />}
                    </div>

                    {/* Clickable Progress */}
                    <div style={{ position: 'relative' }}>
                        {progressConfig ? (
                            <button
                                onClick={() => setEditingProgress(!editingProgress)}
                                disabled={updating}
                                style={{
                                    backgroundColor: progressConfig.bgColor,
                                    color: progressConfig.textColor,
                                    border: `1px solid ${progressConfig.borderColor}`,
                                    padding: '0.125rem 0.5rem',
                                    borderRadius: '12px',
                                    fontSize: '0.75rem',
                                    fontWeight: '600',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    cursor: updating ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s',
                                    opacity: updating ? 0.5 : 1
                                }}
                                onMouseEnter={(e) => {
                                    if (!updating) {
                                        e.target.style.transform = 'scale(1.05)';
                                        e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.transform = 'scale(1)';
                                    e.target.style.boxShadow = 'none';
                                }}
                                title="Click to change progress"
                            >
                                <span>{progressConfig.icon}</span>
                                <span>{progressConfig.label}</span>
                                <span style={{ fontSize: '0.6rem' }}>▼</span>
                            </button>
                        ) : (
                            <button
                                onClick={() => setEditingProgress(!editingProgress)}
                                disabled={updating}
                                style={{
                                    backgroundColor: '#f3f4f6',
                                    color: '#9ca3af',
                                    border: '1px solid #e5e7eb',
                                    padding: '0.125rem 0.5rem',
                                    borderRadius: '12px',
                                    fontSize: '0.75rem',
                                    fontWeight: '500',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    cursor: updating ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s',
                                    opacity: updating ? 0.5 : 1
                                }}
                                onMouseEnter={(e) => {
                                    if (!updating) {
                                        e.target.style.backgroundColor = '#e5e7eb';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = '#f3f4f6';
                                }}
                                title="Click to set progress"
                            >
                                <span>⭕</span>
                                <span>Not Started</span>
                                <span style={{ fontSize: '0.6rem' }}>▼</span>
                            </button>
                        )}
                        {editingProgress && <ProgressDropdown />}
                    </div>
                </div>

                {/* Additional Task Info */}
                {(task.tags && task.tags.length > 0) && (
                    <div style={{
                        display: 'flex',
                        gap: '0.5rem',
                        flexWrap: 'wrap',
                        marginTop: '0.5rem'
                    }}>
                        {task.tags.map((tag, index) => (
                            <span key={index} style={{
                                backgroundColor: '#f3f4f6',
                                color: '#374151',
                                padding: '0.125rem 0.5rem',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem'
                            }}>
                                <span>🏷️</span>
                                {tag.name || tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            {(onEdit || onDelete) && (
                <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    marginLeft: 'auto',
                    flexShrink: 0
                }}>
                    {onEdit && (
                        <button
                            onClick={() => onEdit(task)}
                            style={{
                                background: 'none',
                                border: '1px solid #e5e7eb',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '1rem',
                                padding: '0.5rem',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                            title="Edit task"
                            onMouseEnter={(e) => {
                                e.target.style.backgroundColor = '#f3f4f6';
                                e.target.style.borderColor = '#d1d5db';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.backgroundColor = 'transparent';
                                e.target.style.borderColor = '#e5e7eb';
                            }}
                        >
                            ✏️
                        </button>
                    )}
                    {onDelete && (
                        <button
                            onClick={() => {
                                if (window.confirm(`Are you sure you want to delete "${task.name}"?`)) {
                                    onDelete(task);
                                }
                            }}
                            style={{
                                background: 'none',
                                border: '1px solid #e5e7eb',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '1rem',
                                padding: '0.5rem',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                            title="Delete task"
                            onMouseEnter={(e) => {
                                e.target.style.backgroundColor = '#fef2f2';
                                e.target.style.borderColor = '#fecaca';
                                e.target.style.color = '#dc2626';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.backgroundColor = 'transparent';
                                e.target.style.borderColor = '#e5e7eb';
                                e.target.style.color = 'inherit';
                            }}
                        >
                            🗑️
                        </button>
                    )}
                </div>
            )}

            {/* Completion Indicator */}
            {task.completed && (
                <div style={{
                    position: 'absolute',
                    top: '0.75rem',
                    right: '0.75rem',
                    backgroundColor: '#10b981',
                    color: 'white',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: '600'
                }}>
                    ✓
                </div>
            )}

            {/* Click outside to close dropdowns */}
            {(editingPriority || editingProgress) && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 999
                    }}
                    onClick={() => {
                        setEditingPriority(false);
                        setEditingProgress(false);
                    }}
                />
            )}
        </div>
    );
};

export default TaskItem;