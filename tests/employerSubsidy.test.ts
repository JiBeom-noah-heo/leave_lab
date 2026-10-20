// 사업주 지원금 엔진 테스트. 실행: npm test
// 기대값은 출처 예시(센터 해설)와 브리프 시나리오에서 왔다. 규칙이 바뀌면 출처를 다시 확인하고 고친다.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  compareScenarios, spouseLeaveSharing, monthSegments, addMonths, rulesAt, RULE_FILE, type LeaveInput, type Scenario,
} from '../src/lib/employerSubsidy.ts';

const sum = (s: Scenario, kind: string) => s.lines.filter(l => l.kind === kind).reduce((a, l) => a + l.amount, 0);
const get = (input: LeaveInput, id: string) => compareScenarios(input).scenarios.find(s => s.id === id)!;

test('센터 예시: 20인, 대체인력 6개월(사전 2 + 휴직 3 + 복직 후 1) = 840만 원', () => {
  const s = get({
    insured: 20, leaveStart: '2026-08-20', leaveEnd: '2026-11-19', childBirthDate: '2025-01-01',
    substitute: { hireDate: '2026-06-20', endDate: '2026-12-19', monthlyWage: 2_500_000 },
  }, 'substitute');
  assert.equal(s.ineligible, null);
  assert.equal(sum(s, 'substitute'), 8_400_000);
  assert.deepEqual(s.lines.filter(l => l.kind === 'substitute').map(l => l.months), [2, 3, 1]);
});

test('센터 예시: 20인, 분담 수당 월 65만 원 × 3개월 → 상한 60만 원 × 3 = 180만 원', () => {
  const s = get({ insured: 20, leaveStart: '2026-04-01', leaveEnd: '2026-06-30', childBirthDate: '2024-01-01', sharingMonthlyAllowance: 650_000 }, 'sharing');
  assert.equal(sum(s, 'sharing'), 1_800_000);
  assert.ok(s.notes.some(n => n.includes('상한')));
});

// 브리프 시나리오: 30인 미만, 12개월 휴직 1건
const brief = (childBirthDate: string): LeaveInput => ({
  insured: 20, leaveStart: '2026-03-01', leaveEnd: '2027-02-28', childBirthDate,
  substitute: { hireDate: '2026-01-01', endDate: '2027-03-31', monthlyWage: 2_000_000 },
  sharingMonthlyAllowance: 600_000,
});

test('브리프 ① 대체인력: 360만 + 140만 × 15 = 2,460만 원, 사후 180만 원', () => {
  const s = get(brief('2025-01-01'), 'substitute');
  assert.equal(s.total, 24_600_000);
  assert.equal(s.deferred, 1_800_000);
  assert.equal(s.upfront, 22_800_000);
  assert.equal(s.deferredFrom, '2027-09-01');
});

test('브리프 ② 업무분담(자녀 12개월 초과): 360만 + 720만 = 1,080만 원', () => {
  const c = compareScenarios(brief('2025-01-01'));
  assert.equal(c.specialEligible, false);
  assert.equal(c.scenarios.find(s => s.id === 'sharing')!.total, 10_800_000);
});

test('브리프 ③ 특례 + 업무분담(자녀 12개월 이내): 570만 + 720만 = 1,290만 원, 사후 285만 원', () => {
  const c = compareScenarios(brief('2025-10-01'));
  assert.equal(c.specialEligible, true);
  const sharing = c.scenarios.find(s => s.id === 'sharing')!;
  assert.equal(sharing.total, 12_900_000);
  assert.equal(sharing.deferred, 2_850_000);
  // 특례 대상이어도 대체인력 시나리오는 기본 30만 원으로 계산한다
  const sub = c.scenarios.find(s => s.id === 'substitute')!;
  assert.equal(sub.total, 24_600_000);
  assert.equal(sum(sub, 'special'), 0);
  assert.ok(c.notices.some(n => n.text.includes('전체 기간')));
});

test('30인 이상은 대체 130만·업무분담 40만 상한', () => {
  const input = { ...brief('2025-01-01'), insured: 30 };
  assert.equal(sum(get(input, 'substitute'), 'substitute'), 1_300_000 * 15);
  assert.equal(sum(get(input, 'sharing'), 'sharing'), 400_000 * 12);
});

test('대체인력 임금의 80% 한도: 월 150만 원이면 월 120만 원', () => {
  const s = get({ ...brief('2025-01-01'), substitute: { hireDate: '2026-03-01', endDate: '2027-02-28', monthlyWage: 1_500_000 } }, 'substitute');
  assert.equal(sum(s, 'substitute'), 1_200_000 * 12);
});

