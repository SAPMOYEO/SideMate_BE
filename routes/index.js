const express = require("express");
const router = express.Router();

const projectApi = require("./project.api");
const adminApi = require("./admin.api");
const userApi = require("./user.api");

router.use("/project", projectApi);
router.use("/admin", adminApi);
router.use("/user", userApi);
module.exports = router;
