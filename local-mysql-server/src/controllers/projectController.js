const { pool } = require('../config/database');
const { validateProject } = require('../utils/validators');
const SyncService = require('../services/syncService');

class ProjectController {
    static async createProject(req, res) {
        try {
            const { gid, name, workspace, notes, color, public: isPublic, archived, team } = req.body;

            validateProject({ name, workspace });

            const projectGid = gid || `local_${Date.now()}`;

            // Database insertion logic
            await pool.execute(`
                INSERT INTO projects (gid, name, workspace_gid, notes, color, \`public\`, archived, team_gid, sync_status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
            `, [projectGid, name, workspace, notes || null, color || null, isPublic || false, archived || false, team || null]);

            // Add to sync queue
            await SyncService.addToSyncQueue('CREATE', 'project', projectGid, {
                name, workspace, notes, color, public: isPublic, archived, team
            }, 'high');

            console.log('Project created locally and queued for sync');
            SyncService.triggerAutoSync('create');

            res.json({
                data: {
                    gid: projectGid,
                    name,
                    workspace_gid: workspace,
                    notes,
                    color,
                    public: isPublic,
                    archived,
                    team_gid: team,
                    sync_status: 'pending',
                    created_at: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('Project creation failed:', error);
            res.status(500).json({
                error: 'Project creation failed',
                message: error.message
            });
        }
    }
}

module.exports = ProjectController;