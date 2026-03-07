// 구독 결제일, 리셋일 관리

function addOneMonthCalendar(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = d.getMonth();
  const day = d.getDate();

  const next = new Date(
    year,
    month + 1,
    day,
    d.getHours(),
    d.getMinutes(),
    d.getSeconds(),
    d.getMilliseconds(),
  );

  // 다음달에 같은 일이 없어서 월이 튀면 말일로 보정
  if (next.getMonth() !== (month + 1) % 12) {
    return new Date(
      year,
      month + 2,
      0,
      d.getHours(),
      d.getMinutes(),
      d.getSeconds(),
      d.getMilliseconds(),
    );
  }

  return next;
}

module.exports = { addOneMonthCalendar };
