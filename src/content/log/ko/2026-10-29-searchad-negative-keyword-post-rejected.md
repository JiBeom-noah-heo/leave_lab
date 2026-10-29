---
title: "쇼핑검색 광고그룹에 API로 제외 키워드를 넣을 수 있을까?"
description: "네이버 쇼핑검색 광고그룹에 검색광고 API로 제외 키워드 등록을 실제로 요청해 봤다. 응답은 400(코드 3728)이었고, 등록 전후 목록도 비어 있었다. 판정은 NO-GO다."
date: 2026-10-29
lang: ko
series: 검증일지
verdict: NO-GO
category: 수익
project: "wit-commerce"
tags: ["네이버검색광고", "쇼핑검색광고", "제외키워드", "검색광고API", "스마트스토어", "위탁판매"]
sources:
  - { title: "네이버 검색광고 API POST /ncc/adgroups/{id}/restricted-keywords (우리 쇼핑검색 광고그룹에 등록 시도)", url: "https://api.searchad.naver.com/ncc/adgroups" }
  - { title: "네이버 검색광고 API GET /ncc/adgroups/{id}/restricted-keywords (등록 시도 전후 목록 조회)", url: "https://api.searchad.naver.com/ncc/adgroups" }
  - { title: "naver/searchad-apidoc 명세 ncc-heroes-ncc.json (AdgroupRestrictKwd 모델의 type 값). 10-20에 받은 사본을 10-22에 다시 읽음", url: "https://raw.githubusercontent.com/naver/searchad-apidoc/gh-pages/assets/json/ncc-heroes-ncc.json" }
hypothesis: "쇼핑검색 광고그룹에 API로 제외 키워드 등록을 요청하면 실제로 들어갈까?"
method: "기본 type으로 등록 요청 1회를 보내고 전후로 목록을 조회했다"
result: "400과 코드 3728로 거부됐고 목록은 비어 있었다. API로 넣기는 NO-GO"
draft: false
---

## 질문

쇼핑검색 광고그룹에 검색광고 API로 제외 키워드 등록 요청(POST)을 보내면 실제로 들어갈까?

## 막힌 지점

10월 20일에 API 명세를 읽었을 때, 제외 키워드 기능에 "웹사이트 캠페인 전용"이라고 적혀 있었다. 그래서 당시에는 쇼핑검색 광고그룹에는 API로 넣을 수 없다고 봤다. 그때는 등록 요청을 실제로 보내지 않았다.

그런데 쇼핑검색 광고그룹에 제외 키워드 목록 조회를 보내면 200과 빈 목록이 돌아왔다. "지원하지 않는다면서 조회는 왜 되지?" 하는 생각이 들었다. 등록 요청을 보내면 분명하게 거부할지, 받아 놓고 아무 말 없이 버릴지는 보내 보기 전에는 알 수 없었다. 같은 회사의 커머스 API에서 모르는 값을 200으로 받고 버린 적이 있어서 더 신경이 쓰였다. 광고 관리 화면은 내가 쓰는 브라우저 도구로 열리지 않아서 화면으로 확인할 수도 없었다.

## 확인한 것

| 출처 | 확인한 내용 |
|---|---|
| 검색광고 API `POST /ncc/adgroups/{id}/restricted-keywords` (2026-10-22) | 22일 오후 5시 19분에 우리 쇼핑검색 광고그룹에 일반어 '책꽂이'를 기본 type으로 등록해 봤다. 응답은 400, 코드 3728이었고 메시지는 "This is a campaign type that does not support keyword plus impression restricted keywords."였다. |
| 검색광고 API `GET /ncc/adgroups/{id}/restricted-keywords` (2026-10-22) | 등록 시도 전과 후에 같은 그룹의 제외 키워드 목록을 조회했다. 두 번 다 200과 빈 목록이었고, 아무것도 들어가지 않았다. |
| naver/searchad-apidoc 명세 `ncc-heroes-ncc.json` (2026-10-20에 받은 사본을 2026-10-22에 다시 읽음) | `AdgroupRestrictKwd` 모델의 type 값은 `KEYWORD_PLUS_RESTRICT`와 `EXP_SEARCH` 두 가지다. 설명은 "기본값이 `KEYWORD_PLUS_RESTRICT`"라는 한 줄뿐이고, `EXP_SEARCH`가 무엇인지는 적혀 있지 않다. |

등록 요청은 한 번만 보냈다. 중복 등록을 막으려고 스크립트가 먼저 목록을 조회하고, 이미 있으면 보내지 않게 해 두었다. 이번 요청은 400으로 분명히 거부됐지만, 그래도 등록 시도 뒤 목록을 다시 조회해 비어 있는 것까지 봤다.

## 판정

**NO-GO**: 쇼핑검색 광고그룹에는 API로 제외 키워드를 넣을 수 없다. 명세의 "웹사이트 캠페인 전용"이 맞았다. 쇼핑검색 광고에서 제외 키워드를 쓸 수 없다는 뜻은 아니다. API로 자동 등록하는 방식이 맞지 않는다는 뜻이고, 그 결론은 기본 type(`KEYWORD_PLUS_RESTRICT`)으로 보낸 요청에서 나왔다.

이번 요청에서 검색광고 API는 요청을 받아 놓고 조용히 버리지 않았다. 400과 함께 이유를 돌려줬다. 조회에서 200이 온 것도 빈 목록을 돌려줬을 뿐이고, 쇼핑검색 광고그룹을 지원한다는 뜻은 아니었다. 이번 확인에서 가장 의미 있었던 건 이 차이다. 조회가 성공했다고 해서 등록까지 지원한다는 뜻은 아니었다.

`EXP_SEARCH` type은 설명이 없어서 보내 보지 않았다. 같은 명세에서 '확장 검색'은 광고그룹의 사용 여부 필드로만 나와서 파워링크 쪽 기능으로 보이지만, 이건 추측이다.

## 다음 행동

'책꽂이'는 광고 관리 화면에서 직접 넣는다. 넣은 시각을 적어 두고, 그 뒤로 검색어 리포트에서 이 검색어의 노출이 0이 되는지 기록한다.

## 정리

**측정한 것**
- 비용: 기록하지 않음
- 시간: 기록하지 않음
- 결과: 등록 요청 1회가 400(코드 3728)으로 거부됐다. 등록 전후 목록은 둘 다 200과 빈 목록이었다.

**확실한 것**
- 쇼핑검색 광고그룹에 기본 type으로 보낸 제외 키워드 등록 요청은 400으로 거부됐다.
- 등록 시도 뒤에도 그 그룹의 제외 키워드 목록은 비어 있었다.
- 조회 요청이 200을 돌려준 것은 빈 목록을 준 것뿐이고, 등록 지원과는 별개였다.
- 명세의 type 값은 `KEYWORD_PLUS_RESTRICT`와 `EXP_SEARCH` 두 가지이고, `EXP_SEARCH`에는 설명이 없다.

**아직 모르는 것**
- `EXP_SEARCH` type으로 보내면 어떻게 되는지는 아직 모른다. 파워링크 쪽 기능이라는 짐작은 보내 보기 전까지 가설로 둔다.
- 광고 관리 화면에서 직접 넣은 제외 키워드가 실제로 노출을 막는지는 아직 모른다. 넣은 시각 뒤로 검색어 리포트에서 노출이 0이 되는지로 확인한다.
