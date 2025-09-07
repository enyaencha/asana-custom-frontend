// utils/LocalDatabase.js
class LocalDatabase {
    constructor() {
        this.dbName = 'AsanaLocalDB';
        this.version = 1;
        this.db = null;
    }

    // Initialize the database
    async init() {
        if (this.db) return this.db;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => {
                console.error('❌ Error opening IndexedDB:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('✅ LocalDatabase initialized successfully');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                console.log('🔧 Upgrading LocalDatabase schema...');

                // Users store
                if (!db.objectStoreNames.contains('users')) {
                    const userStore = db.createObjectStore('users', { keyPath: 'gid' });
                    userStore.createIndex('name', 'name', { unique: false });
                }

                // Workspaces store
                if (!db.objectStoreNames.contains('workspaces')) {
                    const workspaceStore = db.createObjectStore('workspaces', { keyPath: 'gid' });
                    workspaceStore.createIndex('name', 'name', { unique: false });
                }

                // Projects store
                if (!db.objectStoreNames.contains('projects')) {
                    const projectStore = db.createObjectStore('projects', { keyPath: 'gid' });
                    projectStore.createIndex('workspace', 'workspace.gid', { unique: false });
                    projectStore.createIndex('name', 'name', { unique: false });
                }

                // Tasks store
                if (!db.objectStoreNames.contains('tasks')) {
                    const taskStore = db.createObjectStore('tasks', { keyPath: 'gid' });
                    taskStore.createIndex('project', 'projects', { unique: false, multiEntry: true });
                    taskStore.createIndex('assignee', 'assignee.gid', { unique: false });
                    taskStore.createIndex('completed', 'completed', { unique: false });
                }

                // Sync queue store
                if (!db.objectStoreNames.contains('syncQueue')) {
                    const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
                    syncStore.createIndex('timestamp', 'timestamp', { unique: false });
                    syncStore.createIndex('priority', 'priority', { unique: false });
                    syncStore.createIndex('status', 'status', { unique: false });
                }

                // Settings store
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'key' });
                }

