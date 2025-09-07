// context/AsanaContext.jsx - Enhanced with Local MySQL Integration
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AsanaContext = createContext();

export const useAsana = () => {
    const context = useContext(AsanaContext);
    if (!context) {
        throw new Error('useAsana must be used within an AsanaProvider');
    }
    return context;
};

export const AsanaProvider = ({ children }) => {
    // Your original state - UNCHANGED
    const [user, setUser] = useState(null);
    const [workspaces, setWorkspaces] = useState([]);
    const [projects, setProjects] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [workspaceUsers, setWorkspaceUsers] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [selectedWorkspace, setSelectedWorkspace] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [serverStatus, setServerStatus] = useState('checking');

    // Enhanced: Local MySQL server status and sync management
    const [localDBAvailable, setLocalDBAvailable] = useState(false);
    const [syncStatus, setSyncStatus] = useState('idle');
    const [queueStats, setQueueStats] = useState({ pending: 0, failed: 0, completed: 0 });

    // NEW: Cache information for SyncSettings
    const [cacheInfo, setCacheInfo] = useState({
        projects: 0,
        tasks: 0,
        storageUsed: 0,
        lastSync: null
    });

    // NEW: Track page state to prevent blank pages
    const [isUpdating, setIsUpdating] = useState(false);
    const [lastError, setLastError] = useState(null);

    console.log('🚀 AsanaProvider starting - Local MySQL First + Sync Queue...');

    // Local server configuration from .env
    const LOCAL_SERVER_URL = import.meta.env.VITE_LOCAL_SERVER_URL || 'http://localhost:3002/api';

    // Local MySQL API calls
    const localAPI = {
        // Get settings from asana_local_cache.settings table
        getSettings: async () => {
            try {
                const response = await fetch(`${LOCAL_SERVER_URL}/settings`);
                if (!response.ok) throw new Error('Failed to fetch settings');
                return await response.json();
            } catch (error) {
                console.error('Error fetching local settings:', error);
                return {
                    auto_sync: true,
                    sync_interval: 30,
                    batch_size: 50,
                    max_retries: 3,
                    auto_sync_enabled: true
                };
            }
        },

        // Update settings in database
        updateSettings: async (settings) => {
            try {
                const response = await fetch(`${LOCAL_SERVER_URL}/settings`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(settings)
                });
                if (!response.ok) throw new Error('Failed to update settings');
                return await response.json();
            } catch (error) {
                console.error('Error updating local settings:', error);
                throw error;
            }
        },

        // Health check
        checkHealth: async () => {
            try {
                const response = await fetch(`http://localhost:3002/health`, {
                    method: 'GET',
                    timeout: 3000
                });
                return response.ok;
            } catch (error) {
                console.warn('Local server health check failed:', error.message);
                return false;
            }
        },

        // Get sync queue status from sync_queue table
        getSyncQueue: async () => {
            try {
                const response = await fetch(`${LOCAL_SERVER_URL}/sync-queue`);
                if (!response.ok) throw new Error('Failed to fetch sync queue');
                return await response.json();
            } catch (error) {
                console.error('Error fetching sync queue:', error);
                return { pending: 0, failed: 0, retry: 0, total: 0 };
            }
        },

        // Clear cache tables
        clearCache: async () => {
            try {
                const response = await fetch(`${LOCAL_SERVER_URL}/cache/clear`, {
                    method: 'DELETE'
                });
                if (!response.ok) throw new Error('Failed to clear cache');
                return await response.json();
            } catch (error) {
                console.error('Error clearing cache:', error);
                throw error;
            }
        },

        // Clear sync queue
        clearSyncQueue: async () => {
            try {
                const response = await fetch(`${LOCAL_SERVER_URL}/sync-queue/clear`, {
                    method: 'DELETE'
                });
                if (!response.ok) throw new Error('Failed to clear sync queue');
                return await response.json();
            } catch (error) {
                console.error('Error clearing sync queue:', error);
                throw error;
            }
        },

        // Get cache statistics
        getCacheStats: async () => {
            try {
                const response = await fetch(`${LOCAL_SERVER_URL}/cache/stats`);
                if (!response.ok) throw new Error('Failed to fetch cache stats');
                return await response.json();
            } catch (error) {
                console.error('Error fetching cache stats:', error);
                return { projects: 0, tasks: 0, storageUsed: 0 };
            }
        }
    };

    // Enhanced: Check local MySQL server availability
    const checkLocalServer = async () => {
        try {
            const response = await fetch(`${LOCAL_SERVER_URL}/health`);
            if (response.ok) {
                setLocalDBAvailable(true);
                setServerStatus('connected');
                console.log('✅ Local MySQL server connected');

                // Load initial cache info
                await updateCacheInfo();
                await updateSyncQueueStatus();
            } else {
                setLocalDBAvailable(false);
                setServerStatus('disconnected');
                console.warn('⚠️ Local MySQL server not responding');
            }
        } catch (error) {
            setLocalDBAvailable(false);
            setServerStatus('error');
            console.error('❌ Local MySQL server error:', error.message);
        }
    };

    // NEW: Methods needed by SyncSettings component
    const clearLocalCache = async () => {
        try {
            setIsUpdating(true);
            await localAPI.clearCache();

            // Reset local state
            setProjects([]);
            setTasks([]);
            setCacheInfo({ projects: 0, tasks: 0, storageUsed: 0, lastSync: null });

            console.log('✅ Local cache cleared successfully');
        } catch (error) {
            console.error('❌ Error clearing local cache:', error);
            setLastError(error.message);
            throw error;
        } finally {
            setIsUpdating(false);
        }
    };

    const updateCacheInfo = async () => {
        try {
            const stats = await localAPI.getCacheStats();
            setCacheInfo({
                projects: stats.projects || projects.length,
                tasks: stats.tasks || tasks.length,
                storageUsed: stats.storageUsed || 0,
                lastSync: stats.lastSync || null
            });
        } catch (error) {
            console.error('Error updating cache info:', error);
            // Fallback to current state
            setCacheInfo({
                projects: projects.length,
                tasks: tasks.length,
                storageUsed: 0,
                lastSync: null
            });
        }
    };

    const getSyncQueueStatus = () => {
        return {
            total: queueStats.pending + queueStats.failed,
            pending: queueStats.pending,
            failed: queueStats.failed,
            retry: queueStats.retry || 0
        };
    };

    const clearSyncQueue = async () => {
        try {
            setIsUpdating(true);
            await localAPI.clearSyncQueue();
            setQueueStats({ pending: 0, failed: 0, completed: queueStats.completed, retry: 0 });
            console.log('✅ Sync queue cleared successfully');
        } catch (error) {
            console.error('❌ Error clearing sync queue:', error);
            setLastError(error.message);
            throw error;
        } finally {
            setIsUpdating(false);
        }
    };

    const updateSyncQueueStatus = async () => {
        try {
            const queueStatus = await localAPI.getSyncQueue();
            setQueueStats({
                pending: queueStatus.pending || 0,
                failed: queueStatus.failed || 0,
                completed: queueStatus.completed || queueStats.completed,
                retry: queueStatus.retry || 0
            });
        } catch (error) {
            console.error('Error updating sync queue status:', error);
        }
    };

    // Enhanced: Load settings from MySQL database
    const loadSyncSettings = async () => {
        try {
            const settings = await localAPI.getSettings();
            return {
                autoSync: settings.auto_sync || settings.auto_sync_enabled,
                syncIntervalMinutes: Math.floor((settings.sync_interval || 30000) / 60000), // Convert ms to minutes
                retryAttempts: settings.max_retries || 3,
                batchSize: settings.batch_size || 50
            };
        } catch (error) {
            console.error('Error loading sync settings:', error);
            return {
                autoSync: true,
                syncIntervalMinutes: 5,
                retryAttempts: 3,
                batchSize: 10
            };
        }
    };

    const saveSyncSettings = async (settings) => {
        try {
            await localAPI.updateSettings({
                auto_sync: settings.autoSync,
                auto_sync_enabled: settings.autoSync,
                sync_interval: settings.syncIntervalMinutes * 60000, // Convert minutes to ms
                max_retries: settings.retryAttempts,
                batch_size: settings.batchSize,
                updated_at: new Date().toISOString()
            });
            console.log('✅ Sync settings saved to MySQL database');
        } catch (error) {
            console.error('❌ Error saving sync settings:', error);
            throw error;
        }
    };

    // Initialize on mount
    useEffect(() => {
        checkLocalServer();

        // Set up periodic checks
        const interval = setInterval(() => {
            checkLocalServer();
            updateSyncQueueStatus();
        }, 30000); // Check every 30 seconds

        return () => clearInterval(interval);
    }, []);

    // Update cache info when projects/tasks change
    useEffect(() => {
        updateCacheInfo();
    }, [projects, tasks]);

    const value = {
        // Original state and methods
        user,
        setUser,
        workspaces,
        setWorkspaces,
        projects,
        setProjects,
        tasks,
        setTasks,
        workspaceUsers,
        setWorkspaceUsers,
        selectedProject,
        setSelectedProject,
        selectedWorkspace,
        setSelectedWorkspace,
        loading,
        setLoading,
        error,
        setError,
        serverStatus,

        // Enhanced MySQL integration
        localDBAvailable,
        syncStatus,
        queueStats,

        // NEW: SyncSettings required methods
        cacheInfo,
        clearLocalCache,
        updateCacheInfo,
        getSyncQueueStatus,
        clearSyncQueue,
        loadSyncSettings,
        saveSyncSettings,

        // Additional state
        isUpdating,
        lastError,
        setLastError,

        // Local API access
        localAPI,
        checkLocalServer,
        updateSyncQueueStatus
    };

    return (
        <AsanaContext.Provider value={value}>
            {children}
        </AsanaContext.Provider>
    );
};