// 사업주용 출산육아기 고용안정장려금 계산 엔진. 육아휴직 1건에 대해 대체인력 / 업무분담 / 지원금만 시나리오를 비교한다.
//
// 금액·요건과 근거는 src/data/rules/employer-subsidy.json에 있다(규칙 파일 형식은 src/lib/rules.ts).
// 날짜는 모두 'YYYY-MM-DD' 문자열이고, 끝 날짜는 그날을 포함한다.
//
// 해석으로 정한 것 (출처에 명시가 없어 고른 것. 바뀌면 여기와 테스트를 같이 고친다)
//  - 개월 수: 시작일부터 한 달씩 센다. 1개월이 안 되는 나머지는 '남은 일수 ÷ 그 달의 총일수'로 일할한다(센터 해설).
//  - 원 단위 미만은 버린다(줄마다). 실제 지급액보다 크게 보이지 않게 하려는 것이다.
//  - 특례 자격: 휴직 시작일에 자녀가 만 12개월 이내(또는 임신 중)이고, 휴직이 3개월 이상 연속일 때.
//  - 특례와 대체인력: 특례를 받으면 같은 휴직의 대체인력지원금 전체를 막는다(정부24·고용24 안내 기준).
//  - 남성 인센티브: 육아휴직 지원금이 나오는 모든 달(최대 18개월)에 붙인다.
//  - 2026-01-01 이전 기간(예: 1·2월 휴직의 사전 인수인계)은 그 전 규칙을 넣지 않아 계산에서 빼고 알린다.
import data from '../data/rules/employer-subsidy.json' with { type: 'json' };
import { valuesAt, sourceById, type RuleFile, type Source } from './rules.ts';

// ---------- 규칙 값 형식 ----------

interface Sourced { sources: string[] }
interface Notice extends Sourced { text: string }

export interface EmployerValues {
  minLeaveDays: number;
  applyWithinMonths: number;
  /** 피보험자 수가 이 값 미만이면 '30인 미만' 상한 */
  smallBelow: number;
  leaveSubsidy: Sourced & {
    label: string;
    monthly: number;
    maxMonths: number;
    special: { label: string; monthly: number; months: number; childMaxAgeMonths: number; minConsecutiveMonths: number };
    maleIncentive: { label: string; monthly: number; maxOrdinal: number };
    deferred: { share: number; afterMonths: number };
  };
  substitute: Sourced & {
    label: string;
    capSmall: number;
    capLarge: number;
    wageRatio: number;
    minDays: number;
    hireNotBeforeMonths: number;
    preHandoverMonths: number;
    postHandoverMonths: number;
    noLayoffMonthsBefore: number;
    noLayoffMonthsAfter: number;
    excludedWithSpecial: boolean;
  };
  workSharing: Sourced & { label: string; capSmall: number; capLarge: number; maxSharers: number };
  spouseLeaveSharing: (Sourced & { label: string; capSmall: number; capLarge: number; minConsecutiveDays: number }) | null;
  cultureFund: Sourced & { label: string; amount: number; maxInsured: number };
  notices: Record<string, Notice>;
}

export const RULE_FILE = data as RuleFile<EmployerValues>;
export const AS_OF = RULE_FILE.asOf;
/** 이 엔진이 계산할 수 있는 가장 이른 날짜 */
export const EARLIEST = [...RULE_FILE.versions].map(v => v.effectiveFrom).sort()[0];

export function rulesAt(date: string): EmployerValues | null {
  return valuesAt(RULE_FILE, date);
}

export function sources(ids: string[]): Source[] {
  return [...new Set(ids)].map(id => sourceById(RULE_FILE, id));
}

// ---------- 날짜 ----------

const DAY = 86_400_000;
const parse = (d: string) => {
  const [y, m, dd] = d.split('-').map(Number);
  return Date.UTC(y, m - 1, dd);
};
const fmt = (t: number) => new Date(t).toISOString().slice(0, 10);
const daysInMonth = (y: number, m0: number) => new Date(Date.UTC(y, m0 + 1, 0)).getUTCDate();

export function addDays(d: string, n: number): string {
  return fmt(parse(d) + n * DAY);
}

