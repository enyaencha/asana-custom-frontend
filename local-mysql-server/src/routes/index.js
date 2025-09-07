const express = require('express');
const { pool } = require('../config/database');
const router = express.Router();

// Health check
router.get('/health', async (req, res) => {
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

// Test endpoint
router.get('/test', async (req, res) => {
    // Move test endpoint logic here
});

module.exports = router;