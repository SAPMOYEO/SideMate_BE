const express = require("express");
const projectController = require("../controller/project.controller");
const userController = require("../controller/user.controller");
const router = express.Router();

router.get("/", projectController.getProjects);
router.get("/:id", projectController.getProject);
router.put("/:id", projectController.updateProject);
router.delete("/:id", projectController.deleteProject);

module.exports = router;
