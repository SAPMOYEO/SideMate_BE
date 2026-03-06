const express = require('express');
const projectController = require('../controller/project.controller');
const userController = require('../controller/user.controller');
const router = express.Router();

router.post('/', userController.getTestUser, projectController.createProject);
router.get('/', projectController.getProjects);
router.get('/:id', projectController.getProject);
router.put('/:id', userController.getTestUser, projectController.updateProject);
router.delete('/:id', userController.getTestUser, projectController.deleteProject);

module.exports = router;