const express = require("express");
const router = express.Router();

const feedbackController = require("../controller/feedback.controller");
const authController = require("../controller/auth.controller");

// 로그인한 사용자만 AI 피드백 요청 가능
router.post("/project", authController.authenticate, feedbackController.createProjectFeedback);

// 로그인한 사용자의 생성 전 draft AI 피드백 최신 1개 조회
// 등록 페이지에서 여러번 피드백 해도 최신 1개만 보여줌
router.get(
  "/draft/:tempProjectId",
  authController.authenticate,
  feedbackController.getLatestDraftProjectFeedback,
);

// 로그인한 사용자의 특정 프로젝트 AI 피드백 조회
router.get(
  "/project/:projectId",
  authController.authenticate,
  feedbackController.getProjectFeedbacks,
);
module.exports = router;
