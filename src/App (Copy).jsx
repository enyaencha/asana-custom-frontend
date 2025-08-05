import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import api from './services/api';
import Modal from './components/Modal';
import ProjectForm from './components/ProjectForm';
import TaskForm from './components/TaskForm';
import ProjectCard from './components/ProjectCard';
import TaskItem from './components/TaskItem';

// Simple Navigation Component
const Navigation = ({ currentView, projects, tasks, onNavigate }) => {
    const location = useLocation();
    
    const navItems = [
        { path: '/', icon: '📊', label: 'Dashboard' },
        { path: '/projects', icon: '📁', label: 'Projects', count: projects.length },
        ...(tasks.length > 0 ? [{ path: '/tasks', icon: '✅', label: 'Tasks', count: tasks.length }] : [])
    ];

    return (
        <nav>
            {navItems.map((item) => {
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
                            background: isActive ? '#ebf8ff' : 'none',
                            borderLeft: isActive ? '3px solid #3182ce' : '3px solid transparent',
                            color: isActive ? '#3182ce' : '#4a5568',
                            fontSize: '1rem',
                            fontWeight: isActive ? '600' : '400'
                        }}
                    >
                        <span style={{ marginRight: '0.75rem' }}>{item.icon}</span>
                        {item.label}
                        {item.count && (
                            <span style={{
                                marginLeft: '0.5rem',
                                backgroundColor: isActive ? '#3182ce' : '#e2e8f0',
                                color: isActive ? 'white' : '#4a5568',
                                padding: '0.125rem 0.5rem',
                                borderRadius: '12px',
                                fontSize: '0.75rem'
                            }}>
                                {item.count}
                            </span>
                        )}
                    </Link>
                );
            })}
        </nav>
    );
};

