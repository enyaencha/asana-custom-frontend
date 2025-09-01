// scripts/setup-database.js - Fixed version
const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    charset: 'utf8mb4'
};

const setupDatabase = async () => {
    let connection;

    try {
        console.log('🗄️ Connecting to MySQL...');
        connection = await mysql.createConnection(dbConfig);

        console.log('📋 Creating database...');
        // Use query() instead of execute() for USE statements
        await connection.query('CREATE DATABASE IF NOT EXISTS asana_local_cache');
        await connection.query('USE asana_local_cache');

        console.log('🏗️ Creating tables...');

        // Users table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS users (
                gid VARCHAR(255) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255),
                photo JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                last_synced TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                sync_status ENUM('synced', 'pending', 'error') DEFAULT 'synced'
            )
        `);
        console.log('✅ Users table created');

        // Workspaces table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS workspaces (
                gid VARCHAR(255) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                is_organization BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                last_synced TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                sync_status ENUM('synced', 'pending', 'error') DEFAULT 'synced'
            )
        `);
        console.log('✅ Workspaces table created');

        // Projects table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS projects (
                gid VARCHAR(255) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                workspace_gid VARCHAR(255),
                color VARCHAR(50),
                notes TEXT,
                archived BOOLEAN DEFAULT FALSE,
                \`public\` BOOLEAN DEFAULT FALSE,
                owner_gid VARCHAR(255),
                team_gid VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                last_synced TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                sync_status ENUM('synced', 'pending', 'error') DEFAULT 'synced',
                INDEX idx_workspace (workspace_gid),
                INDEX idx_sync_status (sync_status)
            )
        `);
        console.log('✅ Projects table created');

        // Tasks table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS tasks (
                gid VARCHAR(255) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                notes TEXT,
                completed BOOLEAN DEFAULT FALSE,
                assignee_gid VARCHAR(255),
                due_date DATE,
                due_time TIME,
                priority ENUM('Low', 'Medium', 'High', 'Urgent', 'None') DEFAULT 'Medium',
                progress ENUM('Not Started', 'In Progress', 'Review', 'Done', 'Waiting', 'Deferred') DEFAULT 'Not Started',
                parent_gid VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                last_synced TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                sync_status ENUM('synced', 'pending', 'error') DEFAULT 'synced',
                custom_fields JSON,
                asana_data JSON,
                INDEX idx_completed (completed),
                INDEX idx_assignee (assignee_gid),
                INDEX idx_due_date (due_date),
                INDEX idx_priority (priority),
                INDEX idx_sync_status (sync_status),
                INDEX idx_parent (parent_gid)
            )
        `);
        console.log('✅ Tasks table created');

        // Task-Project relationship (many-to-many)
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS task_projects (
                task_gid VARCHAR(255),
                project_gid VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (task_gid, project_gid),
                INDEX idx_task (task_gid),
                INDEX idx_project (project_gid)
            )
        `);
        console.log('✅ Task-Projects table created');

        // Sync queue for offline operations
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS sync_queue (
                id INT AUTO_INCREMENT PRIMARY KEY,
                operation_type ENUM('CREATE', 'UPDATE', 'UPDATE_FIELD', 'DELETE') NOT NULL,
                resource_type ENUM('user', 'workspace', 'project', 'task') NOT NULL,
                resource_id VARCHAR(255) NOT NULL,
                payload JSON,
                priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
                status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
                retry_count INT DEFAULT 0,
                max_retries INT DEFAULT 3,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                processed_at TIMESTAMP NULL,
                error_message TEXT NULL,
                api_endpoint VARCHAR(500),
                api_method ENUM('GET', 'POST', 'PUT', 'DELETE') DEFAULT 'PUT',
                INDEX idx_status (status),
                INDEX idx_priority (priority),
                INDEX idx_resource (resource_type, resource_id),
                INDEX idx_created (created_at)
            )
        `);
        console.log('✅ Sync queue table created');

        // Settings table for sync configuration
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS settings (
                setting_key VARCHAR(255) PRIMARY KEY,
                setting_value JSON,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Settings table created');

        // Project custom fields mapping
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS project_custom_fields (
                id INT AUTO_INCREMENT PRIMARY KEY,
                project_gid VARCHAR(255),
                field_name VARCHAR(255),
                field_gid VARCHAR(255),
                field_type ENUM('enum', 'text', 'number', 'date') DEFAULT 'enum',
                enum_options JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_project_field (project_gid, field_name),
                INDEX idx_project (project_gid),
                INDEX idx_field_name (field_name)
            )
        `);
        console.log('✅ Project custom fields table created');

        console.log('📊 Creating views...');

        // Task details view with related data
        await connection.query(`
            CREATE OR REPLACE VIEW task_details AS
            SELECT 
                t.*,
                u.name as assignee_name,
                u.email as assignee_email,
                parent_task.name as parent_name,
                GROUP_CONCAT(DISTINCT tp.project_gid) as project_gids,
                GROUP_CONCAT(DISTINCT p.name) as project_names,
                GROUP_CONCAT(DISTINCT p.color) as project_colors
            FROM tasks t
            LEFT JOIN users u ON t.assignee_gid = u.gid
            LEFT JOIN tasks parent_task ON t.parent_gid = parent_task.gid
            LEFT JOIN task_projects tp ON t.gid = tp.task_gid
            LEFT JOIN projects p ON tp.project_gid = p.gid
            GROUP BY t.gid
        `);
        console.log('✅ Task details view created');

        // Sync statistics view
        await connection.query(`
            CREATE OR REPLACE VIEW sync_stats AS
            SELECT 
                resource_type,
                COUNT(*) as total_items,
                SUM(CASE WHEN sync_status = 'synced' THEN 1 ELSE 0 END) as synced_count,
                SUM(CASE WHEN sync_status = 'pending' THEN 1 ELSE 0 END) as pending_count,
                SUM(CASE WHEN sync_status = 'error' THEN 1 ELSE 0 END) as error_count,
                MAX(last_synced) as last_sync_time
            FROM (
                SELECT 'user' as resource_type, sync_status, last_synced FROM users
                UNION ALL
                SELECT 'workspace' as resource_type, sync_status, last_synced FROM workspaces
                UNION ALL
                SELECT 'project' as resource_type, sync_status, last_synced FROM projects
                UNION ALL
                SELECT 'task' as resource_type, sync_status, last_synced FROM tasks
            ) combined
            GROUP BY resource_type
        `);
        console.log('✅ Sync stats view created');

        console.log('⚙️ Inserting default settings...');

        // Insert default settings
        const defaultSettings = [
            ['sync_interval', '30'],
            ['batch_size', '50'],
            ['retry_delay', '5'],
            ['max_retries', '3'],
            ['auto_sync', 'true'],
            ['main_server_url', 'http://localhost:3001/api'],
            ['cache_duration', '300'],
            ['offline_mode', 'false']
        ];

        for (const [key, value] of defaultSettings) {
            await connection.execute(`
                INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)
                ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
            `, [key, JSON.stringify(value)]);
        }
        console.log('✅ Default settings inserted');

        console.log('');
        console.log('🎉 Database setup completed successfully!');
        console.log('');
        console.log('📋 Created tables:');
        console.log('  ✅ users');
        console.log('  ✅ workspaces');
        console.log('  ✅ projects');
        console.log('  ✅ tasks');
        console.log('  ✅ task_projects');
        console.log('  ✅ sync_queue');
        console.log('  ✅ settings');
        console.log('  ✅ project_custom_fields');
        console.log('');
        console.log('📊 Created views:');
        console.log('  ✅ task_details');
        console.log('  ✅ sync_stats');
        console.log('');
        console.log('🚀 Ready to run: npm run dev');

    } catch (error) {
        console.error('❌ Database setup failed:', error.message);
        console.error('Full error details:', error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
};

// Run setup
setupDatabase();