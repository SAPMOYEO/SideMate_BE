// 실패 차감 0을 보장하기 위한 예약(HOLD) 기반 로직
// 차감 우선순위: 1회성(topUp) -> 구독(subExtra) -> 무료(free)
// 사용 가능 계산: remaining - holds

const AiQuota = require("../model/AiQuota");
const AiUsage = require("../model/AiUsage");
const { HOLD_EXPIRE_MINUTES } = require("../constants/plans");

function calcExpiresAt() {
  return new Date(Date.now() + HOLD_EXPIRE_MINUTES * 60 * 1000);
}

function pickBucket(quota) {
  const holds = quota.holds || {};
  const topUpHold = holds.topUp || 0;
  const subExtraHold = holds.subExtra || 0;
  const freeHold = holds.free || 0;

  if ((quota.topUpRemaining || 0) - topUpHold > 0) return "topUp";
  if ((quota.subExtraRemaining || 0) - subExtraHold > 0) return "subExtra";
  if ((quota.freeRemaining || 0) - freeHold > 0) return "free";
  return null;
}

const aiUsageService = {};

// HOLD 생성
aiUsageService.createHold = async ({ userId, requestId, postId }) => {
  if (!userId) throw new Error("UNAUTHORIZED");
  if (!requestId) throw new Error("REQUEST_ID_REQUIRED");

  // 멱등 처리: 같은 requestId 재요청이면 기존 usage 반환
  const existing = await AiUsage.findOne({ requestId, userId });
  if (existing) return { usage: existing };

  // quota 문서 없으면 생성
  const quota = await AiQuota.findOneAndUpdate(
    { userId },
    { $setOnInsert: { userId } },
    { new: true, upsert: true },
  );

  const bucket = pickBucket(quota);
  if (!bucket) throw new Error("NO_QUOTA_AVAILABLE");

  const usage = await AiUsage.create({
    userId,
    requestId,
    postId: postId || undefined,
    bucket,
    amount: 1,
    state: "HOLD",
    expiresAt: calcExpiresAt(),
  });

  // 예약만 증가
  await AiQuota.updateOne({ userId }, { $inc: { [`holds.${bucket}`]: 1 } });

  return { usage };
};

// AI 요청 성공 후 실행 COMMIT: 성공 확정(remaining -1, holds -1)
aiUsageService.commitHold = async ({ userId, requestId }) => {
  if (!userId) throw new Error("UNAUTHORIZED");
  if (!requestId) throw new Error("REQUEST_ID_REQUIRED");

  const usage = await AiUsage.findOne({ requestId, userId });
  if (!usage) throw new Error("USAGE_NOT_FOUND");
  if (usage.state !== "HOLD") throw new Error("NOT_IN_HOLD_STATE");

  const bucket = usage.bucket;

  const quotaUpdate = await AiQuota.updateOne(
    {
      userId,
      [`holds.${bucket}`]: { $gte: 1 },
      ...(bucket === "topUp" ? { topUpRemaining: { $gte: 1 } } : {}),
      ...(bucket === "subExtra" ? { subExtraRemaining: { $gte: 1 } } : {}),
      ...(bucket === "free" ? { freeRemaining: { $gte: 1 } } : {}),
    },
    {
      $inc: {
        [`holds.${bucket}`]: -1,
        ...(bucket === "topUp" ? { topUpRemaining: -1 } : {}),
        ...(bucket === "subExtra" ? { subExtraRemaining: -1 } : {}),
        ...(bucket === "free" ? { freeRemaining: -1 } : {}),
        totalUsed: usage.amount,
      },
    },
  );

  if (quotaUpdate.modifiedCount !== 1) throw new Error("QUOTA_UPDATE_FAILED");

  usage.state = "SUCCESS";
  usage.completedAt = new Date();
  await usage.save();

  return { usage };
};

// AI 요청 실패 후 실행 CANCEL: 실패/취소(holds만 -1, remaining 유지)
aiUsageService.cancelHold = async ({ userId, requestId, reason, errorMessage }) => {
  if (!userId) throw new Error("UNAUTHORIZED");
  if (!requestId) throw new Error("REQUEST_ID_REQUIRED");

  const usage = await AiUsage.findOne({ requestId, userId });
  if (!usage) throw new Error("USAGE_NOT_FOUND");
  if (usage.state !== "HOLD") throw new Error("NOT_IN_HOLD_STATE");

  const bucket = usage.bucket;
  const nextState = reason === "CANCELED" ? "CANCELED" : "FAILED";

  const quotaUpdate = await AiQuota.updateOne(
    { userId, [`holds.${bucket}`]: { $gte: 1 } },
    { $inc: { [`holds.${bucket}`]: -1 } },
  );

  if (quotaUpdate.modifiedCount !== 1) throw new Error("HOLD_RELEASE_FAILED");

  usage.state = nextState;
  usage.reason = reason || undefined;
  usage.errorMessage = errorMessage || undefined;
  usage.completedAt = new Date();
  await usage.save();

  return { usage };
};

module.exports = aiUsageService;
