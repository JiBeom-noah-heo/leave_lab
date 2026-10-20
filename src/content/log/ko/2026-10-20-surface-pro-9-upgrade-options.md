---
title: "서피스 프로 9 업그레이드, SSD만 되고 지금은 보류했다"
description: "서피스 프로 9(인텔)에서 바꿀 수 있는 부품은 M.2 2230 SSD뿐이었다. 여유 공간이 236GB 중 33% 남아 있었고 1TB SSD는 31만 원대부터라 HOLD로 판정했다. C: 여유가 30GB 아래로 떨어지면 1TB 교체를 다시 본다."
date: 2026-10-20
lang: ko
series: 검증일지
verdict: HOLD
category: 개발
project: "C:\\ (PC 점검, 특정 프로젝트 아님)"
tags: ["서피스 프로 9", "SSD", "업그레이드", "개발 PC"]
sources:
  - { title: "Surface Pro 9 features and specs (Microsoft Support)", url: "https://support.microsoft.com/surface/models/surface-pro-9-features-and-specs" }
  - { title: "Self-repair information for your Surface device (Microsoft Support)", url: "https://support.microsoft.com/en-us/surface/self-repair-information-for-your-surface-device" }
  - { title: "Surface Pro 9 Component Disassembly and Reassembly (Microsoft Learn)", url: "https://learn.microsoft.com/en-us/surface/service-guides/surface-pro-9/surface-pro-9-component-disassembly-and-reassembly" }
  - { title: "How to upgrade the storage on the Surface Pro (XDA, 2024-12-05 갱신)", url: "https://www.xda-developers.com/surface-pro-9-upgrade-storage/" }
  - { title: "iFixit Microsoft Surface Pro 9 Storage 부품", url: "https://www.ifixit.com/Parts/Microsoft_Surface_Pro_9/Storage" }
  - { title: "iFixit Answers: Propper SSD replacement for power consumption", url: "https://pt.ifixit.com/Answers/View/757934/Propper+SSD+replacement+for+power+consumption" }
  - { title: "다나와 검색: 2230 NVMe 1TB", url: "https://search.danawa.com/dsearch.php?query=2230+NVMe+1TB" }
hypothesis: "서피스 프로 9(인텔)를 지금 업그레이드할 수 있을까, 한다면 무엇을 바꿀까?"
method: "MS 공식 문서, 수리 가이드, 부품 판매처를 이 PC 실측값과 대조했다"
result: "교체 가능한 부품은 SSD뿐이다. 여유 공간 33%와 1TB SSD 31만 원대 비용을 보고 HOLD로 판정했다"
draft: false
---

## 질문

육아휴직 중 수익화 작업에 쓰는 서피스 프로 9(인텔)를 지금 상태에서 업그레이드할 수 있을까? 한다면 무엇을 어떻게 바꿔야 할까?

## 막힌 지점

"서피스는 다 납땜이라 못 바꾼다"는 말과 "SSD는 바꿀 수 있다"는 말을 둘 다 들었다. 실제로 어디까지 바꿀 수 있는지 공식 문서로 확인해야 했다.

바꾸는 방법도 문제였다. SSD를 교체한 뒤 Windows를 새로 설치하면 이 PC에서 매일 오전 9시에 돌아가는 blog_bot 예약 작업과 git에 올리지 않은 로컬 프로젝트 폴더가 함께 사라진다. 그래서 교체 방법을 고를 때 이 점을 기준으로 삼았다.

이 PC를 2026년 10월 15일에 측정한 값은 다음과 같다. 모델은 2038이고 i5-1235U, RAM 16GB(LPDDR5-5200), SSD 256GB(PCIe 3.0 x4 연결, 마모 0%)를 쓴다. 배터리는 설계 용량의 99.4%가 남아 있었고 충전 횟수는 11사이클이었다.

## 확인한 것

| 출처 | 확인한 내용 |
|---|---|
| Surface Pro 9 features and specs (Microsoft Support) | 인텔 모델 RAM은 8·16·32GB LPDDR5다. 저장장치는 "Removable drive (SSD)"로 표기되어 있다. 화면은 최대 120Hz를 지원한다. 각주에는 숙련 기술자가 서비스 가이드에 따라 부품을 교체할 수 있다고 적혀 있다 |
| Self-repair information (Microsoft Support) | 교체 가능 부품 목록에 SSD 도어와 탈착식 SSD(rSSD)가 있다. RAM은 별도 항목이 없고 메인보드 전체 교체만 있다. 직접 수리하다 생긴 손상은 보증하지 않는다 |
| Component Disassembly and Reassembly (Microsoft Learn) | SSD 도어는 공구 없이 눌러서 연다. 고정 나사 1개는 3IP(Torx Plus) 드라이버로 푼다. 공식 절차는 같은 용량의 순정품 교체만 다룬다 |
| XDA | 규격은 M.2 2230이고 2280은 들어가지 않는다. 복구 USB로 Windows를 설치하는 방법을 소개한다. 공구는 Torx T3로 적혀 있어 MS 문서와 다르다 |
| iFixit Storage 부품 | 순정 SSD(US$93.99)와 타사 PCIe 4.0 2230 SSD(US$156.99)를 Pro 9용으로 판매한다 |
| iFixit Answers | 2022년 커뮤니티 답변이다. 타사 1TB 제품을 1주일 동안 문제없이 쓴 사례가 있었고, 저가 컨트롤러는 전력을 2~3배 더 쓸 수 있다는 의견도 있었다 |
| 다나와 검색 | 2026년 10월 15일 기준 M.2 2230 1TB 제품의 최저가는 약 316,550원~590,000원이었다 |

