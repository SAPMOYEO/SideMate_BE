// 결제 관련
// - createPayment: 1회성 결제 or 구독 시작 결제
// - updatePayment: 구독 플랜 변경(결제 기록 생성 + 구독/쿼터 갱신)
// - deletePayment: 구독 해지(상태 변경 + 추가분 소멸)
// - getPayments/getPaymentDetail: 결제 내역 조회 / 결제내역 상세조회

const User = require("../model/User");
const Payment = require("../model/Payment");
const Subscription = require("../model/Subscription");
const AiQuota = require("../model/AiQuota");

const { addOneMonthCalendar } = require("../utils/date.util");
const { TOPUP_UNIT_PRICE_KRW, PLANS } = require("../constants/plans");

function assertUser(userId) {
  if (!userId) throw new Error("UNAUTHORIZED");
}

function assertIdempotencyKey(key) {
  if (!key || typeof key !== "string") {
    throw new Error("IDEMPOTENCY_KEY_REQUIRED");
  }
}

function assertMethod(method) {
  if (!["CARD", "CASH"].includes(method)) {
    throw new Error("INVALID_METHOD");
  }
}

function assertType(type) {
  if (!["TOPUP", "SUBSCRIPTION"].includes(type)) {
    throw new Error("INVALID_TYPE");
  }
}

function assertPlan(plan) {
  if (!["basic", "premium"].includes(plan)) {
    throw new Error("INVALID_PLAN");
  }
}

async function ensureQuotaDoc(userId) {
  await AiQuota.findOneAndUpdate(
    { userId },
    { $setOnInsert: { userId } },
    { upsert: true, returnDocument: "after" },
  );
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
    return res.status(400).json({
      status: "fail",
      error: err.message,
    });
  }
};

// 결제 상세
paymentController.getPaymentDetail = async (req, res) => {
  try {
    const { userId } = req;
    const { id } = req.params;

    assertUser(userId);

    const payment = await Payment.findOne({ _id: id, userId });
    if (!payment) throw new Error("PAYMENT_NOT_FOUND");

    return res.status(200).json({
      status: "success",
      payment,
    });
  } catch (err) {
    return res.status(400).json({
      status: "fail",
      error: err.message,
    });
  }
};

// 결제 생성
paymentController.createPayment = async (req, res) => {
  try {
    const { userId } = req;
    const { idempotencyKey, method, type, cardLastFour, bankName, accountNumberMasked } = req.body;

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

    // 1회성 충전 결제
    if (type === "TOPUP") {
      const qty = Number(req.body.quantity);
      const topupUnitPrice = Number(TOPUP_UNIT_PRICE_KRW);

      if (!Number.isInteger(qty) || qty <= 0) {
        throw new Error("INVALID_QUANTITY");
      }

      if (!Number.isFinite(topupUnitPrice) || topupUnitPrice <= 0) {
        throw new Error("INVALID_TOPUP_UNIT_PRICE");
      }

      const payAmount = topupUnitPrice * qty;

      const payment = await Payment.create({
        userId,
        idempotencyKey,
        method,
        type: "TOPUP",
        quantity: qty,
        payAmount,
        status: "PAID",
        cardLastFour: method === "CARD" ? cardLastFour : undefined,
        bankName: method === "CASH" ? bankName : undefined,
        accountNumberMasked: method === "CASH" ? accountNumberMasked : undefined,
      });

      const quota = await AiQuota.findOneAndUpdate(
        { userId },
        { $inc: { topUpRemaining: qty } },
        { returnDocument: "after" },
      );
      return res.status(200).json({
        status: "success",
        payment,
        quota,
      });
    }

    // 구독 시작 결제
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
      payAmount: rule.priceKRW,
      status: "PAID",
      cardLastFour: method === "CARD" ? cardLastFour : undefined,
      bankName: method === "CASH" ? bankName : undefined,
      accountNumberMasked: method === "CASH" ? accountNumberMasked : undefined,
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
      { upsert: true, returnDocument: "after" },
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
      { returnDocument: "after" },
    );

    // 구독 플랜 결제 시 티어 변경하기
    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          tier: plan === "basic" ? "BASIC" : "PREMIUM",
        },
      },
      { new: true },
    );

    return res.status(200).json({
      status: "success",
      payment,
      subscription,
      quota,
      user,
    });
  } catch (err) {
    return res.status(400).json({
      status: "fail",
      error: err.message,
    });
  }
};

// 결제 변경(구독 플랜 변경)
paymentController.updatePayment = async (req, res) => {
  try {
    const { userId } = req;
    const { idempotencyKey, method, plan, cardLastFour, bankName, accountNumberMasked } = req.body;

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

    const payment = await Payment.create({
      userId,
      idempotencyKey,
      method,
      type: "SUBSCRIPTION",
      plan,
      quantity: 0,
      payAmount: rule.priceKRW,
      status: "PAID",
      cardLastFour: method === "CARD" ? cardLastFour : undefined,
      bankName: method === "CASH" ? bankName : undefined,
      accountNumberMasked: method === "CASH" ? accountNumberMasked : undefined,
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
      { returnDocument: "after" },
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
      { returnDocument: "after" },
    );

    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          tier: plan === "basic" ? "BASIC" : "PREMIUM",
        },
      },
      { new: true },
    );

    return res.status(200).json({
      status: "success",
      payment,
      subscription,
      quota,
      user,
    });
  } catch (err) {
    return res.status(400).json({
      status: "fail",
      error: err.message,
    });
  }
};

// 결제 취소(구독 해지)
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
      {
        $set: {
          status: "canceled",
          canceledAt: now,
        },
      },
      { returnDocument: "after" },
    );

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
      { returnDocument: "after" },
    );

    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          tier: "FREE",
        },
      },
      { new: true },
    );

    return res.status(200).json({
      status: "success",
      subscription,
      quota,
      user,
    });
  } catch (err) {
    return res.status(400).json({
      status: "fail",
      error: err.message,
    });
  }
};

module.exports = paymentController;
