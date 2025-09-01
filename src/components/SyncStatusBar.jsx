// components/SyncStatusBar.jsx
import React, { useState } from 'react';
import { useAsana } from '../context/AsanaContext';

const SyncStatusBar = () => {
    const {
        isOnline,
        syncStatus,
        cacheInfo,
        getSyncQueueStatus,
        forceSyncNow,
        clearSyncQueue,
        updateCacheInfo
    } = useAsana();

    const [showDetails, setShowDetails] = useState(false);
    const queueStatus = getSyncQueueStatus();

    const getStatusIcon = () => {
        if (!isOnline) return '📴';

        switch (syncStatus) {
            case 'syncing': return '🔄';
            case 'success': return '✅';
            case 'error': return '❌';
            default: return '🌐';
        }
    };

    const getStatusText = () => {
        if (!isOnline) return 'Offline';

        switch (syncStatus) {
            case 'syncing': return 'Syncing...';
            case 'success': return 'Synced';
            case 'error': return 'Sync Error';
            default: return 'Online';
        }
    };

    const getStatusColor = () => {
        if (!isOnline) return 'bg-gray-500';

        switch (syncStatus) {
            case 'syncing': return 'bg-blue-500';
            case 'success': return 'bg-green-500';
            case 'error': return 'bg-red-500';
            default: return 'bg-green-500';
        }
    };

    const handleSyncNow = async () => {
        if (isOnline) {
            await forceSyncNow();
            await updateCacheInfo();
        }
    };

    const handleClearQueue = async () => {
        await clearSyncQueue();
        await updateCacheInfo();
    };

    const getTotalCacheItems = () => {
        return Object.values(cacheInfo).reduce((sum, count) => sum + count, 0);
    };

    return (
        <div className="bg-white border-t border-gray-200 px-4 py-2">
            {/* Main Status Bar */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    {/* Status Indicator */}
                    <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-white text-sm ${getStatusColor()}`}>
                        <span className="text-xs">{getStatusIcon()}</span>
                        <span className="font-medium">{getStatusText()}</span>
                    </div>

                    {/* Queue Status */}
                    {queueStatus.total > 0 && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                                📤 {queueStatus.pending} pending
                            </span>
                            {queueStatus.failed > 0 && (
                                <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">
                                    ❌ {queueStatus.failed} failed
                                </span>
                            )}
                        </div>
                    )}

                    {/* Cache Info */}
                    {getTotalCacheItems() > 0 && (
                        <div className="text-sm text-gray-500">
                            📦 {getTotalCacheItems()} cached items
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2">
                    {isOnline && (
                        <button
                            onClick={handleSyncNow}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm hover:bg-blue-200 transition-colors"
                            disabled={syncStatus === 'syncing'}
                        >
                            {syncStatus === 'syncing' ? '🔄 Syncing...' : '🔄 Sync Now'}
                        </button>
                    )}

                    <button
                        onClick={() => setShowDetails(!showDetails)}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200 transition-colors"
                    >
                        {showDetails ? '▲ Hide' : '▼ Details'}
                    </button>
                </div>
            </div>

            {/* Detailed Status */}
            {showDetails && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        {/* Connection Status */}
                        <div className="space-y-2">
                            <h4 className="font-medium text-gray-900">Connection</h4>
                            <div className="space-y-1">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Status:</span>
                                    <span className={isOnline ? 'text-green-600' : 'text-red-600'}>
                                        {isOnline ? '🌐 Online' : '📴 Offline'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Sync Status:</span>
                                    <span className={
                                        syncStatus === 'success' ? 'text-green-600' :
                                            syncStatus === 'error' ? 'text-red-600' :
                                                syncStatus === 'syncing' ? 'text-blue-600' : 'text-gray-600'
                                    }>
                                        {getStatusIcon()} {getStatusText()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Sync Queue */}
                        <div className="space-y-2">
                            <h4 className="font-medium text-gray-900">Sync Queue</h4>
                            <div className="space-y-1">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Total:</span>
                                    <span>{queueStatus.total}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Pending:</span>
                                    <span className="text-yellow-600">{queueStatus.pending}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Failed:</span>
                                    <span className="text-red-600">{queueStatus.failed}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Retries:</span>
                                    <span className="text-orange-600">{queueStatus.retry}</span>
                                </div>
                            </div>
                            {queueStatus.failed > 0 && (
                                <button
                                    onClick={handleClearQueue}
                                    className="w-full px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200 transition-colors"
                                >
                                    Clear Failed Items
                                </button>
                            )}
                        </div>

                        {/* Cache Information */}
                        <div className="space-y-2">
                            <h4 className="font-medium text-gray-900">Local Cache</h4>
                            <div className="space-y-1">
                                {Object.entries(cacheInfo).map(([store, count]) => (
                                    <div key={store} className="flex justify-between">
                                        <span className="text-gray-600 capitalize">{store}:</span>
                                        <span>{count}</span>
                                    </div>
                                ))}
                                <div className="flex justify-between font-medium border-t pt-1">
                                    <span className="text-gray-900">Total:</span>
                                    <span>{getTotalCacheItems()}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Status Messages */}
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        {!isOnline && (
                            <div className="text-amber-700 text-sm">
                                📴 <strong>Offline Mode:</strong> Changes are being saved locally and will sync when you're back online.
                            </div>
                        )}

                        {isOnline && queueStatus.pending > 0 && (
                            <div className="text-blue-700 text-sm">
                                🔄 <strong>Syncing:</strong> {queueStatus.pending} changes are being synced to the server.
                            </div>
                        )}

                        {isOnline && queueStatus.total === 0 && syncStatus === 'success' && (
                            <div className="text-green-700 text-sm">
                                ✅ <strong>All synced:</strong> Your data is up to date with the server.
                            </div>
                        )}

                        {queueStatus.failed > 0 && (
                            <div className="text-red-700 text-sm">
                                ❌ <strong>Sync Issues:</strong> {queueStatus.failed} changes failed to sync. Check your connection and try again.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SyncStatusBar;