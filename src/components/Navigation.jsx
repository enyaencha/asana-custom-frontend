// components/Navigation.jsx
import React from 'react';
import { useAsana } from '../context/AsanaContext.jsx';

const Navigation = ({ currentView, onNavigate }) => {
    const { projects, tasks } = useAsana();

    const navItems = [
        { key: 'dashboard', icon: '📊', label: 'Dashboard' },
        { key: 'projects', icon: '📁', label: 'Projects', count: projects.length },
        ...(tasks.length > 0 ? [{ key: 'tasks', icon: '✅', label: 'Tasks', count: tasks.length }] : [])
    ];

    return (
        <nav>
            {navItems.map((item) => {
                const isActive = currentView === item.key;
                return (
                    <button
                        key={item.key}
                        onClick={() => onNavigate(item.key)}
                        style={{
                            display: 'block',
                            width: '100%',
                            padding: '0.75rem 2rem',
                            textDecoration: 'none',
                            background: isActive ? '#ebf8ff' : 'none',
                            borderLeft: isActive ? '3px solid #3182ce' : '3px solid transparent',
                            color: isActive ? '#3182ce' : '#4a5568',
                            fontSize: '1rem',
                            fontWeight: isActive ? '600' : '400',
                            border: 'none',
                            textAlign: 'left',
                            cursor: 'pointer'
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
                                fontSize: '0.75rem'
                            }}>
                                {item.count}
                            </span>
                        )}
                    </button>
                );
            })}
        </nav>
    );
};

export default Navigation;