test('1개월 미만은 남은 일수 ÷ 그 달 총일수로 일할(원 미만 버림)', () => {
  // 3/1~4/15: 1개월 + 4월 15일/30일
  const s = get({ insured: 10, leaveStart: '2026-03-01', leaveEnd: '2026-04-15', childBirthDate: '2024-01-01' }, 'none');
  assert.equal(s.total, 300_000 + 150_000);
  assert.deepEqual(monthSegments('2026-03-01', '2026-04-15').map(x => x.fraction), [1, 0.5]);
});

test('특례: 휴직 3개월 미만이면 적용 안 됨', () => {
  const c = compareScenarios({ insured: 10, leaveStart: '2026-03-01', leaveEnd: '2026-05-15', childBirthDate: '2026-01-01' });
  assert.equal(c.specialEligible, false);
});

test('특례: 임신 중 육아휴직도 대상', () => {
  const c = compareScenarios({ insured: 10, leaveStart: '2026-03-01', leaveEnd: '2026-08-31', childBirthDate: null });
  assert.equal(c.specialEligible, true);
  assert.equal(c.scenarios[0].total, 1_000_000 * 3 + 300_000 * 3);
});

test('남성 인센티브(1~3번째)는 월 10만 원 추가, 4번째부터는 없음', () => {
  const base = { insured: 10, leaveStart: '2026-03-01', leaveEnd: '2027-02-28', childBirthDate: '2024-01-01' };
  assert.equal(get({ ...base, maleOrdinal: 1 }, 'none').total, 3_600_000 + 1_200_000);
  assert.equal(get({ ...base, maleOrdinal: 4 }, 'none').total, 3_600_000);
});

test('육아휴직 지원금은 최대 18개월까지', () => {
  const s = get({ insured: 10, leaveStart: '2026-01-01', leaveEnd: '2027-12-31', childBirthDate: '2023-01-01' }, 'none');
  assert.equal(s.total, 300_000 * 18);
});

test('대체인력을 휴직 2개월 전보다 먼저 고용했으면 대상 아님', () => {
  const s = get({ ...brief('2025-01-01'), substitute: { hireDate: '2025-12-31', endDate: '2027-03-31', monthlyWage: 2_000_000 } }, 'substitute');
  assert.match(s.ineligible ?? '', /2개월 전/);
});

test('2026-01-01 이전 사전 인수인계 기간은 빼고 알린다', () => {
  const s = get({
    insured: 10, leaveStart: '2026-02-01', leaveEnd: '2026-07-31', childBirthDate: '2024-01-01',
    substitute: { hireDate: '2025-12-01', endDate: '2026-08-31', monthlyWage: 2_000_000 },
  }, 'substitute');
  // 사전 인수인계 2025-12-01~2026-01-31 중 2026-01 한 달만, 휴직 6개월, 복직 후 1개월
  assert.equal(sum(s, 'substitute'), 1_400_000 * 8);
  assert.ok(s.notes.some(n => n.includes('계산에서 뺐습니다')));
});

test('감원 금지 기간: 고용 3개월 전 ~ 고용 후 1년', () => {
  const s = get(brief('2025-01-01'), 'substitute');
  assert.ok(s.notes.some(n => n.includes('2025-10-01 ~ 2026-12-31')));
});

test('50인 미만 대체인력이면 문화확산 지원금을 추가 가능성으로만 표시(총액 제외)', () => {
  const s = get(brief('2025-01-01'), 'substitute');
  assert.equal(s.extras.length, 1);
  assert.equal(s.extras[0].amount, 2_000_000);
  assert.equal(s.total, 24_600_000);
  assert.equal(get({ ...brief('2025-01-01'), insured: 50 }, 'substitute').extras.length, 0);
});

test('휴직 30일 미만, 2026 이전 시작은 오류', () => {
  assert.throws(() => compareScenarios({ insured: 10, leaveStart: '2026-03-01', leaveEnd: '2026-03-20', childBirthDate: null }), /30일/);
  assert.throws(() => compareScenarios({ insured: 10, leaveStart: '2025-12-01', leaveEnd: '2026-05-31', childBirthDate: null }), /2026-01-01/);
});

test('신청 마감은 휴직 종료일 + 12개월', () => {
  assert.equal(compareScenarios(brief('2025-01-01')).applyBy, '2028-02-28');
});

