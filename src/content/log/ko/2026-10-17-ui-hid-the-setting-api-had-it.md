---
title: "관리 화면에 없는 광고 설정, API로 바꿀 수 있을까?"
description: "네이버 검색광고 관리 화면에 없는 균등 배분 설정을 API로 바꿔 봤다. 판정은 GO다. 조건은 두 가지다. 다시 읽어 확인한 값만으로는 실제 동작을 알 수 없고, 예산 한도는 캠페인과 광고그룹 두 곳에 있다."
date: 2026-10-17
lang: ko
series: 검증일지
verdict: GO
category: 수익
project: "wit-commerce"
tags: ["네이버검색광고", "API", "광고예산"]
sources:
  - { title: "naver/searchad-apidoc — Campaigns.java (PUT /ncc/campaigns/{id}?fields=)", url: "https://github.com/naver/searchad-apidoc/blob/master/java-sample/src/main/java/com/naver/searchad/api/rest/Campaigns.java" }
  - { title: "naver/searchad-apidoc — Campaign.java (deliveryMethod 필드)", url: "https://github.com/naver/searchad-apidoc/blob/master/java-sample/src/main/java/com/naver/searchad/api/model/Campaign.java" }
  - { title: "Adverity — Naver Search Ads: Most-used fields (deliveryMethod: STANDARD / ACCELERATED)", url: "https://docs.adverity.com/reference/connectors/connector-naver-search-ads.html" }
hypothesis: "관리 화면에 없는 설정을 API로 바꿀 수 있고, 바꾸면 실제로 동작할까?"
method: "budget 필드 묶음으로 deliveryMethod를 수정하고 다시 읽어 확인했다"
result: "GO. ACCELERATED→STANDARD 변경 확인, 실제 동작은 소진 기록으로 판정 예정"
draft: false
---

## 질문

광고 관리 화면에 없는 설정을 API로 바꿀 수 있을까? 바꾸면 실제로 동작한다고 믿어도 될까?

## 막힌 지점

2026년 10월 8일, 광고의 하루 예산이 오전에 다 쓰이고 있었다. 10시 43분에 이미 "예산 한도로 중단" 상태였다. 오후와 저녁에 들어오는 검색은 측정 대상에 아예 들어오지 않는다는 뜻이다. 구매가 저녁에 몰리는 품목이라면 이렇게 재면 전환율이 늘 실제보다 낮게 나온다.

해결 방법은 알고 있었다. 예산을 하루 동안 고르게 나눠 쓰는 균등 배분으로 바꾸면 된다. 그런데 관리 화면에 그 항목이 없었다. 당시에는 이 광고 유형에서 화면에 보이지 않는 설정이라고 봤다.

## 확인한 것

