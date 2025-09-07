const express = require('express');
const cors = require('cors');
const { PORT } = require('./src/config/server');
const { createAllTables, initializeSyncSettings } = require('./src/database/schema');
const errorHandler = require('./src/middleware/errorHandler');

// Import routes
const indexRoutes = require('./src/routes/index');
const workspaceRoutes = require('./src/routes/workspaces');
const projectRoutes = require('./src/routes/projects');
const taskRoutes = require('./src/routes/tasks');
const syncRoutes = require('./src/routes/sync');
const settingsRoutes = require('./src/routes/settings');

console.log('MySQL Local Server starting...');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/', indexRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/settings', settingsRoutes);

// Error handling middleware
app.use(errorHandler);

// Server startup
async function startServer() {
    try {
        await createAllTables();
        await initializeSyncSettings();

        const server = app.listen(PORT, () => {
            console.log(`🚀 Local MySQL Server running on port ${PORT}`);
            console.log('✅ All modules loaded and ready!');
        });

        return server;
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Error handling
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

startServer();

module.exports = app;