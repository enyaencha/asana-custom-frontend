// components/ProjectCard.jsx
import React from 'react';

const ProjectCard = ({ project, onClick, onEdit, onDelete, showWorkspace = false }) => {
    const formatDate = (dateString) => {
        if (!dateString) return 'No date';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const getProjectColor = (color) => {
        const colorMap = {
            'dark-pink': '#e53e3e',
            'dark-green': '#38a169',
            'dark-blue': '#3182ce',
            'dark-purple': '#805ad5',
            'dark-orange': '#dd6b20',
            'dark-teal': '#319795',
            'dark-brown': '#8b4513',
            'dark-red': '#c53030',
            'light-pink': '#f687b3',
            'light-green': '#68d391',
            'light-blue': '#63b3ed',
            'light-purple': '#b794f6',
            'light-orange': '#f6ad55',
            'light-teal': '#4fd1c7',
            'light-brown': '#cd853f',
            'light-red': '#fc8181'
        };
        return colorMap[color] || '#718096';
    };

    const projectColor = getProjectColor(project.color);

    return (
        <div
            style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '1.5rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                border: '1px solid #e2e8f0',
                cursor: onClick ? 'pointer' : 'default',
                transition: 'all 0.2s ease',
                position: 'relative',
                borderLeft: `4px solid ${projectColor}`
            }}
            onClick={() => onClick && onClick(project)}
            onMouseEnter={(e) => {
                if (onClick) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                }
            }}
            onMouseLeave={(e) => {
                if (onClick) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                }
            }}
        >
            {/* Project Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '1rem'
            }}>
                <div style={{ flex: 1 }}>
                    <h3 style={{
                        fontSize: '1.25rem',
                        fontWeight: '600',
                        color: '#2d3748',
                        margin: '0 0 0.5rem 0',
                        lineHeight: '1.4'
                    }}>
                        {project.name}
                    </h3>

                    {/* Workspace Badge */}
                    {showWorkspace && project.workspace && (
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            backgroundColor: '#ebf8ff',
                            color: '#3182ce',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            marginBottom: '0.5rem'
                        }}>
                            <span>🏢</span>
                            <span>{project.workspace.name}</span>
                        </div>
                    )}

                    {project.notes && (
                        <p style={{
                            fontSize: '0.875rem',
                            color: '#718096',
                            margin: '0',
                            lineHeight: '1.5',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                        }}>
                            {project.notes}
                        </p>
                    )}
                </div>

                {/* Action Buttons */}
                {(onEdit || onDelete) && (
                    <div style={{
                        display: 'flex',
                        gap: '0.5rem',
                        marginLeft: '1rem',
                        flexShrink: 0
                    }}>
                        {onEdit && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit(project);
                                }}
                                style={{
                                    background: 'none',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '0.875rem',
                                    padding: '0.5rem',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.backgroundColor = '#f7fafc';
                                    e.target.style.borderColor = '#cbd5e0';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = 'transparent';
                                    e.target.style.borderColor = '#e2e8f0';
                                }}
                            >
                                ✏️
                            </button>
                        )}
                        {onDelete && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (window.confirm(`Are you sure you want to delete "${project.name}"?`)) {
                                        onDelete(project);
                                    }
                                }}
                                style={{
                                    background: 'none',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '0.875rem',
                                    padding: '0.5rem',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.backgroundColor = '#fed7d7';
                                    e.target.style.borderColor = '#feb2b2';
                                    e.target.style.color = '#c53030';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = 'transparent';
                                    e.target.style.borderColor = '#e2e8f0';
                                    e.target.style.color = 'inherit';
                                }}
                            >
                                🗑️
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Project Metadata */}
            <div style={{
                display: 'flex',
                gap: '1rem',
                fontSize: '0.75rem',
                color: '#a0aec0',
                marginBottom: '1rem',
                flexWrap: 'wrap'
            }}>
                {/* Owner */}
                {project.owner && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                    }}>
                        <span>👤</span>
                        <span>{project.owner.name}</span>
                    </div>
                )}

                {/* Team */}
                {project.team && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                    }}>
                        <span>👥</span>
                        <span>{project.team.name}</span>
                    </div>
                )}

                {/* Members Count */}
                {project.members && project.members.length > 0 && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                    }}>
                        <span>👫</span>
                        <span>{project.members.length} member{project.members.length !== 1 ? 's' : ''}</span>
                    </div>
                )}

                {/* Privacy Status */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                }}>
                    <span>{project.public ? '🌐' : '🔒'}</span>
                    <span>{project.public ? 'Public' : 'Private'}</span>
                </div>
            </div>

            {/* Project Status */}
            {project.current_status && (
                <div style={{
                    backgroundColor: '#f7fafc',
                    padding: '0.75rem',
                    borderRadius: '6px',
                    marginBottom: '1rem',
                    border: '1px solid #e2e8f0'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.875rem'
                    }}>
                        <span>📊</span>
                        <span style={{ fontWeight: '500', color: '#4a5568' }}>Status:</span>
                        <span style={{ color: '#718096' }}>{project.current_status.text}</span>
                    </div>
                </div>
            )}

            {/* Project Footer */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.75rem',
                color: '#a0aec0'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                }}>
                    <span>📅</span>
                    <span>Created {formatDate(project.created_at)}</span>
                </div>

                {project.modified_at && project.modified_at !== project.created_at && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                    }}>
                        <span>🔄</span>
                        <span>Updated {formatDate(project.modified_at)}</span>
                    </div>
                )}
            </div>

            {/* Archived Badge */}
            {project.archived && (
                <div style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    backgroundColor: '#fed7aa',
                    color: '#c05621',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: '600'
                }}>
                    📦 Archived
                </div>
            )}
        </div>
    );
};

export default ProjectCard;