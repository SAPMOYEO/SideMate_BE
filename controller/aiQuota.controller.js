const AiQuota = require("../model/AiQuota");

function assertUser(userId) {
  if (!userId) throw new Error("UNAUTHORIZED");
}

async function ensureQuotaDoc(userId) {
  let quota = await AiQuota.findOne({ userId });

  if (!quota) {
    quota = await AiQuota.create({
      userId,
      freeRemaining: 0,
      topUpRemaining: 0,
      subGrantPerPeriod: 0,
      subCarryCap: 0,
      subExtraRemaining: 0,
      subExtraResetAt: null,
      totalUsed: 0,
    });
  }

  return quota;
}

const aiQuotaController = {};

// 내 AI 사용량 조회
aiQuotaController.getMyQuota = async (req, res) => {
  try {
    const { userId } = req;
    assertUser(userId);

    const quota = await ensureQuotaDoc(userId);

    const totalRemaining =
      (quota.freeRemaining || 0) + (quota.topUpRemaining || 0) + (quota.subExtraRemaining || 0);

    return res.status(200).json({
      status: "success",
      quota,
      summary: {
        freeRemaining: quota.freeRemaining,
        topUpRemaining: quota.topUpRemaining,
        subExtraRemaining: quota.subExtraRemaining,
        totalRemaining,
        totalUsed: quota.totalUsed,
        subExtraResetAt: quota.subExtraResetAt,
      },
    });
  } catch (err) {
    return res.status(400).json({
      status: "fail",
      error: err.message,
    });
  }
};

// AI 사용량 차감
aiQuotaController.consumeQuota = async (req, res) => {
  try {
    const { userId } = req;
    const amount = Number(req.body.amount || 1);

    assertUser(userId);

    if (!Number.isInteger(amount) || amount <= 0) {
      throw new Error("INVALID_CONSUME_AMOUNT");
    }

    const quota = await ensureQuotaDoc(userId);

    let need = amount;
    let useSubExtra = 0;
    let useTopUp = 0;
    let useFree = 0;

    if (quota.subExtraRemaining > 0 && need > 0) {
      useSubExtra = Math.min(quota.subExtraRemaining, need);
      quota.subExtraRemaining -= useSubExtra;
      need -= useSubExtra;
    }

    if (quota.topUpRemaining > 0 && need > 0) {
      useTopUp = Math.min(quota.topUpRemaining, need);
      quota.topUpRemaining -= useTopUp;
      need -= useTopUp;
    }

    if (quota.freeRemaining > 0 && need > 0) {
      useFree = Math.min(quota.freeRemaining, need);
      quota.freeRemaining -= useFree;
      need -= useFree;
    }

    if (need > 0) {
      throw new Error("INSUFFICIENT_QUOTA");
    }

    quota.totalUsed += amount;
    await quota.save();

    const totalRemaining =
      (quota.freeRemaining || 0) + (quota.topUpRemaining || 0) + (quota.subExtraRemaining || 0);

    return res.status(200).json({
      status: "success",
      message: "QUOTA_CONSUMED",
      used: {
        amount,
        fromSubscription: useSubExtra,
        fromTopUp: useTopUp,
        fromFree: useFree,
      },
      quota,
      summary: {
        freeRemaining: quota.freeRemaining,
        topUpRemaining: quota.topUpRemaining,
        subExtraRemaining: quota.subExtraRemaining,
        totalRemaining,
        totalUsed: quota.totalUsed,
        subExtraResetAt: quota.subExtraResetAt,
      },
    });
  } catch (err) {
    return res.status(400).json({
      status: "fail",
      error: err.message,
    });
  }
};

// 무료 quota 수동 지급
aiQuotaController.addFreeQuota = async (req, res) => {
  try {
    const { userId } = req;
    const amount = Number(req.body.amount);

    assertUser(userId);

    if (!Number.isInteger(amount) || amount <= 0) {
      throw new Error("INVALID_AMOUNT");
    }

    await ensureQuotaDoc(userId);

    const quota = await AiQuota.findOneAndUpdate(
      { userId },
      { $inc: { freeRemaining: amount } },
      { new: true },
    );

    const totalRemaining =
      (quota.freeRemaining || 0) + (quota.topUpRemaining || 0) + (quota.subExtraRemaining || 0);

    return res.status(200).json({
      status: "success",
      message: "FREE_QUOTA_ADDED",
      quota,
      summary: {
        freeRemaining: quota.freeRemaining,
        topUpRemaining: quota.topUpRemaining,
        subExtraRemaining: quota.subExtraRemaining,
        totalRemaining,
        totalUsed: quota.totalUsed,
        subExtraResetAt: quota.subExtraResetAt,
      },
    });
  } catch (err) {
    return res.status(400).json({
      status: "fail",
      error: err.message,
    });
  }
};

module.exports = aiQuotaController;
