// components/TaskItem.jsx
import React from 'react';
import { useAsana } from '../context/AsanaContext.jsx';
// import { extractPriority, extractTaskProgress } from '../utils/taskHelpers.jsx';

const TaskItem = ({ task, onEdit, onDelete }) => {
    const { toggleTaskComplete, workspaceUsers } = useAsana();

    // Add these functions directly for now
    const extractPriority = (task) => {
        const priorityField = task.custom_fields?.find(field => field.name === "Priority");
        const priority = priorityField?.enum_value?.name;
        console.log('Priority field found:', priorityField);
        console.log('Priority value:', priority);
        return priority?.toLowerCase() || null;
    };

    const extractTaskProgress = (task) => {
        const progressField = task.custom_fields?.find(field => field.name === "Task Progress");
        return progressField?.enum_value?.name || null;
    };

    const extractAssignee = (task) => {
        // Use the same method as TaskForm - lookup in workspaceUsers
        if (task.assignee) {
            console.log('Assignee found:', task.assignee);

            // First try to get the name directly if it exists
            if (task.assignee.name) {
                return task.assignee.name;
            }

            // If no name, lookup in workspaceUsers using gid (same as TaskForm)
            if (task.assignee.gid && workspaceUsers) {
                const user = workspaceUsers.find(u => u.gid === task.assignee.gid);
                console.log('Found user in workspaceUsers:', user);
                return user?.name || `User ${task.assignee.gid}`;
            }

            return 'Assigned';
        }
        return null;
    };

    // Function to fetch user name by GID (similar to your task form)
    const [assigneeName, setAssigneeName] = React.useState(null);

    React.useEffect(() => {
        const fetchAssigneeName = async () => {
            if (task.assignee && task.assignee.gid && !task.assignee.name) {
                try {
                    // Use the same method as your task form to fetch user details
                    const response = await fetch(`/api/asana/users/${task.assignee.gid}`, {
                        headers: {
                            'Authorization': 'Bearer YOUR_TOKEN' // You'll need to get this from your context
                        }
                    });
                    const userData = await response.json();
                    if (userData && userData.data) {
                        setAssigneeName(userData.data.name);
                    }
                } catch (error) {
                    console.error('Error fetching assignee name:', error);
                    setAssigneeName(null);
                }
            }
        };

        fetchAssigneeName();
    }, [task.assignee]);

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
        console.log('Getting priority config for:', priority);
        switch (priority) {
            case 'high':
                return {
                    label: 'High',
                    icon: '🔴',
                    bgColor: '#fef2f2',
                    textColor: '#dc2626',
                    borderColor: '#fecaca'
                };
            case 'medium':
                return {
                    label: 'Medium',
                    icon: '🟡',
                    bgColor: '#fffbeb',
                    textColor: '#d97706',
                    borderColor: '#fed7aa'
                };
            case 'low':
                return {
                    label: 'Low',
                    icon: '🔵',
                    bgColor: '#eff6ff',
                    textColor: '#2563eb',
                    borderColor: '#bfdbfe'
                };
            default:
                return null;
        }
    };

    // Progress configuration
    const getProgressConfig = (progress) => {
        console.log('Getting progress config for:', progress);
        switch (progress) {
            case 'Not Started':
                return {
                    label: 'Not Started',
                    icon: '⭕',
                    bgColor: '#f3f4f6',
                    textColor: '#6b7280',
                    borderColor: '#d1d5db'
                };
            case 'In Progress':
                return {
                    label: 'In Progress',
                    icon: '🟡',
                    bgColor: '#fef3c7',
                    textColor: '#d97706',
                    borderColor: '#fcd34d'
                };
            case 'Waiting':
                return {
                    label: 'Waiting',
                    icon: '⏸️',
                    bgColor: '#fef9c3',
                    textColor: '#ca8a04',
                    borderColor: '#fde047'
                };
            case 'Deferred':
                return {
                    label: 'Deferred',
                    icon: '⏭️',
                    bgColor: '#fed7aa',
                    textColor: '#ea580c',
                    borderColor: '#fb923c'
                };
            case 'Done':
                return {
                    label: 'Done',
                    icon: '✅',
                    bgColor: '#d1fae5',
                    textColor: '#065f46',
                    borderColor: '#34d399'
                };
            default:
                return null;
        }
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

    // Extract values and add debug logging
    console.log('Task object:', task);
    console.log('Workspace users:', workspaceUsers);
    const taskPriority = extractPriority(task);
    const taskProgress = extractTaskProgress(task);
    const taskAssignee = extractAssignee(task); // Now uses workspaceUsers lookup like TaskForm
    const priorityConfig = getPriorityConfig(taskPriority);
    const progressConfig = getProgressConfig(taskProgress);
    const dueDateStatus = getDueDateStatus();

    console.log('Task priority:', taskPriority);
    console.log('Priority config:', priorityConfig);
    console.log('Task progress:', taskProgress);
    console.log('Progress config:', progressConfig);
    console.log('Task assignee:', taskAssignee);

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

                    {/* Priority */}
                    {priorityConfig && (
                        <span style={{
                            backgroundColor: priorityConfig.bgColor,
                            color: priorityConfig.textColor,
                            border: `1px solid ${priorityConfig.borderColor}`,
                            padding: '0.125rem 0.5rem',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                        }}>
                            <span>{priorityConfig.icon}</span>
                            <span>{priorityConfig.label}</span>
                        </span>
                    )}

                    {/* Progress */}
                    {progressConfig && (
                        <span style={{
                            backgroundColor: progressConfig.bgColor,
                            color: progressConfig.textColor,
                            border: `1px solid ${progressConfig.borderColor}`,
                            padding: '0.125rem 0.5rem',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                        }}>
                            <span>{progressConfig.icon}</span>
                            <span>{progressConfig.label}</span>
                        </span>
                    )}
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
        </div>
    );
};

export default TaskItem;