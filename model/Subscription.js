// 유저의 구독 상태 확인, 구독이 존재 할 때만(=== 구독플랜 결제시에만 생성)

//*** mongoose 세팅 ***//
const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.ObjectId, ref: User, required: true },
    plan: { type: String, enum: ["basic", "premium"], required: true }, // free: 구독 없음
    status: { type: String, enum: ["active", "canceled"], default: "active" },

    currentPeriodStart: { type: Date, required: true }, // 결제일 기반
    currentPeriodEnd: { type: Date, required: true }, // 다음 결제일(= 다음 리셋일): currentPeriodStart + 1개월(달력 기준)

    canceledAt: { type: Date }, // 중도 해지 시점
  },
  { timestamps: true },
);

const Subscription = mongoose.model("Subscription", subscriptionSchema);
module.exports = Subscription;