test('체불 제외 문구는 2026-05-12부터 상습체불까지', () => {
  assert.doesNotMatch(rulesAt('2026-05-11')!.notices.arrears.text, /상습체불/);
  assert.match(rulesAt('2026-05-12')!.notices.arrears.text, /상습체불/);
});

test('배우자 출산휴가 업무분담: 2026-07-01부터, 20일 연속, 휴가 1회 상한(일할 없음)', () => {
  assert.equal(spouseLeaveSharing({ insured: 10, leaveStart: '2026-07-01', leaveEnd: '2026-07-20', allowance: 900_000 }).amount, 600_000);
  assert.equal(spouseLeaveSharing({ insured: 40, leaveStart: '2026-07-01', leaveEnd: '2026-07-20', allowance: 900_000 }).amount, 400_000);
  assert.ok(spouseLeaveSharing({ insured: 10, leaveStart: '2026-07-01', leaveEnd: '2026-07-19', allowance: 900_000 }).ineligible);
  assert.ok(spouseLeaveSharing({ insured: 10, leaveStart: '2026-06-01', leaveEnd: '2026-06-20', allowance: 900_000 }).ineligible);
  assert.match(spouseLeaveSharing({ insured: 10, leaveStart: '2026-09-18', leaveEnd: '2026-10-07', allowance: 100_000 }).label, /출산전후휴가/);
});

test('addMonths는 말일을 맞춘다', () => {
  assert.equal(addMonths('2026-01-31', 1), '2026-02-28');
  assert.equal(addMonths('2026-03-01', -2), '2026-01-01');
});

test('규칙 파일: 모든 출처 id가 sources에 있고 checked 날짜가 있다', () => {
  const ids = new Set(RULE_FILE.sources.map(s => s.id));
  for (const s of RULE_FILE.sources) assert.match(s.checked, /^\d{4}-\d{2}-\d{2}$/);
  const walk = (v: unknown): void => {
    if (Array.isArray(v)) { v.forEach(walk); return; }
    if (v && typeof v === 'object') {
      for (const [k, x] of Object.entries(v)) {
        if (k === 'sources' && Array.isArray(x)) x.forEach(id => assert.ok(ids.has(id), `없는 출처 id: ${id}`));
        else walk(x);
      }
    }
  };
  walk(RULE_FILE.versions);
});

// 육아기 근로시간 단축 (고시 별표 5 제2·3·4호, 시행령 제29조 제1항 제4호 가목 단서)
const reduced = (extra: Partial<LeaveInput> = {}): LeaveInput => ({
  kind: 'reduced', insured: 20, leaveStart: '2026-03-01', leaveEnd: '2027-02-28', childBirthDate: '2025-10-01',
  reductionHoursPerWeek: 10, sharingMonthlyAllowance: 300_000, ...extra,
});

test('단축 12개월: 지원금 월 30만 × 12 = 360만 원, 특례 없음, 사후 180만 원', () => {
  const c = compareScenarios(reduced());
  assert.equal(c.specialEligible, false);
  const none = c.scenarios.find(s => s.id === 'none')!;
  assert.equal(none.total, 3_600_000);
  assert.equal(none.deferred, 1_800_000);
  assert.ok(none.notes.some(n => n.includes('단축이 끝난 뒤')));
});

test('단축 업무분담: 규모와 상관없이 월 20만 원 상한, 주당 10시간 미만 단축이면 제외', () => {
  assert.equal(sum(get(reduced(), 'sharing'), 'sharing'), 200_000 * 12);
  assert.equal(sum(get(reduced({ insured: 100 }), 'sharing'), 'sharing'), 200_000 * 12);
  assert.match(get(reduced({ reductionHoursPerWeek: 8 }), 'sharing').ineligible ?? '', /주당 10시간/);
});

test('단축 첫 허용 사업장 인센티브 월 10만 원, 단축 대체인력은 금액을 내지 않는다', () => {
  assert.equal(sum(get(reduced({ reducedOrdinal: 1 }), 'none'), 'incentive'), 1_200_000);
  assert.equal(sum(get(reduced({ maleOrdinal: 1 }), 'none'), 'incentive'), 0);
  const sub = get(reduced({ substitute: { hireDate: '2026-02-01', endDate: '2027-02-28', monthlyWage: 2_000_000 } }), 'substitute');
  assert.match(sub.ineligible ?? '', /1,200,000원/);
});

test('단축은 최대 36개월까지 계산', () => {
  const none = get(reduced({ leaveStart: '2026-01-01', leaveEnd: '2029-12-31' }), 'none');
  assert.equal(sum(none, 'leave'), 300_000 * 36);
});
