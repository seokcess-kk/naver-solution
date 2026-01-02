# TODO List - Naver Place Monitoring System

> 마지막 업데이트: 2026-01-02
> 프론트엔드 진행률: 80% (리뷰 기능 완성, 경쟁사/알림 미구현)

## 🔥 긴급 - Puppeteer 랭킹 스크래핑 수정 (진행 중)

**문제**: 키워드 추가 및 "랭킹 조회" 버튼 클릭 시 순위가 잡히지 않음 (실제 네이버에서는 순위 존재)

### 작업 내용
- [ ] 백엔드 로그 확인 (스크래핑 API 호출 시 에러 메시지)
- [ ] `src/infrastructure/naver/NaverPlaceScraperService.ts` 코드 검토
- [ ] 네이버 검색 결과 페이지 DOM 구조 분석
- [ ] Puppeteer 셀렉터 업데이트
- [ ] 에러 핸들링 개선
- [ ] 스크래핑 테스트 및 검증

---

## ✅ Priority 1 - 리뷰 관련 기능 (완료!)

### API 클라이언트
- [x] `web/lib/api/review.ts` 생성
  - [x] `getPlaceReviews(placeId, params)` - 리뷰 목록 조회
  - [x] `getReviewsBySentiment(placeId, sentiment)` - 감정별 리뷰 조회
  - [x] `scrapeReviews(placeId)` - 리뷰 스크래핑 트리거
  - [x] `getReviewHistory(placeId, params)` - 리뷰 히스토리 조회
  - [x] `getLatestReviewStats(placeId)` - 최신 리뷰 통계

### 페이지 구현
- [x] `web/app/(dashboard)/places/[id]/reviews/page.tsx` - 리뷰 목록 페이지
  - [x] 리뷰 카드 (작성자, 내용, 평점, 작성일)
  - [x] 감정 분석 결과 표시 (긍정/부정/중립)
  - [x] 감정별/타입별 필터링
  - [x] 스크래핑 버튼

- [x] `web/app/(dashboard)/places/[id]/reviews/analytics/page.tsx` - 리뷰 분석 페이지
  - [x] 감정 비율 Pie Chart (긍정/부정/중립)
  - [x] 시간대별 리뷰 수 변화 Line Chart
  - [x] 평균 평점 변화 Line Chart
  - [x] 감정 분포 변화 Line Chart

### 컴포넌트
- [x] `web/components/reviews/ReviewList.tsx` - 리뷰 목록 컴포넌트
- [x] `web/components/reviews/ReviewCard.tsx` - 리뷰 카드 컴포넌트
- [x] `web/components/reviews/SentimentBadge.tsx` - 감정 배지 컴포넌트
- [x] `web/components/reviews/ReviewAnalyticsChart.tsx` - 분석 차트

### 타입 정의
- [x] `web/types/api.ts`에 Review 관련 타입 추가

### 테스트
- [x] 타입 체크 통과
- [x] 빌드 테스트 통과
- [x] 개발 서버 실행 성공

---

## 🔴 Priority 2 - 경쟁사 비교 기능 (백엔드 API ✅ 존재)

### API 클라이언트
- [ ] `web/lib/api/competitor.ts` 생성
  - [ ] `addCompetitor(placeId, data)` - 경쟁사 추가
  - [ ] `getCompetitorHistory(competitorId, params)` - 경쟁사 히스토리
  - [ ] `recordCompetitorSnapshot(competitorId)` - 스냅샷 기록

### 페이지 구현
- [ ] `web/app/(dashboard)/places/[id]/competitors/page.tsx` - 경쟁사 목록 페이지
  - [ ] 경쟁사 목록 테이블
  - [ ] 경쟁사 추가 폼
  - [ ] 경쟁사 삭제 기능

- [ ] `web/app/(dashboard)/places/[id]/competitors/[competitorId]/page.tsx` - 경쟁사 비교 페이지
  - [ ] 내 Place vs 경쟁사 비교 차트
  - [ ] 리뷰 수, 평점, 랭킹 비교
  - [ ] 시간대별 트렌드 비교

