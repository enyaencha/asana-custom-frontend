// components/ProjectCard.jsx
import React from 'react';

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
        return colorMap[colorName] || '#4169e1';
    };

    return (
        <div
            style={{
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderLeft: `4px solid ${getProjectColor(project.color)}`,
                borderRadius: '12px',
                padding: '1.5rem',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                transition: 'all 0.2s',
                position: 'relative',
                opacity: project.archived ? 0.6 : 1
            }}
        >
            {/* Edit / Delete buttons */}
            {(onEdit || onDelete) && (
                <div
                    style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem',
                        display: 'flex',
                        gap: '0.5rem'
                    }}
                >
                    {onEdit && (
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
                                borderRadius: '4px'
                            }}
                            title="Edit project"
                        >
                            ✏️
                        </button>
                    )}
                    {onDelete && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (
                                    window.confirm(`Are you sure you want to delete "${project.name}"?`)
                                ) {
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
                    )}
                </div>
            )}

            {/* Clickable area */}
            <div
                onClick={onClick ? () => onClick(project) : undefined}
                style={{ cursor: onClick ? 'pointer' : 'default' }}
            >
                <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <h3
                        style={{
                            fontSize: '1.25rem',
                            fontWeight: '600',
                            color: project.archived ? '#9ca3af' : '#2d3748',
                            margin: '0 2rem 0 0',
                            flex: 1,
                            textDecoration: project.archived ? 'line-through' : 'none'
                        }}
                    >
                        {project.name}
                    </h3>
                    {project.archived && (
                        <span
                            style={{
                                backgroundColor: '#fef2f2',
                                color: '#dc2626',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                whiteSpace: 'nowrap',
                                border: '1px solid #fecaca'
                            }}
                        >
                            📦 ARCHIVED
                        </span>
                    )}
                </div>

                {project.notes && (
                    <p
                        style={{
                            color: project.archived ? '#9ca3af' : '#718096',
                            fontSize: '0.875rem',
                            margin: '0 0 1rem 0',
                            lineHeight: '1.4'
                        }}
                    >
                        {project.notes}
                    </p>
                )}

                {/* Metadata section */}
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: '1rem'
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.25rem'
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                color: project.archived ? '#9ca3af' : '#718096',
                                fontSize: '0.875rem'
                            }}
                        >
                            <span>📋</span>
                            <span>{taskCount} tasks</span>
                        </div>
                        {project.created_at && (
                            <div
                                style={{
                                    color: project.archived ? '#9ca3af' : '#718096',
                                    fontSize: '0.75rem'
                                }}
                            >
                                📅 Created {new Date(project.created_at).toLocaleDateString()}
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        {project.public && (
                            <span
                                style={{
                                    backgroundColor: project.archived ? '#f3f4f6' : '#e6fffa',
                                    color: project.archived ? '#6b7280' : '#234e52',
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: '12px',
                                    fontSize: '0.75rem',
                                    fontWeight: '500'
                                }}
                            >
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

export default ProjectCard;
