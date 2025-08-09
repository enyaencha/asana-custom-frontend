import React, { useState, useEffect } from 'react';
import { healthApi, webhookApi, userApi } from '../services/asanaApi';

const SettingsPage = ({ currentTheme, onThemeChange }) => {
    const [activeTab, setActiveTab] = useState('general');
    const [serverHealth, setServerHealth] = useState(null);
    const [userSettings, setUserSettings] = useState({
        notifications: true,
        emailAlerts: false,
        darkMode: false,
        autoSave: true,
        soundEffects: false
    });
    const [webhooks, setWebhooks] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadSettingsData();
    }, []);

    const loadSettingsData = async () => {
        setLoading(true);
        try {
            // Load server health
            const healthResponse = await healthApi.check();
            setServerHealth(healthResponse);

            // Load saved settings from localStorage
            const savedSettings = localStorage.getItem('asana-user-settings');
            if (savedSettings) {
                setUserSettings(JSON.parse(savedSettings));
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const saveUserSettings = (newSettings) => {
        setUserSettings(newSettings);
        localStorage.setItem('asana-user-settings', JSON.stringify(newSettings));
    };

    const handleSettingChange = (key, value) => {
        const newSettings = { ...userSettings, [key]: value };
        saveUserSettings(newSettings);
    };

    const tabs = [
        { id: 'general', label: 'General', icon: '⚙️' },
        { id: 'appearance', label: 'Appearance', icon: '🎨' },
        { id: 'notifications', label: 'Notifications', icon: '🔔' },
        { id: 'integrations', label: 'Integrations', icon: '🔗' },
        { id: 'advanced', label: 'Advanced', icon: '🔧' }
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'general':
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <div>
                            <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: '600' }}>
                                General Settings
                            </h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '1rem',
                                    backgroundColor: 'white',
                                    borderRadius: '8px',
                                    border: '1px solid #e2e8f0'
                                }}>
                                    <div>
                                        <h4 style={{ margin: '0 0 0.25rem 0', fontWeight: '500' }}>Auto Save</h4>
                                        <p style={{ margin: 0, fontSize: '0.875rem', color: '#718096' }}>
                                            Automatically save changes as you work
                                        </p>
                                    </div>
                                    <label style={{
                                        position: 'relative',
                                        display: 'inline-block',
                                        width: '50px',
                                        height: '28px'
                                    }}>
                                        <input
                                            type="checkbox"
                                            checked={userSettings.autoSave}
                                            onChange={(e) => handleSettingChange('autoSave', e.target.checked)}
                                            style={{ opacity: 0, width: 0, height: 0 }}
                                        />
                                        <span style={{
                                            position: 'absolute',
                                            cursor: 'pointer',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            bottom: 0,
                                            backgroundColor: userSettings.autoSave ? (currentTheme?.primary || '#3182ce') : '#ccc',
                                            borderRadius: '28px',
                                            transition: '.4s'
                                        }}>
                      <span style={{
                          position: 'absolute',
                          content: '',
                          height: '20px',
                          width: '20px',
                          left: userSettings.autoSave ? '26px' : '4px',
                          bottom: '4px',
                          backgroundColor: 'white',
                          borderRadius: '50%',
                          transition: '.4s'
                      }} />
                    </span>
                                    </label>
                                </div>

                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '1rem',
                                    backgroundColor: 'white',
                                    borderRadius: '8px',
                                    border: '1px solid #e2e8f0'
                                }}>
                                    <div>
                                        <h4 style={{ margin: '0 0 0.25rem 0', fontWeight: '500' }}>Sound Effects</h4>
                                        <p style={{ margin: 0, fontSize: '0.875rem', color: '#718096' }}>
                                            Play sounds for notifications and actions
                                        </p>
                                    </div>
                                    <label style={{
                                        position: 'relative',
                                        display: 'inline-block',
                                        width: '50px',
                                        height: '28px'
                                    }}>
                                        <input
                                            type="checkbox"
                                            checked={userSettings.soundEffects}
                                            onChange={(e) => handleSettingChange('soundEffects', e.target.checked)}
                                            style={{ opacity: 0, width: 0, height: 0 }}
                                        />
                                        <span style={{
                                            position: 'absolute',
                                            cursor: 'pointer',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            bottom: 0,
                                            backgroundColor: userSettings.soundEffects ? (currentTheme?.primary || '#3182ce') : '#ccc',
                                            borderRadius: '28px',
                                            transition: '.4s'
                                        }}>
                      <span style={{
                          position: 'absolute',
                          content: '',
                          height: '20px',
                          width: '20px',
                          left: userSettings.soundEffects ? '26px' : '4px',
                          bottom: '4px',
                          backgroundColor: 'white',
                          borderRadius: '50%',
                          transition: '.4s'
                      }} />
                    </span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Server Status */}
                        <div>
                            <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: '600' }}>
                                Server Status
                            </h3>
                            {serverHealth && (
                                <div style={{
                                    padding: '1.5rem',
                                    backgroundColor: 'white',
                                    borderRadius: '8px',
                                    border: '1px solid #e2e8f0'
                                }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div>
                                            <span style={{ fontSize: '0.875rem', color: '#718096' }}>Status</span>
                                            <div style={{
                                                fontWeight: '600',
                                                color: '#48bb78',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem'
                                            }}>
                                                🟢 {serverHealth.status}
                                            </div>
                                        </div>
                                        <div>
                                            <span style={{ fontSize: '0.875rem', color: '#718096' }}>Version</span>
                                            <div style={{ fontWeight: '600' }}>{serverHealth.version}</div>
                                        </div>
                                        <div>
                                            <span style={{ fontSize: '0.875rem', color: '#718096' }}>Uptime</span>
                                            <div style={{ fontWeight: '600' }}>
                                                {Math.floor(serverHealth.uptime / 3600)}h {Math.floor((serverHealth.uptime % 3600) / 60)}m
                                            </div>
                                        </div>
                                        <div>
                                            <span style={{ fontSize: '0.875rem', color: '#718096' }}>Last Check</span>
                                            <div style={{ fontWeight: '600' }}>
                                                {new Date(serverHealth.timestamp).toLocaleTimeString()}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );

            case 'appearance':
                return (
                    <div>
                        <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: '600' }}>
                            Appearance Settings
                        </h3>

                        <div style={{
                            padding: '1.5rem',
                            backgroundColor: 'white',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            marginBottom: '1.5rem'
                        }}>
                            <h4 style={{ margin: '0 0 1rem 0', fontWeight: '500' }}>Current Theme</h4>
                            {currentTheme ? (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    padding: '1rem',
                                    backgroundColor: '#f8f9fa',
                                    borderRadius: '6px'
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        gap: '0.5rem'
                                    }}>
                                        <div style={{
                                            width: '24px',
                                            height: '24px',
                                            backgroundColor: currentTheme.primary,
                                            borderRadius: '4px'
                                        }} />
                                        <div style={{
                                            width: '24px',
                                            height: '24px',
                                            backgroundColor: currentTheme.secondary,
                                            borderRadius: '4px'
                                        }} />
                                        <div style={{
                                            width: '24px',
                                            height: '24px',
                                            backgroundColor: currentTheme.background,
                                            borderRadius: '4px',
                                            border: '1px solid #e2e8f0'
                                        }} />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '600' }}>{currentTheme.name}</div>
                                        <div style={{ fontSize: '0.875rem', color: '#718096' }}>
                                            Active theme with custom colors
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <p style={{ color: '#718096', margin: 0 }}>No theme selected</p>
                            )}

                            <button
                                onClick={() => window.location.hash = '#themes'}
                                style={{
                                    marginTop: '1rem',
                                    padding: '0.75rem 1.5rem',
                                    backgroundColor: currentTheme?.primary || '#3182ce',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: '500'
                                }}
                            >
                                🎨 Manage Themes
                            </button>
                        </div>

                        <div style={{
                            padding: '1.5rem',
                            backgroundColor: 'white',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0'
                        }}>
                            <h4 style={{ margin: '0 0 1rem 0', fontWeight: '500' }}>Display Options</h4>

                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div>
                                    <div style={{ fontWeight: '500' }}>Dark Mode</div>
                                    <div style={{ fontSize: '0.875rem', color: '#718096' }}>
                                        Enable dark mode for better visibility in low light
                                    </div>
                                </div>
                                <div style={{
                                    padding: '0.5rem',
                                    backgroundColor: '#f8f9fa',
                                    borderRadius: '6px',
                                    color: '#718096',
                                    fontSize: '0.875rem'
                                }}>
                                    Coming Soon
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'notifications':
                return (
                    <div>
                        <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: '600' }}>
                            Notification Settings
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '1rem',
                                backgroundColor: 'white',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0'
                            }}>
                                <div>
                                    <h4 style={{ margin: '0 0 0.25rem 0', fontWeight: '500' }}>Push Notifications</h4>
                                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#718096' }}>
                                        Receive notifications for important updates
                                    </p>
                                </div>
                                <label style={{
                                    position: 'relative',
                                    display: 'inline-block',
                                    width: '50px',
                                    height: '28px'
                                }}>
                                    <input
                                        type="checkbox"
                                        checked={userSettings.notifications}
                                        onChange={(e) => handleSettingChange('notifications', e.target.checked)}
                                        style={{ opacity: 0, width: 0, height: 0 }}
                                    />
                                    <span style={{
                                        position: 'absolute',
                                        cursor: 'pointer',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        backgroundColor: userSettings.notifications ? (currentTheme?.primary || '#3182ce') : '#ccc',
                                        borderRadius: '28px',
                                        transition: '.4s'
                                    }}>
                    <span style={{
                        position: 'absolute',
                        content: '',
                        height: '20px',
                        width: '20px',
                        left: userSettings.notifications ? '26px' : '4px',
                        bottom: '4px',
                        backgroundColor: 'white',
                        borderRadius: '50%',
                        transition: '.4s'
                    }} />
                  </span>
                                </label>
                            </div>

                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '1rem',
                                backgroundColor: 'white',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0'
                            }}>
                                <div>
                                    <h4 style={{ margin: '0 0 0.25rem 0', fontWeight: '500' }}>Email Alerts</h4>
                                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#718096' }}>
                                        Send email notifications for critical events
                                    </p>
                                </div>
                                <label style={{
                                    position: 'relative',
                                    display: 'inline-block',
                                    width: '50px',
                                    height: '28px'
                                }}>
                                    <input
                                        type="checkbox"
                                        checked={userSettings.emailAlerts}
                                        onChange={(e) => handleSettingChange('emailAlerts', e.target.checked)}
                                        style={{ opacity: 0, width: 0, height: 0 }}
                                    />
                                    <span style={{
                                        position: 'absolute',
                                        cursor: 'pointer',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        backgroundColor: userSettings.emailAlerts ? (currentTheme?.primary || '#3182ce') : '#ccc',
                                        borderRadius: '28px',
                                        transition: '.4s'
                                    }}>
                    <span style={{
                        position: 'absolute',
                        content: '',
                        height: '20px',
                        width: '20px',
                        left: userSettings.emailAlerts ? '26px' : '4px',
                        bottom: '4px',
                        backgroundColor: 'white',
                        borderRadius: '50%',
                        transition: '.4s'
                    }} />
                  </span>
                                </label>
                            </div>
                        </div>
                    </div>
                );

            case 'integrations':
                return (
                    <div>
                        <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: '600' }}>
                            Integrations & Webhooks
                        </h3>

                        <div style={{
                            padding: '2rem',
                            backgroundColor: 'white',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔗</div>
                            <h4 style={{ margin: '0 0 0.5rem 0' }}>Webhook Integration</h4>
                            <p style={{ color: '#718096', marginBottom: '1.5rem' }}>
                                Configure webhooks to integrate with external services
                            </p>
                            <button
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    backgroundColor: '#f7fafc',
                                    color: '#4a5568',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '6px',
                                    cursor: 'not-allowed',
                                    fontWeight: '500'
                                }}
                                disabled
                            >
                                Coming Soon
                            </button>
                        </div>
                    </div>
                );

            case 'advanced':
                return (
                    <div>
                        <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: '600' }}>
                            Advanced Settings
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{
                                padding: '1.5rem',
                                backgroundColor: 'white',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0'
                            }}>
                                <h4 style={{ margin: '0 0 1rem 0', fontWeight: '500' }}>Data Management</h4>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button
                                        onClick={() => {
                                            localStorage.clear();
                                            alert('Local data cleared successfully!');
                                        }}
                                        style={{
                                            padding: '0.75rem 1.5rem',
                                            backgroundColor: '#fed7d7',
                                            color: '#c53030',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontWeight: '500'
                                        }}
                                    >
                                        🗑️ Clear Local Data
                                    </button>
                                    <button
                                        onClick={() => {
                                            const data = {
                                                settings: userSettings,
                                                theme: currentTheme,
                                                timestamp: new Date().toISOString()
                                            };
                                            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                                            const url = URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = 'asana-dashboard-backup.json';
                                            a.click();
                                            URL.revokeObjectURL(url);
                                        }}
                                        style={{
                                            padding: '0.75rem 1.5rem',
                                            backgroundColor: '#bee3f8',
                                            color: '#2b6cb0',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontWeight: '500'
                                        }}
                                    >
                                        💾 Export Settings
                                    </button>
                                </div>
                            </div>

                            <div style={{
                                padding: '1.5rem',
                                backgroundColor: 'white',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0'
                            }}>
                                <h4 style={{ margin: '0 0 1rem 0', fontWeight: '500' }}>Debug Information</h4>
                                <div style={{
                                    backgroundColor: '#f8f9fa',
                                    padding: '1rem',
                                    borderRadius: '6px',
                                    fontSize: '0.875rem',
                                    fontFamily: 'monospace'
                                }}>
                                    <div>User Agent: {navigator.userAgent}</div>
                                    <div>Screen: {screen.width}x{screen.height}</div>
                                    <div>Timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}</div>
                                    <div>Language: {navigator.language}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    if (loading) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚙️</div>
                <p>Loading settings...</p>
            </div>
        );
    }

    return (
        <div style={{ padding: '2rem' }}>
            <h2 style={{
                margin: '0 0 2rem 0',
                fontSize: '2rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
            }}>
                ⚙️ Settings & Configuration
            </h2>

            <div style={{ display: 'flex', gap: '2rem' }}>
                {/* Sidebar Tabs */}
                <div style={{
                    width: '250px',
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    padding: '1rem',
                    height: 'fit-content'
                }}>
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                width: '100%',
                                padding: '0.75rem 1rem',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                textAlign: 'left',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                marginBottom: '0.5rem',
                                backgroundColor: activeTab === tab.id
                                    ? (currentTheme?.primary ? `${currentTheme.primary}15` : '#3182ce15')
                                    : 'transparent',
                                color: activeTab === tab.id
                                    ? (currentTheme?.primary || '#3182ce')
                                    : '#4a5568',
                                fontWeight: activeTab === tab.id ? '600' : '500',
                                transition: 'all 0.2s'
                            }}
                        >
                            <span style={{ fontSize: '1.25rem' }}>{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Main Content */}
                <div style={{ flex: 1 }}>
                    {renderTabContent()}
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;