// 육아휴직 급여 계산 규칙과 계산 함수.
// 페이지(src/pages/tools/leave-pay.astro)는 이 파일만 바라본다.
//
// TODO: 아래 지급률·상한·하한은 design/Calculator.dc.html 시안의 예시 값이다.
//       기준 연도의 고용노동부 고시(고용24)에서 확인한 값으로 바꾸고 BASIS_YEAR를 채운 뒤,
//       public/tools/_registry.json의 asOf도 같은 날짜로 맞춘다.

/** 규칙의 기준 연도. null이면 페이지에 "[기준 연도]" 자리표시가 보인다. */
export const BASIS_YEAR: number | null = null;

export interface Rule {
  /** 이 규칙이 적용되는 마지막 개월 (1부터 세어 upTo개월째까지) */
  upTo: number;
  /** 통상임금 대비 지급률 (1.0 = 100%) */
  rate: number;
  /** 월 상한액(원) */
  cap: number;
}

export const RULES: Rule[] = [
  { upTo: 3, rate: 1.0, cap: 2_500_000 },  // TODO 예시 값: 1~3개월
  { upTo: 6, rate: 1.0, cap: 2_000_000 },  // TODO 예시 값: 4~6개월
  { upTo: 12, rate: 0.8, cap: 1_600_000 }, // TODO 예시 값: 7개월~
];

/** 월 하한액(원) */
export const FLOOR = 700_000; // TODO 예시 값

export const MAX_MONTHS = 12;
export const DEFAULT_WAGE = 3_000_000;

export function ruleFor(month: number): Rule {
  return RULES.find(r => month <= r.upTo) ?? RULES[RULES.length - 1];
}

/** 한 달치 지급액: min(통상임금 × 지급률, 상한)을 하한으로 받친다. 임금이 0이면 0. */
export function monthlyPay(wage: number, month: number): number {
  if (!(wage > 0)) return 0;
  const r = ruleFor(month);
  return Math.max(FLOOR, Math.min(wage * r.rate, r.cap));
}

export function calcLeavePay(wage: number, months: number) {
  const n = Math.min(MAX_MONTHS, Math.max(0, Math.floor(months)));
  const amounts = Array.from({ length: n }, (_, i) => monthlyPay(wage, i + 1));
  const total = amounts.reduce((a, b) => a + b, 0);
  return { amounts, total, avg: n ? total / n : 0, max: Math.max(1, ...amounts) };
}

/** 계산 방식 표에 쓰는 구간 이름: "1–3개월", "4–6개월", "7개월~" */
export function ruleLabel(i: number): string {
  const from = i === 0 ? 1 : RULES[i - 1].upTo + 1;
  return i === RULES.length - 1 ? `${from}개월~` : `${from}–${RULES[i].upTo}개월`;
}

export const won = (v: number) => Math.round(v).toLocaleString('ko-KR');