                console.log('✅ LocalDatabase schema upgraded successfully');
            };
        });
    }

    // Generic database operations
    async getStore(storeName, mode = 'readonly') {
        await this.init();
        const transaction = this.db.transaction([storeName], mode);
        return transaction.objectStore(storeName);
    }

    // Users operations
    async saveUsers(users) {
        try {
            const store = await this.getStore('users', 'readwrite');
            const promises = users.map(user => store.put({ ...user, lastUpdated: Date.now() }));
            await Promise.all(promises);
            console.log(`✅ Saved ${users.length} users to local database`);
        } catch (error) {
            console.error('❌ Error saving users:', error);
        }
    }

    async getUsers() {
        try {
            const store = await this.getStore('users');
            const request = store.getAll();
            return new Promise((resolve, reject) => {
                request.onsuccess = () => resolve(request.result || []);
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('❌ Error getting users:', error);
            return [];
        }
    }

    // Workspaces operations
    async saveWorkspaces(workspaces) {
        try {
            const store = await this.getStore('workspaces', 'readwrite');
            const promises = workspaces.map(workspace => store.put({ ...workspace, lastUpdated: Date.now() }));
            await Promise.all(promises);
            console.log(`✅ Saved ${workspaces.length} workspaces to local database`);
        } catch (error) {
            console.error('❌ Error saving workspaces:', error);
        }
    }

    async getWorkspaces() {
        try {
            const store = await this.getStore('workspaces');
            const request = store.getAll();
            return new Promise((resolve, reject) => {
                request.onsuccess = () => resolve(request.result || []);
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('❌ Error getting workspaces:', error);
            return [];
        }
    }

    // Projects operations
    async saveProjects(projects) {
        try {
            const store = await this.getStore('projects', 'readwrite');
            const promises = projects.map(project => store.put({ ...project, lastUpdated: Date.now() }));
            await Promise.all(promises);
            console.log(`✅ Saved ${projects.length} projects to local database`);
        } catch (error) {
            console.error('❌ Error saving projects:', error);
        }
    }

    async getProjects() {
        try {
            const store = await this.getStore('projects');
            const request = store.getAll();
            return new Promise((resolve, reject) => {
                request.onsuccess = () => resolve(request.result || []);
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('❌ Error getting projects:', error);
            return [];
        }
    }

    async getProjectsByWorkspace(workspaceGid) {
        try {
            const store = await this.getStore('projects');
            const index = store.index('workspace');
            const request = index.getAll(workspaceGid);
            return new Promise((resolve, reject) => {
                request.onsuccess = () => resolve(request.result || []);
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('❌ Error getting projects by workspace:', error);
            return [];
        }
    }

    // Tasks operations
    async saveTasks(tasks) {
        try {
            const store = await this.getStore('tasks', 'readwrite');
            const promises = tasks.map(task => {
                // Handle projects array for indexing
                const taskData = {
                    ...task,
                    lastUpdated: Date.now(),
                    projects: task.projects?.map(p => p.gid) || []
                };
                return store.put(taskData);
            });
            await Promise.all(promises);
            console.log(`✅ Saved ${tasks.length} tasks to local database`);
        } catch (error) {
            console.error('❌ Error saving tasks:', error);
        }
    }

    async getTasks() {
        try {
            const store = await this.getStore('tasks');
            const request = store.getAll();
            return new Promise((resolve, reject) => {
                request.onsuccess = () => resolve(request.result || []);
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('❌ Error getting tasks:', error);
            return [];
        }
    }

    async getTasksByProject(projectGid) {
        try {
            const store = await this.getStore('tasks');
            const index = store.index('project');
            const request = index.getAll(projectGid);
            return new Promise((resolve, reject) => {
                request.onsuccess = () => resolve(request.result || []);
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('❌ Error getting tasks by project:', error);
            return [];
        }
    }

    async updateTask(taskGid, updates) {
        try {
            const store = await this.getStore('tasks', 'readwrite');

            // Get existing task
            const getRequest = store.get(taskGid);
            const existingTask = await new Promise((resolve, reject) => {
                getRequest.onsuccess = () => resolve(getRequest.result);
                getRequest.onerror = () => reject(getRequest.error);
            });

            if (existingTask) {
                const updatedTask = {
                    ...existingTask,
                    ...updates,
                    lastUpdated: Date.now()
                };

                const putRequest = store.put(updatedTask);
                await new Promise((resolve, reject) => {
                    putRequest.onsuccess = () => resolve();
                    putRequest.onerror = () => reject(putRequest.error);
                });

                console.log(`✅ Updated task ${taskGid} in local database`);
                return updatedTask;
            }
        } catch (error) {
            console.error('❌ Error updating task:', error);
        }
    }

    // Sync queue operations
    async addToSyncQueue(operation) {
        try {
            const syncItem = {
                ...operation,
                timestamp: Date.now(),
                status: 'pending',
                retryCount: 0,
                priority: operation.priority || 'medium'
            };

            const store = await this.getStore('syncQueue', 'readwrite');
            const request = store.add(syncItem);

            await new Promise((resolve, reject) => {
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });

            console.log(`✅ Added operation to sync queue:`, operation.type);
        } catch (error) {
            console.error('❌ Error adding to sync queue:', error);
        }
    }

    async getSyncQueue() {
        try {
            const store = await this.getStore('syncQueue');
            const request = store.getAll();
            return new Promise((resolve, reject) => {
                request.onsuccess = () => resolve(request.result || []);
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('❌ Error getting sync queue:', error);
            return [];
        }
    }

    async updateSyncQueueItem(id, updates) {
        try {
            const store = await this.getStore('syncQueue', 'readwrite');

            const getRequest = store.get(id);
            const existingItem = await new Promise((resolve, reject) => {
                getRequest.onsuccess = () => resolve(getRequest.result);
                getRequest.onerror = () => reject(getRequest.error);
            });

            if (existingItem) {
                const updatedItem = { ...existingItem, ...updates };
                const putRequest = store.put(updatedItem);
                await new Promise((resolve, reject) => {
                    putRequest.onsuccess = () => resolve();
                    putRequest.onerror = () => reject(putRequest.error);
                });
            }
        } catch (error) {
            console.error('❌ Error updating sync queue item:', error);
        }
    }

    async deleteSyncQueueItem(id) {
        try {
            const store = await this.getStore('syncQueue', 'readwrite');
            const request = store.delete(id);
            await new Promise((resolve, reject) => {
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('❌ Error deleting sync queue item:', error);
        }
    }

    // Settings operations
    async saveSetting(key, value) {
        try {
            const store = await this.getStore('settings', 'readwrite');
            const request = store.put({ key, value, lastUpdated: Date.now() });
            await new Promise((resolve, reject) => {
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('❌ Error saving setting:', error);
        }
    }

    async getSetting(key, defaultValue = null) {
        try {
            const store = await this.getStore('settings');
            const request = store.get(key);
            return new Promise((resolve, reject) => {
                request.onsuccess = () => {
                    const result = request.result;
                    resolve(result ? result.value : defaultValue);
                };
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('❌ Error getting setting:', error);
            return defaultValue;
        }
    }

    // Utility operations
    async clearAllData() {
        try {
            await this.init();
            const stores = ['users', 'workspaces', 'projects', 'tasks', 'syncQueue', 'settings'];

            for (const storeName of stores) {
                const store = await this.getStore(storeName, 'readwrite');
                await new Promise((resolve, reject) => {
                    const request = store.clear();
                    request.onsuccess = () => resolve();
                    request.onerror = () => reject(request.error);
                });
            }

            console.log('✅ Cleared all local database data');
        } catch (error) {
            console.error('❌ Error clearing all data:', error);
        }
    }

    async getStorageInfo() {
        try {
            const stores = ['users', 'workspaces', 'projects', 'tasks', 'syncQueue', 'settings'];
            const info = {};

            for (const storeName of stores) {
                const store = await this.getStore(storeName);
                const request = store.count();
                info[storeName] = await new Promise((resolve, reject) => {
                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => reject(request.error);
                });
            }

            return info;
        } catch (error) {
            console.error('❌ Error getting storage info:', error);
            return {};
        }
    }
}

// Create and export a singleton instance
export const localDB = new LocalDatabase();