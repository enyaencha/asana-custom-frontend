// components/SyncSettings.jsx
import React, { useState, useEffect } from 'react';
import { useAsana } from '../context/AsanaContext.jsx';
import { localDB } from '../utils/LocalDatabase.js';

const SyncSettings = () => {
    const {
        cacheInfo,
        clearLocalCache,
        updateCacheInfo,
        getSyncQueueStatus,
        clearSyncQueue
    } = useAsana();

    const [settings, setSettings] = useState({
        autoSync: true,
        syncIntervalMinutes: 6,
        retryAttempts: 3,
        batchSize: 10
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        loadSyncSettings();
    }, []);

    const loadSyncSettings = async () => {
        try {
            const currentSettings = await localDB.getSyncSettings();
            setSettings(currentSettings);
        } catch (error) {
            console.error('Error loading sync settings:', error);
        }
    };

    const saveSyncSettings = async () => {
        try {
            setLoading(true);
            await localDB.updateSyncSettings(settings);
            setMessage('✅ Settings saved successfully');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error('Error saving sync settings:', error);
            setMessage('❌ Failed to save settings');
            setTimeout(() => setMessage(''), 3000);
        } finally {
            setLoading(false);
        }
    };

    const handleClearCache = async () => {
        if (!window.confirm('Are you sure you want to clear all local cache? This will remove all offline data.')) {
            return;
        }

        try {
            setLoading(true);
            await clearLocalCache();
            setMessage('✅ Cache cleared successfully');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error('Error clearing cache:', error);
            setMessage('❌ Failed to clear cache');
            setTimeout(() => setMessage(''), 3000);
        } finally {
            setLoading(false);
        }
    };

    const handleClearFailedSync = async () => {
        try {
            setLoading(true);
            await clearSyncQueue();
            setMessage('✅ Failed sync items cleared');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error('Error clearing sync queue:', error);
            setMessage('❌ Failed to clear sync queue');
            setTimeout(() => setMessage(''), 3000);
        } finally {
            setLoading(false);
        }
    };

    const queueStatus = getSyncQueueStatus();

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{
                fontSize: '2rem',
                fontWeight: '600',
                color: '#1f2937',
                marginBottom: '2rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
            }}>
                ⚙️ Sync & Offline Settings
            </h2>

            {message && (
                <div style={{
                    padding: '0.75rem 1rem',
                    backgroundColor: message.startsWith('✅') ? '#d1fae5' : '#fef2f2',
                    color: message.startsWith('✅') ? '#065f46' : '#dc2626',
                    borderRadius: '8px',
                    marginBottom: '1.5rem',
                    border: `1px solid ${message.startsWith('✅') ? '#34d399' : '#fecaca'}`
                }}>
                    {message}
                </div>
            )}

            {/* Sync Configuration */}
            <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                padding: '1.5rem',
                marginBottom: '1.5rem'
            }}>
                <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    🔄 Sync Configuration
                </h3>

                <div style={{ display: 'grid', gap: '1rem' }}>
                    {/* Auto Sync Toggle */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '1rem',
                        backgroundColor: '#f8fafc',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb'
                    }}>
                        <div>
                            <div style={{
                                fontSize: '0.875rem',
                                fontWeight: '600',
                                color: '#374151',
                                marginBottom: '0.25rem'
                            }}>
                                Automatic Sync
                            </div>
                            <div style={{
                                fontSize: '0.75rem',
                                color: '#6b7280'
                            }}>
                                Automatically sync changes when online
                            </div>
                        </div>
                        <label style={{
                            position: 'relative',
                            display: 'inline-block',
                            width: '48px',
                            height: '24px'
                        }}>
                            <input
                                type="checkbox"
                                checked={settings.autoSync}
                                onChange={(e) => setSettings(prev => ({
                                    ...prev,
                                    autoSync: e.target.checked
                                }))}
                                style={{
                                    opacity: 0,
                                    width: 0,
                                    height: 0
                                }}
                            />
                            <span style={{
                                position: 'absolute',
                                cursor: 'pointer',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundColor: settings.autoSync ? '#10b981' : '#d1d5db',
                                borderRadius: '24px',
                                transition: 'background-color 0.2s',
                                '::before': {
                                    content: '""',
                                    position: 'absolute',
                                    height: '18px',
                                    width: '18px',
                                    left: settings.autoSync ? '27px' : '3px',
                                    bottom: '3px',
                                    backgroundColor: 'white',
                                    borderRadius: '50%',
                                    transition: 'left 0.2s'
                                }
                            }}>
                                <div style={{
                                    position: 'absolute',
                                    height: '18px',
                                    width: '18px',
                                    left: settings.autoSync ? '27px' : '3px',
                                    bottom: '3px',
                                    backgroundColor: 'white',
                                    borderRadius: '50%',
                                    transition: 'left 0.2s'
                                }} />
                            </span>
                        </label>
                    </div>

                    {/* Sync Interval */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 120px',
                        gap: '1rem',
                        alignItems: 'center'
                    }}>
                        <div>
                            <label style={{
                                fontSize: '0.875rem',
                                fontWeight: '600',
                                color: '#374151',
                                display: 'block',
                                marginBottom: '0.25rem'
                            }}>
                                Sync Interval (minutes)
                            </label>
                            <div style={{
                                fontSize: '0.75rem',
                                color: '#6b7280'
                            }}>
                                How often to check for pending changes
                            </div>
                        </div>
                        <input
                            type="number"
                            min="1"
                            max="60"
                            value={settings.syncIntervalMinutes}
                            onChange={(e) => setSettings(prev => ({
                                ...prev,
                                syncIntervalMinutes: parseInt(e.target.value)
                            }))}
                            style={{
                                padding: '0.5rem',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px',
                                fontSize: '0.875rem'
                            }}
                        />
                    </div>

                    {/* Retry Attempts */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 120px',
                        gap: '1rem',
                        alignItems: 'center'
                    }}>
                        <div>
                            <label style={{
                                fontSize: '0.875rem',
                                fontWeight: '600',
                                color: '#374151',
                                display: 'block',
                                marginBottom: '0.25rem'
                            }}>
                                Retry Attempts
                            </label>
                            <div style={{
                                fontSize: '0.75rem',
                                color: '#6b7280'
                            }}>
                                How many times to retry failed sync operations
                            </div>
                        </div>
                        <input
                            type="number"
                            min="1"
                            max="10"
                            value={settings.retryAttempts}
                            onChange={(e) => setSettings(prev => ({
                                ...prev,
                                retryAttempts: parseInt(e.target.value)
                            }))}
                            style={{
                                padding: '0.5rem',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px',
                                fontSize: '0.875rem'
                            }}
                        />
                    </div>

                    {/* Batch Size */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 120px',
                        gap: '1rem',
                        alignItems: 'center'
                    }}>
                        <div>
                            <label style={{
                                fontSize: '0.875rem',
                                fontWeight: '600',
                                color: '#374151',
                                display: 'block',
                                marginBottom: '0.25rem'
                            }}>
                                Batch Size
                            </label>
                            <div style={{
                                fontSize: '0.75rem',
                                color: '#6b7280'
                            }}>
                                Number of changes to sync at once
                            </div>
                        </div>
                        <input
                            type="number"
                            min="1"
                            max="50"
                            value={settings.batchSize}
                            onChange={(e) => setSettings(prev => ({
                                ...prev,
                                batchSize: parseInt(e.target.value)
                            }))}
                            style={{
                                padding: '0.5rem',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px',
                                fontSize: '0.875rem'
                            }}
                        />
                    </div>

                    {/* Save Button */}
                    <button
                        onClick={saveSyncSettings}
                        disabled={loading}
                        style={{
                            padding: '0.75rem 1.5rem',
                            backgroundColor: loading ? '#9ca3af' : '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            alignSelf: 'start'
                        }}
                    >
                        {loading ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </div>

            {/* Storage Information */}
            <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                padding: '1.5rem',
                marginBottom: '1.5rem'
            }}>
                <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    💾 Storage Information
                </h3>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: '1rem',
                    marginBottom: '1rem'
                }}>
                    <div style={{
                        padding: '1rem',
                        backgroundColor: '#f8fafc',
                        borderRadius: '8px',
                        textAlign: 'center'
                    }}>
                        <div style={{
                            fontSize: '1.5rem',
                            fontWeight: '700',
                            color: '#3b82f6'
                        }}>
                            {cacheInfo.projects || 0}
                        </div>
                        <div style={{
                            fontSize: '0.75rem',
                            color: '#6b7280'
                        }}>
                            Projects
                        </div>
                    </div>

                    <div style={{
                        padding: '1rem',
                        backgroundColor: '#f8fafc',
                        borderRadius: '8px',
                        textAlign: 'center'
                    }}>
                        <div style={{
                            fontSize: '1.5rem',
                            fontWeight: '700',
                            color: '#10b981'
                        }}>
                            {cacheInfo.tasks || 0}
                        </div>
                        <div style={{
                            fontSize: '0.75rem',
                            color: '#6b7280'
                        }}>
                            Tasks
                        </div>
                    </div>

                    <div style={{
                        padding: '1rem',
                        backgroundColor: '#f8fafc',
                        borderRadius: '8px',
                        textAlign: 'center'
                    }}>
                        <div style={{
                            fontSize: '1.5rem',
                            fontWeight: '700',
                            color: '#f59e0b'
                        }}>
                            {queueStatus.total || 0}
                        </div>
                        <div style={{
                            fontSize: '0.75rem',
                            color: '#6b7280'
                        }}>
                            Pending Sync
                        </div>
                    </div>

                    {cacheInfo.storageUsed && (
                        <div style={{
                            padding: '1rem',
                            backgroundColor: '#f8fafc',
                            borderRadius: '8px',
                            textAlign: 'center'
                        }}>
                            <div style={{
                                fontSize: '1.5rem',
                                fontWeight: '700',
                                color: '#8b5cf6'
                            }}>
                                {(cacheInfo.storageUsed / 1024 / 1024).toFixed(1)}
                            </div>
                            <div style={{
                                fontSize: '0.75rem',
                                color: '#6b7280'
                            }}>
                                MB Used
                            </div>
                        </div>
                    )}
                </div>

                {/* Storage Actions */}
                <div style={{
                    display: 'flex',
                    gap: '1rem',
                    flexWrap: 'wrap'
                }}>
                    <button
                        onClick={handleClearCache}
                        disabled={loading}
                        style={{
                            flex: 1,
                            padding: '0.75rem 1rem',
                            backgroundColor: loading ? '#9ca3af' : '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            minWidth: '150px'
                        }}
                    >
                        🗑️ Clear All Cache
                    </button>

                    {queueStatus.failed > 0 && (
                        <button
                            onClick={handleClearFailedSync}
                            disabled={loading}
                            style={{
                                flex: 1,
                                padding: '0.75rem 1rem',
                                backgroundColor: loading ? '#9ca3af' : '#f59e0b',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                minWidth: '150px'
                            }}
                        >
                            🔄 Clear Failed ({queueStatus.failed})
                        </button>
                    )}
                </div>
            </div>

            {/* Sync Status */}
            {queueStatus.total > 0 && (
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    padding: '1.5rem'
                }}>
                    <h3 style={{
                        fontSize: '1.25rem',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        📋 Sync Queue Status
                    </h3>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                        gap: '1rem'
                    }}>
                        <div style={{
                            padding: '0.75rem',
                            backgroundColor: '#fef3c7',
                            borderRadius: '8px',
                            textAlign: 'center',
                            border: '1px solid #f59e0b'
                        }}>
                            <div style={{
                                fontSize: '1.25rem',
                                fontWeight: '600',
                                color: '#92400e'
                            }}>
                                {queueStatus.pending || 0}
                            </div>
                            <div style={{
                                fontSize: '0.75rem',
                                color: '#a16207'
                            }}>
                                Pending
                            </div>
                        </div>

                        <div style={{
                            padding: '0.75rem',
                            backgroundColor: '#fef2f2',
                            borderRadius: '8px',
                            textAlign: 'center',
                            border: '1px solid #ef4444'
                        }}>
                            <div style={{
                                fontSize: '1.25rem',
                                fontWeight: '600',
                                color: '#dc2626'
                            }}>
                                {queueStatus.failed || 0}
                            </div>
                            <div style={{
                                fontSize: '0.75rem',
                                color: '#b91c1c'
                            }}>
                                Failed
                            </div>
                        </div>

                        <div style={{
                            padding: '0.75rem',
                            backgroundColor: '#ecfdf5',
                            borderRadius: '8px',
                            textAlign: 'center',
                            border: '1px solid #10b981'
                        }}>
                            <div style={{
                                fontSize: '1.25rem',
                                fontWeight: '600',
                                color: '#059669'
                            }}>
                                {queueStatus.retry || 0}
                            </div>
                            <div style={{
                                fontSize: '0.75rem',
                                color: '#047857'
                            }}>
                                Retrying
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SyncSettings;