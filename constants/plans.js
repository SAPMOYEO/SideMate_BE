// 구독 플랜 규칙 상수

module.exports = {
  // 무료 플랜 기본 지급량
  FREE_GRANT: 3,

  // 구독 플랜 규칙
  // extraGrant: 기간마다 추가로 지급되는 횟수
  // extraCap: 이월 가능한 최대치(2배 cap)
  PLANS: {
    basic: { priceKRW: 29000, extraGrant: 2, extraCap: 4 },
    premium: { priceKRW: 59000, extraGrant: 5, extraCap: 10 },
  },

  // HOLD 만료 기본 시간(분)
  HOLD_EXPIRE_MINUTES: 3,
};
