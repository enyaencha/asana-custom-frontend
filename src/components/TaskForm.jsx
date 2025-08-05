// components/TaskForm.jsx
import React, { useState } from 'react';
import { useAsana } from '../context/AsanaContext.jsx';

const TaskForm = ({ task, onSave, onCancel }) => {
    const { selectedProject, workspaceUsers, createTask, updateTask } = useAsana();
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

export default TaskForm;