// local-server.js - Complete Enhanced Local MySQL-based server with FIXED JSON handling
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const axios = require('axios');
const cron = require('node-cron');
require('dotenv').config();

const app = express();
const PORT = process.env.LOCAL_PORT || 3002;

// =============================================================================
// UTILITY: Safe JSON handling functions (CENTRALIZED)
// =============================================================================
const JsonUtils = {
    // Safe JSON stringify - handles all edge cases
    safeStringify: (obj, defaultValue = '{}') => {
        // Handle null/undefined
        if (obj === null || obj === undefined) {
            return defaultValue;
        }

        // If it's already a valid JSON string, return it
        if (typeof obj === 'string') {
            // Check for problematic strings
            if (obj.includes('[object Object]') || obj === '[object Object]') {
                console.warn('Found [object Object] in string, using default:', defaultValue);
                return defaultValue;
            }

            // Validate it's proper JSON
            try {
                JSON.parse(obj);
                return obj;
            } catch (e) {
                console.warn('Invalid JSON string, using default:', obj.substring(0, 100));
                return defaultValue;
            }
        }

        // For objects and arrays, stringify them
        if (typeof obj === 'object') {
            try {
                // Check for circular references
                JSON.stringify(obj);
                return JSON.stringify(obj);
            } catch (e) {
                console.error('Failed to stringify object:', e.message);
                return defaultValue;
            }
        }

        // For other types, try to stringify
        try {
            return JSON.stringify(obj);
        } catch (e) {
            console.error('Failed to stringify value:', e.message);
            return defaultValue;
        }
    },

    // Safe JSON parse - handles all edge cases
    safeParse: (jsonString, defaultValue = {}) => {
        // Handle null/undefined/empty
        if (!jsonString || jsonString === '' || jsonString === '[]' || jsonString === '{}') {
            return defaultValue;
        }

        // If it's already an object, return it
        if (typeof jsonString === 'object' && jsonString !== null) {
            return jsonString;
        }

        // Handle string cases
        if (typeof jsonString === 'string') {
            // Check for [object Object] pattern
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

    // Ensure value is a JSON string (for database storage)
    ensureJsonString: (value, defaultValue = '{}') => {
        if (typeof value === 'string') {
            // Validate it's proper JSON
            try {
                JSON.parse(value);
                return value;
            } catch (e) {
                // Invalid JSON string, stringify it or use default
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

        // Convert to JSON string
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

console.log('🗄️ MySQL Local Server starting...');

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
// DATABASE SCHEMA FIX ENDPOINT
// =============================================================================

app.post('/api/fix/database-schema', async (req, res) => {
    try {
        console.log('🔧 Fixing database schema for custom fields...');

        await pool.execute('DROP TABLE IF EXISTS project_custom_fields');
        await pool.execute(`
            CREATE TABLE project_custom_fields (
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

        console.log('✅ project_custom_fields table recreated');

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

        console.log('✅ custom_field_values table created');

        res.json({
            message: 'Database schema fixed successfully',
            tables_updated: ['project_custom_fields', 'custom_field_values']
        });

    } catch (error) {
        console.error('❌ Error fixing database schema:', error);
        res.status(500).json({
            error: 'Failed to fix database schema',
            message: error.message
        });
    }
});

// =============================================================================
// DATA SYNC ENDPOINTS
// =============================================================================

app.post('/api/sync/workspaces', async (req, res) => {
    try {
        console.log('🔄 Syncing workspaces from main Asana server...');
        const isOnline = await isMainServerOnline();
        if (!isOnline) {
            return res.status(503).json({ error: 'Main Asana server unavailable' });
        }

        const response = await axios.get(`${MAIN_SERVER_URL}/workspaces`);
        const workspaces = response.data.data || [];
        console.log(`📥 Retrieved ${workspaces.length} workspaces from main server`);

        await pool.execute('DELETE FROM workspaces');
        let insertedCount = 0;
        for (const workspace of workspaces) {
            try {
                await pool.execute(
                    'INSERT INTO workspaces (gid, name, is_organization, sync_status) VALUES (?, ?, ?, ?)',
                    [workspace.gid, workspace.name, workspace.is_organization || false, 'synced']
                );
                insertedCount++;
            } catch (insertError) {
                console.error(`❌ Failed to insert workspace ${workspace.name}:`, insertError.message);
            }
        }

        console.log(`✅ Synced ${insertedCount} workspaces to local database`);
        res.json({
            message: 'Workspaces synced successfully',
            synced: insertedCount,
            total: workspaces.length
        });
    } catch (error) {
        console.error('❌ Error syncing workspaces:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/sync/workspaces/:workspaceId/projects', async (req, res) => {
    try {
        const { workspaceId } = req.params;
        console.log(`🔄 Syncing projects for workspace: ${workspaceId}`);

        const isOnline = await isMainServerOnline();
        if (!isOnline) {
            return res.status(503).json({ error: 'Main Asana server unavailable' });
        }

        const response = await axios.get(`${MAIN_SERVER_URL}/projects?workspace=${workspaceId}&opt_fields=name,notes,public,color,archived,created_at,modified_at,owner,workspace`);
        const projects = response.data.data || [];
        console.log(`📥 Retrieved ${projects.length} projects for workspace ${workspaceId}`);

        await pool.execute('DELETE FROM projects WHERE workspace_gid = ?', [workspaceId]);
        let insertedCount = 0;
        for (const project of projects) {
            try {
                await pool.execute(`
                    INSERT INTO projects (gid, name, workspace_gid, color, notes, archived, \`public\`, sync_status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    project.gid,
                    project.name,
                    project.workspace?.gid || workspaceId,
                    project.color || null,
                    project.notes || null,
                    project.archived || false,
                    project.public || false,
                    'synced'
                ]);
                insertedCount++;
            } catch (insertError) {
                console.error(`❌ Failed to insert project ${project.name}:`, insertError.message);
            }
        }

        console.log(`✅ Synced ${insertedCount} projects to local database`);
        res.json({
            message: 'Projects synced successfully',
            synced: insertedCount,
            total: projects.length,
            workspaceId
        });
    } catch (error) {
        console.error('❌ Error syncing projects:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/sync/projects/:projectId/tasks', async (req, res) => {
    try {
        const { projectId } = req.params;
        console.log(`🔄 Syncing tasks for project: ${projectId}`);

        const isOnline = await isMainServerOnline();
        if (!isOnline) {
            return res.status(503).json({ error: 'Main Asana server unavailable' });
        }

        const response = await axios.get(`${MAIN_SERVER_URL}/tasks?project=${projectId}&opt_fields=name,notes,completed,assignee,due_on,due_at,created_at,modified_at,custom_fields,tags,projects`);
        const tasks = response.data.data || [];
        console.log(`📥 Retrieved ${tasks.length} tasks for project ${projectId}`);

        await pool.execute('DELETE FROM task_projects WHERE project_gid = ?', [projectId]);
        let insertedCount = 0;
        for (const task of tasks) {
            try {
                let priority = 'Medium';
                let progress = 'Not Started';

                if (task.custom_fields && Array.isArray(task.custom_fields)) {
                    for (const field of task.custom_fields) {
                        if (field.name === 'Priority' && field.enum_value) {
                            priority = field.enum_value.name;
                        }
                        if (field.name === 'Task Progress' && field.enum_value) {
                            progress = field.enum_value.name;
                        }
                    }
                }

                // Use JsonUtils for safe JSON storage
                const customFieldsJson = JsonUtils.ensureJsonString(task.custom_fields || [], '[]');
                const asanaDataJson = JsonUtils.ensureJsonString(task, '{}');

                await pool.execute(`
                    INSERT INTO tasks (gid, name, notes, completed, assignee_gid, due_date, priority, progress, custom_fields, asana_data, sync_status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE
                    name = VALUES(name),
                    notes = VALUES(notes),
                    completed = VALUES(completed),
                    assignee_gid = VALUES(assignee_gid),
                    due_date = VALUES(due_date),
                    priority = VALUES(priority),
                    progress = VALUES(progress),
                    custom_fields = VALUES(custom_fields),
                    asana_data = VALUES(asana_data),
                    sync_status = VALUES(sync_status),
                    updated_at = CURRENT_TIMESTAMP
                `, [
                    task.gid,
                    task.name,
                    task.notes || null,
                    task.completed || false,
                    task.assignee?.gid || null,
                    task.due_on || null,
                    priority,
                    progress,
                    customFieldsJson,
                    asanaDataJson,
                    'synced'
                ]);

                await pool.execute(
                    'INSERT IGNORE INTO task_projects (task_gid, project_gid) VALUES (?, ?)',
                    [task.gid, projectId]
                );
                insertedCount++;
            } catch (insertError) {
                console.error(`❌ Failed to insert task ${task.name}:`, insertError.message);
            }
        }

        console.log(`✅ Synced ${insertedCount} tasks to local database`);
        res.json({
            message: 'Tasks synced successfully',
            synced: insertedCount,
            total: tasks.length,
            projectId
        });
    } catch (error) {
        console.error('❌ Error syncing tasks:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/sync/workspaces/:workspaceId/users', async (req, res) => {
    try {
        const { workspaceId } = req.params;
        console.log(`🔄 Syncing users for workspace: ${workspaceId}`);

        const isOnline = await isMainServerOnline();
        if (!isOnline) {
            return res.status(503).json({ error: 'Main Asana server unavailable' });
        }

        const response = await axios.get(`${MAIN_SERVER_URL}/workspaces/${workspaceId}/users?opt_fields=name,email,photo`);
        const users = response.data.data || [];
        console.log(`📥 Retrieved ${users.length} users for workspace ${workspaceId}`);

        let insertedCount = 0;
        for (const user of users) {
            try {
                const photoJson = JsonUtils.ensureJsonString(user.photo || {}, '{}');

                await pool.execute(`
                    INSERT INTO users (gid, name, email, photo, sync_status)
                    VALUES (?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE
                    name = VALUES(name),
                    email = VALUES(email),
                    photo = VALUES(photo),
                    sync_status = VALUES(sync_status),
                    updated_at = CURRENT_TIMESTAMP
                `, [
                    user.gid,
                    user.name,
                    user.email || null,
                    photoJson,
                    'synced'
                ]);
                insertedCount++;
            } catch (insertError) {
                console.error(`❌ Failed to insert user ${user.name}:`, insertError.message);
            }
        }

        console.log(`✅ Synced ${insertedCount} users to local database`);
        res.json({
            message: 'Users synced successfully',
            synced: insertedCount,
            total: users.length,
            workspaceId
        });
    } catch (error) {
        console.error('❌ Error syncing users:', error);
        res.status(500).json({ error: error.message });
    }
});

// =============================================================================
// CUSTOM FIELDS SYNC
// =============================================================================

app.post('/api/sync/custom-fields', async (req, res) => {
    try {
        console.log('🔧 Starting enhanced custom fields sync...');

        const [tasks] = await pool.execute(
            'SELECT gid, custom_fields FROM tasks WHERE custom_fields IS NOT NULL AND custom_fields != "[]"'
        );

        console.log(`📋 Found ${tasks.length} tasks with custom fields`);

        let totalFields = 0;
        let totalValues = 0;
        const fieldDefinitions = new Map();

        await pool.execute('DELETE FROM project_custom_fields');
        await pool.execute('DELETE FROM custom_field_values');

        for (const task of tasks) {
            if (task.custom_fields) {
                const customFields = JsonUtils.safeParse(task.custom_fields, []);

                if (Array.isArray(customFields)) {
                    for (const field of customFields) {
                        if (field && field.gid && field.name) {
                            const fieldKey = `${field.gid}`;

                            if (!fieldDefinitions.has(fieldKey)) {
                                fieldDefinitions.set(fieldKey, {
                                    gid: field.gid,
                                    name: field.name,
                                    type: field.type || 'enum',
                                    enum_options: field.enum_options || null
                                });
                            }

                            let fieldValue = null;
                            if (field.enum_value && field.enum_value.name) {
                                fieldValue = field.enum_value.name;
                            } else if (field.text_value) {
                                fieldValue = field.text_value;
                            } else if (field.display_value) {
                                fieldValue = field.display_value;
                            }

                            if (fieldValue) {
                                try {
                                    await pool.execute(`
                                        INSERT INTO custom_field_values 
                                        (task_gid, field_gid, field_name, field_value)
                                        VALUES (?, ?, ?, ?)
                                        ON DUPLICATE KEY UPDATE
                                        field_value = VALUES(field_value)
                                    `, [task.gid, field.gid, field.name, fieldValue]);
                                    totalValues++;
                                } catch (valueError) {
                                    console.error(`❌ Error storing value for field ${field.name}:`, valueError.message);
                                }
                            }
                        }
                    }
                }
            }
        }

        console.log(`🔧 Found ${fieldDefinitions.size} unique custom fields across all tasks`);

        for (const [key, field] of fieldDefinitions) {
            try {
                const enumOptionsJson = field.enum_options ? JsonUtils.ensureJsonString(field.enum_options, null) : null;

                await pool.execute(`
                    INSERT INTO project_custom_fields 
                    (gid, name, type, enum_options, project_gid) 
                    VALUES (?, ?, ?, ?, 'global')
                `, [
                    field.gid,
                    field.name,
                    field.type,
                    enumOptionsJson
                ]);

                totalFields++;
                console.log(`✅ Synced custom field: ${field.name} (${field.type})`);
            } catch (fieldError) {
                console.error(`❌ Error syncing custom field ${field.name}:`, fieldError.message);
            }
        }

        console.log(`✅ Enhanced custom fields sync completed!`);
        console.log(`📊 Results: ${totalFields} field definitions, ${totalValues} field values`);

        res.json({
            message: 'Enhanced custom fields sync completed',
            totalFields,
            totalValues,
            fieldDefinitions: Array.from(fieldDefinitions.values())
        });

    } catch (error) {
        console.error('❌ Custom fields sync failed:', error);
        res.status(500).json({
            error: 'Custom fields sync failed',
            message: error.message
        });
    }
});

// =============================================================================
// CUSTOM FIELDS ENDPOINTS
// =============================================================================

app.get('/api/custom-fields', async (req, res) => {
    try {
        const [fields] = await pool.execute(`
            SELECT gid, name, type, enum_options 
            FROM project_custom_fields 
            ORDER BY name
        `);

        const fieldMapping = {};
        const safeFields = [];

        fields.forEach(field => {
            const parsedEnumOptions = JsonUtils.safeParse(field.enum_options, null);

            const safeField = {
                gid: field.gid,
                name: field.name,
                type: field.type,
                enum_options: parsedEnumOptions
            };

            safeFields.push(safeField);

            const fieldName = field.name.toLowerCase();
            fieldMapping[fieldName] = safeField;
        });

        res.json({
            fields: safeFields,
            mapping: fieldMapping
        });

    } catch (error) {
        console.error('❌ Error fetching custom fields:', error);
        res.status(500).json({
            error: 'Failed to fetch custom fields',
            message: error.message
        });
    }
});

// =============================================================================
// DATA CLEANUP ENDPOINTS
// =============================================================================

app.post('/api/fix/clean-json-data', async (req, res) => {
    try {
        console.log('🧹 Cleaning up malformed JSON data...');

        let fixedCount = 0;

        // Fix tasks table
        const [tasks] = await pool.execute('SELECT gid, custom_fields, asana_data FROM tasks');

        for (const task of tasks) {
            let needsUpdate = false;
            let fixedCustomFields = task.custom_fields;
            let fixedAsanaData = task.asana_data;

            // Fix custom_fields
            if (task.custom_fields && typeof task.custom_fields === 'string') {
                if (task.custom_fields.includes('[object Object]')) {
                    fixedCustomFields = '[]';
                    needsUpdate = true;
                    console.log(`🔧 Fixed custom_fields for task ${task.gid}`);
                }
            }

            // Fix asana_data
            if (task.asana_data && typeof task.asana_data === 'string') {
                if (task.asana_data.includes('[object Object]')) {
                    fixedAsanaData = '{}';
                    needsUpdate = true;
                    console.log(`🔧 Fixed asana_data for task ${task.gid}`);
                }
            }

            if (needsUpdate) {
                await pool.execute(
                    'UPDATE tasks SET custom_fields = ?, asana_data = ? WHERE gid = ?',
                    [fixedCustomFields, fixedAsanaData, task.gid]
                );
                fixedCount++;
            }
        }

        // Fix users table
        const [users] = await pool.execute('SELECT gid, photo FROM users');

        for (const user of users) {
            if (user.photo && typeof user.photo === 'string' && user.photo.includes('[object Object]')) {
                await pool.execute(
                    'UPDATE users SET photo = ? WHERE gid = ?',
                    ['{}', user.gid]
                );
                fixedCount++;
                console.log(`🔧 Fixed photo for user ${user.gid}`);
            }
        }

        console.log(`✅ Cleaned up ${fixedCount} malformed JSON entries`);

        res.json({
            message: 'JSON data cleanup completed',
            fixed_count: fixedCount
        });

    } catch (error) {
        console.error('❌ Error cleaning JSON data:', error);
        res.status(500).json({
            error: 'JSON cleanup failed',
            message: error.message
        });
    }
});

// =============================================================================
// BULK SYNC
// =============================================================================

app.post('/api/sync/all', async (req, res) => {
    try {
        console.log('🚀 Starting full sync from Asana to local database...');

        const isOnline = await isMainServerOnline();
        if (!isOnline) {
            return res.status(503).json({ error: 'Main Asana server unavailable' });
        }

        const syncResults = {
            workspaces: 0,
            projects: 0,
            tasks: 0,
            users: 0,
            customFields: 0,
            customValues: 0,
            errors: []
        };

        try {
            const workspacesResponse = await axios.post(`http://localhost:${PORT}/api/sync/workspaces`);
            syncResults.workspaces = workspacesResponse.data.synced;
            console.log(`✅ Step 1: Synced ${syncResults.workspaces} workspaces`);
        } catch (error) {
            syncResults.errors.push(`Workspaces sync failed: ${error.message}`);
        }

        const [workspaces] = await pool.execute('SELECT gid, name FROM workspaces');

        for (const workspace of workspaces) {
            try {
                const projectsResponse = await axios.post(`http://localhost:${PORT}/api/sync/workspaces/${workspace.gid}/projects`);
                syncResults.projects += projectsResponse.data.synced;

                const usersResponse = await axios.post(`http://localhost:${PORT}/api/sync/workspaces/${workspace.gid}/users`);
                syncResults.users += usersResponse.data.synced;

                console.log(`✅ Synced ${projectsResponse.data.synced} projects and ${usersResponse.data.synced} users for workspace: ${workspace.name}`);

                const [projects] = await pool.execute('SELECT gid, name FROM projects WHERE workspace_gid = ?', [workspace.gid]);

                for (const project of projects) {
                    try {
                        const tasksResponse = await axios.post(`http://localhost:${PORT}/api/sync/projects/${project.gid}/tasks`);
                        syncResults.tasks += tasksResponse.data.synced;
                        console.log(`✅ Synced ${tasksResponse.data.synced} tasks for project: ${project.name}`);
                    } catch (taskError) {
                        syncResults.errors.push(`Tasks sync failed for project ${project.name}: ${taskError.message}`);
                    }
                }

            } catch (workspaceError) {
                syncResults.errors.push(`Workspace ${workspace.name} sync failed: ${workspaceError.message}`);
            }
        }

        try {
            console.log('🔧 Extracting custom fields from synced tasks...');
            const customFieldsResponse = await axios.post(`http://localhost:${PORT}/api/sync/custom-fields`);
            syncResults.customFields = customFieldsResponse.data.totalFields;
            syncResults.customValues = customFieldsResponse.data.totalValues;
            console.log(`✅ Step 4: Extracted ${syncResults.customFields} custom fields and ${syncResults.customValues} values`);
        } catch (error) {
            syncResults.errors.push(`Custom fields extraction failed: ${error.message}`);
        }

        console.log('🎉 Full sync completed!');
        console.log(`📊 Results: ${syncResults.workspaces} workspaces, ${syncResults.projects} projects, ${syncResults.tasks} tasks, ${syncResults.users} users, ${syncResults.customFields} custom fields`);

        if (syncResults.errors.length > 0) {
            console.log(`⚠️ Errors: ${syncResults.errors.length}`);
        }

        res.json({
            message: 'Full sync completed',
            results: syncResults,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Full sync failed:', error);
        res.status(500).json({ error: error.message });
    }
});

// =============================================================================
// DATA RETRIEVAL ENDPOINTS
// =============================================================================

app.get('/api/workspaces', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM workspaces ORDER BY name');
        if (rows.length === 0) {
            console.log('📦 No local workspaces found, attempting sync...');
            try {
                await axios.post(`http://localhost:${PORT}/api/sync/workspaces`);
                const [newRows] = await pool.execute('SELECT * FROM workspaces ORDER BY name');
                res.json({ data: newRows });
            } catch (syncError) {
                res.status(503).json({ error: 'No local data and sync failed' });
            }
        } else {
            res.json({ data: rows });
        }
    } catch (error) {
        console.error('❌ Error fetching workspaces:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/workspaces/:workspaceId/projects', async (req, res) => {
    try {
        const { workspaceId } = req.params;
        const [rows] = await pool.execute(
            'SELECT * FROM projects WHERE workspace_gid = ? ORDER BY name',
            [workspaceId]
        );

        if (rows.length === 0) {
            console.log(`📦 No local projects found for workspace ${workspaceId}, attempting sync...`);
            try {
                await axios.post(`http://localhost:${PORT}/api/sync/workspaces/${workspaceId}/projects`);
                const [newRows] = await pool.execute(
                    'SELECT * FROM projects WHERE workspace_gid = ? ORDER BY name',
                    [workspaceId]
                );
                res.json({ data: newRows });
            } catch (syncError) {
                res.status(503).json({ error: 'No local data and sync failed' });
            }
        } else {
            res.json({ data: rows });
        }
    } catch (error) {
        console.error('❌ Error fetching projects:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/users', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM users ORDER BY name');

        // Safe parse photo JSON for each user
        const usersWithParsedData = rows.map(user => ({
            ...user,
            photo: JsonUtils.safeParse(user.photo, {})
        }));

        res.json({ data: usersWithParsedData });
    } catch (error) {
        console.error('❌ Error fetching users:', error);
        res.status(500).json({ error: error.message });
    }
});

// =============================================================================
// TASKS ENDPOINTS - FIXED JSON HANDLING
// =============================================================================

app.get('/api/projects/:projectId/tasks', async (req, res) => {
    try {
        const { projectId } = req.params;

        // Get tasks with full details
        const [rows] = await pool.execute(`
            SELECT t.*, u.name as assignee_name, u.email as assignee_email
            FROM tasks t
            LEFT JOIN users u ON t.assignee_gid = u.gid
            INNER JOIN task_projects tp ON t.gid = tp.task_gid
            WHERE tp.project_gid = ?
            ORDER BY t.created_at DESC
        `, [projectId]);

        // Process tasks with safe JSON parsing
        const tasksWithProjects = rows.map(task => {
            try {
                return {
                    ...task,
                    assignee: task.assignee_gid ? {
                        gid: task.assignee_gid,
                        name: task.assignee_name,
                        email: task.assignee_email
                    } : null,
                    projects: [{ gid: projectId }],
                    custom_fields: JsonUtils.safeParse(task.custom_fields, []),
                    asana_data: JsonUtils.safeParse(task.asana_data, {}),
                    photo: JsonUtils.safeParse(task.photo, null)
                };
            } catch (taskError) {
                console.error(`❌ Error processing task ${task.gid}:`, taskError.message);
                // Return task with minimal safe data
                return {
                    gid: task.gid,
                    name: task.name || 'Untitled Task',
                    notes: task.notes || '',
                    completed: task.completed || false,
                    priority: task.priority || 'Medium',
                    progress: task.progress || 'Not Started',
                    assignee: task.assignee_gid ? {
                        gid: task.assignee_gid,
                        name: task.assignee_name,
                        email: task.assignee_email
                    } : null,
                    projects: [{ gid: projectId }],
                    custom_fields: [],
                    created_at: task.created_at,
                    updated_at: task.updated_at
                };
            }
        });

        console.log(`✅ Successfully processed ${tasksWithProjects.length} tasks for project ${projectId}`);
        res.json({ data: tasksWithProjects });

    } catch (error) {
        console.error('❌ Error fetching tasks:', error);
        res.status(500).json({
            error: error.message,
            details: 'Check server logs for more information'
        });
    }
});

// =============================================================================
// TASK UPDATE ENDPOINT - COMPLETELY FIXED
// =============================================================================

app.put('/api/tasks/:taskId', async (req, res) => {
    try {
        const { taskId } = req.params;
        const updates = req.body;
        const isOnline = await isMainServerOnline();

        console.log(`📝 Updating task ${taskId} with:`, updates);

        const [existingTasks] = await pool.execute('SELECT * FROM tasks WHERE gid = ?', [taskId]);
        if (existingTasks.length === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }

        const existingTask = existingTasks[0];
        const setClause = [];
        const values = [];

        // Handle standard fields
        if (updates.name !== undefined) {
            setClause.push('name = ?');
            values.push(updates.name);
        }
        if (updates.notes !== undefined) {
            setClause.push('notes = ?');
            values.push(updates.notes);
        }
        if (updates.completed !== undefined) {
            setClause.push('completed = ?');
            values.push(updates.completed);
        }
        if (updates.due_date !== undefined) {
            setClause.push('due_date = ?');
            values.push(updates.due_date);
        }
        if (updates.assignee_gid !== undefined) {
            setClause.push('assignee_gid = ?');
            values.push(updates.assignee_gid);
        }

        // Handle priority and progress updates with safe JSON handling
        if (updates.priority !== undefined || updates.progress !== undefined) {
            // Safely parse existing custom fields
            let existingCustomFields = JsonUtils.safeParse(existingTask.custom_fields, []);

            // Ensure it's an array
            if (!Array.isArray(existingCustomFields)) {
                console.warn('Custom fields is not an array, resetting to empty array');
                existingCustomFields = [];
            }

            // Update priority
            if (updates.priority !== undefined) {
                let priorityField = existingCustomFields.find(f =>
                    f && f.name && (f.name === 'Priority' || f.name.toLowerCase().includes('priority'))
                );

                if (priorityField) {
                    priorityField.text_value = updates.priority;
                    priorityField.enum_value = { name: updates.priority };
                } else {
                    existingCustomFields.push({
                        gid: "1208011690719461",
                        name: "Priority",
                        type: "enum",
                        text_value: updates.priority,
                        enum_value: { name: updates.priority }
                    });
                }

                setClause.push('priority = ?');
                values.push(updates.priority);

                // Update custom field value table
                try {
                    await pool.execute(`
                        INSERT INTO custom_field_values 
                        (task_gid, field_gid, field_name, field_value)
                        VALUES (?, ?, 'Priority', ?)
                        ON DUPLICATE KEY UPDATE
                        field_value = VALUES(field_value)
                    `, [taskId, priorityField ? priorityField.gid : "1208011690719461", updates.priority]);
                } catch (valueError) {
                    console.error(`❌ Error updating priority value:`, valueError.message);
                }
            }

            // Update progress
            if (updates.progress !== undefined) {
                let progressField = existingCustomFields.find(f =>
                    f && f.name && (f.name === 'Progress' || f.name === 'Task Progress' || f.name.toLowerCase().includes('progress'))
                );

                if (progressField) {
                    progressField.text_value = updates.progress;
                    progressField.enum_value = { name: updates.progress };
                } else {
                    existingCustomFields.push({
                        gid: "1208011690719462",
                        name: "Task Progress",
                        type: "enum",
                        text_value: updates.progress,
                        enum_value: { name: updates.progress }
                    });
                }

                setClause.push('progress = ?');
                values.push(updates.progress);

                // Update custom field value table
                try {
                    await pool.execute(`
                        INSERT INTO custom_field_values 
                        (task_gid, field_gid, field_name, field_value)
                        VALUES (?, ?, 'Task Progress', ?)
                        ON DUPLICATE KEY UPDATE
                        field_value = VALUES(field_value)
                    `, [taskId, progressField ? progressField.gid : "1208011690719462", updates.progress]);
                } catch (valueError) {
                    console.error(`❌ Error updating progress value:`, valueError.message);
                }
            }

            // Safely update custom_fields JSON using JsonUtils
            const customFieldsJson = JsonUtils.ensureJsonString(existingCustomFields, '[]');
            setClause.push('custom_fields = ?');
            values.push(customFieldsJson);
        }

        setClause.push('sync_status = ?');
        values.push(isOnline ? 'synced' : 'pending');
        setClause.push('updated_at = CURRENT_TIMESTAMP');
        values.push(taskId);

        // Update the task
        if (setClause.length > 1) {
            await pool.execute(
                `UPDATE tasks SET ${setClause.join(', ')} WHERE gid = ?`,
                values
            );
            console.log(`✅ Task ${taskId} updated in local database`);
        }

        // Add to sync queue with proper JSON handling
        try {
            const queuePayload = JsonUtils.ensureJsonString(updates, '{}');
            console.log(`📝 Queue payload being stored: ${queuePayload}`);

            await pool.execute(`
                INSERT INTO sync_queue (operation_type, resource_type, resource_id, payload, priority)
                VALUES ('UPDATE', 'task', ?, ?, 'high')
                ON DUPLICATE KEY UPDATE
                payload = VALUES(payload),
                priority = VALUES(priority),
                retry_count = 0,
                created_at = NOW()
            `, [taskId, queuePayload]);

            console.log(`📤 Task ${taskId} queued for main server sync`);
        } catch (queueError) {
            console.error('❌ Error adding to sync queue:', queueError.message);
            // Don't fail the request just because queue failed
        }

        // Get updated task for response
        const [updatedTasks] = await pool.execute('SELECT * FROM tasks WHERE gid = ?', [taskId]);
        const updatedTask = updatedTasks[0];

        res.json({
            data: {
                ...updatedTask,
                custom_fields: JsonUtils.safeParse(updatedTask.custom_fields, []),
                assignee: updatedTask.assignee_gid ? { gid: updatedTask.assignee_gid } : null
            }
        });

    } catch (error) {
        console.error('❌ Task update failed:', error);
        res.status(500).json({
            error: 'Task update failed',
            message: error.message
        });
    }
});

// =============================================================================
// SYNC QUEUE PROCESSING - SINGLE DEFINITION WITH FIXED JSON
// =============================================================================

async function processSyncItem(item) {
    const { operation_type, resource_type, resource_id, payload } = item;

    console.log(`🔄 Processing ${operation_type} for ${resource_type} ${resource_id}`);
    console.log(`📝 Raw payload type: ${typeof payload}, value:`, payload);

    // Use JsonUtils for bulletproof payload parsing
    const parsedPayload = JsonUtils.safeParse(payload, {});
    console.log('📝 Final parsed payload:', parsedPayload);

    try {
        switch (operation_type) {
            case 'CREATE':
                if (resource_type === 'task') {
                    console.log('📝 Creating task with data:', parsedPayload);
                    const response = await axios.post(`${MAIN_SERVER_URL}/tasks`, parsedPayload);
                    const serverTask = response.data.data;
                    await pool.execute(
                        'UPDATE tasks SET gid = ?, sync_status = ? WHERE gid = ?',
                        [serverTask.gid, 'synced', resource_id]
                    );
                    console.log('✅ Task created successfully on main server');
                }
                break;

            case 'UPDATE_FIELD':
            case 'UPDATE':
                console.log('📝 Updating resource with data:', parsedPayload);
                await axios.put(`${MAIN_SERVER_URL}/${resource_type}s/${resource_id}`, parsedPayload);
                await pool.execute(
                    `UPDATE ${resource_type}s SET sync_status = ? WHERE gid = ?`,
                    ['synced', resource_id]
                );
                console.log('✅ Resource updated successfully on main server');
                break;

            case 'DELETE':
                if (!resource_id.startsWith('local_')) {
                    console.log('📝 Deleting resource:', resource_id);
                    await axios.delete(`${MAIN_SERVER_URL}/${resource_type}s/${resource_id}`);
                    console.log('✅ Resource deleted successfully on main server');
                }
                break;

            default:
                console.warn('📝 Unknown operation type:', operation_type);
                break;
        }
    } catch (error) {
        console.error(`❌ Sync operation failed for ${operation_type} ${resource_type} ${resource_id}:`, error.message);
        if (error.response) {
            console.error(`❌ Server response:`, error.response.status, error.response.data);
        }
        throw error;
    }
}

// =============================================================================
// SYNC QUEUE MANAGEMENT
// =============================================================================

app.get('/api/sync/queue', async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT * FROM sync_queue 
            WHERE status IN ('pending', 'failed') 
            ORDER BY priority DESC, created_at ASC
        `);
        res.json({ data: rows });
    } catch (error) {
        console.error('❌ Error fetching sync queue:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/sync/process', async (req, res) => {
    try {
        const isOnline = await isMainServerOnline();
        if (!isOnline) {
            return res.status(503).json({ error: 'Main server unavailable' });
        }

        const [queueItems] = await pool.execute(`
            SELECT * FROM sync_queue 
            WHERE status = 'pending' AND retry_count < max_retries
            ORDER BY priority DESC, created_at ASC
            LIMIT 10
        `);

        let processed = 0;
        let failed = 0;

        for (const item of queueItems) {
            try {
                await pool.execute(
                    'UPDATE sync_queue SET status = ?, processed_at = CURRENT_TIMESTAMP WHERE id = ?',
                    ['processing', item.id]
                );

                await processSyncItem(item);

                await pool.execute(
                    'UPDATE sync_queue SET status = ?, processed_at = CURRENT_TIMESTAMP WHERE id = ?',
                    ['completed', item.id]
                );

                processed++;
            } catch (error) {
                failed++;
                await pool.execute(
                    'UPDATE sync_queue SET status = ?, retry_count = retry_count + 1, error_message = ?, processed_at = CURRENT_TIMESTAMP WHERE id = ?',
                    ['failed', error.message, item.id]
                );
                console.error(`❌ Failed to process sync item ${item.id}:`, error.message);
            }
        }

        res.json({
            message: 'Sync processing completed',
            processed,
            failed,
            total: queueItems.length
        });
    } catch (error) {
        console.error('❌ Error processing sync queue:', error);
        res.status(500).json({ error: error.message });
    }
});

// =============================================================================
// SYNC QUEUE CLEANUP
// =============================================================================

app.delete('/api/sync/queue/failed', async (req, res) => {
    try {
        console.log('🧹 Clearing failed sync queue items...');

        const [countResult] = await pool.execute(
            'SELECT COUNT(*) as count FROM sync_queue WHERE status = "failed"'
        );
        const failedCount = countResult[0].count;

        await pool.execute('DELETE FROM sync_queue WHERE status = "failed"');

        console.log(`✅ Cleared ${failedCount} failed sync queue items`);

        res.json({
            message: 'Failed sync items cleared',
            cleared_count: failedCount
        });

    } catch (error) {
        console.error('❌ Error clearing failed sync items:', error);
        res.status(500).json({
            error: 'Failed to clear sync items',
            message: error.message
        });
    }
});

app.delete('/api/sync/queue/all', async (req, res) => {
    try {
        console.log('🧹 Clearing all sync queue items...');

        const [countResult] = await pool.execute('SELECT COUNT(*) as count FROM sync_queue');
        const totalCount = countResult[0].count;

        await pool.execute('DELETE FROM sync_queue');

        console.log(`✅ Cleared ${totalCount} sync queue items`);

        res.json({
            message: 'All sync items cleared',
            cleared_count: totalCount
        });

    } catch (error) {
        console.error('❌ Error clearing sync items:', error);
        res.status(500).json({
            error: 'Failed to clear sync items',
            message: error.message
        });
    }
});

// =============================================================================
// SYNC STATISTICS
// =============================================================================

app.get('/api/sync/stats', async (req, res) => {
    try {
        const [stats] = await pool.execute('SELECT * FROM sync_stats');
        const [queueStats] = await pool.execute(`
            SELECT status, COUNT(*) as count
            FROM sync_queue 
            GROUP BY status
        `);

        res.json({
            data: {
                resources: stats,
                queue: queueStats
            }
        });
    } catch (error) {
        console.error('❌ Error fetching sync stats:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/sync/status', async (req, res) => {
    try {
        const [syncStats] = await pool.execute('SELECT * FROM sync_stats');
        const [queueStats] = await pool.execute(`
            SELECT status, COUNT(*) as count
            FROM sync_queue 
            GROUP BY status
        `);

        res.json({
            data: {
                resources: syncStats,
                queue: queueStats,
                last_check: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('❌ Error fetching sync status:', error);
        res.status(500).json({ error: error.message });
    }
});

// =============================================================================
// DEBUG ENDPOINTS
// =============================================================================

app.get('/api/debug/tasks-with-custom-fields', async (req, res) => {
    try {
        const [tasks] = await pool.execute(`
            SELECT gid, name, custom_fields, priority, progress 
            FROM tasks 
            WHERE custom_fields IS NOT NULL AND custom_fields != '[]'
            LIMIT 10
        `);

        const tasksWithParsedFields = tasks.map(task => ({
            ...task,
            custom_fields_parsed: JsonUtils.safeParse(task.custom_fields, [])
        }));

        res.json({
            data: tasksWithParsedFields,
            count: tasks.length
        });
    } catch (error) {
        console.error('❌ Error fetching debug tasks:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/debug/custom-fields-summary', async (req, res) => {
    try {
        const [fieldsCount] = await pool.execute(`
            SELECT COUNT(*) as total_fields FROM project_custom_fields
        `);

        const [tasksWithFields] = await pool.execute(`
            SELECT COUNT(*) as tasks_with_fields 
            FROM tasks 
            WHERE custom_fields IS NOT NULL AND custom_fields != '[]'
        `);

        const [fieldsList] = await pool.execute(`
            SELECT name, type, gid FROM project_custom_fields
        `);

        const [valuesCount] = await pool.execute(`
            SELECT COUNT(*) as total_values FROM custom_field_values
        `);

        res.json({
            summary: {
                total_custom_fields_defined: fieldsCount[0].total_fields,
                tasks_with_custom_fields: tasksWithFields[0].tasks_with_fields,
                total_field_values: valuesCount[0].total_values,
                fields_list: fieldsList
            }
        });
    } catch (error) {
        console.error('❌ Error fetching custom fields summary:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/debug/tasks/:taskId/custom-fields', async (req, res) => {
    try {
        const { taskId } = req.params;

        const [values] = await pool.execute(`
            SELECT cfv.*, pcf.type, pcf.enum_options
            FROM custom_field_values cfv
            LEFT JOIN project_custom_fields pcf ON cfv.field_gid = pcf.gid
            WHERE cfv.task_gid = ?
        `, [taskId]);

        // Parse enum_options safely
        const safeValues = values.map(value => ({
            ...value,
            enum_options: JsonUtils.safeParse(value.enum_options, null)
        }));

        res.json({
            task_id: taskId,
            custom_field_values: safeValues
        });
    } catch (error) {
        console.error('❌ Error fetching task custom fields:', error);
        res.status(500).json({ error: error.message });
    }
});

// =============================================================================
// AUTO SYNC SCHEDULER
// =============================================================================

cron.schedule('*/30 * * * * *', async () => {
    try {
        const isOnline = await isMainServerOnline();
        if (isOnline) {
            const response = await axios.post(`http://localhost:${PORT}/api/sync/process`);
            if (response.data.processed > 0) {
                console.log(`🔄 Auto-sync processed ${response.data.processed} items`);
            }
        }
    } catch (error) {
        // Silent fail for auto-sync
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Local MySQL Server running on port ${PORT}`);
    console.log(`🗄️ Database: ${dbConfig.database}`);
    console.log(`🔄 Auto-sync: Enabled (30s intervals)`);
    console.log(`📥 Enhanced data pull endpoints available!`);
    console.log(`   POST /api/fix/database-schema - Fix custom fields schema`);
    console.log(`   POST /api/fix/clean-json-data - Clean malformed JSON data`);
    console.log(`   POST /api/sync/all - Pull all data from Asana with custom fields`);
    console.log(`   POST /api/sync/custom-fields - Extract custom fields from tasks`);
    console.log(`   GET  /api/custom-fields - Get custom field mappings`);
    console.log(`   GET  /api/debug/custom-fields-summary - Debug custom fields`);
    console.log(`   DELETE /api/sync/queue/failed - Clear failed sync items`);
    console.log(`   DELETE /api/sync/queue/all - Clear all sync items`);
});

module.exports = app;