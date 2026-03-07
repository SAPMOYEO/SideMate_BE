// 만료된 HOLD를 EXPIRED로 전환하고 holds를 해제

const AiUsage = require("../model/AiUsage");
const AiQuota = require("../model/AiQuota");

const expireHoldsJob = {};

expireHoldsJob.run = async () => {
  // 현재 시각 확인하기
  const now = new Date();

  const expired = await AiUsage.find({
    // 아직 hold 상태인 것 확인하기
    state: "HOLD",
    expiresAt: { $lt: now },
  }).limit(500);

  for (const usage of expired) {
    // hold상태 중 버킷 확인 하기(topUp, subExtra, free)
    const bucket = usage.bucket;

    await AiQuota.updateOne(
      // hold가 1이면 1감소 => hold 해제
      { userId: usage.userId, [`holds.${bucket}`]: { $gte: 1 } },
      { $inc: { [`holds.${bucket}`]: -1 } },
    );

    // 해제 되면 expired
    usage.state = "EXPIRED";
    usage.completedAt = now;
    await usage.save();
  }

  return { processed: expired.length };
};

module.exports = expireHoldsJob;
