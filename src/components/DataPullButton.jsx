// components/DataPullButton.jsx
import React from 'react';
import { useAsana } from '../context/AsanaContext';

const DataPullButton = () => {
    const {
        localDBAvailable,
        syncStatus,
        pullAllDataFromAsana,
        serverStatus
    } = useAsana();

    const handlePullData = async () => {
        const success = await pullAllDataFromAsana();
        if (success) {
            alert('✅ All data pulled from Asana and stored locally!');
        } else {
            alert('❌ Failed to pull data. Check console for details.');
        }
    };

    const canPullData = localDBAvailable && serverStatus === 'connected';

    return (
        <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            border: '1px solid #e2e8f0',
            marginBottom: '1rem'
        }}>
            <h4 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: '#2d3748',
                margin: '0 0 1rem 0',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
            }}>
                📥 Initial Data Setup
            </h4>

            <p style={{
                fontSize: '0.875rem',
                color: '#718096',
                margin: '0 0 1rem 0'
            }}>
                Pull all your Asana data (workspaces, projects, tasks) and store it locally for offline access and faster performance.
            </p>

            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
            }}>
                <button
                    onClick={handlePullData}
                    disabled={!canPullData || syncStatus === 'syncing'}
                    style={{
                        padding: '0.75rem 1.5rem',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: canPullData && syncStatus !== 'syncing' ? '#3182ce' : '#a0aec0',
                        color: 'white',
                        fontWeight: '500',
                        cursor: canPullData && syncStatus !== 'syncing' ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.875rem'
                    }}
                >
                    {syncStatus === 'syncing' ? (
                        <>
                            <span>🔄</span>
                            <span>Pulling Data...</span>
                        </>
                    ) : (
                        <>
                            <span>📥</span>
                            <span>Pull All Data from Asana</span>
                        </>
                    )}
                </button>

                <div style={{
                    fontSize: '0.75rem',
                    color: '#718096'
                }}>
                    {!localDBAvailable && '❌ Local database unavailable'}
                    {localDBAvailable && serverStatus !== 'connected' && '❌ Asana server disconnected'}
                    {canPullData && syncStatus === 'idle' && '✅ Ready to pull data'}
                    {syncStatus === 'syncing' && '🔄 Syncing in progress...'}
                    {syncStatus === 'success' && '✅ Last sync successful'}
                    {syncStatus === 'error' && '❌ Last sync failed'}
                </div>
            </div>
        </div>
    );
};

export default DataPullButton;