const express = require('express');
const projectController = require('../controller/project.controller');
const router = express.Router();

router.post('/', /* 로그인 됐는지 미들웨어 필요 */projectController.createProject);
router.get('/', projectController.getProjects);
router.get('/:id', projectController.getProject);

module.exports = router;