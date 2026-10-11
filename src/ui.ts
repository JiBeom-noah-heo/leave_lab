// 템플릿 공통 헬퍼
export const CATEGORIES = ['개발', '자동화', '수익', '육아'] as const;
export const STATUSES = ['진행 중', '측정 중', '완료'] as const;

export const ymd = (d: Date) => d.toISOString().slice(0, 10);

/** 한국어 기준 분당 약 500자로 읽는 시간을 어림한다. */
export const readingMinutes = (body: string) => Math.max(1, Math.round(body.replace(/\s+/g, '').length / 500));

type Meta = { status?: string; verdict?: string };
/** 목록·상세의 상태 표시. status가 없으면 판정(verdict)으로 대신한다. */
export function statusOf(d: Meta): { label: string; cls: string } {
  if (d.status) return { label: d.status, cls: d.status === '완료' ? 'done' : '' };
  if (d.verdict) return { label: d.verdict, cls: d.verdict === 'NO-GO' ? 'no' : d.verdict === 'HOLD' ? 'done' : '' };
  return { label: '', cls: '' };
}

export type Category = (typeof CATEGORIES)[number];
type CatMeta = { category?: Category; tags?: string[]; title?: string };
// blog_bot이 올리는 글에는 category가 없으므로 태그·제목의 낱말로 추정한다. 앞 항목이 우선.
const CATEGORY_HINTS: [Category, string[]][] = [
  ['육아', ['육아', '휴직', '아이', '돌봄', '어린이집']],
  ['수익', ['위탁판매', '매출', '수익', '결산', '판매', '쇼피', '스마트스토어', '광고', '수수료', '애드센스', '도매', '가격', '주문', '전자책', '강의']],
  ['자동화', ['자동화', '봇', '파이프라인', '예약', '스크립트', '크롤링', '스케줄']],
  ['개발', ['개발', 'API', '코드', '계산기', '배포', '빌드', '버그', '정적사이트', '클로드코드', '디자인']],
];
/** 글의 분류. frontmatter의 category가 있으면 그대로, 없으면 태그·제목으로 추정하고, 못 찾으면 null. */
export function categoryOf(d: CatMeta): Category | null {
  if (d.category) return d.category;
  const hay = [...(d.tags ?? []), d.title ?? ''].join(' ').toLowerCase();
  for (const [cat, words] of CATEGORY_HINTS) if (words.some(w => hay.includes(w.toLowerCase()))) return cat;
  return null;
}

// ---- 관련 계산기 ----
import registry from '../public/tools/_registry.json';
export type Tool = { file: string; name: string; summary: string; asOf: string };
// 글의 태그·제목에 이 낱말이 있으면 해당 계산기를 글 하단에 붙인다. 앞 항목이 우선.
const TOOL_HINTS: [string, string[]][] = [
  ['consign-profit', ['위탁판매', '스마트스토어', '수수료', '순이익', '마진', '결산', '주문']],
  ['consign-price-check', ['위탁판매', '도매', '가격', '등록']],
  ['breakeven-roas', ['광고', 'roas', 'cpc', '전환', '클릭']],
  ['shopee-margin', ['쇼피', '태국', '대만', '베트남', '크로스보더']],
  ['leave-pay/', ['육아휴직', '휴직', '급여']],
  ['leave-side-income', ['육아휴직', '휴직', '부업', '소득', '사업자']],
];
/** 글과 어울리는 계산기. 태그·제목의 낱말로 고르고 최대 max개. */
export function relatedTools(d: CatMeta, max = 2): Tool[] {
  const hay = [...(d.tags ?? []), d.title ?? ''].join(' ').toLowerCase();
  const picked: Tool[] = [];
  for (const [file, words] of TOOL_HINTS) {
    if (picked.length >= max) break;
    if (!words.some(w => hay.includes(w.toLowerCase()))) continue;
    const tool = (registry as Tool[]).find(t => t.file === file);
    if (tool && !picked.includes(tool)) picked.push(tool);
  }
  return picked;
}
