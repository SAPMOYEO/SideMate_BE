const express = require("express");
const express = require("express");
const router = express.Router();

const projectApi = require("./project.api");
const adminApi = require("./admin.api");

router.use("/project", projectApi);
router.use("/admin", adminApi);

module.exports = router;

