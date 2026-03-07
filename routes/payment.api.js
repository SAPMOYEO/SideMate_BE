const express = require("express");
const router = express.Router();

const authController = require("../controller/auth.controller");
const paymentController = require("../controller/payment.controller");

// 결제 내역 조회
router.get("/", authController.authenticate, paymentController.getPayments); // 결제 내역 확인
router.get("/:id", authController.authenticate, paymentController.getPaymentDetail); // 결제 내역 상세 확인

// 결제 생성 (일회성, 구독 시작)
router.post("/", authController.authenticate, paymentController.createPayment);

// 구독 플랜 변경 (basic <-> premium)
router.patch("/subscription", authController.authenticate, paymentController.updatePayment);

// 구독 해지
router.delete("/subscription", authController.authenticate, paymentController.deletePayment);

module.exports = router;
