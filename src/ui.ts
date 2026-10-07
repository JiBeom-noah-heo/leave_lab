// 템플릿 공통 헬퍼
export const verdictClass = (v?: string) => v === 'GO' ? 'go' : v === 'NO-GO' ? 'no' : 'hold';
export const ymd = (d: Date) => d.toISOString().slice(0, 10);
