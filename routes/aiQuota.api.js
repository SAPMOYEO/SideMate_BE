const express = require("express");
const router = express.Router();

const authController = require("../controller/auth.controller");
const aiQuotaController = require("../controller/aiQuota.controller");

// 내 남은 사용량 조회
router.get("/", authController.authenticate, aiQuotaController.getMyQuota);

// 실제 AI 사용 차감
router.post("/consume", authController.authenticate, aiQuotaController.consumeQuota);

// 무료 횟수 추가
router.patch("/free", authController.authenticate, aiQuotaController.addFreeQuota);

module.exports = router;
