// 결제 관련 스케쥴링
// node.js 스케쥴러 node-cron

// 기능
// 1. 만료된 hold 정리
// 2. 구독 추가분 자동 리셋
// 3. 무료 횟수 자동 리셋

const cron = require("node-cron");
const expireHoldsJob = require("./expireHolds.job");
const subscriptionResetJob = require("./subscriptionReset.job");
const freeResetJob = require("./freeReset.job");

function startJobs() {
  // 1분 마다 실행
  cron.schedule("* * * * *", async () => {
    await expireHoldsJob.run();
  });

  // 5분 마다 실행
  cron.schedule("*/5 * * * *", async () => {
    await subscriptionResetJob.run();
  });

  // 10분마다 실행
  cron.schedule("*/10 * * * *", async () => {
    await freeResetJob.run();
  });
}

module.exports = { startJobs };
