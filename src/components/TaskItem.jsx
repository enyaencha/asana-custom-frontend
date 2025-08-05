// components/TaskItem.jsx
import React from 'react';
import { useAsana } from '../context/AsanaContext.jsx';

const TaskItem = ({ task, onEdit, onDelete }) => {
    const { toggleTaskComplete } = useAsana();

    const handleToggleComplete = async () => {
        try {
            await toggleTaskComplete(task);
        } catch (error) {
            console.error('Error toggling task:', error);
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

            {(onEdit || onDelete) && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {onEdit && (
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
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '1rem',
                                padding: '0.25rem'
                            }}
                            title="Delete task"
                        >
                            🗑️
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default TaskItem;