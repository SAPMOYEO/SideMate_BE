// 유저의 AI 사용 가능 횟수와 리셋 규칙 관리

//*** mongoose 세팅 ***//
const mongoose = require("mongoose");

const User = require("./User");

const aiQuotaSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.ObjectId, ref: User, required: true },

    // 무료 플랜 : Free 사용 가능 횟수
    freeRemaining: { type: Number, default: 3, min: 0, max: 3 },
    freeCycleAnchorAt: { type: Date }, // 무료 플랜 시작일
    freeResetAt: { type: Date }, // 무료 플랜 시작일 + 1개월(달력기준)

    // 구독 플랜 : Basic, Premium / 현재 남아있는 구독 추가분
    subExtraRemaining: { type: Number, default: 0, min: 0 }, // 비구독 사용자는 0 -> default:0
    subExtraResetAt: { type: Date }, // 다음 결제일,리셋일 = Subscription.currentPeriodEnd

    // - 기간마다 지급되는 추가분
    subGrantPerPeriod: { type: Number, default: 0, min: 0 }, // basic : 2추가, premium : 5 추가
    subCarryCap: { type: Number, default: 0, min: 0 }, // 이월 최대치(2배수까지만)

    // 1회성 충전 크래딧, 만료 기간 없음
    topUpRemaining: { type: Number, default: 0, min: 0 }, // 기본유저 충전 안 한 상태 -> default:0

    // 실패시 차감 0 관리
    holds: {
      topUp: { type: Number, default: 0, min: 0 },
      subExtra: { type: Number, default: 0, min: 0 },
      free: { type: Number, default: 0, min: 0 },
    },
  },
  { timestamps: true },
);

const AiQuota = mongoose.model("AiQuota", aiQuotaSchema);
module.exports = AiQuota;
