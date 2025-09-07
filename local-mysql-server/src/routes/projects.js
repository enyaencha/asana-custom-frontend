const express = require('express');
const ProjectController = require('../controllers/projectController');
const router = express.Router();

router.post('/', ProjectController.createProject);

module.exports = router;