| 출처 | 확인한 내용 |
|---|---|
| [naver/searchad-apidoc — Campaign.java](https://github.com/naver/searchad-apidoc/blob/master/java-sample/src/main/java/com/naver/searchad/api/model/Campaign.java) (2026-10-08 확인) | 캠페인 객체에 노출 방식 필드 `deliveryMethod`가 정의되어 있다. 내 계정의 캠페인을 조회하니 값이 `ACCELERATED`(집중 노출)였다. 화면에 안 보이는 설정이 데이터에는 있었다. |
| [Adverity — Naver Search Ads 필드 문서](https://docs.adverity.com/reference/connectors/connector-naver-search-ads.html) (2026-10-08 확인) | 이 필드의 값은 `STANDARD`와 `ACCELERATED` 두 가지다. 균등 배분에 해당하는 값은 `STANDARD`다. |
| [naver/searchad-apidoc — Campaigns.java](https://github.com/naver/searchad-apidoc/blob/master/java-sample/src/main/java/com/naver/searchad/api/rest/Campaigns.java) (2026-10-08 확인) | 캠페인 수정 요청은 `PUT /ncc/campaigns/{id}?fields=<이름>` 형식이다. |

처음에는 `fields`에 `deliveryMethod`를 넣었다. 400 에러가 돌아왔는데, 에러 본문에 쓸 수 있는 값이 적혀 있었다.

```
유효하지 않은 fields 값입니다.  유효한 fields 값은  userLock, budget, period 입니다.
```

하루 예산과 균등 배분은 `budget`이라는 이름 하나로 묶여 있었다. 문서에서 찾지 못한 값을 에러 메시지에서 알게 된 것이다. `fields=budget`으로 다시 보내자 200이 왔다. 캠페인을 다시 읽어 보니 값이 `ACCELERATED`에서 `STANDARD`로 바뀌어 있었고, 다른 필드는 모두 그대로였다.

요청을 보내기 전에 캠페인 객체 원본을 파일로 저장해 뒀다. 되돌릴 방법을 먼저 만들어 두려는 것이었다. 요청 본문에서는 조회 응답에만 나오는 실행 중 값(상태, 사유, 누적 과금액, 수정 시각)을 뺐다. 읽은 값을 그대로 다시 보내면 서버가 계산한 값을 내 요청이 덮어쓸 수 있다고 판단했다.

## 판정

**GO. 관리 화면에 없는 설정도 API에는 있고, API로 바꿀 수 있다.** 다만 조건이 두 가지 있다.

**조건 1. 다시 읽은 값만으로는 실제로 동작하는지 알 수 없다.** 플랫폼이 이 광고 유형에서 균등 배분을 쓰지 않기로 했다면, 값은 저장되어도 광고는 예전처럼 노출될 수 있다. 화면에서 항목이 사라진 것도 지원이 끝났기 때문일 수 있다. 이건 추측이고 확인하지 못했다. 그래서 다시 읽은 값은 증거로 쓰지 않고, 다음 날 시간대별 소진 곡선을 보고 판정하기로 했다. 읽기만 하는 스크립트가 하루 다섯 번 캠페인 상태와 누적 소진액을 기록한다. 바꾸기 전 기준값은 "10시 43분에 이미 중단"이다.

**조건 2. 예산 한도는 두 곳에 있다.** 이쪽이 더 비싼 교훈이었다. 같은 날 하루 예산을 2,000원에서 4,000원으로 올렸는데 아무 변화가 없었다. 내가 올린 것은 광고그룹 한도였고, 그 위 캠페인 한도는 2,000원 그대로였다. 두 한도 중 낮은 쪽이 적용된다. 실패로 분류한 것은 이 1건이다.

이상하다는 걸 알아챈 단서는 상태 사유 문자열이었다.

| | 캠페인 사유 | 그룹 사유 |
|---|---|---|
| 둘 다 2,000원 | 캠페인 예산 한도 | 그룹 예산 한도 |
| 그룹만 4,000원 | 캠페인 예산 한도 | **캠페인 예산 한도** |

그룹 한도가 풀리자 그룹의 사유도 캠페인 쪽으로 바뀌었다. 화면에도 4,000원으로 표시되고 있었기 때문에, 이 문자열을 보지 않았다면 "4,000원으로 올렸다"고 믿고 하루를 날렸을 것이다. 캠페인 한도까지 올리자 그날 광고가 곧바로 다시 돌기 시작했다. 이미 쓴 2,140원이 새 한도 4,000원보다 적어졌기 때문이다. 15시 5분에 "중단"이던 상태가 18분 뒤 "진행중"으로 바뀌었다.

```
[15:05] STANDARD · 일예산 2,000원 · 소진 2,140원(107%) · 중단
[15:23] STANDARD · 일예산 4,000원 · 소진 2,140원( 54%) · 진행중
```

## 다음 행동

2~3일 동안 시간대별 소진액과 중단 시각을 기록하고, "10시 43분 중단"이라는 기준값과 비교해 균등 배분이 실제로 동작하는지 판정한다. 동작하지 않으면 같은 요청으로 원래 값(`ACCELERATED`)으로 되돌린다.

## 정리

**측정한 것**
- 비용: 이 작업에 추가로 든 비용은 없다. 광고비는 따로 기록한다.
- 시간: 기록하지 않음
- 결과: `fields=budget` 요청이 200으로 처리됐고, 다시 읽은 값이 `ACCELERATED`에서 `STANDARD`로 바뀌어 있었다. 캠페인 한도까지 4,000원으로 올리자 광고가 15시 5분 "중단"에서 15시 23분 "진행중"으로 바뀌었다.

**확실한 것**
- 관리 화면에서 보이지 않던 노출 방식 설정(`deliveryMethod`)이 이 계정의 캠페인 데이터에는 있었다.
- 이번 요청에서는 400 에러 본문에 쓸 수 있는 `fields` 값(userLock, budget, period)이 적혀 있었다.
- 광고그룹 한도만 올렸을 때는 그룹 사유도 "캠페인 예산 한도"로 바뀌었고, 광고는 계속 멈춰 있었다.

**아직 모르는 것**
- 저장된 `STANDARD` 값대로 실제로 균등 배분되는지는 아직 모른다. 시간대별 소진 기록으로 확인한다.
- 화면에서 항목이 사라진 이유가 이 광고 유형에서 지원이 끝났기 때문인지는 확인하지 못했다. 소진 곡선이 나오기 전까지는 가설로 둔다.
