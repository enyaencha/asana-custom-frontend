import React from 'react';
import { useAsanaContext } from '../context/AsanaContext.jsx';
import ProjectCard from '../components/ProjectCard';

const DashboardPage = () => {
    const { state } = useAsanaContext();
    const { projects, tasks, workspaces } = state;

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
                <h3 style={{
                    fontSize: '1.5rem',
                    fontWeight: '600',
                    color: '#2d3748',
                    marginBottom: '1.5rem'
                }}>
                    📂 Recent Projects
                </h3>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '1.5rem'
                }}>
                    {projects.slice(0, 6).map(project => (
                        <ProjectCard key={project.gid} project={project} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
