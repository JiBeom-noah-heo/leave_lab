// 연재(시리즈). 글 frontmatter의 project(글감 메모의 project 값)를 독자용 연재 이름으로 묶는다.
// 새 프로젝트를 시작하면 여기에 한 줄 추가한다. 없는 project는 연재 없이 그냥 글로만 보인다.
export type SeriesInfo = { id: string; name: string; projects: string[]; blurb: string };

export const SERIES: SeriesInfo[] = [
  {
    id: 'consign-automation', name: '위탁판매 자동화', projects: ['wit-commerce'],
    blurb: '도매처 상품을 스마트스토어에 자동으로 올리고 파는 실험. 수집·등록·광고·첫 주문까지, 숫자와 실패를 순서대로 기록한다.',
  },
  {
    id: 'blog', name: '블로그 만들기', projects: ['blog_bot', 'leave-lab'],
    blurb: '이 블로그 자체가 실험이다. 작업 메모를 글로 만드는 봇, 도메인과 검색 등록, 직접 만든 계산기, 수익화까지.',
  },
  {
    id: 'baby-monitor', name: '워치 베이비모니터 앱', projects: ['baby monitor'],
    blurb: '갤럭시 워치로 방 안 소리를 듣고 폰으로 알리는 앱을 단계별로 만드는 기록.',
  },
  {
    id: 'web-outsourcing', name: '홈페이지 외주', projects: ['chimu'],
    blurb: '디자인 시안만 받아 Claude Code로 사이트를 만들어 보며 외주 포트폴리오를 쌓는 실험.',
  },
  {
    id: 'shopee-th', name: '태국 쇼피 위탁판매', projects: ['shopee-th'],
    blurb: '한국 상품을 태국 쇼피에 위탁 구조로 팔 수 있는지 규제와 마진부터 확인하는 검증.',
  },
];

type HasProject = { project?: string };
type Entry = { id: string; data: HasProject & { date: Date } };

/** 글이 속한 연재. project가 "a, b"처럼 여럿이면 먼저 맞는 연재. */
export function seriesOf(d: HasProject): SeriesInfo | null {
  if (!d.project) return null;
  const ids = d.project.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  return SERIES.find(s => s.projects.some(p => ids.includes(p.toLowerCase()))) ?? null;
}

/** 연재의 글을 오래된 순(1편부터)으로. */
export function episodesOf<T extends Entry>(s: SeriesInfo, posts: T[]): T[] {
  return posts
    .filter(p => seriesOf(p.data)?.id === s.id)
    .sort((a, b) => a.data.date.valueOf() - b.data.date.valueOf());
}

/** 글이 하나라도 있는 연재를 최신 글 순으로. */
export function activeSeries<T extends Entry>(posts: T[]): { series: SeriesInfo; episodes: T[] }[] {
  return SERIES
    .map(series => ({ series, episodes: episodesOf(series, posts) }))
    .filter(x => x.episodes.length > 0)
    .sort((a, b) => b.episodes[b.episodes.length - 1].data.date.valueOf() - a.episodes[a.episodes.length - 1].data.date.valueOf());
}
