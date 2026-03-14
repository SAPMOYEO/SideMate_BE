// freeResetAt이 만료된 유저의 무료 횟수를 미리 리필

const AiQuota = require("../model/AiQuota");
const { FREE_GRANT } = require("../constants/plans");
const { addOneMonthCalendar } = require("../utils/date.util");

const freeResetJob = {};

freeResetJob.run = async () => {
  // 현재 시각 확인하기
  const now = new Date();

  // 무료 횟수분 리셋할 타겟 찾기
  const targets = await AiQuota.find({
    // freeResetAt 필드 있는지 아닌지 확인하기
    // 현재 시간 보다 과거인지 확인하기
    freeResetAt: { $exists: true, $ne: null, $lte: now },
  }).limit(500);

  for (const q of targets) {
    q.freeRemaining = FREE_GRANT; // 횟수 채우기
    q.freeCycleAnchorAt = now; // 이번 무료 사이클 시작
    q.freeResetAt = addOneMonthCalendar(now); // 한달 뒤 만료일 설정
    await q.save();
  }

  return { processed: targets.length };
};

module.exports = freeResetJob;
