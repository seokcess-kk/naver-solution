# TODO List - Naver Place Monitoring System

> 마지막 업데이트: 2026-01-03
> 프론트엔드 진행률: 100% (모든 핵심 기능 완성)

## ✅ Firecrawl 하이브리드 스크래핑 시스템 (완료!)

**기존 문제**: Puppeteer 스크래핑이 네이버 DOM 변경에 취약하여 순위를 가져오지 못함

**해결 방법**: LLM 기반 Firecrawl API + Puppeteer 하이브리드 시스템 구현

### 완료된 작업
- [x] FirecrawlNaverScrapingService 구현 (LLM 기반 추출)
- [x] HybridNaverScrapingService 구현 (Firecrawl 우선, Puppeteer fallback)
- [x] DIContainer 업데이트 (하이브리드 서비스 주입)
- [x] axios 의존성 추가
- [x] 환경 변수 설정 (.env.example에 FIRECRAWL_API_KEY 추가)
- [x] TypeScript 컴파일 통과
- [x] 백엔드 서버 정상 동작 확인

### 주요 개선사항
- ✅ DOM 변경에 강건한 스크래핑 (LLM이 페이지 의미 이해)
- ✅ 코드 간소화 (441줄 → ~130줄)
- ✅ 자동 fallback (Firecrawl 실패 시 Puppeteer 사용)
- ✅ 완전한 하위 호환성 (API 키 없으면 Puppeteer만 사용)
- ✅ 비용 최적화 (API 키 제거 시 자동으로 무료 Puppeteer 전환)

