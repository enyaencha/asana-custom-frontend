// local-server.js - COMPLETE PRODUCTION VERSION
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const axios = require('axios');
const cron = require('node-cron');
require('dotenv').config();

console.log('🗄️ MySQL Local Server starting...');

const app = express();
const PORT = process.env.LOCAL_PORT || 3002;

// =============================================================================
// UTILITY: Safe JSON handling functions
// =============================================================================
const JsonUtils = {
    safeStringify: (obj, defaultValue = '{}') => {
        if (obj === null || obj === undefined) {
            return defaultValue;
        }

        if (typeof obj === 'string') {
            if (obj.includes('[object Object]') || obj === '[object Object]') {
                console.warn('Found [object Object] in string, using default:', defaultValue);
                return defaultValue;
            }

            try {
                JSON.parse(obj);
                return obj;
            } catch (e) {
                console.warn('Invalid JSON string, using default:', obj.substring(0, 100));
                return defaultValue;
            }
        }

        if (typeof obj === 'object') {
            try {
                JSON.stringify(obj);
                return JSON.stringify(obj);
            } catch (e) {
                console.error('Failed to stringify object:', e.message);
                return defaultValue;
            }
        }

        try {
            return JSON.stringify(obj);
        } catch (e) {
            console.error('Failed to stringify value:', e.message);
            return defaultValue;
        }
    },

    safeParse: (jsonString, defaultValue = {}) => {
        if (!jsonString || jsonString === '' || jsonString === '[]' || jsonString === '{}') {
            return defaultValue;
        }

        if (typeof jsonString === 'object' && jsonString !== null) {
            return jsonString;
        }

        if (typeof jsonString === 'string') {
            if (jsonString.includes('[object Object]') || jsonString === '[object Object]') {
                console.warn('Found [object Object] in JSON field, using default');
                return defaultValue;
            }

            try {
                const parsed = JSON.parse(jsonString);
                return parsed;
            } catch (parseError) {
                console.warn('JSON parse error:', parseError.message, 'Raw value:', jsonString.substring(0, 100));
                return defaultValue;
            }
        }

        return defaultValue;
    },

    ensureJsonString: (value, defaultValue = '{}') => {
        if (typeof value === 'string') {
            try {
                JSON.parse(value);
                return value;
            } catch (e) {
                if (value.includes('[object Object]')) {
                    return defaultValue;
                }
                try {
                    return JSON.stringify(value);
                } catch (e2) {
                    return defaultValue;
                }
            }
        }

        return JsonUtils.safeStringify(value, defaultValue);
    }
};

// Middleware
app.use(cors());
app.use(express.json());

// MySQL connection configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'asana_local_cache',
    charset: 'utf8mb4'
};

// Main server configuration
const MAIN_SERVER_URL = process.env.MAIN_SERVER_URL || 'http://localhost:3001/api';

