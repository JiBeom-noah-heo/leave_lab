// 사이트 공통 정보. 소개·문의·개인정보처리방침 페이지와 홈 화면이 이 값을 쓴다.
export const SITE = {
  name: '육아휴직 개발자 수익화 실험',
  // 공개해도 되는 문의용 이메일. 비워 두면 문의 페이지는 GitHub 이슈만 안내한다.
  contactEmail: '',
  issues: 'https://github.com/JiBeom-noah-heo/leave_lab/issues',
  privacyEffective: '2026-10-07',
  // 검색엔진 소유 확인
  naverVerification: '9347967767474a73ebd2f3aaece1f41ea9d9a3ec',

  // 글쓴이 표시 (글 상세 바이라인, 홈 RESEARCHER 카드). 시안 문구를 그대로 옮겼다.
  author: 'JB',
  authorTitle: 'JB · 프론트엔드 개발자, 두 아이 아빠',
  authorBio: '산업공학을 전공하고 6년 넘게 웹을 만들었습니다. 휴직 동안 회사 밖에서 혼자 돈을 벌 수 있는지 실험하고, 그 과정을 한국어와 태국어로 남깁니다.',
  disclaimer: '모든 숫자는 실제 기록이며, 투자 권유가 아닙니다.',

  // 홈 LAB STATUS 카드. 비어 있으면 자리표시([N], [금액])가 그대로 보인다.
  leaveStart: '' as string,            // 휴직 시작일 'YYYY-MM-DD' → D+N 계산
  monthlyRevenue: null as number | null, // 이번 달 수익(원)
  statusFootnote: '매월 1일 수익 리포트 공개',
};