// Dashboard Component
const Dashboard = ({ projects, tasks, workspaces, onCreateProject, onProjectClick }) => {
    const completedTasks = tasks.filter(t => t.completed).length;
    const pendingTasks = tasks.filter(t => !t.completed).length;

    return (
        <div>
            <h2 style={{
                fontSize: '2rem',
                fontWeight: '600',
                color: '#2d3748',
                marginBottom: '2rem'
            }}>
                📊 Dashboard Overview
            </h2>

            {/* Stats Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '1.5rem',
                marginBottom: '3rem'
            }}>
                <div style={{
                    backgroundColor: 'white',
                    padding: '2rem',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏢</div>
                    <h3 style={{ color: '#718096', fontSize: '0.875rem', fontWeight: '600', margin: '0 0 0.5rem 0' }}>WORKSPACES</h3>
                    <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#3182ce' }}>{workspaces.length}</div>
                </div>
                <div style={{
                    backgroundColor: 'white',
                    padding: '2rem',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📁</div>
                    <h3 style={{ color: '#718096', fontSize: '0.875rem', fontWeight: '600', margin: '0 0 0.5rem 0' }}>PROJECTS</h3>
                    <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#48bb78' }}>{projects.length}</div>
                </div>
                <div style={{
                    backgroundColor: 'white',
                    padding: '2rem',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
                    <h3 style={{ color: '#718096', fontSize: '0.875rem', fontWeight: '600', margin: '0 0 0.5rem 0' }}>PENDING</h3>
                    <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#ed8936' }}>{pendingTasks}</div>
                </div>
                <div style={{
                    backgroundColor: 'white',
                    padding: '2rem',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
                    <h3 style={{ color: '#718096', fontSize: '0.875rem', fontWeight: '600', margin: '0 0 0.5rem 0' }}>COMPLETED</h3>
                    <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#38a169' }}>{completedTasks}</div>
                </div>
            </div>

            {/* Recent Projects */}
            <div>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1.5rem'
                }}>
                    <h3 style={{
                        fontSize: '1.5rem',
                        fontWeight: '600',
                        color: '#2d3748',
                        margin: 0
                    }}>
                        📂 Recent Projects
                    </h3>
                    <button
                        onClick={onCreateProject}
                        style={{
                            backgroundColor: '#3182ce',
                            color: 'white',
                            border: 'none',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: '500'
                        }}
                    >
                        + New Project
                    </button>
                </div>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '1.5rem'
                }}>
                    {projects.slice(0, 6).map(project => (
                        <ProjectCard
                            key={project.gid}
                            project={project}
                            onClick={onProjectClick}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

// Main App Component with Routing
function AppWithRouting() {
    // All your existing state and logic...
    const [user, setUser] = useState(null);
    const [workspaces, setWorkspaces] = useState([]);
    const [projects, setProjects] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [workspaceUsers, setWorkspaceUsers] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showProjectModal, setShowProjectModal] = useState(false);

    // Check if API token is available
    const hasToken = import.meta.env.VITE_ASANA_TOKEN;

    if (!hasToken) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f8f9fa'
            }}>
                <div style={{
                    backgroundColor: 'white',
                    padding: '3rem',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    maxWidth: '500px',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔑</div>
                    <h1 style={{
                        color: '#e53e3e',
                        fontSize: '1.5rem',
                        fontWeight: '600',
                        marginBottom: '1rem'
                    }}>
                        API Token Required
                    </h1>
                    <code style={{
                        display: 'block',
                        padding: '1rem',
                        backgroundColor: '#1a202c',
                        color: '#e2e8f0',
                        borderRadius: '6px',
                        fontSize: '0.875rem'
                    }}>
                        VITE_ASANA_TOKEN=your_token_here
                    </code>
                </div>
            </div>
        );
    }

    // Your existing useEffect and functions...
    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [userData, workspacesData] = await Promise.all([
                api.get('/users/me'),
                api.get('/workspaces')
            ]);

            setUser(userData.data);
            setWorkspaces(workspacesData.data);

            if (workspacesData.data.length > 0) {
                const workspaceId = workspacesData.data[0].gid;
                const [projectsData, usersData] = await Promise.all([
                    api.get(`/projects?workspace=${workspaceId}`),
                    api.get(`/workspaces/${workspaceId}/users`)
                ]);
                setProjects(projectsData.data);
                setWorkspaceUsers(usersData.data);
            }

            setLoading(false);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    const loadProjectTasks = async (project) => {
        try {
            setLoading(true);
            const tasksData = await api.get(`/tasks?project=${project.gid}`);
            setTasks(tasksData.data);
            setSelectedProject(project);
            setLoading(false);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    if (loading && !user) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                backgroundColor: '#f8f9fa'
            }}>
                <div style={{ textAlign: 'center', color: '#666' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔄</div>
                    <p style={{ fontSize: '1.25rem' }}>Loading your Asana data...</p>
                </div>
            </div>
        );
    }

    return (
        <Router>
            <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
                {/* Header */}
                <header style={{
                    backgroundColor: 'white',
                    borderBottom: '1px solid #e2e8f0',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    padding: '1rem 2rem'
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        maxWidth: '1400px',
                        margin: '0 auto'
                    }}>
                        <Link to="/" style={{ textDecoration: 'none' }}>
                            <h1 style={{
                                fontSize: '1.75rem',
                                fontWeight: '700',
                                color: '#2d3748',
                                margin: 0
                            }}>
                                🚀 Custom Asana Dashboard
                            </h1>
                        </Link>
                        <div style={{ color: '#718096', fontWeight: '500' }}>
                            Welcome, {user?.name}! 👋
                        </div>
                    </div>
                </header>

                <div style={{ display: 'flex', minHeight: 'calc(100vh - 80px)' }}>
                    {/* Sidebar */}
                    <aside style={{
                        width: '280px',
                        backgroundColor: 'white',
                        borderRight: '1px solid #e2e8f0',
                        padding: '2rem 0'
                    }}>
                        <Navigation 
                            projects={projects} 
                            tasks={tasks}
                        />
                    </aside>

                    {/* Main Content */}
                    <main style={{ flex: 1, padding: '2rem' }}>
                        <Routes>
                            <Route 
                                path="/" 
                                element={
                                    <Dashboard 
                                        projects={projects}
                                        tasks={tasks}
                                        workspaces={workspaces}
                                        onCreateProject={() => setShowProjectModal(true)}
                                        onProjectClick={loadProjectTasks}
                                    />
                                } 
                            />
                            <Route 
                                path="/projects" 
                                element={
                                    <div>
                                        <h2>📁 All Projects ({projects.length})</h2>
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                                            gap: '1.5rem',
                                            marginTop: '2rem'
                                        }}>
                                            {projects.map(project => (
                                                <ProjectCard
                                                    key={project.gid}
                                                    project={project}
                                                    onClick={loadProjectTasks}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                } 
                            />
                            <Route 
                                path="/tasks" 
                                element={
                                    <div>
                                        <h2>✅ Tasks {selectedProject && `in "${selectedProject.name}"`}</h2>
                                        <div style={{ marginTop: '2rem' }}>
                                            {tasks.length === 0 ? (
                                                <p>No tasks to display. Select a project first!</p>
                                            ) : (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                                    {tasks.map(task => (
                                                        <TaskItem key={task.gid} task={task} />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                } 
                            />
                        </Routes>
                    </main>
                </div>

                {/* Modal */}
                <Modal
                    isOpen={showProjectModal}
                    onClose={() => setShowProjectModal(false)}
                    title="Create New Project"
                >
                    <ProjectForm
                        workspaceId={workspaces[0]?.gid}
                        onSave={() => {
                            setShowProjectModal(false);
                            loadUserData();
                        }}
                        onCancel={() => setShowProjectModal(false)}
                    />
                </Modal>
            </div>
        </Router>
    );
}

export default AppWithRouting;