/** 월을 더한다. 그 달에 같은 날짜가 없으면 말일로 맞춘다(1/31 + 1개월 = 2/28). */
export function addMonths(d: string, n: number): string {
  const [y, m, dd] = d.split('-').map(Number);
  const first = new Date(Date.UTC(y, m - 1 + n, 1));
  const yy = first.getUTCFullYear(), mm = first.getUTCMonth();
  return fmt(Date.UTC(yy, mm, Math.min(dd, daysInMonth(yy, mm))));
}

export function daysInclusive(from: string, to: string): number {
  return Math.round((parse(to) - parse(from)) / DAY) + 1;
}

export interface Segment { from: string; to: string; fraction: number }

/** from~to를 시작일 기준 1개월 단위로 자른다. 마지막 나머지는 '남은 일수 ÷ 그 달 총일수'. */
export function monthSegments(from: string, to: string): Segment[] {
  const out: Segment[] = [];
  for (let k = 0; ; k++) {
    const s = addMonths(from, k);
    if (s > to) break;
    const fullEnd = addDays(addMonths(from, k + 1), -1);
    if (fullEnd <= to) { out.push({ from: s, to: fullEnd, fraction: 1 }); continue; }
    const [y, m] = s.split('-').map(Number);
    out.push({ from: s, to, fraction: daysInclusive(s, to) / daysInMonth(y, m - 1) });
    break;
  }
  return out;
}

// ---------- 입력·출력 ----------

export interface SubstituteInput {
  /** 대체인력 고용(또는 파견 사용) 시작일 */
  hireDate: string;
  /** 대체인력 고용 종료일(예정) */
  endDate: string;
  /** 대체인력에게 주는 월 임금(또는 파견 대가) */
  monthlyWage: number;
}

export interface LeaveInput {
  /** 고용보험 피보험자 수 */
  insured: number;
  leaveStart: string;
  leaveEnd: string;
  /** 자녀 생년월일. 임신 중이면 null */
  childBirthDate: string | null;
  /** 남성 육아휴직이고 사업장 1~3번째 허용 사례면 그 순번. 아니면 null */
  maleOrdinal?: number | null;
  substitute?: SubstituteInput | null;
  /** 업무분담자 전체에게 주는 월 분담 수당 합계 */
  sharingMonthlyAllowance?: number | null;
}

export type ScenarioId = 'substitute' | 'sharing' | 'none';

export interface Line {
  label: string;
  from: string;
  to: string;
  /** 일할 포함 개월 수 */
  months: number;
  monthly: number;
  amount: number;
  /** leave·special·incentive 줄은 50%가 복귀 후 사후 지급이다(Scenario.deferred 참고) */
  kind: 'leave' | 'special' | 'incentive' | 'substitute' | 'sharing';
  sources: string[];
}

export interface Scenario {
  id: ScenarioId;
  label: string;
  /** 계산할 수 없으면 이유 */
  ineligible: string | null;
  lines: Line[];
  total: number;
  /** 휴직 중·인수인계 중에 신청해 받는 금액 */
  upfront: number;
  /** 복귀 후 6개월 계속 고용하면 받는 금액(육아휴직 지원금의 50%) */
  deferred: number;
  /** deferred를 신청할 수 있게 되는 날 */
  deferredFrom: string;
  notes: string[];
  /** 총액에 넣지 않은 추가 가능 지원 */
  extras: { label: string; amount: number; note: string; sources: string[] }[];
}

export interface Comparison {
  rulesDate: string;
  specialEligible: boolean;
  specialReason: string;
  scenarios: Scenario[];
  /** 신청 마감(휴직 종료일 + 12개월) */
  applyBy: string;
  notices: Notice[];
}

const SCENARIO_LABEL: Record<ScenarioId, string> = {
  substitute: '대체인력 채용',
  sharing: '동료 업무분담',
  none: '지원금만 (대체·분담 없음)',
};

// ---------- 계산 ----------

function validate(input: LeaveInput): void {
  const re = /^\d{4}-\d{2}-\d{2}$/;
  for (const d of [input.leaveStart, input.leaveEnd, input.childBirthDate, input.substitute?.hireDate, input.substitute?.endDate]) {
    if (d != null && !re.test(d)) throw new Error(`날짜 형식은 YYYY-MM-DD입니다: ${d}`);
  }
  if (input.leaveEnd < input.leaveStart) throw new Error('휴직 종료일이 시작일보다 빠릅니다');
  if (input.leaveStart < EARLIEST) throw new Error(`${EARLIEST} 이전에 시작한 휴직은 아직 계산하지 않습니다(그 전 규칙 미수록)`);
  if (!(input.insured > 0)) throw new Error('피보험자 수를 입력하세요');
}

