const express = require("express");
const applicationController = require("../controller/application.controller");
const authController = require("../controller/auth.controller");
const router = express.Router();

router.post(
  "/",
  authController.authenticate,
  applicationController.createApplication,
);
router.get(
  "/me",
  authController.authenticate,
  applicationController.getMyApplication,
);
router.get("/:id", applicationController.getApplication);
router.put(
  "/:id",
  authController.authenticate,
  applicationController.updateApplication,
);
router.delete(
  "/:id",
  authController.authenticate,
  applicationController.deleteApplication,
);

module.exports = router;
