const express = require("express");
const router = express.Router();

const projectApi = require("./project.api");
const userApi = require("./user.api");

router.use("/project", projectApi);
router.use("/user", userApi);

module.exports = router;
