// 글 발행 규칙 (E4 브리프): 제휴 표시 자동 삽입, 얇은 글 검색 제외.
// frontmatter의 affiliate·noindex가 있으면 그 값을 따르고, 없으면 본문으로 판단한다.

/** 제휴(수수료) 링크로 보는 주소. 새 제휴 프로그램을 쓰면 여기에 더한다. */
export const AFFILIATE_LINK = /https?:\/\/(?:link\.coupang\.com|coupa\.ng|s\.click\.aliexpress\.com|[\w.-]*ali\.ski|[\w.-]*\.linkprice\.com|click\.linkprice\.com|[\w.-]*adpick\.co\.kr|[\w.-]*amzn\.to)\b/i;

/**
 * 공백을 뺀 본문 글자 수가 이보다 적으면 얇은 글로 보고 검색에서 뺀다. 길이만으로는 얇은지 알 수 없어서
 * 안전망으로만 쓴다(해석: 2026-10-21 기준 가장 짧은 발행 글이 공백 빼고 약 1,100자라 그 절반쯤). 내용이 얇은 글은 noindex: true로 직접 표시한다.
 */
export const THIN_CHARS = 600;

export const hasAffiliateLink = (body: string) => AFFILIATE_LINK.test(body);
export const isThin = (body: string) => body.replace(/\s+/g, '').length < THIN_CHARS;

export function postFlags(d: { affiliate?: boolean; noindex?: boolean }, body: string) {
  return {
    affiliate: d.affiliate ?? hasAffiliateLink(body),
    noindex: d.noindex ?? isThin(body),
  };
}

/** 공정위 추천·보증 심사지침: 제목이나 본문 첫 부분에 표시한다(본문 끝은 안 된다). */
export const AFFILIATE_NOTICE = {
  ko: '이 글에는 제휴 링크가 있습니다. 링크를 통해 구매하면 leave-lab이 판매처로부터 일정 수수료를 받을 수 있습니다.',
  th: 'บทความนี้มีลิงก์พันธมิตร หากซื้อผ่านลิงก์ leave-lab อาจได้รับค่าคอมมิชชันจากผู้ขาย',
} as const;