// Create connection pool
const pool = mysql.createPool({
    ...dbConfig,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// =============================================================================
// DATABASE SCHEMA CREATION
// =============================================================================

async function createAllTables() {
    try {
        console.log('📋 Creating database tables...');

        // Settings table
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS settings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                setting_key VARCHAR(255) UNIQUE NOT NULL,
                setting_value TEXT,
                description TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // Workspaces table
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS workspaces (
                gid VARCHAR(255) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                is_organization BOOLEAN DEFAULT FALSE,
                sync_status VARCHAR(50) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // Projects table
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS projects (
                gid VARCHAR(255) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                workspace_gid VARCHAR(255),
                notes TEXT,
                color VARCHAR(50),
                \`public\` BOOLEAN DEFAULT FALSE,
                archived BOOLEAN DEFAULT FALSE,
                team_gid VARCHAR(255),
                sync_status VARCHAR(50) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_workspace (workspace_gid)
            )
        `);

        // Tasks table
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS tasks (
                gid VARCHAR(255) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                notes TEXT,
                completed BOOLEAN DEFAULT FALSE,
                assignee_gid VARCHAR(255),
                due_date DATE,
                priority VARCHAR(50) DEFAULT 'Medium',
                progress VARCHAR(100) DEFAULT 'Not Started',
                custom_fields JSON,
                asana_data JSON,
                sync_status VARCHAR(50) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_assignee (assignee_gid),
                INDEX idx_completed (completed)
            )
        `);

        // Users table
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS users (
                gid VARCHAR(255) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255),
                photo JSON,
                sync_status VARCHAR(50) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // Task-Projects relationship table
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS task_projects (
                id INT AUTO_INCREMENT PRIMARY KEY,
                task_gid VARCHAR(255) NOT NULL,
                project_gid VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_task_project (task_gid, project_gid),
                INDEX idx_task (task_gid),
                INDEX idx_project (project_gid)
            )
        `);

        // Sync queue table
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS sync_queue (
                id INT AUTO_INCREMENT PRIMARY KEY,
                operation_type VARCHAR(50) NOT NULL,
                resource_type VARCHAR(50) NOT NULL,
                resource_id VARCHAR(255) NOT NULL,
                payload JSON,
                priority VARCHAR(20) DEFAULT 'medium',
                status VARCHAR(50) DEFAULT 'pending',
                retry_count INT DEFAULT 0,
                error_message TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                processed_at TIMESTAMP NULL,
                INDEX idx_status (status),
                INDEX idx_resource (resource_type, resource_id)
            )
        `);

        // Custom fields tables
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS project_custom_fields (
                id INT AUTO_INCREMENT PRIMARY KEY,
                gid VARCHAR(255) NOT NULL,
                name VARCHAR(255) NOT NULL,
                type VARCHAR(50) DEFAULT 'enum',
                enum_options JSON,
                project_gid VARCHAR(255) DEFAULT 'global',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_field_project (gid, project_gid),
                INDEX idx_project_gid (project_gid),
                INDEX idx_field_name (name)
            )
        `);

        await pool.execute(`
            CREATE TABLE IF NOT EXISTS custom_field_values (
                id INT AUTO_INCREMENT PRIMARY KEY,
                task_gid VARCHAR(255) NOT NULL,
                field_gid VARCHAR(255) NOT NULL,
                field_name VARCHAR(255) NOT NULL,
                field_value VARCHAR(500),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_task_field (task_gid, field_gid),
                INDEX idx_task_gid (task_gid),
                INDEX idx_field_name (field_name)
            )
        `);

        console.log('✅ All database tables ready');

    } catch (error) {
        console.error('❌ Error creating tables:', error.message);
        throw error;
    }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

// Health check
app.get('/health', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        await connection.ping();
        connection.release();
        res.json({
            status: 'healthy',
            database: 'connected',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Utility function to check if main server is online
async function isMainServerOnline() {
    try {
        const response = await axios.get(`${MAIN_SERVER_URL}/health`, { timeout: 5000 });
        return response.status === 200;
    } catch (error) {
        console.log('📴 Main server offline:', error.message);
        return false;
    }
}

// =============================================================================
// SETTINGS MANAGEMENT
// =============================================================================

// Replace the getSyncSettings function in your local-server.js with this fixed version:

async function getSyncSettings() {
    try {
        const [settings] = await pool.execute(`
            SELECT setting_key, setting_value 
            FROM settings 
            WHERE setting_key IN (
                'auto_sync_enabled',
                'auto_sync_delay_create', 
                'auto_sync_delay_update',
                'auto_sync_batch_size',
                'auto_sync_retry_enabled'
            )
        `);

        const defaults = {
            auto_sync_enabled: 'true',
            auto_sync_delay_create: '3000',
            auto_sync_delay_update: '1000',
            auto_sync_batch_size: '10',
            auto_sync_retry_enabled: 'true'
        };

        const config = { ...defaults };
        settings.forEach(setting => {
            config[setting.setting_key] = setting.setting_value;
        });

        // FIX: Proper boolean conversion - check for string 'true' OR boolean true
        return {
            enabled: config.auto_sync_enabled === 'true' || config.auto_sync_enabled === true,
            delayCreate: parseInt(config.auto_sync_delay_create) || 3000,
            delayUpdate: parseInt(config.auto_sync_delay_update) || 1000,
            batchSize: parseInt(config.auto_sync_batch_size) || 10,
            retryEnabled: config.auto_sync_retry_enabled === 'true' || config.auto_sync_retry_enabled === true
        };

    } catch (error) {
        console.error('❌ Error reading sync settings:', error.message);
        return {
            enabled: true,
            delayCreate: 3000,
            delayUpdate: 1000,
            batchSize: 10,
            retryEnabled: true
        };
    }
}

async function initializeSyncSettings() {
    try {
        console.log('🔧 Initializing sync settings...');

        const defaultSettings = [
            ['auto_sync_enabled', 'true', 'Enable automatic sync after create/update operations'],
            ['auto_sync_delay_create', '3000', 'Delay in milliseconds before syncing after creation'],
            ['auto_sync_delay_update', '1000', 'Delay in milliseconds before syncing after updates'],
            ['auto_sync_batch_size', '10', 'Maximum number of items to process in one sync batch'],
            ['auto_sync_retry_enabled', 'true', 'Enable automatic retry of failed sync operations']
        ];

        for (const [key, value, description] of defaultSettings) {
            await pool.execute(`
                INSERT IGNORE INTO settings (setting_key, setting_value, description, updated_at)
                VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            `, [key, value, description]);
        }

        console.log('✅ Sync settings initialized');

    } catch (error) {
        console.error('❌ Error initializing sync settings:', error.message);
    }
}

async function triggerAutoSync(operation = 'create') {
    try {
        const settings = await getSyncSettings();

        if (!settings.enabled) {
            console.log('⏸️ Auto-sync disabled in settings, skipping...');
            return;
        }

        const delay = operation === 'create' ? settings.delayCreate : settings.delayUpdate;
        console.log(`⏰ Auto-sync triggered for ${operation}, processing in ${delay}ms...`);

        setTimeout(async () => {
            try {
                const isOnline = await isMainServerOnline();
                if (!isOnline) {
                    console.log('📴 Main server offline, skipping auto-sync');
                    return;
                }

                const [pendingItems] = await pool.execute(`
                    SELECT COUNT(*) as count 
                    FROM sync_queue 
                    WHERE status = 'pending' AND retry_count < 3
                `);

                const pendingCount = pendingItems[0].count;
                if (pendingCount > 0) {
                    console.log(`🔄 Auto-sync: ${pendingCount} pending items found`);
                    // Here you would call your sync processing endpoint
                    // For now, just log
                    console.log('📋 Auto-sync queue processing would happen here');
                } else {
                    console.log('📭 Auto-sync: No pending items to process');
                }

            } catch (autoSyncError) {
                console.error('❌ Auto-sync failed:', autoSyncError.message);
            }
        }, delay);

    } catch (error) {
        console.error('❌ Auto-sync trigger failed:', error);
    }
}

// =============================================================================
// API ENDPOINTS
// =============================================================================

// Get sync settings
app.get('/api/settings/sync', async (req, res) => {
    try {
        const settings = await getSyncSettings();

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
        console.error('❌ Error fetching sync settings:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update sync settings
app.put('/api/settings/sync', async (req, res) => {
    try {
        const { enabled, delayCreate, delayUpdate, batchSize, retryEnabled } = req.body;

        const updates = [
            ['auto_sync_enabled', enabled?.toString()],
            ['auto_sync_delay_create', delayCreate?.toString()],
            ['auto_sync_delay_update', delayUpdate?.toString()],
            ['auto_sync_batch_size', batchSize?.toString()],
            ['auto_sync_retry_enabled', retryEnabled?.toString()]
        ].filter(([key, value]) => value !== undefined);

        for (const [key, value] of updates) {
            await pool.execute(`
                INSERT INTO settings (setting_key, setting_value, updated_at)
                VALUES (?, ?, CURRENT_TIMESTAMP)
                ON DUPLICATE KEY UPDATE 
                setting_value = VALUES(setting_value),
                updated_at = VALUES(updated_at)
            `, [key, value]);
        }

        console.log(`✅ Updated ${updates.length} sync settings`);

        const newSettings = await getSyncSettings();
        res.json({
            data: {
                message: 'Sync settings updated successfully',
                settings: newSettings,
                updated_count: updates.length
            }
        });

    } catch (error) {
        console.error('❌ Error updating sync settings:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get workspaces
app.get('/api/workspaces', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM workspaces ORDER BY name');
        res.json({ data: rows });
    } catch (error) {
        console.error('❌ Error fetching workspaces:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get projects for workspace
app.get('/api/workspaces/:workspaceId/projects', async (req, res) => {
    try {
        const { workspaceId } = req.params;

        const [rows] = await pool.execute(
            'SELECT * FROM projects WHERE workspace_gid = ? ORDER BY created_at DESC',
            [workspaceId]
        );

        res.json({ data: rows });
    } catch (error) {
        console.error('❌ Error fetching workspace projects:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get tasks for project
app.get('/api/projects/:projectId/tasks', async (req, res) => {
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
        console.error('❌ Error fetching tasks:', error);
        res.status(500).json({ error: error.message });
    }
});

// Create project
app.post('/api/projects', async (req, res) => {
    try {
        const { gid, name, workspace, notes, color, public: isPublic, archived, team } = req.body;

        if (!name || !workspace) {
            return res.status(400).json({
                error: 'Project name and workspace are required'
            });
        }

        const projectGid = gid || `local_${Date.now()}`;

        await pool.execute(`
            INSERT INTO projects (gid, name, workspace_gid, notes, color, \`public\`, archived, team_gid, sync_status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
        `, [
            projectGid,
            name,
            workspace,
            notes || null,
            color || null,
            isPublic || false,
            archived || false,
            team || null
        ]);

        // Add to sync queue
        const queuePayload = JsonUtils.ensureJsonString({
            name,
            workspace,
            notes,
            color,
            public: isPublic,
            archived,
            team
        }, '{}');

        await pool.execute(`
            INSERT IGNORE INTO sync_queue (operation_type, resource_type, resource_id, payload, priority)
            VALUES ('CREATE', 'project', ?, ?, 'high')
        `, [projectGid, queuePayload]);

        console.log('✅ Project created locally and queued for sync');
        triggerAutoSync('create');

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
        console.error('❌ Project creation failed:', error);
        res.status(500).json({
            error: 'Project creation failed',
            message: error.message
        });
    }
});

// Create task
app.post('/api/tasks', async (req, res) => {
    try {
        const { gid, name, notes, assignee, due_on, projects, priority, progress, custom_fields } = req.body;

        if (!name || !projects) {
            return res.status(400).json({
                error: 'Task name and projects are required'
            });
        }

        const taskGid = gid || `local_${Date.now()}`;
        const projectsArray = Array.isArray(projects) ? projects : [projects];

        const taskPriority = priority || 'Medium';
        const taskProgress = progress || 'Not Started';
        const customFieldsJson = JsonUtils.ensureJsonString(custom_fields || [], '[]');

        await pool.execute(`
            INSERT INTO tasks (gid, name, notes, completed, assignee_gid, due_date, priority, progress, custom_fields, sync_status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
        `, [
            taskGid,
            name,
            notes || null,
            false,
            assignee || null,
            due_on || null,
            taskPriority,
            taskProgress,
            customFieldsJson
        ]);

        // Add task to project relationships
        for (const projectId of projectsArray) {
            await pool.execute(
                'INSERT IGNORE INTO task_projects (task_gid, project_gid) VALUES (?, ?)',
                [taskGid, projectId]
            );
        }

        // Add to sync queue
        const queuePayload = JsonUtils.ensureJsonString({
            name,
            notes,
            assignee,
            due_on,
            projects: projectsArray,
            custom_fields: {
                priority: taskPriority,
                progress: taskProgress
            }
        }, '{}');

        await pool.execute(`
            INSERT IGNORE INTO sync_queue (operation_type, resource_type, resource_id, payload, priority)
            VALUES ('CREATE', 'task', ?, ?, 'high')
        `, [taskGid, queuePayload]);

        console.log('✅ Task created locally and queued for sync');
        triggerAutoSync('create');

        res.json({
            data: {
                gid: taskGid,
                name,
                notes,
                completed: false,
                assignee_gid: assignee,
                due_date: due_on,
                priority: taskPriority,
                progress: taskProgress,
                projects: projectsArray.map(p => ({ gid: p })),
                custom_fields: custom_fields || [],
                sync_status: 'pending',
                created_at: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('❌ Task creation failed:', error);
        res.status(500).json({
            error: 'Task creation failed',
            message: error.message
        });
    }
});

// Get sync queue
app.get('/api/sync/queue', async (req, res) => {
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
        console.error('❌ Error fetching sync queue:', error);
        res.status(500).json({ error: error.message });
    }
});

// Test endpoint
app.get('/api/test', async (req, res) => {
    try {
        // Test database tables
        const [workspaces] = await pool.execute('SELECT COUNT(*) as count FROM workspaces');
        const [projects] = await pool.execute('SELECT COUNT(*) as count FROM projects');
        const [tasks] = await pool.execute('SELECT COUNT(*) as count FROM tasks');
        const [queue] = await pool.execute('SELECT COUNT(*) as count FROM sync_queue');

        res.json({
            message: 'Full server functionality test',
            timestamp: new Date().toISOString(),
            database: 'connected',
            tables: {
                workspaces: workspaces[0].count,
                projects: projects[0].count,
                tasks: tasks[0].count,
                sync_queue: queue[0].count
            },
            endpoints_available: [
                'GET /health',
                'GET /api/test',
                'GET /api/settings/sync',
                'PUT /api/settings/sync',
                'GET /api/workspaces',
                'GET /api/workspaces/:id/projects',
                'GET /api/projects/:id/tasks',
                'POST /api/projects',
                'POST /api/tasks',
                'GET /api/sync/queue'
            ]
        });
    } catch (error) {
        res.status(500).json({
            error: 'Test failed',
            message: error.message
        });
    }
});

// =============================================================================
// SERVER STARTUP
// =============================================================================

async function startServer() {
    try {
        // Test database connection
        console.log('🔍 Testing database connection...');
        const connection = await pool.getConnection();
        await connection.execute('SELECT 1 as test');
        connection.release();
        console.log('✅ Database connection successful');

        // Create all tables
        await createAllTables();

        // Initialize settings
        await initializeSyncSettings();

        // Start the server
        const server = app.listen(PORT, () => {
            console.log(`🚀 Local MySQL Server running on port ${PORT}`);
            console.log(`🗄️ Database: ${dbConfig.database}`);
            console.log(`🔄 Settings-based auto-sync: Enabled`);
            console.log(`📥 All endpoints available!`);

            console.log('\n🌐 Available Endpoints:');
            console.log(`  GET  ${PORT}/health - Health check`);
            console.log(`  GET  ${PORT}/api/test - Full functionality test`);
            console.log(`  GET  ${PORT}/api/settings/sync - View sync settings`);
            console.log(`  PUT  ${PORT}/api/settings/sync - Update sync settings`);
            console.log(`  GET  ${PORT}/api/workspaces - List workspaces`);
            console.log(`  GET  ${PORT}/api/workspaces/:id/projects - List projects`);
            console.log(`  GET  ${PORT}/api/projects/:id/tasks - List tasks`);
            console.log(`  POST ${PORT}/api/projects - Create project`);
            console.log(`  POST ${PORT}/api/tasks - Create task`);
            console.log(`  GET  ${PORT}/api/sync/queue - View sync queue`);

            console.log('\n✅ FULL SERVER READY - All features enabled!');
        });

        server.on('error', (error) => {
            console.error('❌ Server error:', error);
            process.exit(1);
        });

        return server;

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Error handling
process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Add this sync processing endpoint to your local-server.js
// Add it before the "SERVER STARTUP" section

// =============================================================================
// SYNC PROCESSING ENDPOINT
// =============================================================================
// REAL ASANA SYNC PROCESSING - Replace the sync processing in your local-server.js

// =============================================================================
// REAL ASANA SYNC PROCESSING WITH GID REPLACEMENT
// =============================================================================

// Replace the processSyncItemEnhanced function with this fixed version:

async function processSyncItemEnhanced(item) {
    const { operation_type, resource_type, resource_id, payload } = item;

    console.log(`🔄 Processing ${operation_type} for ${resource_type} ${resource_id}`);

    // CRITICAL CHECK: Never process local IDs for UPDATE operations
    if (resource_id.startsWith('local_') && (operation_type === 'UPDATE' || operation_type === 'UPDATE_FIELD')) {
        console.log(`⚠️ BLOCKING: Cannot ${operation_type} local ID ${resource_id} - mark as failed`);
        return { error: 'Local ID cannot be updated', skipped: true };
    }

    // Use JsonUtils for bulletproof payload parsing
    const parsedPayload = JsonUtils.safeParse(payload, {});
    console.log('📝 Original parsed payload:', parsedPayload);

    try {
        switch (operation_type) {
            case 'CREATE':
                if (resource_type === 'project') {
                    console.log('🏗️ Creating project on main Asana server...');

                    // Format payload for main server (match what your main server expects)
                    const projectPayload = {
                        name: parsedPayload.name,
                        workspace: parsedPayload.workspace,
                        notes: parsedPayload.notes || '',
                        color: parsedPayload.color || null,
                        public: parsedPayload.public || false,
                        archived: parsedPayload.archived || false
                    };

                    console.log('📤 Sending to main server:', projectPayload);

                    // Create project on main server
                    const projectResponse = await axios.post(`${MAIN_SERVER_URL}/projects`, projectPayload, {
                        timeout: 30000, // 30 second timeout
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });

                    console.log('📥 Main server response status:', projectResponse.status);
                    const serverProject = projectResponse.data.data || projectResponse.data;

                    if (!serverProject || !serverProject.gid) {
                        console.error('❌ Main server response:', projectResponse.data);
                        throw new Error('Main server did not return valid project data');
                    }

                    console.log(`✅ Project created on Asana with GID: ${serverProject.gid}`);

                    // Update local project with real Asana GID - WITH TRANSACTION
                    const connection = await pool.getConnection();
                    await connection.beginTransaction();

                    try {
                        // Update the project table
                        const [updateResult] = await connection.execute(
                            'UPDATE projects SET gid = ?, sync_status = ?, updated_at = CURRENT_TIMESTAMP WHERE gid = ?',
                            [serverProject.gid, 'synced', resource_id]
                        );

                        if (updateResult.affectedRows === 0) {
                            throw new Error(`Project with local ID ${resource_id} not found for update`);
                        }

                        // Update task_projects table if needed
                        await connection.execute(
                            'UPDATE task_projects SET project_gid = ? WHERE project_gid = ?',
                            [serverProject.gid, resource_id]
                        );

                        // Update any sync_queue items that reference this project
                        await connection.execute(
                            'UPDATE sync_queue SET resource_id = ? WHERE resource_id = ? AND resource_type = ?',
                            [serverProject.gid, resource_id, 'project']
                        );

                        await connection.commit();
                        console.log(`✅ Local project updated: ${resource_id} → ${serverProject.gid}`);

                    } catch (dbError) {
                        await connection.rollback();
                        throw new Error(`Database update failed: ${dbError.message}`);
                    } finally {
                        connection.release();
                    }

                    return { success: true, oldGid: resource_id, newGid: serverProject.gid };
                }
                else if (resource_type === 'task') {
                    console.log('📝 Creating task on main Asana server...');

                    // Format payload for main server
                    const taskPayload = {
                        name: parsedPayload.name,
                        notes: parsedPayload.notes || '',
                        projects: parsedPayload.projects || [],
                        assignee: parsedPayload.assignee || null,
                        due_on: parsedPayload.due_on || null,
                        completed: parsedPayload.completed || false
                    };

                    // Add custom fields if present
                    if (parsedPayload.custom_fields) {
                        taskPayload.custom_fields = parsedPayload.custom_fields;
                    }

                    console.log('📤 Sending task to main server:', taskPayload);

                    // Create task on main server
                    const taskResponse = await axios.post(`${MAIN_SERVER_URL}/tasks`, taskPayload, {
                        timeout: 30000,
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });

                    console.log('📥 Main server response status:', taskResponse.status);
                    const serverTask = taskResponse.data.data || taskResponse.data;

                    if (!serverTask || !serverTask.gid) {
                        console.error('❌ Main server response:', taskResponse.data);
                        throw new Error('Main server did not return valid task data');
                    }

                    console.log(`✅ Task created on Asana with GID: ${serverTask.gid}`);

                    // Update local task with real Asana GID - WITH TRANSACTION
                    const connection = await pool.getConnection();
                    await connection.beginTransaction();

                    try {
                        // Update the task table
                        const [updateResult] = await connection.execute(
                            'UPDATE tasks SET gid = ?, sync_status = ?, updated_at = CURRENT_TIMESTAMP WHERE gid = ?',
                            [serverTask.gid, 'synced', resource_id]
                        );

                        if (updateResult.affectedRows === 0) {
                            throw new Error(`Task with local ID ${resource_id} not found for update`);
                        }

                        // Update task_projects table with new GID
                        await connection.execute(
                            'UPDATE task_projects SET task_gid = ? WHERE task_gid = ?',
                            [serverTask.gid, resource_id]
                        );

                        // Update custom_field_values table with new GID
                        await connection.execute(
                            'UPDATE custom_field_values SET task_gid = ? WHERE task_gid = ?',
                            [serverTask.gid, resource_id]
                        );

                        // Update any sync_queue items that reference this task
                        await connection.execute(
                            'UPDATE sync_queue SET resource_id = ? WHERE resource_id = ? AND resource_type = ?',
                            [serverTask.gid, resource_id, 'task']
                        );

                        await connection.commit();
                        console.log(`✅ Local task updated: ${resource_id} → ${serverTask.gid}`);

                    } catch (dbError) {
                        await connection.rollback();
                        throw new Error(`Database update failed: ${dbError.message}`);
                    } finally {
                        connection.release();
                    }

                    return { success: true, oldGid: resource_id, newGid: serverTask.gid };
                }
                break;

            case 'UPDATE_FIELD':
            case 'UPDATE':
                // Double-check: This should never happen for local IDs now
                if (resource_id.startsWith('local_')) {
                    console.error(`🚨 CRITICAL: Local ID ${resource_id} should not reach UPDATE - this is a bug!`);
                    throw new Error('Local ID reached UPDATE operation - this should never happen');
                }

                console.log('📝 Updating resource on main server with data:', parsedPayload);

                const updateResponse = await axios.put(`${MAIN_SERVER_URL}/${resource_type}s/${resource_id}`, parsedPayload, {
                    timeout: 30000,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                // Update local sync status
                await pool.execute(
                    `UPDATE ${resource_type}s SET sync_status = ?, updated_at = CURRENT_TIMESTAMP WHERE gid = ?`,
                    ['synced', resource_id]
                );

                console.log('✅ Resource updated successfully on main server');
                return { success: true, updated: true };

            case 'DELETE':
                if (resource_id.startsWith('local_')) {
                    console.log(`⚠️ Skipping DELETE for local ID ${resource_id} - was never created on Asana`);
                    return { success: true, skipped: true };
                }

                console.log('📝 Deleting resource from main server:', resource_id);
                await axios.delete(`${MAIN_SERVER_URL}/${resource_type}s/${resource_id}`, {
                    timeout: 30000
                });
                console.log('✅ Resource deleted successfully from main server');
                return { success: true, deleted: true };

            default:
                console.warn('📝 Unknown operation type:', operation_type);
                throw new Error(`Unknown operation type: ${operation_type}`);
        }
    } catch (error) {
        console.error(`❌ Main server sync operation failed for ${operation_type} ${resource_type} ${resource_id}:`);
        console.error('Error message:', error.message);

        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }

        if (error.code === 'ECONNRESET' || error.message.includes('socket hang up')) {
            console.error('🔌 Connection issue - server may be overloaded or timeout occurred');
        }

        throw error;
    }
}
// =============================================================================
// UPDATED SYNC PROCESSING ENDPOINT - WITH REAL ASANA SYNC
// =============================================================================

// ENHANCED SYNC PROCESSING - Replace your sync processing with this:

app.post('/api/sync/process', async (req, res) => {
    try {
        const isOnline = await isMainServerOnline();
        if (!isOnline) {
            return res.status(503).json({ error: 'Asana server unavailable - cannot sync' });
        }

        const settings = await getSyncSettings();
        const batchSize = parseInt(req.query.batch_size) || settings.batchSize;

        console.log(`🔍 Getting pending sync items for Asana sync (batch size: ${batchSize})...`);

        // ENHANCED ORDER: Prioritize projects first, then tasks, with dependencies
        const [queueItems] = await pool.execute(`
            SELECT * FROM sync_queue 
            WHERE status = 'pending' AND retry_count < 3
            ORDER BY 
                CASE operation_type 
                    WHEN 'CREATE' THEN 1 
                    WHEN 'UPDATE' THEN 2 
                    WHEN 'DELETE' THEN 3 
                    ELSE 4 
                END,
                CASE resource_type 
                    WHEN 'project' THEN 1 
                    WHEN 'task' THEN 2 
                    ELSE 3 
                END,
                priority DESC, 
                created_at ASC
            LIMIT ${batchSize}
        `);

        let processed = 0;
        let failed = 0;
        let skipped = 0;
        let deferred = 0;
        const results = [];

        console.log(`🔄 Found ${queueItems.length} items to sync with Asana...`);

        if (queueItems.length === 0) {
            return res.json({
                message: 'No items to sync with Asana',
                processed: 0,
                failed: 0,
                skipped: 0,
                total: 0
            });
        }

        for (const item of queueItems) {
            const itemResult = {
                id: item.id,
                resource_id: item.resource_id,
                operation_type: item.operation_type,
                resource_type: item.resource_type
            };

            try {
                console.log(`📝 Processing: ${item.operation_type} ${item.resource_type} ${item.resource_id}`);

                // SPECIAL CHECK: For tasks, ensure all referenced projects have real Asana GIDs
                if (item.resource_type === 'task' && item.operation_type === 'CREATE') {
                    const payload = JsonUtils.safeParse(item.payload, {});
                    const projectIds = payload.projects || [];

                    console.log(`🔍 Checking if task's projects have real GIDs:`, projectIds);

                    // Check if any project IDs are still local
                    let hasLocalProjects = false;
                    const realProjectIds = [];

                    for (const projectId of projectIds) {
                        if (projectId.startsWith('local_')) {
                            // Check if this local project has been synced yet
                            const [syncedProjects] = await pool.execute(
                                'SELECT gid FROM projects WHERE gid = ? OR (gid != ? AND gid NOT LIKE "local_%")',
                                [projectId, projectId]
                            );

                            // Find the real GID for this local project
                            const [realProject] = await pool.execute(
                                'SELECT gid FROM projects WHERE name = (SELECT name FROM projects WHERE gid = ?) AND gid NOT LIKE "local_%"',
                                [projectId]
                            );

                            if (realProject.length > 0) {
                                realProjectIds.push(realProject[0].gid);
                                console.log(`✅ Found real GID for project: ${projectId} → ${realProject[0].gid}`);
                            } else {
                                hasLocalProjects = true;
                                console.log(`⚠️ Project ${projectId} not yet synced to Asana`);
                                break;
                            }
                        } else {
                            realProjectIds.push(projectId);
                        }
                    }

                    if (hasLocalProjects) {
                        console.log(`📋 Deferring task ${item.resource_id} - waiting for projects to sync first`);

                        // Mark as deferred (will be retried in next batch)
                        await pool.execute(
                            'UPDATE sync_queue SET retry_count = retry_count + 1, error_message = ?, processed_at = CURRENT_TIMESTAMP WHERE id = ?',
                            ['Deferred - waiting for project dependencies to sync', item.id]
                        );

                        deferred++;
                        itemResult.status = 'deferred';
                        itemResult.reason = 'Waiting for project dependencies';
                        results.push(itemResult);
                        continue;
                    } else if (realProjectIds.length > 0) {
                        // Update the payload with real project IDs
                        payload.projects = realProjectIds;
                        console.log(`🔄 Updated task payload with real project IDs:`, realProjectIds);

                        // Update the queue item with corrected payload
                        await pool.execute(
                            'UPDATE sync_queue SET payload = ? WHERE id = ?',
                            [JsonUtils.ensureJsonString(payload), item.id]
                        );

                        // Update item payload for processing
                        item.payload = JsonUtils.ensureJsonString(payload);
                    }
                }

                // Mark as processing
                await pool.execute(
                    'UPDATE sync_queue SET status = ?, processed_at = CURRENT_TIMESTAMP WHERE id = ?',
                    ['processing', item.id]
                );

                // Process the sync item with REAL Asana API calls
                const result = await processSyncItemEnhanced(item);

                if (result.skipped) {
                    await pool.execute(
                        'UPDATE sync_queue SET status = ?, error_message = ?, processed_at = CURRENT_TIMESTAMP WHERE id = ?',
                        ['completed', 'Skipped - local ID operation', item.id]
                    );
                    skipped++;
                    itemResult.status = 'skipped';
                    itemResult.reason = result.error || 'Local ID operation skipped';
                } else {
                    await pool.execute(
                        'UPDATE sync_queue SET status = ?, processed_at = CURRENT_TIMESTAMP WHERE id = ?',
                        ['completed', item.id]
                    );
                    processed++;
                    itemResult.status = 'completed';
                    if (result.newGid) {
                        itemResult.old_gid = result.oldGid;
                        itemResult.new_gid = result.newGid;
                        console.log(`🔄 GID Updated: ${result.oldGid} → ${result.newGid}`);
                    }
                }

            } catch (error) {
                failed++;
                console.error(`❌ Failed to sync item ${item.id} with Asana:`, error.message);

                try {
                    const errorMessage = error.message.substring(0, 500);
                    await pool.execute(
                        'UPDATE sync_queue SET status = ?, retry_count = retry_count + 1, error_message = ?, processed_at = CURRENT_TIMESTAMP WHERE id = ?',
                        ['failed', errorMessage, item.id]
                    );
                } catch (updateError) {
                    console.error(`❌ Failed to update sync queue item ${item.id}:`, updateError.message);
                }

                itemResult.status = 'failed';
                itemResult.error = error.message;
            }

            results.push(itemResult);
        }

        console.log(`🎉 Asana sync batch completed: ${processed} processed, ${failed} failed, ${skipped} skipped, ${deferred} deferred`);

        res.json({
            message: 'Asana sync processing completed',
            processed,
            failed,
            skipped,
            deferred,
            total: queueItems.length,
            batch_size: batchSize,
            results
        });

    } catch (error) {
        console.error('❌ Error processing Asana sync queue:', error);
        res.status(500).json({
            error: error.message,
            details: 'Check server logs for more information'
        });
    }
});

// ENHANCED AUTO-SYNC - Replace triggerAutoSync with this version:

async function triggerAutoSync(operation = 'create') {
    try {
        const settings = await getSyncSettings();

        if (!settings.enabled) {
            console.log('⏸️ Auto-sync disabled in settings, skipping...');
            return;
        }

        const delay = operation === 'create' ? settings.delayCreate : settings.delayUpdate;
        console.log(`⏰ Auto-sync triggered for ${operation}, processing in ${delay}ms...`);

        setTimeout(async () => {
            try {
                // Check for pending items first
                const [pendingItems] = await pool.execute(`
                    SELECT COUNT(*) as count 
                    FROM sync_queue 
                    WHERE status = 'pending' AND retry_count < 3
                `);

                const pendingCount = pendingItems[0].count;

                if (pendingCount > 0) {
                    console.log(`🔄 Auto-sync: Processing ${pendingCount} pending items...`);

                    // Run sync processing multiple times to handle dependencies
                    let totalProcessed = 0;
                    let attempts = 0;
                    const maxAttempts = 3;

                    while (attempts < maxAttempts) {
                        attempts++;
                        console.log(`🔄 Auto-sync attempt ${attempts}/${maxAttempts}...`);

                        try {
                            const response = await axios.post(`http://localhost:${PORT}/api/sync/process?batch_size=${settings.batchSize}`);

                            const { processed, failed, skipped, deferred } = response.data;
                            totalProcessed += processed;

                            console.log(`📊 Attempt ${attempts}: ${processed} processed, ${failed} failed, ${skipped} skipped, ${deferred} deferred`);

                            // If nothing was processed and nothing deferred, we're done
                            if (processed === 0 && deferred === 0) {
                                break;
                            }

                            // If items were deferred, wait a bit and try again
                            if (deferred > 0 && attempts < maxAttempts) {
                                console.log(`⏳ Waiting 2 seconds before retry (${deferred} items deferred)...`);
                                await new Promise(resolve => setTimeout(resolve, 2000));
                            }

                        } catch (syncError) {
                            console.error(`❌ Auto-sync attempt ${attempts} failed:`, syncError.message);
                            break;
                        }
                    }

                    if (totalProcessed > 0) {
                        console.log(`✅ Auto-sync completed: ${totalProcessed} total items processed`);

                        // Log successful sync to settings table
                        await pool.execute(`
                            INSERT INTO settings (setting_key, setting_value, description, updated_at)
                            VALUES ('last_auto_sync_success', ?, 'Last successful auto-sync timestamp', CURRENT_TIMESTAMP)
                            ON DUPLICATE KEY UPDATE 
                            setting_value = VALUES(setting_value),
                            updated_at = VALUES(updated_at)
                        `, [new Date().toISOString()]);
                    }
                } else {
                    console.log('📭 Auto-sync: No pending items to process');
                }

            } catch (autoSyncError) {
                console.error('❌ Auto-sync failed:', autoSyncError.message);
            }
        }, delay);

    } catch (error) {
        console.error('❌ Auto-sync trigger failed:', error);
    }
}
// UPDATED AUTO-SYNC TRIGGER (Replace the existing triggerAutoSync function)
// =============================================================================

async function triggerAutoSync(operation = 'create') {
    try {
        const settings = await getSyncSettings();

        if (!settings.enabled) {
            console.log('⏸️ Auto-sync disabled in settings, skipping...');
            return;
        }

        const delay = operation === 'create' ? settings.delayCreate : settings.delayUpdate;
        console.log(`⏰ Auto-sync triggered for ${operation}, processing in ${delay}ms...`);

        setTimeout(async () => {
            try {
                const isOnline = await isMainServerOnline();
                if (!isOnline) {
                    console.log('📴 Main server offline, skipping auto-sync (simulating offline mode)');
                    return;
                }

                const [pendingItems] = await pool.execute(`
                    SELECT COUNT(*) as count 
                    FROM sync_queue 
                    WHERE status = 'pending' AND retry_count < 3
                `);

                const pendingCount = pendingItems[0].count;
                if (pendingCount > 0) {
                    console.log(`🔄 Auto-sync: Processing ${pendingCount} pending items...`);

                    // Actually call the sync processing endpoint
                    try {
                        const response = await axios.post(`http://localhost:${PORT}/api/sync/process?batch_size=${settings.batchSize}`);

                        if (response.data.processed > 0) {
                            console.log(`✅ Auto-sync completed: ${response.data.processed} processed, ${response.data.failed} failed`);
                        }

                        if (response.data.failed > 0) {
                            console.log(`⚠️ Auto-sync had ${response.data.failed} failures`);
                        }

                    } catch (syncError) {
                        console.error('❌ Auto-sync processing failed:', syncError.message);
                    }
                } else {
                    console.log('📭 Auto-sync: No pending items to process');
                }

            } catch (autoSyncError) {
                console.error('❌ Auto-sync failed:', autoSyncError.message);
            }
        }, delay);

    } catch (error) {
        console.error('❌ Auto-sync trigger failed:', error);
    }
}

// Add this debug endpoint to your local-server.js

app.get('/api/debug/connection', async (req, res) => {
    try {
        console.log('🔍 Testing connection to main Asana server...');
        console.log('Main server URL:', MAIN_SERVER_URL);

        // Test 1: Health check
        let healthCheck;
        try {
            const healthResponse = await axios.get(`${MAIN_SERVER_URL}/health`, { timeout: 5000 });
            healthCheck = {
                status: 'success',
                code: healthResponse.status,
                data: healthResponse.data
            };
            console.log('✅ Health check passed');
        } catch (healthError) {
            healthCheck = {
                status: 'failed',
                error: healthError.message,
                code: healthError.response?.status || 'NO_RESPONSE'
            };
            console.log('❌ Health check failed:', healthError.message);
        }

        // Test 2: Try to get workspaces
        let workspacesCheck;
        try {
            const workspacesResponse = await axios.get(`${MAIN_SERVER_URL}/workspaces`, { timeout: 5000 });
            workspacesCheck = {
                status: 'success',
                code: workspacesResponse.status,
                count: workspacesResponse.data?.data?.length || 0
            };
            console.log('✅ Workspaces check passed');
        } catch (workspacesError) {
            workspacesCheck = {
                status: 'failed',
                error: workspacesError.message,
                code: workspacesError.response?.status || 'NO_RESPONSE'
            };
            console.log('❌ Workspaces check failed:', workspacesError.message);
        }

        // Test 3: Check current sync queue status
        const [queueStats] = await pool.execute(`
            SELECT 
                status,
                COUNT(*) as count,
                MAX(created_at) as latest,
                MAX(error_message) as last_error
            FROM sync_queue 
            GROUP BY status
        `);

        res.json({
            main_server_url: MAIN_SERVER_URL,
            tests: {
                health_check: healthCheck,
                workspaces_check: workspacesCheck
            },
            sync_queue_status: queueStats,
            recommendations: healthCheck.status === 'failed' ? [
                'Check if main server is running on port 3001',
                'Verify MAIN_SERVER_URL in .env file',
                'Ensure no firewall blocking localhost connections'
            ] : [
                'Connection looks good!',
                'Try manual sync processing'
            ]
        });

    } catch (error) {
        console.error('❌ Debug connection failed:', error);
        res.status(500).json({
            error: error.message,
            main_server_url: MAIN_SERVER_URL
        });
    }
});

// Also add a manual sync test endpoint
app.post('/api/debug/manual-sync/:itemId', async (req, res) => {
    try {
        const { itemId } = req.params;

        // Get specific sync queue item
        const [items] = await pool.execute('SELECT * FROM sync_queue WHERE id = ?', [itemId]);

        if (items.length === 0) {
            return res.status(404).json({ error: 'Sync item not found' });
        }

        const item = items[0];
        console.log(`🔧 Manual sync test for item ${itemId}:`, item);

        // Try to process this specific item
        try {
            const result = await processSyncItemEnhanced(item);
            console.log('✅ Manual sync result:', result);

            res.json({
                message: 'Manual sync test completed',
                item,
                result,
                success: true
            });

        } catch (syncError) {
            console.error('❌ Manual sync failed:', syncError);
            res.json({
                message: 'Manual sync test failed',
                item,
                error: syncError.message,
                success: false
            });
        }

    } catch (error) {
        console.error('❌ Manual sync test error:', error);
        res.status(500).json({ error: error.message });
    }
});
// Start the server
startServer();

module.exports = app;