function isSmall(r: EmployerValues, insured: number) {
  return insured < r.smallBelow;
}

/** 같은 월 금액이 이어지는 구간을 한 줄로 묶는다. 금액은 줄마다 원 미만 버림. */
function linesFrom(segs: { seg: Segment; monthly: number }[], label: string, kind: Line['kind'], src: string[]): Line[] {
  const out: Line[] = [];
  for (const { seg, monthly } of segs) {
    const last = out.at(-1);
    if (last && last.monthly === monthly && addDays(last.to, 1) === seg.from) {
      last.to = seg.to;
      last.months += seg.fraction;
    } else {
      out.push({ label, from: seg.from, to: seg.to, months: seg.fraction, monthly, amount: 0, kind, sources: src });
    }
  }
  for (const l of out) {
    l.months = Math.round(l.months * 1000) / 1000;
    l.amount = Math.floor(l.monthly * l.months);
  }
  return out.filter(l => l.amount > 0);
}

export function specialEligibility(input: LeaveInput, r: EmployerValues): { ok: boolean; reason: string } {
  const sp = r.leaveSubsidy.special;
  const fullMonths = monthSegments(input.leaveStart, input.leaveEnd).filter(s => s.fraction === 1).length;
  if (fullMonths < sp.minConsecutiveMonths) return { ok: false, reason: `휴직이 ${sp.minConsecutiveMonths}개월 이상 연속이어야 특례가 됩니다` };
  if (input.childBirthDate !== null && input.leaveStart > addMonths(input.childBirthDate, sp.childMaxAgeMonths)) {
    return { ok: false, reason: `휴직 시작일에 자녀가 만 ${sp.childMaxAgeMonths}개월을 넘었습니다` };
  }
  return { ok: true, reason: input.childBirthDate === null ? '임신 중 육아휴직' : `휴직 시작일에 자녀가 만 ${sp.childMaxAgeMonths}개월 이내` };
}

function leaveSubsidyLines(input: LeaveInput, r: EmployerValues, useSpecial: boolean): Line[] {
  const ls = r.leaveSubsidy;
  const segs = monthSegments(input.leaveStart, input.leaveEnd).slice(0, ls.maxMonths);
  const lines: Line[] = [];
  const special = useSpecial ? segs.slice(0, ls.special.months) : [];
  const basic = segs.slice(special.length);
  lines.push(...linesFrom(special.map(seg => ({ seg, monthly: ls.special.monthly })), ls.special.label, 'special', ls.sources));
  lines.push(...linesFrom(basic.map(seg => ({ seg, monthly: ls.monthly })), ls.label, 'leave', ls.sources));
  const ord = input.maleOrdinal;
  if (ord != null && ord >= 1 && ord <= ls.maleIncentive.maxOrdinal) {
    lines.push(...linesFrom(segs.map(seg => ({ seg, monthly: ls.maleIncentive.monthly })), ls.maleIncentive.label, 'incentive', ls.sources));
  }
  return lines;
}

/** 대체인력 지원 기간: 사전 인수인계(최대 2개월) + 휴직 + 복직 후 인수인계(최대 1개월). 2026 이전 구간은 뺀다. */
function substituteLines(input: LeaveInput, sub: SubstituteInput, notes: string[]): Line[] {
  const r0 = rulesAt(input.leaveStart)!;
  const st = r0.substitute;
  const periods: { from: string; to: string; label: string }[] = [
    { from: sub.hireDate > addMonths(input.leaveStart, -st.preHandoverMonths) ? sub.hireDate : addMonths(input.leaveStart, -st.preHandoverMonths), to: addDays(input.leaveStart, -1), label: `${st.label} (사전 인수인계)` },
    { from: sub.hireDate > input.leaveStart ? sub.hireDate : input.leaveStart, to: sub.endDate < input.leaveEnd ? sub.endDate : input.leaveEnd, label: `${st.label} (휴직 기간)` },
  ];
  const postStart = addDays(input.leaveEnd, 1);
  const postEnd = addDays(addMonths(postStart, st.postHandoverMonths), -1);
  periods.push({ from: postStart, to: sub.endDate < postEnd ? sub.endDate : postEnd, label: `${st.label} (복직 후 인수인계)` });

  const lines: Line[] = [];
  for (const p of periods) {
    if (p.from > p.to) continue;
    let from = p.from;
    if (from < EARLIEST) {
      notes.push(`${from} ~ ${addDays(EARLIEST, -1)} 대체인력 기간은 ${EARLIEST} 이전이라 계산에서 뺐습니다(그 전 단가 미수록).`);
      if (EARLIEST > p.to) continue;
      from = EARLIEST;
    }
    const segs = monthSegments(from, p.to).map(seg => {
      const r = rulesAt(seg.from)!;
      const cap = isSmall(r, input.insured) ? r.substitute.capSmall : r.substitute.capLarge;
      return { seg, monthly: Math.min(cap, Math.floor(sub.monthlyWage * r.substitute.wageRatio)) };
    });
    lines.push(...linesFrom(segs, p.label, 'substitute', st.sources));
  }
  return lines;
}

