// 육아휴직 급여 계산 함수. 페이지(src/pages/tools/leave-pay.astro)는 이 파일만 바라본다.
//
// 금액과 근거는 src/data/rules/leave-pay.json에 있다(출처별 확인 내용은 sources[].note).
// 사업주 지원금 계산기(src/lib/employerSubsidy.ts)와 같은 규칙 파일 형식이다(src/lib/rules.ts).
// 값이 바뀌면 JSON에 새 version을 추가하고 asOf와 public/tools/_registry.json의 asOf를 같은 날짜로 고친다.
import data from '../data/rules/leave-pay.json' with { type: 'json' };
import { latestValues, type RuleFile } from './rules.ts';

export type Mode = 'general' | 'both' | 'single';

export interface Rule {
  /** 이 규칙이 적용되는 마지막 개월 (1부터 세어 upTo개월째까지) */
  upTo: number;
  /** 통상임금 대비 지급률 (1.0 = 100%) */
  rate: number;
  /** 월 상한액(원) */
  cap: number;
}

interface LeavePayValues {
  floor: number;
  modes: Record<Mode, Rule[]>;
}

const file = data as RuleFile<LeavePayValues>;
const values = latestValues(file);

/** 규칙의 기준 연도. null이면 페이지에 "[기준 연도]" 자리표시가 보인다. */
export const BASIS_YEAR: number | null = file.basisYear;
/** 출처를 직접 확인한 날 */
export const AS_OF = file.asOf;

export interface ModeInfo { id: Mode; label: string; note: string }
export const MODES: ModeInfo[] = [
  { id: 'general', label: '일반', note: '한 사람이 쓰는 일반 육아휴직입니다. 2025년 1월 1일부터 사후지급금 없이 휴직 중에 전액 지급됩니다.' },
  { id: 'both', label: '부모 함께 (6+6)', note: '자녀 생후 18개월 안에 부모가 모두(동시 또는 순차로) 육아휴직을 쓰면 각자 첫 6개월에 특례 상한이 적용됩니다. 이 계산기는 한 사람 분을 계산합니다.' },
  { id: 'single', label: '한부모', note: '한부모가족지원법상 한부모 근로자는 첫 3개월 상한이 300만 원입니다. 4개월째부터는 일반 규칙과 같습니다.' },
];

export const RULES: Record<Mode, Rule[]> = values.modes;

/** 월 하한액(원) */
export const FLOOR = values.floor;

export const MAX_MONTHS = 12;
export const DEFAULT_WAGE = 3_000_000;

export const SOURCES = file.sources.map(s => ({ title: s.title, url: s.url }));

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
