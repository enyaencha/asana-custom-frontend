const express = require('express');
const TaskController = require('../controllers/taskController');
const router = express.Router();

router.get('/:projectId/tasks', TaskController.getProjectTasks);
router.post('/', TaskController.createTask);

module.exports = router;