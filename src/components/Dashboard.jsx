// components/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAsana } from '../context/AsanaContext.jsx';
import ProjectCard from './ProjectCard';

const Dashboard = ({ onCreateProject, onProjectClick }) => {
    const {
        projects,
        tasks,
        workspaces,
        selectedWorkspace,
        setSelectedWorkspace,
        loadProjects,
        loadAllWorkspacesData
    } = useAsana();

    const [filteredProjects, setFilteredProjects] = useState([]);
    const [filteredTasks, setFilteredTasks] = useState([]);

    // Filter projects and tasks based on selected workspace
    useEffect(() => {
        if (selectedWorkspace) {
            // Filter projects that belong to the selected workspace
            const workspaceProjects = projects.filter(project =>
                project.workspace?.gid === selectedWorkspace.gid
            );
            setFilteredProjects(workspaceProjects);

            // Filter tasks that belong to projects in the selected workspace
            const workspaceTasks = tasks.filter(task =>
                task.projects?.some(project =>
                    workspaceProjects.some(wp => wp.gid === project.gid)
                )
            );
            setFilteredTasks(workspaceTasks);
        } else {
            // Show all projects and tasks if no workspace selected
            setFilteredProjects(projects);
            setFilteredTasks(tasks);
        }
    }, [selectedWorkspace, projects, tasks]);

    const completedTasks = filteredTasks.filter(t => t.completed).length;
    const pendingTasks = filteredTasks.filter(t => !t.completed).length;

    const handleWorkspaceChange = async (workspace) => {
        setSelectedWorkspace(workspace);
        if (workspace) {
            // Load projects for the selected workspace
            await loadProjects(workspace.gid);
        } else {
            // Load all workspaces data when "All Workspaces" is selected
            await loadAllWorkspacesData();
        }
    };

    // Get project count for each workspace
    const getWorkspaceProjectCount = (workspaceId) => {
        return projects.filter(p => p.workspace?.gid === workspaceId).length;
    };

    return (
        <div>
            {/* Workspace Selector */}
            <div style={{
                backgroundColor: 'white',
                padding: '1.5rem',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                marginBottom: '2rem'
            }}>
                <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: '#2d3748',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    🏢 Select Workspace
                </h3>
                <div style={{
                    display: 'flex',
                    gap: '1rem',
                    flexWrap: 'wrap'
                }}>
                    <button
                        onClick={() => handleWorkspaceChange(null)}
                        style={{
                            padding: '0.75rem 1.5rem',
                            borderRadius: '8px',
                            border: selectedWorkspace === null ? '2px solid #3182ce' : '2px solid #e2e8f0',
                            backgroundColor: selectedWorkspace === null ? '#ebf8ff' : 'white',
                            color: selectedWorkspace === null ? '#3182ce' : '#4a5568',
                            cursor: 'pointer',
                            fontWeight: '500',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                        onMouseEnter={(e) => {
                            if (selectedWorkspace !== null) {
                                e.target.style.backgroundColor = '#f7fafc';
                                e.target.style.borderColor = '#cbd5e0';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (selectedWorkspace !== null) {
                                e.target.style.backgroundColor = 'white';
                                e.target.style.borderColor = '#e2e8f0';
                            }
                        }}
                    >
                        <span>🌐</span>
                        <span>All Workspaces</span>
                        <span style={{
                            backgroundColor: selectedWorkspace === null ? '#3182ce' : '#a0aec0',
                            color: 'white',
                            borderRadius: '12px',
                            padding: '0.125rem 0.5rem',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                        }}>
                            {projects.length}
                        </span>
                    </button>
                    {workspaces.map(workspace => (
                        <button
                            key={workspace.gid}
                            onClick={() => handleWorkspaceChange(workspace)}
                            style={{
                                padding: '0.75rem 1.5rem',
                                borderRadius: '8px',
                                border: selectedWorkspace?.gid === workspace.gid ? '2px solid #3182ce' : '2px solid #e2e8f0',
                                backgroundColor: selectedWorkspace?.gid === workspace.gid ? '#ebf8ff' : 'white',
                                color: selectedWorkspace?.gid === workspace.gid ? '#3182ce' : '#4a5568',
                                cursor: 'pointer',
                                fontWeight: '500',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                            onMouseEnter={(e) => {
                                if (selectedWorkspace?.gid !== workspace.gid) {
                                    e.target.style.backgroundColor = '#f7fafc';
                                    e.target.style.borderColor = '#cbd5e0';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (selectedWorkspace?.gid !== workspace.gid) {
                                    e.target.style.backgroundColor = 'white';
                                    e.target.style.borderColor = '#e2e8f0';
                                }
                            }}
                        >
                            <span>🏢</span>
                            <span>{workspace.name}</span>
                            <span style={{
                                backgroundColor: selectedWorkspace?.gid === workspace.gid ? '#3182ce' : '#a0aec0',
                                color: 'white',
                                borderRadius: '12px',
                                padding: '0.125rem 0.5rem',
                                fontSize: '0.75rem',
                                fontWeight: '600'
                            }}>
                                {getWorkspaceProjectCount(workspace.gid)}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            <h2 style={{
                fontSize: '2rem',
                fontWeight: '600',
                color: '#2d3748',
                marginBottom: '2rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
            }}>
                📊 Dashboard Overview
                {selectedWorkspace ? (
                    <span style={{
                        fontSize: '1.25rem',
                        fontWeight: '400',
                        color: '#718096'
                    }}>
                        - {selectedWorkspace.name}
                    </span>
                ) : (
                    <span style={{
                        fontSize: '1.25rem',
                        fontWeight: '400',
                        color: '#718096'
                    }}>
                        - All Workspaces
                    </span>
                )}
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
                    textAlign: 'center',
                    border: '1px solid #e2e8f0'
                }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏢</div>
                    <h3 style={{ color: '#718096', fontSize: '0.875rem', fontWeight: '600', margin: '0 0 0.5rem 0' }}>
                        {selectedWorkspace ? 'CURRENT WORKSPACE' : 'TOTAL WORKSPACES'}
                    </h3>
                    <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#3182ce' }}>
                        {selectedWorkspace ? '1' : workspaces.length}
                    </div>
                    {selectedWorkspace && (
                        <div style={{ fontSize: '0.875rem', color: '#718096', marginTop: '0.5rem' }}>
                            {selectedWorkspace.name}
                        </div>
                    )}
                </div>
                <div style={{
                    backgroundColor: 'white',
                    padding: '2rem',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    textAlign: 'center',
                    border: '1px solid #e2e8f0'
                }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📁</div>
                    <h3 style={{ color: '#718096', fontSize: '0.875rem', fontWeight: '600', margin: '0 0 0.5rem 0' }}>
                        {selectedWorkspace ? 'WORKSPACE PROJECTS' : 'ALL PROJECTS'}
                    </h3>
                    <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#48bb78' }}>{filteredProjects.length}</div>
                </div>
                <div style={{
                    backgroundColor: 'white',
                    padding: '2rem',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    textAlign: 'center',
                    border: '1px solid #e2e8f0'
                }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
                    <h3 style={{ color: '#718096', fontSize: '0.875rem', fontWeight: '600', margin: '0 0 0.5rem 0' }}>PENDING TASKS</h3>
                    <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#ed8936' }}>{pendingTasks}</div>
                </div>
                <div style={{
                    backgroundColor: 'white',
                    padding: '2rem',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    textAlign: 'center',
                    border: '1px solid #e2e8f0'
                }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
                    <h3 style={{ color: '#718096', fontSize: '0.875rem', fontWeight: '600', margin: '0 0 0.5rem 0' }}>COMPLETED TASKS</h3>
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
                        margin: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        📂 Recent Projects
                        {selectedWorkspace ? (
                            <span style={{
                                fontSize: '1rem',
                                fontWeight: '400',
                                color: '#718096'
                            }}>
                                in {selectedWorkspace.name}
                            </span>
                        ) : (
                            <span style={{
                                fontSize: '1rem',
                                fontWeight: '400',
                                color: '#718096'
                            }}>
                                from all workspaces
                            </span>
                        )}
                    </h3>
                    <button
                        onClick={onCreateProject}
                        style={{
                            backgroundColor: '#ce3150',
                            color: 'white',
                            border: 'none',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <span>+</span>
                        <span>New Project</span>
                        {selectedWorkspace && (
                            <span style={{
                                backgroundColor: 'rgba(255,255,255,0.2)',
                                padding: '0.125rem 0.5rem',
                                borderRadius: '12px',
                                fontSize: '0.75rem'
                            }}>
                                in {selectedWorkspace.name}
                            </span>
                        )}
                    </button>
                </div>

                {filteredProjects.length === 0 ? (
                    <div style={{
                        backgroundColor: 'white',
                        padding: '3rem',
                        borderRadius: '12px',
                        textAlign: 'center',
                        border: '1px solid #e2e8f0'
                    }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📂</div>
                        <h3 style={{ color: '#4a5568', marginBottom: '1rem' }}>
                            {selectedWorkspace
                                ? `No projects in ${selectedWorkspace.name}`
                                : 'No projects found across all workspaces'
                            }
                        </h3>
                        <p style={{ color: '#718096', marginBottom: '2rem' }}>
                            {selectedWorkspace
                                ? `Create your first project in the ${selectedWorkspace.name} workspace`
                                : 'Create your first project to get started'
                            }
                        </p>
                        <button
                            onClick={onCreateProject}
                            style={{
                                backgroundColor: '#ce3150',
                                color: 'white',
                                border: 'none',
                                padding: '0.75rem 2rem',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: '500',
                                fontSize: '1rem'
                            }}
                        >
                            + Create First Project
                        </button>
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                        gap: '1.5rem'
                    }}>
                        {filteredProjects.slice(0, 6).map(project => (
                            <ProjectCard
                                key={project.gid}
                                project={project}
                                onClick={onProjectClick}
                                showWorkspace={!selectedWorkspace} // Show workspace info when viewing all workspaces
                            />
                        ))}
                    </div>
                )}

                {filteredProjects.length > 6 && (
                    <div style={{
                        textAlign: 'center',
                        marginTop: '2rem'
                    }}>
                        <p style={{ color: '#718096', marginBottom: '1rem' }}>
                            Showing 6 of {filteredProjects.length} projects
                            {!selectedWorkspace && ' across all workspaces'}
                        </p>
                        <button
                            onClick={() => {/* Navigate to projects view */}}
                            style={{
                                backgroundColor: 'transparent',
                                color: '#3182ce',
                                border: '1px solid #3182ce',
                                padding: '0.5rem 1.5rem',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: '500'
                            }}
                        >
                            View All Projects
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;