const express = require("express");
const router = express.Router();

const feedbackController = require("../controller/feedback.controller");
const authController = require("../controller/auth.controller");

// 로그인한 사용자만 AI 피드백 요청 가능
router.post("/project", authController.authenticate, feedbackController.createProjectFeedback);

module.exports = router;
