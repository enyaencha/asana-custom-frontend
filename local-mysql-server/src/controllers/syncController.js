const { pool } = require('../config/database');
const SyncService = require('../services/syncService');
const AsanaApiService = require('../services/asanaApiService');

class SyncController {
    static async getSyncQueue(req, res) {
        try {
            const [rows] = await pool.execute(`
                SELECT * FROM sync_queue 
                ORDER BY 
                    CASE operation_type 
                        WHEN 'CREATE' THEN 1 
                        WHEN 'UPDATE' THEN 2 
                        WHEN 'DELETE' THEN 3 
                        ELSE 4 
                    END,
                    priority DESC, 
                    created_at ASC
                LIMIT 50
            `);
            res.json({ data: rows });
        } catch (error) {
            console.error('Error fetching sync queue:', error);
            res.status(500).json({ error: error.message });
        }
    }

    static async processSync(req, res) {
        // Move sync processing endpoint logic here
        // ... (sync processing implementation)
    }

    static async debugConnection(req, res) {
        // Move debug connection logic here
        // ... (debug implementation)
    }

    static async manualSync(req, res) {
        // Move manual sync logic here
        // ... (manual sync implementation)
    }
}

module.exports = SyncController;