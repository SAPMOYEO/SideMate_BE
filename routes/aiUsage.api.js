const express = require("express");
const router = express.Router();

// const userController = require("../controller/user.controller")
// const authController = require("../controller/auth.controller")
const aiUsageController = require("../controllers/aiUsage.controller");

// AI 사용 시작
router.post("/hold", /* auth 연결예정 */ aiUsageController.createHold);

// AI 성공
router.post("/:requestId/commit", /* auth 연결예정 */ aiUsageController.commit);

// AI 실패
router.post("/:requestId/cancel", /* auth 연결예정 */ aiUsageController.cancel);

module.exports = router;
