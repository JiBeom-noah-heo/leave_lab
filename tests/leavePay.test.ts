// 근로자용 육아휴직 급여 계산 테스트. 규칙을 JSON으로 옮기면서 값이 그대로인지 확인한다. 실행: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcLeavePay, FLOOR, RULES, SOURCES, AS_OF } from '../src/lib/leavePay.ts';

test('일반 12개월, 통상임금 300만 원: 250×3 + 200×3 + 160×6 = 2,310만 원', () => {
  assert.equal(calcLeavePay(3_000_000, 12, 'general').total, 23_100_000);
});

test('부모 함께(6+6) 첫 6개월 상한, 통상임금 500만 원', () => {
  const r = calcLeavePay(5_000_000, 6, 'both');
  assert.deepEqual(r.amounts, [2_500_000, 2_500_000, 3_000_000, 3_500_000, 4_000_000, 4_500_000]);
});

test('한부모 첫 3개월 300만 원 상한', () => {
  assert.deepEqual(calcLeavePay(4_000_000, 4, 'single').amounts, [3_000_000, 3_000_000, 3_000_000, 2_000_000]);
});

test('하한 70만 원', () => {
  assert.equal(FLOOR, 700_000);
  assert.deepEqual(calcLeavePay(500_000, 1).amounts, [700_000]);
});

test('규칙·출처가 비어 있지 않다', () => {
  assert.equal(RULES.general.length, 3);
  assert.equal(SOURCES.length, 4);
  assert.match(AS_OF, /^\d{4}-\d{2}-\d{2}$/);
});
