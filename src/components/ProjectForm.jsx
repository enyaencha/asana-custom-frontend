// components/ProjectForm.jsx
import React, { useState } from 'react';
import { useAsana } from '../context/AsanaContext.jsx';

const ProjectForm = ({ project, onSave, onCancel }) => {
    const { workspaces, createProject, updateProject } = useAsana();
    const [name, setName] = useState(project?.name || '');
    const [notes, setNotes] = useState(project?.notes || '');
    const [isPublic, setIsPublic] = useState(project?.public !== false);
    const [color, setColor] = useState(project?.color || 'dark-blue');
    const [archived, setArchived] = useState(project?.archived || false);
    const [loading, setLoading] = useState(false);

    // Real Asana project colors
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
                projectData.workspace = workspaces[0]?.gid;
            }

            console.log('Sending project data:', projectData);

            if (project) {
                await updateProject(project.gid, projectData);
            } else {
                await createProject(projectData);
            }

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

export default ProjectForm;