const express = require("express");
const router = express.Router();

// const userController = require("../controller/user.controller")
// const authController = require("../controller/auth.controller")
const paymentController = require("../controller/payment.controller");

// 결제 내역 조회
router.get("/", /* auth 연결예정 */ paymentController.getPayments); // 결제 내역 확인
router.get("/:id", /* auth 연결예정 */ paymentController.getPaymentDetail); // 결제 내역 상세 확인

// 결제 생성 (일회성, 구독 시작)
router.post("/", /* auth 연결예정 */ paymentController.createPayment);

// 구독 플랜 변경 (basic <-> premium)
router.patch("/subscription", /* auth 연결예정 */ paymentController.updatePayment);

// 구독 해지
router.delete("/subscription", /* auth 연결예정 */ paymentController.deletePayment);

module.exports = router;
