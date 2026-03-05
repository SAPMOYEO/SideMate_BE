// src/routes/payment.routes.js
const express = require("express");
const router = express.Router();

const paymentController = require("../controller/payment.controller");

// 결제 내역 조회
router.get("/", /* 연결예정 */ paymentController.getPayments); // 결제 내역 확인
router.get("/:id", /* 연결예정 */ paymentController.getPaymentDetail); // 결제 내역 상세 확인

// 결제 생성 (일회성, 구독 시작)
router.post("/", /* 연결예정 */ paymentController.createPayment);

// 구독 플랜 변경 (basic <-> premium)
router.patch("/subscription", /* 연결예정 */ paymentController.updatePayment);

// 구독 해지
router.delete("/subscription", /* 연결예정 */ paymentController.deletePayment);

module.exports = router;
