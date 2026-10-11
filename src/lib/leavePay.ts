// 육아휴직 급여 계산 규칙과 계산 함수. 페이지(src/pages/tools/leave-pay.astro)는 이 파일만 바라본다.
//
// 금액 근거 (AS_OF에 직접 열어 확인한 것만 적는다. SOURCES와 1:1)
//  - 고용24 육아휴직급여 제도안내(최종 수정 2025-09-15): 1~3개월 통상임금 100%·상한 250만 원, 4~6개월 100%·상한 200만 원,
//    7개월 이후 80%·상한 160만 원. 부모 함께(6+6): 자녀 생후 18개월 이내에 부모 모두(동시 또는 순차) 사용 시 각각 첫 6개월
//    100%, 상한 250·250·300·350·400·450만 원, 7개월 이후는 일반 규칙. 한부모: 첫 3개월 100%·상한 300만 원, 이후 일반 규칙.
//  - 정책브리핑 2024-12-17: 위 금액은 2025-01-01 시행. 사후지급금 폐지(휴직 중 전액 지급).
//  - 정책브리핑 2025-12-16: 2026년 시행령 개정은 육아기 근로시간 단축급여 상한을 올렸고, 육아휴직 급여 구간·상한 변경은 없다.
//  - 찾기쉬운 생활법령정보(기준일 2026-09-15): 시행령 제95조제1항(구간·상한·하한 70만 원), 제95조의3(부모 모두·한부모 특례) 조문 인용.
// 값이 바뀌면 이 파일과 public/tools/_registry.json의 asOf를 같은 날짜로 고친다.

/** 규칙의 기준 연도. null이면 페이지에 "[기준 연도]" 자리표시가 보인다. */
export const BASIS_YEAR: number | null = 2026;
/** 출처를 직접 확인한 날 */
export const AS_OF = '2026-10-12';

export type Mode = 'general' | 'both' | 'single';
export interface ModeInfo { id: Mode; label: string; note: string }
export const MODES: ModeInfo[] = [
  { id: 'general', label: '일반', note: '한 사람이 쓰는 일반 육아휴직입니다. 2025년 1월 1일부터 사후지급금 없이 휴직 중에 전액 지급됩니다.' },
  { id: 'both', label: '부모 함께 (6+6)', note: '자녀 생후 18개월 안에 부모가 모두(동시 또는 순차로) 육아휴직을 쓰면 각자 첫 6개월에 특례 상한이 적용됩니다. 이 계산기는 한 사람 분을 계산합니다.' },
  { id: 'single', label: '한부모', note: '한부모가족지원법상 한부모 근로자는 첫 3개월 상한이 300만 원입니다. 4개월째부터는 일반 규칙과 같습니다.' },
];

export interface Rule {
  /** 이 규칙이 적용되는 마지막 개월 (1부터 세어 upTo개월째까지) */
  upTo: number;
  /** 통상임금 대비 지급률 (1.0 = 100%) */
  rate: number;
  /** 월 상한액(원) */
  cap: number;
}

const GENERAL: Rule[] = [
  { upTo: 3, rate: 1.0, cap: 2_500_000 },
  { upTo: 6, rate: 1.0, cap: 2_000_000 },
  { upTo: 12, rate: 0.8, cap: 1_600_000 },
];
const BOTH: Rule[] = [
  { upTo: 1, rate: 1.0, cap: 2_500_000 },
  { upTo: 2, rate: 1.0, cap: 2_500_000 },
  { upTo: 3, rate: 1.0, cap: 3_000_000 },
  { upTo: 4, rate: 1.0, cap: 3_500_000 },
  { upTo: 5, rate: 1.0, cap: 4_000_000 },
  { upTo: 6, rate: 1.0, cap: 4_500_000 },
  { upTo: 12, rate: 0.8, cap: 1_600_000 },
];
const SINGLE: Rule[] = [
  { upTo: 3, rate: 1.0, cap: 3_000_000 },
  { upTo: 6, rate: 1.0, cap: 2_000_000 },
  { upTo: 12, rate: 0.8, cap: 1_600_000 },
];
export const RULES: Record<Mode, Rule[]> = { general: GENERAL, both: BOTH, single: SINGLE };

/** 월 하한액(원) */
export const FLOOR = 700_000;

export const MAX_MONTHS = 12;
export const DEFAULT_WAGE = 3_000_000;

export const SOURCES = [
  { title: '고용24 · 육아휴직급여 제도안내 (최종 수정 2025-09-15) — 구간별 지급률·상한, 부모 함께(6+6), 한부모', url: 'https://www.work24.go.kr/cm/c/f/1100/selecSystInfo.do?systClId=SC00000251&systId=SI00000402' },
  { title: '대한민국 정책브리핑 · 내년부터 육아휴직 급여 월 최대 250만 원 (2024-12-17) — 2025-01-01 시행, 사후지급금 폐지', url: 'https://www.korea.kr/news/policyNewsView.do?newsId=148937569' },
  { title: '대한민국 정책브리핑 · 육아휴직 대체인력 지원 1개월 연장 (2025-12-16) — 2026년 개정 사항, 육아휴직 급여 상한 변경 없음', url: 'https://www.korea.kr/news/policyNewsView.do?newsId=148956574' },
  { title: '찾기쉬운 생활법령정보 · 육아휴직 급여 (기준일 2026-09-15) — 고용보험법 시행령 제95조·제95조의3 조문 인용, 하한 70만 원', url: 'https://easylaw.go.kr/CSP/CnpClsMain.laf?popMenu=ov&csmSeq=1380&ccfNo=2&cciNo=1&cnpClsNo=2' },
];

export function ruleFor(month: number, mode: Mode = 'general'): Rule {
  const rules = RULES[mode];
  return rules.find(r => month <= r.upTo) ?? rules[rules.length - 1];
}

/** 한 달치 지급액: min(통상임금 × 지급률, 상한)을 하한으로 받친다. 임금이 0이면 0. */
export function monthlyPay(wage: number, month: number, mode: Mode = 'general'): number {
  if (!(wage > 0)) return 0;
  const r = ruleFor(month, mode);
  return Math.max(FLOOR, Math.min(wage * r.rate, r.cap));
}

export function calcLeavePay(wage: number, months: number, mode: Mode = 'general') {
  const n = Math.min(MAX_MONTHS, Math.max(0, Math.floor(months)));
  const amounts = Array.from({ length: n }, (_, i) => monthlyPay(wage, i + 1, mode));
  const total = amounts.reduce((a, b) => a + b, 0);
  return { amounts, total, avg: n ? total / n : 0, max: Math.max(1, ...amounts) };
}

/** 계산 방식 표에 쓰는 구간 이름: "1–3개월", "4개월", "7개월~" */
export function ruleLabel(rules: Rule[], i: number): string {
  const from = i === 0 ? 1 : rules[i - 1].upTo + 1;
  const to = rules[i].upTo;
  if (i === rules.length - 1) return `${from}개월~`;
  return from === to ? `${from}개월` : `${from}–${to}개월`;
}

export const won = (v: number) => Math.round(v).toLocaleString('ko-KR');
