const { pool } = require('../config/database');

class WorkspaceController {
    static async getWorkspaces(req, res) {
        try {
            const [rows] = await pool.execute('SELECT * FROM workspaces ORDER BY name');
            res.json({ data: rows });
        } catch (error) {
            console.error('Error fetching workspaces:', error);
            res.status(500).json({ error: error.message });
        }
    }

    static async getWorkspaceProjects(req, res) {
        try {
            const { workspaceId } = req.params;
            const [rows] = await pool.execute(
                'SELECT * FROM projects WHERE workspace_gid = ? ORDER BY created_at DESC',
                [workspaceId]
            );
            res.json({ data: rows });
        } catch (error) {
            console.error('Error fetching workspace projects:', error);
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = WorkspaceController;