# leave-lab — 육아휴직 개발자 수익화 실험 블로그

정적 사이트(Astro) + Cloudflare Pages. 서버 없음. 연 비용은 도메인뿐.
한국어가 메인(`/`), 태국어는 서브 트랙(`/th/`). 계산기 도구는 `public/tools/*.html`에 순수 HTML로 둔다.

## 목적
1. 검증 일지·실험 로그를 자동 발행(blog_bot)해 트래픽과 신뢰를 쌓는다.
2. 계산기 도구 페이지가 검색 유입을 담당하고 애드센스를 붙인다.
3. 여기서 나온 원고가 전자책·강의·판정 리포트의 원본이 된다.

## 구조
```
leave-lab/
├─ astro.config.mjs          # site URL, i18n(ko 기본, th)
├─ src/
│  ├─ content.config.ts      # 글 스키마 (frontmatter 규칙의 단일 진실)
│  ├─ content/log/ko/*.md    # 한국어 글
│  ├─ content/log/th/*.md    # 태국어 글 (파일명은 ko와 동일하게 유지)
│  ├─ layouts/Base.astro     # 공통 레이아웃, 애드센스 스크립트 삽입 지점
│  ├─ pages/                 # index, log/[slug], tools/index, th/...
│  └─ styles/global.css
├─ public/tools/*.html       # 계산기. 프레임워크 없이 단일 HTML+JS
└─ blog_bot/publishers/static_site.py  # blog_bot 발행 어댑터
```

## 글 frontmatter (content.config.ts가 강제)
```yaml
title: "태국 쇼피에 한국 화장품을 위탁으로 팔 수 있나"
description: "한 줄 요약. 검색 결과에 노출됨. 80~120자."
date: 2026-09-28
lang: ko            # ko | th
series: 검증일지     # 검증일지 | 실험로그 | 가이드
verdict: NO-GO      # 검증일지만. GO | NO-GO | HOLD
tags: [쇼피, 태국, 규제]
sources:            # 검증일지는 필수. 링크 없는 판정은 발행 금지
  - { title: "Thai FDA 화장품 신고", url: "https://en.fda.moph.go.th/entrepreneurs-cosmetics" }
draft: false
```

## 검증 일지 본문 형식 (고정)
1. **질문** — 한 문장
2. **막힌 지점** — 어디서 "잠깐"이라고 했나
3. **확인한 것** — 출처별로 무엇을 봤나 (sources와 1:1)
4. **판정** — GO / NO-GO / HOLD + 조건
5. **다음 행동** — 한 줄

실험 로그는 주간: 매출·비용·시간·실패 4개 숫자를 표로 먼저, 서술은 그 다음.

모든 글은 마지막에 `## 정리` 블록(**측정한 것**: 비용·시간·결과 / **확실한 것** / **아직 모르는 것**)을 둔다.

## 규칙
- 계산기 도구는 반드시 `기준일`과 근거 링크를 페이지 하단에 표시. 갱신 항목은 `public/tools/_registry.json`에 등록.
- 태국어 글은 한국어 글의 번역이 아니라 "태국 독자용 재작성". 파일명만 같게 유지해 상호 링크한다.
- 애드센스 코드는 `PUBLIC_ADSENSE_CLIENT` 환경변수로만 주입. 코드에 직접 쓰지 않는다.
- 이미지는 `public/img/YYYY/`에 두고 1200px 이하로 리사이즈.
- 상품명·브랜드·아이돌 고유명사는 검증 일지에서 일반명사로 치환한다(IP 안전).

## 명령
```
npm install
npm run dev        # http://localhost:4321
npm run build      # dist/ 생성 → Cloudflare Pages가 이걸 서빙
```
Cloudflare Pages 설정: Build command `npm run build`, Output `dist`, Node 20+.

## blog_bot 연동
기존 파이프라인의 마지막 단계(WordPress/Ghost API 호출)를 `blog_bot/publishers/static_site.py`의 `publish(post)`로 교체한다.
- 입력: `Post` dataclass (title, body_md, lang, series, tags, sources, verdict, date)
- 동작: frontmatter 생성 → `src/content/log/{lang}/{date}-{slug}.md` 저장 → `git add/commit/push`
- push가 곧 배포. 실패 시 예외를 올리고 파일은 남긴다(재시도 가능).
- 환경변수: `LEAVE_LAB_REPO`(로컬 클론 경로), `LEAVE_LAB_BRANCH`(기본 main)

## 하지 않는 것
- CMS, 데이터베이스, 로그인, 댓글 시스템(댓글은 giscus 정도만 나중에)
- 튜토리얼 성격의 글. 이 블로그는 "결과와 판정"만 다룬다.
