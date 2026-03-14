const express = require("express");
const router = express.Router();

const authController = require("../controller/auth.controller");
const aiUsageController = require("../controller/aiUsage.controller");

// AI 사용 시작
router.post("/hold", authController.authenticate, aiUsageController.createHold);

// AI 성공
router.post("/:requestId/commit", authController.authenticate, aiUsageController.commit);

// AI 실패
router.post("/:requestId/cancel", authController.authenticate, aiUsageController.cancel);

module.exports = router;
