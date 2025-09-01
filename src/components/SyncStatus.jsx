// components/SyncStatus.jsx
import React from 'react';
import { useAsana } from '../context/AsanaContext';

const SyncStatus = () => {
    const {
        serverStatus,
        localDBAvailable
    } = useAsana();

    const getStatusColor = (status) => {
        switch (status) {
            case 'connected': return '#38a169'; // green
            case 'disconnected': return '#e53e3e'; // red
            case 'checking': return '#ed8936'; // orange
            default: return '#718096'; // gray
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'connected': return '✅';
            case 'disconnected': return '❌';
            case 'checking': return '⏳';
            default: return '❓';
        }
    };

    return (
        <div style={{
            backgroundColor: 'white',
            padding: '1rem',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            border: '1px solid #e2e8f0',
            marginBottom: '1rem'
        }}>
            <h4 style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#4a5568',
                margin: '0 0 0.75rem 0'
            }}>
                🔗 Server Status
            </h4>

            <div style={{
                display: 'flex',
                gap: '1rem',
                alignItems: 'center',
                flexWrap: 'wrap'
            }}>
                {/* Main Asana Server Status */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px',
                    backgroundColor: serverStatus === 'connected' ? '#f0fff4' : '#fed7d7',
                    border: `1px solid ${getStatusColor(serverStatus)}20`
                }}>
                    <span style={{ fontSize: '0.875rem' }}>
                        {getStatusIcon(serverStatus)}
                    </span>
                    <span style={{
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: getStatusColor(serverStatus)
                    }}>
                        Asana Server: {serverStatus}
                    </span>
                </div>

                {/* Local MySQL Status */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px',
                    backgroundColor: localDBAvailable ? '#f0fff4' : '#fed7d7',
                    border: `1px solid ${localDBAvailable ? '#38a169' : '#e53e3e'}20`
                }}>
                    <span style={{ fontSize: '0.875rem' }}>
                        {localDBAvailable ? '✅' : '❌'}
                    </span>
                    <span style={{
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: localDBAvailable ? '#38a169' : '#e53e3e'
                    }}>
                        MySQL Cache: {localDBAvailable ? 'connected' : 'unavailable'}
                    </span>
                </div>

                {/* Status Summary */}
                <div style={{
                    fontSize: '0.75rem',
                    color: '#718096',
                    fontStyle: 'italic',
                    marginLeft: 'auto'
                }}>
                    {serverStatus === 'connected' && localDBAvailable && '🚀 Optimal performance'}
                    {serverStatus === 'connected' && !localDBAvailable && '🌐 Online only'}
                    {serverStatus === 'disconnected' && localDBAvailable && '📦 Offline mode'}
                    {serverStatus === 'disconnected' && !localDBAvailable && '⚠️ Limited functionality'}
                </div>
            </div>
        </div>
    );
};

export default SyncStatus;