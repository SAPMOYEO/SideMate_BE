// 결제일이 지난 active 구독을 자동 갱신
// 자동 결제 Payment 기록을 생성
// 구독 추가분을 지급

const Subscription = require("../models/Subscription");
const AiQuota = require("../models/AiQuota");
const Payment = require("../models/Payment");

const { PLANS } = require("../constants/plans");
const { addOneMonthCalendar } = require("../utils/date.util");

const subscriptionResetJob = {};

// 자동 결제용 중복 생성 방지
// 같은 유저/같은 기간에 대해 중복 Payment 생성 방지
function makeAutoRenewIdempotencyKey(userId, periodStart, plan) {
  return `AUTO_RENEW:${userId}:${plan}:${new Date(periodStart).toISOString()}`;
}

subscriptionResetJob.run = async () => {
  // 현재 시각 가져오기
  const now = new Date();

  const due = await Subscription.find({
    // 현재 active인 유저 찾기
    // 구독 만료일이 현재 시각보다 전인 경우
    status: "active",
    currentPeriodEnd: { $lte: now },
  }).limit(200);

  for (const sub of due) {
    const rule = PLANS[sub.plan];
    if (!rule) continue;

    const newStart = sub.currentPeriodEnd;
    const newEnd = addOneMonthCalendar(newStart);

    // 자동 결제용 멱등키
    const idempotencyKey = makeAutoRenewIdempotencyKey(sub.userId, newStart, sub.plan);

    // 이미 같은 자동 갱신 결제가 생성됐는지 확인
    const existingPayment = await Payment.findOne({ idempotencyKey });

    // 없을 때만 자동 결제 기록 생성
    if (!existingPayment) {
      await Payment.create({
        userId: sub.userId,
        idempotencyKey,
        method: "CARD", // 현재는 기본값 처리. 원하면 마지막 결제수단 저장 구조로 확장 가능
        type: "SUBSCRIPTION",
        plan: sub.plan,
        quantity: 0,
        amountKRW: rule.priceKRW,
        status: "PAID",
      });
    }

    // 구독 기간 갱신
    sub.currentPeriodStart = newStart;
    sub.currentPeriodEnd = newEnd;
    await sub.save();

    // quota 문서 없으면 생성
    const quota = await AiQuota.findOneAndUpdate(
      { userId: sub.userId },
      { $setOnInsert: { userId: sub.userId } },
      { new: true, upsert: true },
    );

    // 추가분 지급 + cap 적용
    const current = quota.subExtraRemaining || 0;
    const next = Math.min(current + rule.extraGrant, rule.extraCap);

    await AiQuota.updateOne(
      { userId: sub.userId },
      {
        $set: {
          subExtraGrantPerPeriod: rule.extraGrant,
          subExtraCarryCap: rule.extraCap,
          subExtraResetAt: newEnd,
          subExtraRemaining: next,
        },
      },
    );
  }

  return { processed: due.length };
};

module.exports = subscriptionResetJob;
