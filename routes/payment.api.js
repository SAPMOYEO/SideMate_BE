// src/routes/payment.routes.js
const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const paymentController = require("../controllers/payment.controller");

// 결제 내역 조회
router.get("/", auth, paymentController.getPayments); // 결제 내역 확인
router.get("/:id", auth, paymentController.getPaymentDetail); // 결제 내역 상세 확인

// 결제 생성 (일회성, 구독 시작)
router.post("/", auth, paymentController.createPayment);

// 구독 플랜 변경 (basic <-> premium)
router.patch("/subscription", auth, paymentController.updatePayment);

// 구독 해지
router.delete("/subscription", auth, paymentController.deletePayment);

module.exports = router;