### 다음 단계 (선택적)
- [ ] Firecrawl API 키 발급 및 테스트 (https://firecrawl.dev)
- [ ] 2-4주 모니터링 (정확도, 비용, 성능)
- [ ] 리뷰 스크래핑도 Firecrawl로 전환 (Phase 3)

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

## ✅ Priority 2 - 경쟁사 비교 기능 (완료!)

### API 클라이언트
- [x] `web/lib/api/competitor.ts` 생성
  - [x] `addCompetitor(placeId, data)` - 경쟁사 추가
  - [x] `getPlaceCompetitors(placeId, activeOnly)` - 경쟁사 목록 조회
  - [x] `getCompetitorHistory(competitorId, params)` - 경쟁사 히스토리
  - [x] `recordCompetitorSnapshot(competitorId)` - 스냅샷 기록

### 페이지 구현
- [x] `web/app/(dashboard)/places/[id]/competitors/page.tsx` - 경쟁사 목록 페이지
  - [x] 경쟁사 카드 리스트
  - [x] 경쟁사 추가 다이얼로그
  - [x] 경쟁사 상세 보기 버튼
  - [x] React Query를 통한 데이터 관리

- [x] `web/app/(dashboard)/places/[id]/competitors/[competitorId]/page.tsx` - 경쟁사 비교 페이지
  - [x] 최신 통계 카드 (순위, 평점, 리뷰 수)
  - [x] 순위 추이 차트
  - [x] 평균 평점 추이 차트
  - [x] 블로그/방문자 리뷰 수 추이 차트
  - [x] 날짜 필터링 기능

### 컴포넌트
- [x] `web/components/competitors/CompetitorList.tsx` - 경쟁사 목록 컴포넌트
- [x] `web/components/competitors/CompetitorCard.tsx` - 경쟁사 카드 컴포넌트
- [x] `web/components/competitors/CompetitorForm.tsx` - 경쟁사 추가 폼
- [x] `web/components/competitors/CompetitorComparisonChart.tsx` - 비교 차트

### 테스트
- [x] 타입 체크 통과
- [x] 빌드 테스트 통과

---

## ✅ Priority 3 - 알림 시스템 (완료!)

### 백엔드 API
- [x] DTO 생성 (NotificationSettingResponseDto, CreateNotificationSettingDto, UpdateNotificationSettingDto, NotificationLogResponseDto)
- [x] Use Case 생성 (GetUserNotificationSettings, Create, Update, Delete, GetNotificationLogs)
- [x] Controller 및 Routes 생성
- [x] DIContainer 업데이트

### 프론트엔드
- [x] `web/lib/api/notification.ts` 생성
  - [x] `getUserNotificationSettings(userId)` - 알림 설정 조회
  - [x] `createNotificationSetting(input)` - 알림 설정 생성
  - [x] `updateNotificationSetting(id, input)` - 알림 설정 수정
  - [x] `deleteNotificationSetting(id)` - 알림 설정 삭제
  - [x] `getPlaceNotificationLogs(placeId, limit)` - 알림 로그 조회

- [x] `web/app/(dashboard)/settings/notifications/page.tsx` - 알림 설정 페이지
  - [x] 알림 설정 목록 테이블
  - [x] 알림 ON/OFF 토글 (Switch)
  - [x] 알림 삭제 기능
  - [x] 채널별 아이콘 표시 (Email, Slack)
  - [x] 알림 유형별 Badge 표시

### 타입 정의
- [x] `web/types/api.ts`에 Notification 관련 타입 추가

### 테스트
- [x] 백엔드 타입 체크 통과
- [x] 프론트엔드 타입 체크 통과
- [x] 빌드 테스트 통과

---

## ✅ Priority 4 - 사용자 프로필 개선 (완료!)

### 백엔드 API
- [x] UpdateUserProfileDto 생성
- [x] ChangePasswordDto 생성
- [x] UpdateUserProfileUseCase 구현
- [x] ChangePasswordUseCase 구현
- [x] AuthController에 메서드 추가 (updateProfile, changePassword)
- [x] authRoutes에 라우트 추가 (PATCH /profile, PATCH /password)
- [x] DIContainer 및 ServiceRegistry 업데이트

### 프론트엔드
- [x] `web/lib/api/auth.ts`에 프로필 수정 API 추가
  - [x] `updateProfile(data)` - 프로필 수정
  - [x] `changePassword(data)` - 비밀번호 변경
- [x] `web/lib/validations/auth.ts`에 validation 스키마 추가
  - [x] updateProfileSchema
  - [x] changePasswordSchema
- [x] `web/app/(dashboard)/profile/page.tsx` - 프로필 페이지
  - [x] 프로필 정보 표시
  - [x] 프로필 수정 폼 (이름, 이메일)
  - [x] 비밀번호 변경 폼
  - [x] 계정 정보 표시 (ID, 가입일)

### 테스트
- [x] 백엔드 타입 체크 통과
- [x] 프론트엔드 타입 체크 통과
- [x] 빌드 테스트 통과

---

## ✅ Priority 5 - 기존 기능 개선 (완료!)

### 대시보드 개선
- [x] `web/app/(dashboard)/dashboard/page.tsx`
  - [x] 최근 랭킹 변동 알림
  - [x] 최근 리뷰 요약
  - [x] 활동 로그

### 랭킹 페이지 개선
- [x] `web/app/(dashboard)/places/[id]/keywords/[keywordId]/rankings/page.tsx`
  - [x] 날짜 필터링 UI 추가 (Calendar + Popover)
  - [x] 차트 확대/축소 기능 (Brush 컴포넌트)
  - [x] CSV 내보내기

### Place 목록 개선
- [x] `web/app/(dashboard)/places/page.tsx`
  - [x] 검색 기능 (이름, 주소, 카테고리)
  - [x] 필터링 (활성/비활성)
  - [x] 정렬 기능 (이름, 생성일 + 오름차순/내림차순)

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
- [x] **Firecrawl 하이브리드 스크래핑 시스템** (2026-01-02)
- [x] **리뷰 관련 기능** (2026-01-02)
- [x] **경쟁사 비교 기능** (2026-01-03)
- [x] **알림 시스템** (2026-01-03)
- [x] **사용자 프로필 개선** (2026-01-03)
- [x] **Priority 5 - 기존 기능 개선** (2026-01-03)
  - [x] 대시보드 개선 (최근 리뷰, 활동 로그, Places 목록)
  - [x] 랭킹 페이지 개선 (날짜 필터링, 차트 확대/축소, CSV 내보내기)
  - [x] Place 목록 개선 (검색, 필터링, 정렬)

---

## 🎯 다음 시작할 작업

**현재 상태**: 모든 핵심 기능이 완성되었습니다! 🎉

**선택적 개선사항 (기타 개선사항 참고)**:
- 로딩 상태 개선 (skeleton 추가)
- 에러 처리 개선 (Error Boundary)
- 404 페이지 커스터마이징
- SEO 메타태그 추가
- 다크모드 지원
- 모바일 반응형 개선

**또는**:
- 실제 데이터로 테스트 및 피드백 수집
- 성능 최적화 및 사용자 경험 개선
- 추가 기능 기획
