-- MySQL Database Schema for Asana Local Cache
-- File: database/schema.sql

CREATE DATABASE IF NOT EXISTS asana_local_cache;
USE asana_local_cache;

-- Users table
CREATE TABLE users (
                       gid VARCHAR(255) PRIMARY KEY,
                       name VARCHAR(255) NOT NULL,
                       email VARCHAR(255),
                       photo JSON,
                       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                       last_synced TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                       sync_status ENUM('synced', 'pending', 'error') DEFAULT 'synced'
);

-- Workspaces table
CREATE TABLE workspaces (
                            gid VARCHAR(255) PRIMARY KEY,
                            name VARCHAR(255) NOT NULL,
                            is_organization BOOLEAN DEFAULT FALSE,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                            last_synced TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            sync_status ENUM('synced', 'pending', 'error') DEFAULT 'synced'
);

-- Projects table
CREATE TABLE projects (
                          gid VARCHAR(255) PRIMARY KEY,
                          name VARCHAR(255) NOT NULL,
                          workspace_gid VARCHAR(255),
                          color VARCHAR(50),
                          notes TEXT,
                          archived BOOLEAN DEFAULT FALSE,
                          public BOOLEAN DEFAULT FALSE,
                          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                          last_synced TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                          sync_status ENUM('synced', 'pending', 'error') DEFAULT 'synced',
                          FOREIGN KEY (workspace_gid) REFERENCES workspaces(gid) ON DELETE CASCADE,
                          INDEX idx_workspace (workspace_gid),
                          INDEX idx_sync_status (sync_status)
);

-- Tasks table
CREATE TABLE tasks (
                       gid VARCHAR(255) PRIMARY KEY,
                       name VARCHAR(255) NOT NULL,
                       notes TEXT,
                       completed BOOLEAN DEFAULT FALSE,
                       assignee_gid VARCHAR(255),
                       due_date DATE,
                       priority ENUM('Low', 'Medium', 'High', 'Urgent') DEFAULT 'Medium',
                       progress ENUM('Not Started', 'In Progress', 'Review', 'Done') DEFAULT 'Not Started',
                       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                       last_synced TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                       sync_status ENUM('synced', 'pending', 'error') DEFAULT 'synced',
    -- Custom fields as JSON for flexibility
                       custom_fields JSON,
                       FOREIGN KEY (assignee_gid) REFERENCES users(gid) ON DELETE SET NULL,
                       INDEX idx_completed (completed),
                       INDEX idx_assignee (assignee_gid),
                       INDEX idx_due_date (due_date),
                       INDEX idx_priority (priority),
                       INDEX idx_sync_status (sync_status)
);

-- Task-Project relationship (many-to-many)
CREATE TABLE task_projects (
                               task_gid VARCHAR(255),
                               project_gid VARCHAR(255),
                               PRIMARY KEY (task_gid, project_gid),
                               FOREIGN KEY (task_gid) REFERENCES tasks(gid) ON DELETE CASCADE,
                               FOREIGN KEY (project_gid) REFERENCES projects(gid) ON DELETE CASCADE,
                               INDEX idx_task (task_gid),
                               INDEX idx_project (project_gid)
);

-- Sync queue for offline operations
CREATE TABLE sync_queue (
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
                            INDEX idx_status (status),
                            INDEX idx_priority (priority),
                            INDEX idx_resource (resource_type, resource_id),
                            INDEX idx_created (created_at)
);

-- Settings table for sync configuration
CREATE TABLE settings (
                          setting_key VARCHAR(255) PRIMARY KEY,
                          setting_value JSON,
                          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default settings
INSERT INTO settings (setting_key, setting_value) VALUES
                                                      ('sync_interval', '30'),
                                                      ('batch_size', '50'),
                                                      ('retry_delay', '5'),
                                                      ('max_retries', '3'),
                                                      ('auto_sync', 'true')
    ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

-- Views for easy querying
CREATE VIEW task_details AS
SELECT
    t.*,
    u.name as assignee_name,
    u.email as assignee_email,
    GROUP_CONCAT(tp.project_gid) as project_gids,
    GROUP_CONCAT(p.name) as project_names
FROM tasks t
         LEFT JOIN users u ON t.assignee_gid = u.gid
         LEFT JOIN task_projects tp ON t.gid = tp.task_gid
         LEFT JOIN projects p ON tp.project_gid = p.gid
GROUP BY t.gid;

-- Sync statistics view
CREATE VIEW sync_stats AS
SELECT
    resource_type,
    COUNT(*) as total_items,
    SUM(CASE WHEN sync_status = 'synced' THEN 1 ELSE 0 END) as synced_count,
    SUM(CASE WHEN sync_status = 'pending' THEN 1 ELSE 0 END) as pending_count,
    SUM(CASE WHEN sync_status = 'error' THEN 1 ELSE 0 END) as error_count
FROM (
         SELECT 'user' as resource_type, sync_status FROM users
         UNION ALL
         SELECT 'workspace' as resource_type, sync_status FROM workspaces
         UNION ALL
         SELECT 'project' as resource_type, sync_status FROM projects
         UNION ALL
         SELECT 'task' as resource_type, sync_status FROM tasks
     ) combined
GROUP BY resource_type;