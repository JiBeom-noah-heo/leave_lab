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
