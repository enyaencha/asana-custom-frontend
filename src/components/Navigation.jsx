// components/Navigation.jsx
import React from 'react';
import { useAsana } from '../context/AsanaContext.jsx';

const Navigation = ({ currentView, onNavigate, currentTheme }) => {
    const { selectedWorkspace, workspaces, projects, tasks } = useAsana();

    const menuItems = [
        {
            id: 'dashboard',
            label: 'Dashboard',
            icon: '📊',
            description: 'Overview & Stats'
        },
        {
            id: 'projects',
            label: 'Projects',
            icon: '📁',
            description: `${projects.length} project${projects.length !== 1 ? 's' : ''}`,
            badge: projects.length
        },
        {
            id: 'tasks',
            label: 'Tasks',
            icon: '✅',
            description: `${tasks.length} task${tasks.length !== 1 ? 's' : ''}`,
            badge: tasks.filter(t => !t.completed).length
        },
        {
            id: 'insights',
            label: 'AI Insights',
            icon: '🤖',
            description: 'Smart Analytics'
        },
        {
            id: 'activity',
            label: 'Activity',
            icon: '📋',
            description: 'Recent Changes'
        },
        {
            id: 'themes',
            label: 'Themes',
            icon: '🎨',
            description: 'Customize Look'
        },
        {
            id: 'settings',
            label: 'Settings',
            icon: '⚙️',
            description: 'Preferences'
        }
    ];

    const getItemStyle = (itemId) => ({
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.75rem 1.5rem',
        cursor: 'pointer',
        borderRadius: '8px',
        margin: '0 1rem 0.5rem 1rem',
        transition: 'all 0.2s ease',
        backgroundColor: currentView === itemId ? (currentTheme?.primary || '#3182ce') + '15' : 'transparent',
        color: currentView === itemId ? (currentTheme?.primary || '#3182ce') : '#4a5568',
        border: currentView === itemId ? `1px solid ${currentTheme?.primary || '#3182ce'}25` : '1px solid transparent'
    });

    return (
        <nav style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Workspace Info */}
            <div style={{
                padding: '1rem 1.5rem',
                borderBottom: '1px solid #e2e8f0',
                marginBottom: '1rem'
            }}>
                <div style={{
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: '#a0aec0',
                    marginBottom: '0.5rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                }}>
                    Current Workspace
                </div>
                {selectedWorkspace ? (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem',
                        backgroundColor: currentTheme?.primary ? `${currentTheme.primary}10` : '#ebf8ff',
                        borderRadius: '8px',
                        border: `1px solid ${currentTheme?.primary || '#3182ce'}25`
                    }}>
                        <span style={{ fontSize: '1.25rem' }}>🏢</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                                fontWeight: '600',
                                color: currentTheme?.primary || '#3182ce',
                                fontSize: '0.875rem',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                            }}>
                                {selectedWorkspace.name}
                            </div>
                            <div style={{
                                fontSize: '0.75rem',
                                color: '#718096'
                            }}>
                                {projects.length} project{projects.length !== 1 ? 's' : ''}
                            </div>
                        </div>
                        {workspaces.length > 1 && (
                            <div style={{
                                backgroundColor: currentTheme?.primary || '#3182ce',
                                color: 'white',
                                borderRadius: '12px',
                                padding: '0.125rem 0.5rem',
                                fontSize: '0.75rem',
                                fontWeight: '600'
                            }}>
                                1/{workspaces.length}
                            </div>
                        )}
                    </div>
                ) : (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem',
                        backgroundColor: '#f7fafc',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0'
                    }}>
                        <span style={{ fontSize: '1.25rem' }}>🌐</span>
                        <div>
                            <div style={{
                                fontWeight: '600',
                                color: '#4a5568',
                                fontSize: '0.875rem'
                            }}>
                                All Workspaces
                            </div>
                            <div style={{
                                fontSize: '0.75rem',
                                color: '#718096'
                            }}>
                                {workspaces.length} workspace{workspaces.length !== 1 ? 's' : ''}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation Menu */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
                <div style={{
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: '#a0aec0',
                    margin: '0 1.5rem 1rem 1.5rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                }}>
                    Navigation
                </div>

                {menuItems.map(item => (
                    <div
                        key={item.id}
                        style={getItemStyle(item.id)}
                        onClick={() => onNavigate(item.id)}
                        onMouseEnter={(e) => {
                            if (currentView !== item.id) {
                                e.target.style.backgroundColor = '#f7fafc';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (currentView !== item.id) {
                                e.target.style.backgroundColor = 'transparent';
                            }
                        }}
                    >
                        <span style={{ fontSize: '1.25rem' }}>{item.icon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                                fontWeight: '600',
                                fontSize: '0.875rem',
                                marginBottom: '0.125rem'
                            }}>
                                {item.label}
                            </div>
                            <div style={{
                                fontSize: '0.75rem',
                                color: currentView === item.id ? (currentTheme?.primary || '#3182ce') + '80' : '#a0aec0'
                            }}>
                                {item.description}
                            </div>
                        </div>
                        {item.badge !== undefined && item.badge > 0 && (
                            <span style={{
                                backgroundColor: currentView === item.id ? (currentTheme?.primary || '#3182ce') : '#e53e3e',
                                color: 'white',
                                borderRadius: '50%',
                                width: '20px',
                                height: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.75rem',
                                fontWeight: '600'
                            }}>
                                {item.badge > 99 ? '99+' : item.badge}
                            </span>
                        )}
                    </div>
                ))}
            </div>

            {/* Theme Preview */}
            {currentTheme && (
                <div style={{
                    marginTop: '2rem',
                    padding: '1rem',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0'
                }}>
                    <h4 style={{
                        margin: '0 0 0.75rem 0',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#4a5568'
                    }}>
                        Current Theme
                    </h4>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '0.5rem'
                    }}>
                        <div style={{
                            width: '16px',
                            height: '16px',
                            backgroundColor: currentTheme.primary,
                            borderRadius: '3px',
                            border: '1px solid #e2e8f0'
                        }} />
                        <span style={{
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            color: '#2d3748'
                        }}>
                            {currentTheme.name}
                        </span>
                    </div>
                    <div style={{
                        display: 'flex',
                        gap: '0.25rem'
                    }}>
                        <div style={{
                            width: '12px',
                            height: '12px',
                            backgroundColor: currentTheme.primary,
                            borderRadius: '2px'
                        }} title="Primary" />
                        <div style={{
                            width: '12px',
                            height: '12px',
                            backgroundColor: currentTheme.secondary,
                            borderRadius: '2px'
                        }} title="Secondary" />
                        <div style={{
                            width: '12px',
                            height: '12px',
                            backgroundColor: currentTheme.background,
                            borderRadius: '2px',
                            border: '1px solid #e2e8f0'
                        }} title="Background" />
                    </div>
                </div>
            )}

            {/* Quick Stats */}
            <div style={{
                marginTop: '2rem',
                padding: '1rem',
                backgroundColor: currentTheme?.primary ? `${currentTheme.primary}10` : '#f0f9ff',
                borderRadius: '8px',
                border: `1px solid ${currentTheme?.primary ? `${currentTheme.primary}30` : '#bfdbfe'}`
            }}>
                <h4 style={{
                    margin: '0 0 0.75rem 0',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: currentTheme?.primary || '#1e40af',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    ⚡ Quick Info
                </h4>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    fontSize: '0.75rem',
                    color: '#4a5568'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Server Status:</span>
                        <span style={{
                            color: '#48bb78',
                            fontWeight: '600'
                        }}>
                            🟢 Connected
                        </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Last Updated:</span>
                        <span>{new Date().toLocaleTimeString()}</span>
                    </div>
                </div>
            </div>

            {/* Workspace Switcher */}
            {workspaces.length > 1 && (
                <div style={{
                    padding: '1rem 1.5rem',
                    borderTop: '1px solid #e2e8f0',
                    marginTop: 'auto'
                }}>
                    <button
                        onClick={() => onNavigate('dashboard')} // This could open a workspace selector
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem',
                            backgroundColor: '#f7fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            color: '#4a5568'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#edf2f7';
                            e.target.style.borderColor = '#cbd5e0';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = '#f7fafc';
                            e.target.style.borderColor = '#e2e8f0';
                        }}
                    >
                        <span>🔄</span>
                        <span>Switch Workspace</span>
                        <span style={{
                            marginLeft: 'auto',
                            backgroundColor: '#3182ce',
                            color: 'white',
                            borderRadius: '12px',
                            padding: '0.125rem 0.5rem',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                        }}>
                            {workspaces.length}
                        </span>
                    </button>
                </div>
            )}

            {/* Footer */}
            <div style={{
                marginTop: '2rem',
                padding: '1rem 0',
                borderTop: '1px solid #e2e8f0',
                textAlign: 'center'
            }}>
                <div style={{
                    fontSize: '0.75rem',
                    color: '#a0aec0',
                    marginBottom: '0.5rem'
                }}>
                    Enhanced Asana Dashboard
                </div>
                <div style={{
                    fontSize: '0.625rem',
                    color: '#cbd5e0'
                }}>
                    v2.0.0 • AI Powered
                </div>
            </div>
        </nav>
    );
};

export default Navigation;