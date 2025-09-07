const express = require('express');
const SettingsController = require('../controllers/settingsController');
const router = express.Router();

router.get('/sync', SettingsController.getSyncSettings);
router.put('/sync', SettingsController.updateSyncSettings);

module.exports = router;