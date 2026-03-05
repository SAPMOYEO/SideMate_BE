// 결제 관련
// - createPayment: 1회성 결제 or 구독 시작 결제
// - updatePayment: 구독 플랜 변경(결제 기록 생성 + 구독/쿼터 갱신)
// - deletePayment: 구독 해지(상태 변경 + 추가분 소멸)
// - getPayments/getPayment: 결제 내역 조회

const Payment = require("../model/Payment");
const Subscription = require("../model/Subscription");
const AiQuota = require("../model/AiQuota");

const { TOPUP_UNIT_PRICE_KRW, PLANS } = require("../constants/plans");
const { addOneMonthCalendar } = require("../utils/date.util");

function assertUser(userId) {
  if (!userId) throw new Error("UNAUTHORIZED");
}
function assertIdempotencyKey(key) {
  if (!key || typeof key !== "string") throw new Error("IDEMPOTENCY_KEY_REQUIRED");
}
function assertMethod(method) {
  if (!["CARD", "CASH"].includes(method)) throw new Error("INVALID_METHOD");
}
function assertType(type) {
  if (!["TOPUP", "SUBSCRIPTION"].includes(type)) throw new Error("INVALID_TYPE");
}
function assertPlan(plan) {
  if (!["basic", "premium"].includes(plan)) throw new Error("INVALID_PLAN");
}
async function ensureQuotaDoc(userId) {
  await AiQuota.findOneAndUpdate({ userId }, { $setOnInsert: { userId } }, { upsert: true });
}

const paymentController = {};

// 결제 목록
paymentController.getPayments = async (req, res) => {
  try {
    const { userId } = req;
    assertUser(userId);

    const payments = await Payment.find({ userId }).sort({ createdAt: -1 });
    const subscription = await Subscription.findOne({ userId });

    return res.status(200).json({
      status: "success",
      payments,
      subscription: subscription || null,
    });
  } catch (err) {
    return res.status(400).json({ status: "fail", error: err.message });
  }
};

// 결제 목록 상세
paymentController.getPaymentDetail = async (req, res) => {
  try {
    const { userId } = req;
    const { id } = req.params;

    assertUser(userId);

    const payment = await Payment.findOne({ _id: id, userId });
    if (!payment) throw new Error("PAYMENT_NOT_FOUND");

    return res.status(200).json({ status: "success", payment });
  } catch (err) {
    return res.status(400).json({ status: "fail", error: err.message });
  }
};

// 결제 하기
paymentController.createPayment = async (req, res) => {
  try {
    const { userId } = req;
    const { idempotencyKey, method, type } = req.body;

    assertUser(userId);
    assertIdempotencyKey(idempotencyKey);
    assertMethod(method);
    assertType(type);

    // 이미 처리된 결제면 그대로 반환
    const existing = await Payment.findOne({ idempotencyKey, userId });
    if (existing) {
      const quota = await AiQuota.findOne({ userId });
      const subscription = await Subscription.findOne({ userId });
      return res.status(200).json({
        status: "success",
        message: "ALREADY_PROCESSED",
        payment: existing,
        quota,
        subscription: subscription || null,
      });
    }

    await ensureQuotaDoc(userId);

    // 1) 1회성 결제
    if (type === "TOPUP") {
      const qty = Number(req.body.quantity);
      if (!Number.isInteger(qty) || qty <= 0) throw new Error("INVALID_QUANTITY");

      const amountKRW = TOPUP_UNIT_PRICE_KRW * qty;

      const payment = await Payment.create({
        userId,
        idempotencyKey,
        method,
        type: "TOPUP",
        quantity: qty,
        amountKRW,
        status: "PAID",
      });

      const quota = await AiQuota.findOneAndUpdate(
        { userId },
        { $inc: { topupRemaining: qty } },
        { new: true },
      );

      return res.status(200).json({ status: "success", payment, quota });
    }

    // 2) 구독 플랜 시작 결제
    const plan = req.body.plan;
    assertPlan(plan);

    const rule = PLANS[plan];
    const now = new Date();
    const periodEnd = addOneMonthCalendar(now);

    const payment = await Payment.create({
      userId,
      idempotencyKey,
      method,
      type: "SUBSCRIPTION",
      plan,
      quantity: 0,
      amountKRW: rule.priceKRW,
      status: "PAID",
    });

    const subscription = await Subscription.findOneAndUpdate(
      { userId },
      {
        $set: {
          plan,
          status: "active",
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          canceledAt: null,
        },
      },
      { new: true, upsert: true },
    );

    const quotaNow = await AiQuota.findOne({ userId });
    const current = quotaNow?.subExtraRemaining ?? 0;
    const next = Math.min(current + rule.extraGrant, rule.extraCap);

    const quota = await AiQuota.findOneAndUpdate(
      { userId },
      {
        $set: {
          subExtraGrantPerPeriod: rule.extraGrant,
          subExtraCarryCap: rule.extraCap,
          subExtraResetAt: periodEnd,
          subExtraRemaining: next,
        },
      },
      { new: true },
    );

    return res.status(200).json({ status: "success", payment, subscription, quota });
  } catch (err) {
    return res.status(400).json({ status: "fail", error: err.message });
  }
};