function sharingLines(input: LeaveInput, allowance: number): Line[] {
  const segs = monthSegments(input.leaveStart, input.leaveEnd).map(seg => {
    const r = rulesAt(seg.from)!;
    const cap = isSmall(r, input.insured) ? r.workSharing.capSmall : r.workSharing.capLarge;
    return { seg, monthly: Math.min(cap, allowance) };
  });
  const ws = rulesAt(input.leaveStart)!.workSharing;
  return linesFrom(segs, ws.label, 'sharing', ws.sources);
}

function buildScenario(id: ScenarioId, input: LeaveInput, r: EmployerValues, special: { ok: boolean; reason: string }): Scenario {
  const notes: string[] = [];
  const extras: Scenario['extras'] = [];
  const deferredFrom = addMonths(addDays(input.leaveEnd, 1), r.leaveSubsidy.deferred.afterMonths);
  const empty = (why: string): Scenario => ({ id, label: SCENARIO_LABEL[id], ineligible: why, lines: [], total: 0, upfront: 0, deferred: 0, deferredFrom, notes, extras });

  let useSpecial = special.ok;
  let extra: Line[] = [];

  if (id === 'substitute') {
    const sub = input.substitute;
    if (!sub) return empty('대체인력 정보를 입력하지 않았습니다');
    const st = r.substitute;
    if (sub.hireDate < addMonths(input.leaveStart, -st.hireNotBeforeMonths)) {
      return empty(`대체인력은 휴직 시작 ${st.hireNotBeforeMonths}개월 전(${addMonths(input.leaveStart, -st.hireNotBeforeMonths)}) 이후에 새로 고용해야 합니다`);
    }
    if (sub.endDate < sub.hireDate || daysInclusive(sub.hireDate, sub.endDate) < st.minDays) {
      return empty(`대체인력을 ${st.minDays}일 이상 고용해야 합니다`);
    }
    if (useSpecial && st.excludedWithSpecial) {
      useSpecial = false;
      notes.push('특례(첫 3개월 월 100만 원)는 대체인력지원금과 함께 받을 수 없어, 이 시나리오는 기본 월 30만 원으로 계산했습니다.');
    }
    extra = substituteLines(input, sub, notes);
    const layoffFrom = addMonths(sub.hireDate, -st.noLayoffMonthsBefore);
    const yearEnd = addDays(addMonths(sub.hireDate, st.noLayoffMonthsAfter), -1);
    const layoffTo = sub.endDate < yearEnd ? sub.endDate : yearEnd;
    notes.push(`감원 금지: ${layoffFrom} ~ ${layoffTo}에 고용조정(해고·권고사직 등)으로 다른 근로자를 내보내면 대체인력지원금을 받을 수 없고, 받은 돈도 돌려줘야 합니다.`);
    const cf = r.cultureFund;
    if (input.insured <= cf.maxInsured) {
      extras.push({ label: cf.label, amount: cf.amount, note: '50인 미만 중소기업이 처음 육아휴직 대체인력을 채용한 경우 기업당 1회. 최근 3년 대체인력지원금 수령 이력이 없어야 하고, 예산이 소진되면 끝납니다. 접수 중인지 고용센터(1350)에 확인하세요.', sources: cf.sources });
    }
  } else if (id === 'sharing') {
    const a = input.sharingMonthlyAllowance;
    if (!(a != null && a > 0)) return empty('업무분담 수당을 입력하지 않았습니다');
    extra = sharingLines(input, a);
    const cap = isSmall(r, input.insured) ? r.workSharing.capSmall : r.workSharing.capLarge;
    if (a > cap) notes.push(`분담 수당이 월 상한 ${cap.toLocaleString('ko-KR')}원을 넘는 부분은 지원되지 않습니다(사업주 부담).`);
  }

  const leave = leaveSubsidyLines(input, r, useSpecial);
  const leaveTotal = leave.reduce((s, l) => s + l.amount, 0);
  const extraTotal = extra.reduce((s, l) => s + l.amount, 0);
  const deferred = Math.floor(leaveTotal * r.leaveSubsidy.deferred.share);
  notes.push(`육아휴직 지원금의 ${Math.round(r.leaveSubsidy.deferred.share * 100)}%(${deferred.toLocaleString('ko-KR')}원)는 복귀 후 ${r.leaveSubsidy.deferred.afterMonths}개월 계속 고용해야 받습니다(${deferredFrom}부터 신청). 근로자가 자기 사정으로 그만둔 경우에도 받습니다.`);

  return {
    id, label: SCENARIO_LABEL[id], ineligible: null,
    lines: [...leave, ...extra],
    total: leaveTotal + extraTotal,
    upfront: leaveTotal + extraTotal - deferred,
    deferred, deferredFrom, notes, extras,
  };
}