공구 규격이 출처마다 달랐다. 나사를 뭉개지 않으려면 공식 규격인 3IP Torx Plus를 따르기로 했다.

## 판정

**HOLD.** C: 드라이브 여유 공간이 30GB 아래로 떨어지면 1TB SSD로 교체한다.

바꿀 수 있는 부품은 SSD(M.2 2230 NVMe)뿐이다. RAM 16GB는 메인보드와 한 덩어리라 바꿀 수 없고, CPU와 GPU도 마찬가지다. 120Hz 화면은 부품이 아니라 설정 문제였다. 그래픽 드라이버가 보고하는 범위는 30~120Hz였고, 이 기기는 60Hz로 쓰고 있었다.

지금 교체하지 않기로 한 이유는 공간이 아직 남아 있어서다. 판단할 때 여유 공간은 236GB 중 약 77GB(33%)였다. 1TB SSD는 31만 원대부터였는데, 그 돈을 쓰기 전에 무료 정리부터 해 보기로 했다. 당시에는 13~30GB 정도를 더 확보할 수 있다고 예상했다. 같은 날 직접 정리해 보니 여유 공간이 76.7GB에서 102.0GB로 25.3GB 늘었고, 전체의 43%가 비었다.

| 정리 항목 | C: 여유 공간 |
|---|---|
| npm 캐시 6.3GB 삭제 | 76.7 → 83.1GB |
| Docker 빌드 캐시 11.45GB 삭제, 가상 디스크 정리·압축(13.89GB → 3.6GB) | 83.1 → 92.8GB |
| 2월 16일 이후 쓰지 않은 안드로이드 에뮬레이터와 시스템 이미지 삭제 | 92.8 → 102.0GB |

이번 정리에서 Docker 가상 디스크는 안에서 파일을 지워도 디스크 파일 크기가 줄지 않았다. 빈 공간을 정리(TRIM)하고 압축한 뒤에야 실제 공간이 돌아왔다.

교체하게 되면 복구 이미지로 새로 설치하지 않고, 외장 케이스에 새 SSD를 넣어 지금 드라이브를 그대로 복제(클론)할 생각이다. 그래야 예약 작업과 로컬 폴더가 그대로 옮겨진다. 원래 SSD는 보증 수리에 대비해 보관한다.

점검하다가 git 원격 저장소가 없는 로컬 프로젝트 폴더와, git에서 빠진 블로그 원본 메모가 이 SSD에만 있다는 걸 알게 됐다. 그래서 매일 오후 1시에 OneDrive로 백업하는 예약 작업을 만들었다. 첫 실행에서는 파일 2,816개, 1.12GB를 14초 만에 백업했고, 백업한 저장소 기록으로 저장소를 복원하는 시험도 성공했다.

## 다음 행동

C: 여유 공간을 계속 기록하다가 30GB 아래로 떨어지면 1TB SSD 교체를 다시 검토한다.

## 정리

**측정한 것**
- 비용: 기록하지 않음 (1TB 2230 SSD 국내 최저가는 약 316,550원부터)
- 시간: 기록하지 않음
- 결과: 무료 정리만으로 C: 여유 공간이 76.7GB에서 102.0GB로 25.3GB 늘었다. 정리 뒤에는 전체 용량의 43%가 비어 있다

**확실한 것**
- 서피스 프로 9(인텔)에서 교체할 수 있는 부품은 M.2 2230 SSD뿐이고 RAM·CPU·GPU는 바꿀 수 없다
- MS 공식 절차는 같은 용량의 순정품 교체만 다루고, 고정 나사에는 3IP Torx Plus 드라이버를 쓴다
- 이번 정리에서 Docker 가상 디스크는 TRIM과 압축을 거친 뒤에야 13.89GB에서 3.6GB로 줄었다

**아직 모르는 것**
- OneDrive 업로드가 끝난 뒤 백업 사본이 온라인 전용으로 비워져 SSD 공간을 쓰지 않게 될지는 아직 모른다. 업로드가 끝나면 C: 여유 공간으로 확인한다
- 펌웨어에 내장된 키로 Windows를 새로 설치해도 자동 인증될지는 확인하지 않았다. 교체할 때까지는 가설로 둔다
- 타사 2230 SSD의 전력 소비가 더 크다는 이야기는 커뮤니티 의견일 뿐이다. 직접 재 보지 않았다
