const express = require("express");
const router = express.Router();

// const userController = require("../controller/user.controller")
// const authController = require("../controller/auth.controller")
const aiQuotaController = require("../controller/aiQuota.controller");

// 내 사용량 조회
router.get("/", /* auth 연결예정 */ aiQuotaController.getMyQuota);

// 실제 AI 사용 차감
router.post("/consume", /* auth 연결예정 */ aiQuotaController.consumeQuota);

// 무료 횟수 추가
router.patch("/free", /* auth 연결예정 */ aiQuotaController.addFreeQuota);

// 특정 userId quota 조회
router.get("/:userId", /* auth 연결예정 */ aiQuotaController.getQuotaByUserId);

module.exports = router;
