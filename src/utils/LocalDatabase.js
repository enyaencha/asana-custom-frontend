// utils/LocalDatabase.js - MySQL Integration with Enhanced Error Handling
class LocalDatabase {
    constructor() {
        this.baseURL = import.meta.env.VITE_LOCAL_SERVER_URL || 'http://localhost:3002/api';
        this.isConnected = false;
        this.lastHealthCheck = null;
        console.log('LocalDatabase initialized with MySQL server URL:', this.baseURL);
    }

    // Enhanced health check with multiple endpoint attempts
    async isAvailable() {
        // Cache health check for 30 seconds to avoid excessive requests
        const now = Date.now();
        if (this.lastHealthCheck && (now - this.lastHealthCheck.timestamp) < 30000) {
            return this.lastHealthCheck.status;
        }

        // Your server has /health endpoint working
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);

            const response = await fetch(`${this.baseURL}/health`, {
                signal: controller.signal,
                headers: { 'Accept': 'application/json' }
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                const healthData = await response.json();
                this.isConnected = true;
                this.lastHealthCheck = { timestamp: now, status: true };
                console.log('MySQL server is healthy:', healthData);
                return true;
            } else {
                console.warn(`Health endpoint responded with status: ${response.status}`);
            }

        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Health check timeout');
            } else {
                console.log(`Health check failed: ${error.message}`);
            }
        }

        // Health check failed
        this.isConnected = false;
        this.lastHealthCheck = { timestamp: now, status: false };
        console.error('MySQL server health check failed. Server may be down or unreachable.');

        return false;
    }

    // Enhanced HTTP request wrapper with better error handling
    async makeRequest(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...options.headers
            }
        };

        try {
            const response = await fetch(url, { ...defaultOptions, ...options });

            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorBody}`);
            }

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const data = await response.json();
                return data.data || data; // Handle both {data: [...]} and direct array responses
            } else {
                return await response.text();
            }
        } catch (error) {
            console.error(`❌ Request failed: ${options.method || 'GET'} ${endpoint}`, error.message);
            throw error;
        }
    }

    // Settings Management
    async getSyncSettings() {
        try {
            const dbSettings = await this.makeRequest('/settings');

            // Convert database format to component format
            return {
                autoSync: dbSettings.auto_sync_enabled || dbSettings.auto_sync || true,
                syncIntervalMinutes: Math.floor((dbSettings.sync_interval || 30000) / 60000),
                retryAttempts: dbSettings.max_retries || 3,
                batchSize: dbSettings.batch_size || 50
            };
        } catch (error) {
            console.error('Error fetching sync settings, using defaults:', error.message);
            return {
                autoSync: true,
                syncIntervalMinutes: 5,
                retryAttempts: 3,
                batchSize: 10
            };
        }
    }

    async updateSyncSettings(settings) {
        try {
            const dbSettings = {
                auto_sync: settings.autoSync,
                auto_sync_enabled: settings.autoSync,
                sync_interval: settings.syncIntervalMinutes * 60000,
                max_retries: settings.retryAttempts,
                batch_size: settings.batchSize,
                updated_at: new Date().toISOString()
            };

            const result = await this.makeRequest('/settings', {
                method: 'PUT',
                body: JSON.stringify(dbSettings)
            });

            console.log('✅ Sync settings updated in MySQL database');
            return result;
        } catch (error) {
            console.error('❌ Error updating sync settings:', error);
            throw error;
        }
    }

    // Cache Statistics
    async getCacheStats() {
        try {
            const stats = await this.makeRequest('/cache/stats');
            return {
                projects: stats.projects || 0,
                tasks: stats.tasks || 0,
                workspaces: stats.workspaces || 0,
                users: stats.users || 0,
                storageUsed: stats.storageUsed || 0,
                lastSync: stats.lastSync || null
            };
        } catch (error) {
            console.error('Error fetching cache stats, returning zeros:', error.message);
            return {
                projects: 0,
                tasks: 0,
                workspaces: 0,
                users: 0,
                storageUsed: 0,
                lastSync: null
            };
        }
    }

    async clearCache() {
        try {
            const result = await this.makeRequest('/cache/clear', {
                method: 'DELETE'
            });
            console.log('✅ Cache cleared from MySQL database');
            return result;
        } catch (error) {
            console.error('❌ Error clearing cache:', error);
            throw error;
        }
    }

    // Sync Queue Management
    async getSyncQueueStatus() {
        try {
            const queueData = await this.makeRequest('/sync-queue/status');

            return {
                total: (queueData.pending || 0) + (queueData.failed || 0) + (queueData.retry || 0),
                pending: queueData.pending || 0,
                failed: queueData.failed || 0,
                retry: queueData.retry || 0,
                completed: queueData.completed || 0
            };
        } catch (error) {
            console.error('Error fetching sync queue status, returning zeros:', error.message);
            return {
                total: 0,
                pending: 0,
                failed: 0,
                retry: 0,
                completed: 0
            };
        }
    }

    async clearSyncQueue() {
        try {
            const result = await this.makeRequest('/sync-queue/clear-failed', {
                method: 'DELETE'
            });
            console.log('✅ Failed sync queue items cleared from MySQL database');
            return result;
        } catch (error) {
            console.error('❌ Error clearing sync queue:', error);
            throw error;
        }
    }

    async getSyncQueueItems() {
        try {
            const items = await this.makeRequest('/sync-queue');
            return Array.isArray(items) ? items : [];
        } catch (error) {
            console.error('Error fetching sync queue items:', error.message);
            return [];
        }
    }

    // Data Retrieval Methods
    async getWorkspaces() {
        try {
            const workspaces = await this.makeRequest('/workspaces');
            return Array.isArray(workspaces) ? workspaces : [];
        } catch (error) {
            console.error('Error fetching workspaces from cache:', error.message);
            return [];
        }
    }

    async getProjects(workspaceId = null) {
        try {
            const endpoint = workspaceId ? `/workspaces/${workspaceId}/projects` : '/projects';
            const projects = await this.makeRequest(endpoint);
            return Array.isArray(projects) ? projects : [];
        } catch (error) {
            console.error('Error fetching projects from cache:', error.message);
            return [];
        }
    }

    async getTasks(projectId = null) {
        try {
            const endpoint = projectId ? `/projects/${projectId}/tasks` : '/tasks';
            const tasks = await this.makeRequest(endpoint);
            return Array.isArray(tasks) ? tasks : [];
        } catch (error) {
            console.error('Error fetching tasks from cache:', error.message);
            return [];
        }
    }

    async getUsers(workspaceId = null) {
        try {
            const endpoint = workspaceId ? `/workspaces/${workspaceId}/users` : '/users';
            const users = await this.makeRequest(endpoint);
            return Array.isArray(users) ? users : [];
        } catch (error) {
            console.error('Error fetching users from cache:', error.message);
            return [];
        }
    }

    // Custom Fields Support
    async getCustomFields(projectId) {
        try {
            const customFields = await this.makeRequest(`/projects/${projectId}/custom-fields`);
            return Array.isArray(customFields) ? customFields : [];
        } catch (error) {
            console.warn('Error fetching custom fields (may not be implemented):', error.message);
            return [];
        }
    }

    // Data Update Methods
    async updateTask(taskId, taskData) {
        try {
            const result = await this.makeRequest(`/tasks/${taskId}`, {
                method: 'PUT',
                body: JSON.stringify(taskData)
            });
            console.log(`✅ Task ${taskId} updated in local database`);
            return result;
        } catch (error) {
            console.error(`❌ Error updating task ${taskId}:`, error);
            throw error;
        }
    }

    async updateProject(projectId, projectData) {
        try {
            const result = await this.makeRequest(`/projects/${projectId}`, {
                method: 'PUT',
                body: JSON.stringify(projectData)
            });
            console.log(`✅ Project ${projectId} updated in local database`);
            return result;
        } catch (error) {
            console.error(`❌ Error updating project ${projectId}:`, error);
            throw error;
        }
    }

    async createTask(taskData) {
        try {
            const result = await this.makeRequest('/tasks', {
                method: 'POST',
                body: JSON.stringify(taskData)
            });
            console.log('✅ Task created in local database');
            return result;
        } catch (error) {
            console.error('❌ Error creating task:', error);
            throw error;
        }
    }

    async createProject(projectData) {
        try {
            const result = await this.makeRequest('/projects', {
                method: 'POST',
                body: JSON.stringify(projectData)
            });
            console.log('✅ Project created in local database');
            return result;
        } catch (error) {
            console.error('❌ Error creating project:', error);
            throw error;
        }
    }

    async deleteTask(taskId) {
        try {
            const result = await this.makeRequest(`/tasks/${taskId}`, {
                method: 'DELETE'
            });
            console.log(`✅ Task ${taskId} deleted from local database`);
            return result;
        } catch (error) {
            console.error(`❌ Error deleting task ${taskId}:`, error);
            throw error;
        }
    }

    async deleteProject(projectId) {
        try {
            const result = await this.makeRequest(`/projects/${projectId}`, {
                method: 'DELETE'
            });
            console.log(`✅ Project ${projectId} deleted from local database`);
            return result;
        } catch (error) {
            console.error(`❌ Error deleting project ${projectId}:`, error);
            throw error;
        }
    }

    // Sync Operations
    async triggerSync() {
        try {
            const result = await this.makeRequest('/sync/trigger', {
                method: 'POST'
            });
            console.log('✅ Sync operation triggered');
            return result;
        } catch (error) {
            console.error('❌ Error triggering sync:', error);
            throw error;
        }
    }

    async processSyncQueue() {
        try {
            const result = await this.makeRequest('/sync/process', {
                method: 'POST'
            });
            console.log('✅ Sync queue processing completed');
            return result;
        } catch (error) {
            console.error('❌ Error processing sync queue:', error);
            throw error;
        }
    }

    async pullAllDataFromAsana() {
        try {
            const result = await this.makeRequest('/sync/all', {
                method: 'POST'
            });
            console.log('✅ Full data pull from Asana completed');
            return result;
        } catch (error) {
            console.error('❌ Error pulling all data from Asana:', error);
            throw error;
        }
    }

    // Utility Methods
    async testConnection() {
        try {
            const result = await this.makeRequest('/test-connection');
            console.log('✅ Database connection test passed');
            return { success: true, ...result };
        } catch (error) {
            console.error('❌ Database connection test failed:', error);
            return { success: false, error: error.message };
        }
    }

    async getServerInfo() {
        try {
            const info = await this.makeRequest('/info');
            return info;
        } catch (error) {
            console.error('Error fetching server info:', error.message);
            return { version: 'unknown', status: 'error' };
        }
    }

    // Batch operations for efficiency
    async batchUpdateTasks(taskUpdates) {
        try {
            const result = await this.makeRequest('/tasks/batch', {
                method: 'PUT',
                body: JSON.stringify({ tasks: taskUpdates })
            });
            console.log(`✅ Batch updated ${taskUpdates.length} tasks`);
            return result;
        } catch (error) {
            console.error('❌ Error in batch task update:', error);
            throw error;
        }
    }

    async batchCreateTasks(tasks) {
        try {
            const result = await this.makeRequest('/tasks/batch', {
                method: 'POST',
                body: JSON.stringify({ tasks })
            });
            console.log(`✅ Batch created ${tasks.length} tasks`);
            return result;
        } catch (error) {
            console.error('❌ Error in batch task creation:', error);
            throw error;
        }
    }

    // Connection status getter
    get connectionStatus() {
        return this.isConnected;
    }

    // Force refresh connection status
    async refreshConnectionStatus() {
        this.lastHealthCheck = null; // Clear cache
        return await this.isAvailable();
    }
}

// Export singleton instance
export const localDB = new LocalDatabase();
export default LocalDatabase;