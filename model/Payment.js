// 결제 관련

//*** mongoose 세팅 ***//
const mongoose = require("mongoose");

// const User = require("./User");

const paymentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.ObjectId, ref: User, required: true },
    idempotencyKey: { type: String, required: true, unique: true }, // 버튼 연타 중복 결제 차단
    method: { type: String, enum: ["CARD", "CASH"], required: true }, // 카드, 현금
    type: { type: String, enum: ["TOPUP", "SUBSCRIPTION"], required: true }, // 1회성충전,구독

    plan: { type: String, enum: ["basic", "premium"] }, // 구독 플랜, 1회성 충전일 땐 요청X
    quantity: { type: Number, default: 0, min: 0 }, // 1회성 충전일 때만 수량

    payAmount: { type: Number, required: true, min: 0 },

    status: { type: String, enum: ["PAID", "CANCELED"], default: "PAID" }, // 결제 상태
  },
  { timestamps: true },
);

paymentSchema.index({ userId: 1, createdAt: -1 }); // 유저 결제 기록

const Payment = mongoose.model("Payment", paymentSchema);
module.exports = Payment;
