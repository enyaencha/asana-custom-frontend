import React from 'react';
import { Link } from 'react-router-dom';
import { useAsanaContext } from '../context/AsanaContext.jsx';
import ProjectCard from '../components/ProjectCard';

const ProjectsPage = () => {
    const { state } = useAsanaContext();
    const { projects } = state;

    return (
        <div>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2rem'
            }}>
                <h2 style={{
                    fontSize: '2rem',
                    fontWeight: '600',
                    color: '#2d3748',
                    margin: 0
                }}>
                    📁 All Projects ({projects.length})
                </h2>
                <button
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
                gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                gap: '1.5rem'
            }}>
                {projects.map(project => (
                    <ProjectCard key={project.gid} project={project} />
                ))}
            </div>
        </div>
    );
};

export default ProjectsPage;