### 컴포넌트
- [ ] `web/components/competitors/CompetitorList.tsx`
- [ ] `web/components/competitors/CompetitorForm.tsx`
- [ ] `web/components/competitors/CompetitorComparisonChart.tsx`

---

## 🟡 Priority 3 - 알림 시스템 (백엔드 API ✅ 존재)

### API 클라이언트
- [ ] `web/lib/api/notification.ts` 생성
  - [ ] `getNotificationSettings(userId)` - 알림 설정 조회
  - [ ] `updateNotificationSettings(userId, data)` - 알림 설정 수정
  - [ ] `getNotificationLogs(userId, params)` - 알림 로그 조회

### 페이지 구현
- [ ] `web/app/(dashboard)/settings/notifications/page.tsx` - 알림 설정 페이지
  - [ ] 이메일 알림 ON/OFF
  - [ ] Slack 알림 ON/OFF
  - [ ] 알림 조건 설정 (랭킹 하락, 리뷰 급증 등)
  - [ ] 알림 로그 조회

### 컴포넌트
- [ ] `web/components/notifications/NotificationSettings.tsx`
- [ ] `web/components/notifications/NotificationLogTable.tsx`

---

## 🔵 Priority 4 - 사용자 프로필 개선

### 페이지 구현
- [ ] `web/app/(dashboard)/profile/page.tsx` - 프로필 페이지
  - [ ] 프로필 정보 표시
  - [ ] 프로필 수정 폼
  - [ ] 비밀번호 변경 기능

### API 클라이언트 확장
- [ ] `web/lib/api/auth.ts`에 프로필 수정 API 추가
  - [ ] `updateProfile(data)` - 프로필 수정
  - [ ] `changePassword(data)` - 비밀번호 변경

---

## 🔵 Priority 5 - 기존 기능 개선

### 대시보드 개선
- [ ] `web/app/(dashboard)/dashboard/page.tsx`
  - [ ] 최근 랭킹 변동 알림
  - [ ] 최근 리뷰 요약
  - [ ] 활동 로그

### 랭킹 페이지 개선
- [ ] `web/app/(dashboard)/places/[id]/keywords/[keywordId]/rankings/page.tsx`
  - [ ] 날짜 필터링 UI 추가 (현재 state만 있고 UI 없음)
  - [ ] 차트 확대/축소 기능
  - [ ] CSV 내보내기

### Place 목록 개선
- [ ] `web/app/(dashboard)/places/page.tsx`
  - [ ] 검색 기능 (이름, 주소)
  - [ ] 필터링 (활성/비활성)
  - [ ] 정렬 기능

---

## 📝 기타 개선사항

- [ ] 로딩 상태 개선 (skeleton 추가)
- [ ] 에러 처리 개선 (Error Boundary)
- [ ] 404 페이지 커스터마이징
- [ ] SEO 메타태그 추가
- [ ] 다크모드 지원
- [ ] 모바일 반응형 개선

---

## ✅ 완료된 작업

- [x] 인증 시스템 (로그인, 회원가입, JWT)
- [x] Place CRUD 전체
- [x] 키워드 관리
- [x] 랭킹 추적 및 시각화
- [x] 대시보드 기본 통계
- [x] shadcn/ui 컴포넌트 라이브러리
- [x] React Query + Zustand 상태 관리
- [x] Axios 인터셉터 (자동 토큰 갱신)
- [x] SSR/CSR hydration 처리

---

## 🎯 다음 시작할 작업

**추천**: Priority 1 - 리뷰 관련 기능부터 시작
- 백엔드 API가 이미 완성되어 있음
- 사용자에게 가장 중요한 기능 (감정 분석)
- 대시보드에 통합하기 좋음

**시작 명령어**:
```
"TODO.md 보고 Priority 1 작업부터 진행해줘"
```
