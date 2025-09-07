const SyncService = require('../services/syncService');
const { pool } = require('../config/database');

class SettingsController {
    static async getSyncSettings(req, res) {
        try {
            const settings = await SyncService.getSyncSettings();

            const [stats] = await pool.execute(`
                SELECT 
                    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_items,
                    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_items,
                    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_items
                FROM sync_queue
            `);

            res.json({
                data: {
                    settings,
                    statistics: stats[0] || { pending_items: 0, completed_items: 0, failed_items: 0 }
                }
            });

        } catch (error) {
            console.error('Error fetching sync settings:', error);
            res.status(500).json({ error: error.message });
        }
    }

    static async updateSyncSettings(req, res) {
        // Move sync settings update logic here
        // ... (settings update implementation)
    }
}

module.exports = SettingsController;