/** 육아휴직 1건의 시나리오 비교. 입력이 있는 시나리오만 계산하고 '지원금만'은 항상 넣는다. */
export function compareScenarios(input: LeaveInput): Comparison {
  validate(input);
  const r = rulesAt(input.leaveStart)!;
  const days = daysInclusive(input.leaveStart, input.leaveEnd);
  if (days < r.minLeaveDays) throw new Error(`육아휴직을 ${r.minLeaveDays}일 이상 허용해야 지원 대상입니다(입력 ${days}일)`);
  const special = specialEligibility(input, r);
  const ids: ScenarioId[] = [];
  if (input.substitute) ids.push('substitute');
  if (input.sharingMonthlyAllowance) ids.push('sharing');
  ids.push('none');
  const notices = Object.entries(r.notices)
    .filter(([k]) => k !== 'specialVsSubstitute' || (special.ok && !!input.substitute))
    .filter(([k]) => k !== 'sharingRules' || !!input.sharingMonthlyAllowance)
    .map(([, n]) => n);
  return {
    rulesDate: input.leaveStart,
    specialEligible: special.ok,
    specialReason: special.reason,
    scenarios: ids.map(id => buildScenario(id, input, r, special)),
    applyBy: addMonths(input.leaveEnd, r.applyWithinMonths),
    notices,
  };
}

export interface SpouseLeaveInput {
  insured: number;
  leaveStart: string;
  leaveEnd: string;
  /** 업무분담자 전체에게 준 분담 수당 합계(휴가 전체 기간) */
  allowance: number;
}

/** 배우자 출산(전후)휴가 업무분담지원금: 20일 연속 사용 시 휴가 1회에 한 번, 상한까지(일할 계산 없음). */
export function spouseLeaveSharing(input: SpouseLeaveInput): { amount: number; ineligible: string | null; label: string; sources: string[] } {
  const r = rulesAt(input.leaveStart);
  const sl = r?.spouseLeaveSharing ?? null;
  if (!r || !sl) return { amount: 0, ineligible: '배우자 출산휴가 업무분담지원금은 2026-07-01 이후 사용한 휴가부터 지원합니다', label: '배우자 출산휴가 업무분담지원금', sources: ['decree-history'] };
  const days = daysInclusive(input.leaveStart, input.leaveEnd);
  if (days < sl.minConsecutiveDays) return { amount: 0, ineligible: `휴가를 ${sl.minConsecutiveDays}일 연속으로 써야 합니다(입력 ${days}일)`, label: sl.label, sources: sl.sources };
  const cap = isSmall(r, input.insured) ? sl.capSmall : sl.capLarge;
  return { amount: Math.min(cap, Math.max(0, Math.floor(input.allowance))), ineligible: null, label: sl.label, sources: sl.sources };
}

export const won = (v: number) => Math.round(v).toLocaleString('ko-KR');
