import React, { useState, useEffect } from 'react';
import { themeApi } from '../services/asanaApi';

const ThemeManager = ({ onThemeChange, currentTheme }) => {
    const [themes, setThemes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newTheme, setNewTheme] = useState({
        name: '',
        primary: '#3182ce',
        secondary: '#48bb78',
        background: '#f8f9fa'
    });

    useEffect(() => {
        loadThemes();
    }, []);

    const loadThemes = async () => {
        try {
            const response = await themeApi.getThemes();
            setThemes(response.data);
        } catch (error) {
            console.error('Error loading themes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTheme = async (e) => {
        e.preventDefault();
        try {
            const response = await themeApi.createTheme(newTheme);
            setThemes([...themes, response.data]);
            setNewTheme({
                name: '',
                primary: '#3182ce',
                secondary: '#48bb78',
                background: '#f8f9fa'
            });
            setShowCreateForm(false);
        } catch (error) {
            console.error('Error creating theme:', error);
        }
    };

    const handleDeleteTheme = async (themeId) => {
        if (themes.length <= 1) {
            alert('Cannot delete the last theme');
            return;
        }

        try {
            await themeApi.deleteTheme(themeId);
            setThemes(themes.filter(t => t.id !== themeId));
        } catch (error) {
            console.error('Error deleting theme:', error);
        }
    };

    if (loading) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🎨</div>
                <p>Loading themes...</p>
            </div>
        );
    }

    return (
        <div style={{ padding: '2rem' }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2rem'
            }}>
                <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: '600' }}>
                    🎨 Theme Manager
                </h2>
                <button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    style={{
                        backgroundColor: '#805ad5',
                        color: 'white',
                        border: 'none',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '500'
                    }}
                >
                    {showCreateForm ? 'Cancel' : '+ Create Theme'}
                </button>
            </div>

            {showCreateForm && (
                <div style={{
                    backgroundColor: 'white',
                    padding: '2rem',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    marginBottom: '2rem',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}>
                    <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Create New Theme</h3>
                    <div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                                    Theme Name
                                </label>
                                <input
                                    type="text"
                                    value={newTheme.name}
                                    onChange={(e) => setNewTheme({ ...newTheme, name: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '6px',
                                        fontSize: '1rem'
                                    }}
                                    placeholder="Enter theme name"
                                    required
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                                    Background Color
                                </label>
                                <input
                                    type="color"
                                    value={newTheme.background}
                                    onChange={(e) => setNewTheme({ ...newTheme, background: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '0.5rem',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '6px',
                                        height: '3rem'
                                    }}
                                />
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                                    Primary Color
                                </label>
                                <input
                                    type="color"
                                    value={newTheme.primary}
                                    onChange={(e) => setNewTheme({ ...newTheme, primary: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '0.5rem',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '6px',
                                        height: '3rem'
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                                    Secondary Color
                                </label>
                                <input
                                    type="color"
                                    value={newTheme.secondary}
                                    onChange={(e) => setNewTheme({ ...newTheme, secondary: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '0.5rem',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '6px',
                                        height: '3rem'
                                    }}
                                />
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleCreateTheme}
                            style={{
                                backgroundColor: '#48bb78',
                                color: 'white',
                                border: 'none',
                                padding: '0.75rem 2rem',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: '500'
                            }}
                        >
                            Create Theme
                        </button>
                    </div>
                </div>
            )}

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '1.5rem'
            }}>
                {themes.map(theme => (
                    <div
                        key={theme.id}
                        style={{
                            backgroundColor: 'white',
                            border: currentTheme?.id === theme.id ? `3px solid ${theme.primary}` : '1px solid #e2e8f0',
                            borderRadius: '12px',
                            padding: '1.5rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            transform: currentTheme?.id === theme.id ? 'scale(1.02)' : 'scale(1)',
                            boxShadow: currentTheme?.id === theme.id ? '0 8px 16px rgba(0,0,0,0.1)' : '0 2px 4px rgba(0,0,0,0.05)'
                        }}
                        onClick={() => onThemeChange(theme)}
                    >
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '1rem'
                        }}>
                            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>
                                {theme.name}
                                {currentTheme?.id === theme.id && (
                                    <span style={{
                                        fontSize: '0.875rem',
                                        color: theme.primary,
                                        marginLeft: '0.5rem',
                                        fontWeight: '500'
                                    }}>
                    (Active)
                  </span>
                                )}
                            </h3>
                            {themes.length > 1 && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteTheme(theme.id);
                                    }}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#e53e3e',
                                        cursor: 'pointer',
                                        fontSize: '1.25rem',
                                        padding: '0.25rem',
                                        borderRadius: '4px'
                                    }}
                                    title="Delete theme"
                                >
                                    🗑️
                                </button>
                            )}
                        </div>

                        <div style={{
                            display: 'flex',
                            gap: '0.75rem',
                            marginBottom: '1rem'
                        }}>
                            <div style={{
                                width: '3rem',
                                height: '3rem',
                                backgroundColor: theme.primary,
                                borderRadius: '8px',
                                border: '2px solid white',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }} title="Primary Color" />
                            <div style={{
                                width: '3rem',
                                height: '3rem',
                                backgroundColor: theme.secondary,
                                borderRadius: '8px',
                                border: '2px solid white',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }} title="Secondary Color" />
                            <div style={{
                                width: '3rem',
                                height: '3rem',
                                backgroundColor: theme.background,
                                borderRadius: '8px',
                                border: '2px solid #e2e8f0',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }} title="Background Color" />
                        </div>

                        <div style={{
                            fontSize: '0.875rem',
                            color: '#718096',
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '0.5rem'
                        }}>
                            <div>Primary: {theme.primary}</div>
                            <div>Secondary: {theme.secondary}</div>
                            <div style={{ gridColumn: '1 / -1' }}>Background: {theme.background}</div>
                        </div>

                        {currentTheme?.id === theme.id && (
                            <div style={{
                                marginTop: '1rem',
                                padding: '0.75rem',
                                backgroundColor: `${theme.primary}15`,
                                borderRadius: '6px',
                                textAlign: 'center',
                                color: theme.primary,
                                fontWeight: '500',
                                fontSize: '0.875rem'
                            }}>
                                ✓ Currently Active Theme
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ThemeManager;