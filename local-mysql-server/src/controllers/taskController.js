const { pool } = require('../config/database');
const { validateTask } = require('../utils/validators');
const SyncService = require('../services/syncService');
const JsonUtils = require('../utils/jsonUtils');

class TaskController {
    static async getProjectTasks(req, res) {
        try {
            const { projectId } = req.params;

            const [rows] = await pool.execute(`
                SELECT t.*, u.name as assignee_name, u.email as assignee_email
                FROM tasks t
                LEFT JOIN users u ON t.assignee_gid = u.gid
                INNER JOIN task_projects tp ON t.gid = tp.task_gid
                WHERE tp.project_gid = ?
                ORDER BY t.created_at DESC
            `, [projectId]);

            const tasksWithProjects = rows.map(task => ({
                ...task,
                assignee: task.assignee_gid ? {
                    gid: task.assignee_gid,
                    name: task.assignee_name,
                    email: task.assignee_email
                } : null,
                projects: [{ gid: projectId }],
                custom_fields: JsonUtils.safeParse(task.custom_fields, []),
                asana_data: JsonUtils.safeParse(task.asana_data, {})
            }));

            res.json({ data: tasksWithProjects });

        } catch (error) {
            console.error('Error fetching tasks:', error);
            res.status(500).json({ error: error.message });
        }
    }

    static async createTask(req, res) {
        // Move task creation logic here
        // ... (task creation implementation)
    }
}

module.exports = TaskController;