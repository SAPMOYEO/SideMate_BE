// AI 사용 관련 스키마

//*** mongoose 세팅 ***//
const mongoose = require("mongoose");

const aiUsageSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.ObjectId, ref: User, required: true },
    requestId: { type: String, required: true, unique: true }, // 연타, 재시도 등 요청 한 번 처리되게 방지
    postId: { type: mongoose.Schema.Types.ObjectId, ref: Project }, // 게시글 등록 스키마 참조
    amount: { type: Number, default: 1, min: 1 }, // 1회 요청->1회 차감

    state: {
      type: String,
      enum: ["HOLD", "SUCCESS", "FAILED", "CANCELED", "EXPIRED"],
      default: "HOLD",
      index: true,
    },
    // -> 요청시점(HOLD), 요청성공(SUCCESS), 요청실패(FAILED), 요청취소(CANCELED), 요청만료(EXPIRED)

    expiresAt: { type: Date, required: true, index: true },

    completedAt: { type: Date },
  },
  { timestamps: true },
);

aiUsageSchema.index({ userId: 1, createdAt: -1 });
aiUsageSchema.index({ userId: 1, state: 1, expiresAt: 1 });

const AiUsage = mongoose.model("AiUsage", aiUsageSchema);
module.exports = AiUsage;
