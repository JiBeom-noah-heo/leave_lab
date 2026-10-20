// 글 발행 규칙 테스트. 실행: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { postFlags, hasAffiliateLink, isThin, THIN_CHARS } from '../src/postRules.ts';

const long = '가'.repeat(THIN_CHARS);

test('제휴 링크가 있으면 표시, 없으면 표시 안 함', () => {
  assert.equal(hasAffiliateLink('[사 보기](https://link.coupang.com/a/abc123)'), true);
  assert.equal(hasAffiliateLink('[고용24](https://www.work24.go.kr/)'), false);
});

test('frontmatter 값이 본문 판단보다 먼저', () => {
  assert.deepEqual(postFlags({ affiliate: true, noindex: false }, '짧음'), { affiliate: true, noindex: false });
  assert.deepEqual(postFlags({}, long), { affiliate: false, noindex: false });
});

test('공백 뺀 글자 수가 기준 미만이면 얇은 글', () => {
  assert.equal(isThin('가 '.repeat(THIN_CHARS - 1)), true);
  assert.equal(isThin(long), false);
});
