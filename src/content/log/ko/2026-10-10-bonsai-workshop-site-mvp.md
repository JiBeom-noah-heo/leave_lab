---
title: "디자인 시안만으로 공방 홈페이지 MVP를 배포했다"
description: "외주 포트폴리오를 만들려고 디자인 시안만 넘겨 Claude Code로 공방 사이트를 만들었다. 저장소 판정은 Supabase 무료 NO-GO, Cloudflare Workers·D1·R2 GO다."
date: 2026-10-10
lang: ko
series: 실험로그
tags: ["외주", "포트폴리오", "홈페이지", "Next.js", "Claude Code", "Cloudflare", "D1", "R2", "Supabase"]
sources:
  - { title: "OpenNext — Cloudflare", url: "https://opennext.js.org/cloudflare" }
  - { title: "OpenNext — Cloudflare Get Started", url: "https://opennext.js.org/cloudflare/get-started" }
  - { title: "OpenNext — Cloudflare Caching", url: "https://opennext.js.org/cloudflare/caching" }
  - { title: "Supabase Pricing", url: "https://supabase.com/pricing" }
  - { title: "Cloudflare Workers Limits", url: "https://developers.cloudflare.com/workers/platform/limits/" }
  - { title: "Cloudflare R2 Pricing", url: "https://developers.cloudflare.com/r2/pricing/" }
  - { title: "Cloudflare D1 Pricing", url: "https://developers.cloudflare.com/d1/platform/pricing/" }
  - { title: "Cloudflare Pages Limits", url: "https://developers.cloudflare.com/pages/platform/limits/" }
  - { title: "Cloudflare Workers Pricing", url: "https://developers.cloudflare.com/workers/platform/pricing/" }
draft: false
---

| 매출 | 비용 | 시간 | 실패 |
|---|---|---|---|
| 0원 | - | - | - |

## 무엇을 했나

외주 일을 받으려면 보여 줄 사례가 필요했다. 그래서 지인이 운영하는 제주 분재 공방의 홈페이지 MVP를 무상으로 만들어 주기로 했다. 매출이 0원인 이유다.

시험해 보고 싶은 것은 두 가지였다. 첫째, 디자인 시안(README와 프로토타입 HTML)만 넘기면 Claude Code가 실제 사이트를 어디까지 만들 수 있을까? 둘째, 계정을 따로 관리하지 않고 무료로 운영할 수 있는 배포·저장 환경은 무엇일까?

비교 기준으로 쓸 `screenshots/` 폴더가 받은 zip 파일에 없었다. 그래서 프로토타입 HTML을 헤드리스 크롬(화면 없이 돌아가는 브라우저)으로 찍어 기준 화면으로 삼았다. 헤드리스 크롬은 창 폭을 약 500px 아래로 줄이지 못했다. 그래서 360px 화면은 360px 폭의 iframe 안에 띄워 다시 확인했다. 이 과정에서 지도 영역이 가로로 넘치는 것을 찾았고 `max-width:100%`로 고쳤다.

처음에는 사진 저장에 Supabase를 쓰려고 했다. 그런데 무료 플랜은 "1주일 동안 활동이 없으면 일시정지"된다. 방문자가 적은 공방 사이트와는 맞지 않았다. 저장소는 Cloudflare Workers + D1(데이터베이스) + R2(파일 저장소)로 바꿨다.

Cloudflare용 빌드 도구 OpenNext 1.20.9와 Next.js 16.4.0을 함께 썼을 때는 모든 페이지가 500 오류를 냈다. 원인은 16.4에서 새로 읽는 `preview-props.json` 파일을 OpenNext가 빌드 결과물에 넣지 않는 것이었다. OpenNext 문서에는 Next.js 16의 모든 버전을 지원한다고 적혀 있다. 하지만 이번 조합에서는 OpenNext가 테스트에 쓰는 16.3.8로 내려야 해결됐다.

## 결과

