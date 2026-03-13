const express = require("express");
const router = express.Router();
const notiController = require("../controller/notification.controller");
const authController = require("../controller/auth.controller");
// NEW_APPLICANT - 새 지원자 도착 (팀장용)
// APPLICATION_APPROVED - 지원 승인됨 (지원자용)
// APPLICATION_REJECTED - 지원 거절됨 (지원자용)
// AI_FEEDBACK_DEPLETED - AI 피드백 소진
// AI_RESET_REMINDER - AI Reset 알림

router.get("/", authController.authenticate, notiController.getNotifications);
router.get(
  "/unread-count",
  authController.authenticate,
  notiController.getUnreadCount
);
router.patch(
  "/:id/read",
  authController.authenticate,
  notiController.markAsRead
);

module.exports = router;
