const mongoose = require("mongoose");

const User = require("./User");
const Project = require("./Project");

const aiUsageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.ObjectId,
      ref: User,
      required: true,
    },

    // 같은 요청 중복 처리 방지용
    requestId: {
      type: String,
      required: true,
      unique: true,
    },

    // 생성 전이면 없을 수도 있고, 생성 후 상세페이지 요청이면 연결 가능
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: Project,
      default: null,
    },

    // 어떤 자원에서 차감 예약되었는지
    bucket: {
      type: String,
      enum: ["topUp", "subExtra", "free"],
      required: true,
    },

    // 1회 요청 = 1회 차감
    amount: {
      type: Number,
      default: 1,
      min: 1,
    },

    state: {
      type: String,
      enum: ["HOLD", "SUCCESS", "FAILED", "CANCELED", "EXPIRED"],
      default: "HOLD",
      index: true,
    },

    // 실패/취소 이유 기록용
    reason: {
      type: String,
    },

    // 에러 메시지 기록용
    errorMessage: {
      type: String,
    },

    // HOLD 만료 시간
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },

    // 완료 시간
    completedAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

aiUsageSchema.index({ userId: 1, createdAt: -1 });
aiUsageSchema.index({ userId: 1, state: 1, expiresAt: 1 });

const AiUsage = mongoose.model("AiUsage", aiUsageSchema);
module.exports = AiUsage;