| 항목 | 판정·결과 |
|---|---|
| 디자인 재현 | 페이지 5개 완성. 1440px 화면 차이는 헤더 높이 4px 하나였고 수정했다 |
| Supabase 무료 | NO-GO. 이 사이트 조건에서는 일시정지 위험이 있다 |
| Workers + D1 + R2 | GO. Cloudflare 계정 하나로 운영할 수 있다 |
| 같은 계정에 두 번째 사이트 | GO. 블로그는 정적 사이트라 Workers 요청 한도를 쓰지 않는다 |

Supabase가 서비스로서 안 되는 것은 아니다. 방문이 뜸한 소규모 사이트를 무료 플랜으로 돌리는 구조와 맞지 않을 뿐이다.

계정 관리를 할 계획이 없어서 수강생 업로드 기능은 뺐다. 관리자 한 명만 비밀번호로 올리게 했고, 같은 IP에서 15분 동안 10번 틀리면 잠기게 했다. 사진은 브라우저에서 긴 변 1600px JPEG로 줄인 뒤 올라간다. 3000×2000 PNG로 시험했더니 1600×1067, 16KB가 됐다.

2026년 10월 8일에 배포했다. 업로드 크기는 7.4MB(gzip 압축 1.5MB)였고, 공개 페이지는 전부 200으로 응답했다. 배포 중에 두 번 막혔다. `wrangler login`은 브라우저에서 허용을 늦게 눌러 시간이 초과됐다. R2 버킷 생성은 대시보드에서 R2를 켜기 전까지 거절됐다. 10월 9일에는 관리자 비밀번호를 등록한 뒤 실제 사이트에서 사진을 직접 올려 봤다. 수강생 갤러리에 바로 표시되는 것과 삭제까지 내가 확인했다.

같은 날 지인의 기획 리뷰를 반영했다. "체험 공방" 사이트를 "분재·작가 화분 편집숍 + 작업 아카이브" 사이트로 바꿨다. 확인되지 않은 정보는 공개하지 않는다는 원칙도 함께 적용했다. 예를 들어 임시 주소와 예시 환불 규정은 내렸고, 가격이 정해지지 않은 상품에는 "가격 문의"를 달았다.

## 다음 행동

지인에게 관리자 비밀번호를 전달하고, 이 작업을 외주 포트폴리오 사례로 정리한다. 그때까지 실제 Cloudflare 청구 금액과 새로 추가한 관리자 기능을 직접 눌러 본 결과를 함께 기록한다.

## 정리

**측정한 것**
- 비용: 기록하지 않음. 무료 플랜 구성이라 0원을 예상하지만 실제 청구는 아직 확인하지 않았다
- 시간: 기록하지 않음. 사람이 들인 시간은 재지 않았다
- 결과: 페이지 5개를 배포했고 공개 페이지는 전부 200으로 응답했다. 1440px 화면의 레이아웃 차이는 4px 하나였다

**확실한 것**
- Supabase 무료 플랜은 1주일 동안 활동이 없으면 일시정지된다
- 이번 빌드에서 OpenNext 1.20.9와 Next.js 16.4.0 조합은 모든 페이지가 500 오류를 냈고, 16.3.8에서는 정상이었다
- R2 버킷은 대시보드에서 R2를 켠 뒤에야 만들 수 있었다
- 실제 사이트에서 사진 업로드, 표시, 삭제까지 확인했다

**아직 모르는 것**
- R2를 켤 때 결제수단 등록이 필요하다는 외부 안내가 있었다. 무료 한도 안이라면 청구가 없을 것이라고 보지만, 공식 문서로는 확인하지 못했다. 실제 청구 내역을 볼 때까지는 가설로 둔다
- 시안 재현이 정확했던 이유는 README에 수치가 픽셀 단위로 적혀 있었기 때문이라고 추측한다. 다른 시안에서도 같은 결과가 나오는지는 다음 외주에서 확인한다
- 리뷰를 반영하며 새로 만든 관리자 기능은 아직 아무도 직접 눌러 보지 않았다