// 결제 변경시 업데이트 하기
paymentController.updatePayment = async (req, res) => {
  try {
    const { userId } = req;
    const { idempotencyKey, method, plan } = req.body;

    assertUser(userId);
    assertIdempotencyKey(idempotencyKey);
    assertMethod(method);
    assertPlan(plan);

    const existing = await Payment.findOne({ idempotencyKey, userId });
    if (existing) {
      const quota = await AiQuota.findOne({ userId });
      const subscription = await Subscription.findOne({ userId });
      return res.status(200).json({
        status: "success",
        message: "ALREADY_PROCESSED",
        payment: existing,
        quota,
        subscription: subscription || null,
      });
    }

    const currentSub = await Subscription.findOne({ userId });
    if (!currentSub || currentSub.status !== "active") {
      throw new Error("NO_ACTIVE_SUBSCRIPTION");
    }

    const rule = PLANS[plan];
    const now = new Date();
    const periodEnd = addOneMonthCalendar(now);

    // 플랜 변경도 "결제 발생"처럼 기록 남김(데모)
    const payment = await Payment.create({
      userId,
      idempotencyKey,
      method,
      type: "SUBSCRIPTION",
      plan,
      quantity: 0,
      amountKRW: rule.priceKRW,
      status: "PAID",
    });

    const subscription = await Subscription.findOneAndUpdate(
      { userId },
      {
        $set: {
          plan,
          status: "active",
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          canceledAt: null,
        },
      },
      { new: true },
    );

    const quotaNow = await AiQuota.findOne({ userId });
    const current = quotaNow?.subExtraRemaining ?? 0;
    const next = Math.min(current + rule.extraGrant, rule.extraCap);

    const quota = await AiQuota.findOneAndUpdate(
      { userId },
      {
        $set: {
          subExtraGrantPerPeriod: rule.extraGrant,
          subExtraCarryCap: rule.extraCap,
          subExtraResetAt: periodEnd,
          subExtraRemaining: next,
        },
      },
      { new: true },
    );

    return res.status(200).json({ status: "success", payment, subscription, quota });
  } catch (err) {
    return res.status(400).json({ status: "fail", error: err.message });
  }
};

// 결제 취소하기(구독 해지)
paymentController.deletePayment = async (req, res) => {
  try {
    const { userId } = req;
    assertUser(userId);

    const sub = await Subscription.findOne({ userId });
    if (!sub || sub.status !== "active") {
      const quota = await AiQuota.findOne({ userId });
      return res.status(200).json({
        status: "success",
        message: "NO_ACTIVE_SUBSCRIPTION",
        subscription: sub || null,
        quota,
      });
    }

    const now = new Date();

    const subscription = await Subscription.findOneAndUpdate(
      { userId },
      { $set: { status: "canceled", canceledAt: now } },
      { new: true },
    );

    // 중도 해지 시 구독 추가분 소멸. free/topup은 유지.
    const quota = await AiQuota.findOneAndUpdate(
      { userId },
      {
        $set: {
          subExtraRemaining: 0,
          subExtraResetAt: null,
          subExtraGrantPerPeriod: 0,
          subExtraCarryCap: 0,
        },
      },
      { new: true },
    );

    return res.status(200).json({ status: "success", subscription, quota });
  } catch (err) {
    return res.status(400).json({ status: "fail", error: err.message });
  }
};

module.exports = paymentController;
