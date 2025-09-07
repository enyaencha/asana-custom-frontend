const { pool } = require('../config/database');
const AsanaApiService = require('./asanaApiService');
const JsonUtils = require('../utils/jsonUtils');

class SyncService {
    static async getSyncSettings() {
        // Move getSyncSettings function here
        // ... (settings retrieval logic)
    }

    static async processSyncItemEnhanced(item) {
        // Move processSyncItemEnhanced function here
        // ... (sync processing logic)
    }

    static async triggerAutoSync(operation = 'create') {
        // Move triggerAutoSync function here
        // ... (auto-sync logic)
    }

    static async addToSyncQueue(operationType, resourceType, resourceId, payload, priority = 'medium') {
        const queuePayload = JsonUtils.ensureJsonString(payload, '{}');

        await pool.execute(`
            INSERT IGNORE INTO sync_queue (operation_type, resource_type, resource_id, payload, priority)
            VALUES (?, ?, ?, ?, ?)
        `, [operationType, resourceType, resourceId, queuePayload, priority]);
    }
}

module.exports = SyncService;