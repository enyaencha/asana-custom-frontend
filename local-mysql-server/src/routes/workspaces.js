const express = require('express');
const WorkspaceController = require('../controllers/workspaceController');
const router = express.Router();

router.get('/', WorkspaceController.getWorkspaces);
router.get('/:workspaceId/projects', WorkspaceController.getWorkspaceProjects);

module.exports = router;