const express = require('express');
const SyncController = require('../controllers/syncController');
const router = express.Router();

router.get('/queue', SyncController.getSyncQueue);
router.post('/process', SyncController.processSync);
router.get('/debug/connection', SyncController.debugConnection);
router.post('/debug/manual-sync/:itemId', SyncController.manualSync);

module.exports = router;