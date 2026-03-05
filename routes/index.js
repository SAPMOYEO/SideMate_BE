const express = require('express');
const router = express.Router();

const projectApi = require('./project.api');

router.use('/project', projectApi);

module.exports = router;