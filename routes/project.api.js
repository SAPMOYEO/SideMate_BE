const express = require("express");
const projectController = require("../controller/project.controller");
const authController = require("../controller/auth.controller");
const router = express.Router();

router.post("/", authController.authenticate, projectController.createProject);
router.get("/", projectController.getProjects);
router.get(
  "/me",
  authController.authenticate,
  projectController.getProjectByMe,
);
router.get("/:id", projectController.getProject);
router.put(
  "/:id",
  authController.authenticate,
  projectController.updateProject,
);
router.delete(
  "/:id",
  authController.authenticate,
  projectController.deleteProject,
);

module.exports = router;
