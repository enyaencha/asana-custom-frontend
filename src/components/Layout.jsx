import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAsanaContext } from '../context/AsanaContext.jsx';
import { useAuth } from '../hooks/useAuth';

const Layout = ({ children }) => {
    const location = useLocation();
    const { state } = useAsanaContext();
    const { user, loading, error } = useAuth();

    const navigation = [
        { path: '/dashboard', icon: '📊', label: 'Dashboard' },
        { path: '/projects', icon: '📁', label: 'Projects', count: state.projects.length },
        { path: '/tasks', icon: '✅', label: 'Tasks', count: state.tasks.length },
        { path: '/profile', icon: '👤', label: 'Profile' },
        { path: '/settings', icon: '⚙️', label: 'Settings' }
    ];

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                backgroundColor: '#f8f9fa'
            }}>
                <div style={{ textAlign: 'center', color: '#666' }}>
                    <div style={{
                        width: '50px',
                        height: '50px',
                        border: '3px solid #e2e8f0',
                        borderTop: '3px solid #3182ce',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 1rem'
                    }} />
                    <p style={{ fontSize: '1.25rem' }}>Loading your Asana workspace...</p>
                </div>
                <style>
                    {`
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    `}
                </style>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{
                padding: '2rem',
                backgroundColor: '#f8f9fa',
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <div style={{
                    backgroundColor: 'white',
                    padding: '3rem',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    textAlign: 'center',
                    maxWidth: '500px'
                }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
                    <h2 style={{
                        color: '#e53e3e',
                        fontSize: '1.5rem',
                        fontWeight: '600',
                        marginBottom: '1rem'
                    }}>
                        Connection Error
                    </h2>
                    <p style={{
                        color: '#718096',
                        marginBottom: '2rem',
                        lineHeight: '1.6'
                    }}>
                        {error}
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            backgroundColor: '#3182ce',
                            color: 'white',
                            border: 'none',
                            padding: '0.75rem 2rem',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: '500'
                        }}
                    >
                        🔄 Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
            {/* Header */}
            <header style={{
                backgroundColor: 'white',
                borderBottom: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                position: 'sticky',
                top: 0,
                zIndex: 100
            }}>
                <div className="container" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1rem 2rem'
                }}>
                    <Link to="/dashboard" style={{
                        textDecoration: 'none',
                        color: '#2d3748'
                    }}>
                        <h1 style={{
                            fontSize: '1.75rem',
                            fontWeight: '700',
                            margin: 0,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            🚀 <span>Asana Dashboard</span>
                        </h1>
                    </Link>
                    
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem'
                    }}>
                        <div style={{ color: '#718096', fontWeight: '500' }}>
                            Welcome, {user?.name}! 👋
                        </div>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            backgroundColor: '#3182ce',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: '600'
                        }}>
                            {user?.name?.charAt(0)?.toUpperCase()}
                        </div>
                    </div>
                </div>
            </header>

            <div style={{ display: 'flex', minHeight: 'calc(100vh - 80px)' }}>
                {/* Sidebar */}
                <aside style={{
                    width: '280px',
                    backgroundColor: 'white',
                    borderRight: '1px solid #e2e8f0',
                    padding: '2rem 0',
                    position: 'sticky',
                    top: '80px',
                    height: 'calc(100vh - 80px)',
                    overflowY: 'auto'
                }}>
                    <nav>
                        {navigation.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    style={{
                                        display: 'block',
                                        width: '100%',
                                        padding: '0.75rem 2rem',
                                        textDecoration: 'none',
                                        backgroundColor: isActive ? '#ebf8ff' : 'transparent',
                                        borderLeft: isActive ? '3px solid #3182ce' : '3px solid transparent',
                                        color: isActive ? '#3182ce' : '#4a5568',
                                        fontSize: '1rem',
                                        fontWeight: isActive ? '600' : '400',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isActive) {
                                            e.target.style.backgroundColor = '#f7fafc';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isActive) {
                                            e.target.style.backgroundColor = 'transparent';
                                        }
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
                                            fontSize: '0.75rem',
                                            fontWeight: '500'
                                        }}>
                                            {item.count}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Footer info */}
                    <div style={{
                        position: 'absolute',
                        bottom: '2rem',
                        left: '2rem',
                        right: '2rem',
                        padding: '1rem',
                        backgroundColor: '#f7fafc',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        color: '#718096'
                    }}>
                        <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>
                            🏢 {state.workspaces[0]?.name}
                        </div>
                        <div>
                            {state.projects.length} projects • {state.tasks.length} tasks
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main style={{
                    flex: 1,
                    padding: '2rem',
                    overflow: 'auto'
                }}>
                    {error && (
                        <div className="error">
                            Error: {error}
                        </div>
                    )}
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;
