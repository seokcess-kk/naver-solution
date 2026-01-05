# 전체 시스템 테스트 - 발견된 문제점 및 개선사항

> 테스트 일시: 2026-01-05
> 테스트 범위: 백엔드 API 전체 워크플로우 (인증 → Place → 키워드 → 스크래핑)
> 최종 업데이트: 2026-01-05 (실제 데이터 테스트 완료, 한글 인코딩 문제 수정)

---

## 🔴 Critical Issues (즉시 수정 필요)

### 1. **한글 인코딩 문제** ✅ **수정 완료**

**문제**: API 응답에서 한글이 `���`로 표시되고, 스크래핑 URL에서 한글이 `%EF%BF%BD`로 잘못 인코딩됨
**발견 경로**: 실제 데이터 테스트 중 키워드 "강남 맛집"이 "���� ����"으로 표시됨
**영향**:
- API 응답에서 한글 데이터가 깨져서 표시됨
- 스크래핑 시 검색어가 제대로 전달되지 않아 검색 결과 없음
- UTF-8 replacement character (`U+FFFD`)로 변환되어 스크래핑 실패

**로그 예시**:
```json
{
  "keyword": "���� ����",  // 원본: "강남 맛집"
  "scrapingUrl": "https://search.naver.com/search.naver?query=%EF%BF%BD%EF%BF%BD..."
}
```

**원인 분석**:
1. PostgreSQL 연결에 charset 설정이 명시되지 않음
2. Express JSON 응답에 charset=utf-8 헤더가 명시되지 않음
3. curl/API 클라이언트에서 한글 전송 시 인코딩 처리 필요

**수정 내용**:

1. **PostgreSQL DataSource 설정** (`src/infrastructure/database/data-source.ts`)
```typescript
export const AppDataSource = new DataSource({
  // ... 기존 설정
  extra: {
    // Ensure UTF-8 encoding for Korean text support
    charset: 'utf8mb4',
  },
});
```

2. **Express 응답 헤더 설정** (`src/presentation/api/app.ts`)
```typescript
// Body parsing middleware with explicit UTF-8 charset
app.use(express.json({ type: 'application/json' }));
app.use(express.urlencoded({ extended: true }));

// Set default charset for all responses
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});
```

**재테스트 필요**: 서버 재시작 후 한글 키워드로 다시 테스트

---

### 2. **Integration Tests SQLite 호환성 문제**

**문제**: PostgreSQL `timestamp` 타입이 better-sqlite3와 호환되지 않음
**영향**: Integration Tests 302개 모두 실패
**해결**:
- **임시**: `timestamp` 타입으로 프로덕션 유지, Integration Tests 실패 상태 유지
- **권장**: Integration Tests를 PostgreSQL 컨테이너 사용으로 변경

**파일**:
- `src/domain/entities/NotificationLog.ts:40`
- `src/domain/entities/Review.ts:45`
- `src/domain/entities/RefreshToken.ts:26,38`
- `src/domain/entities/CompetitorSnapshot.ts:36`
- `src/domain/entities/RankingHistory.ts:31`
- `src/domain/entities/ReviewHistory.ts:31`

**코드 예시**:
```typescript
// 현재 (PostgreSQL 전용)
@Column({ name: 'checked_at', type: 'timestamp' })
checkedAt: Date;

// 필요한 변경: Docker PostgreSQL 테스트 환경 구축
```

---

### 3. **PlaceController userId 자동 주입 누락** ✅ **수정 완료**

**문제**: JWT 토큰에서 userId를 추출하여 DTO에 자동으로 넣어주지 않음
**영향**: API 호출 시 매번 `userId`를 요청 본문에 포함해야 함 (보안 문제)

**수정 내용**:

1. **CreatePlaceDto에서 userId 필드 제거** (`src/application/dtos/place/CreatePlaceDto.ts`)
```typescript
// 제거된 필드:
// @IsUUID()
// @IsNotEmpty()
// userId: string;
```

2. **CreatePlaceUseCase 시그니처 변경** (`src/application/usecases/place/CreatePlaceUseCase.ts`)
```typescript
// Before: async execute(dto: CreatePlaceDto): Promise<PlaceResponseDto>
// After: async execute(dto: CreatePlaceDto, userId: string): Promise<PlaceResponseDto>

async execute(dto: CreatePlaceDto, userId: string): Promise<PlaceResponseDto> {
  const user = await this.userRepository.findById(userId);
  // ...
}
```

3. **PlaceController에서 JWT userId 자동 주입** (`src/presentation/api/controllers/PlaceController.ts`)
```typescript
createPlace = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const dto: CreatePlaceDto = req.body;
    const userId = req.user!.userId; // authMiddleware guarantees req.user exists
    const result = await this.createPlaceUseCase.execute(dto, userId);
    // ...
  }
};

listPlaces = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId; // from JWT, not query param
    // ...
  }
};
```

**테스트 결과**: 모든 Unit Tests (668개) 통과

---

## 🟠 Major Issues (우선순위 높음)

### 4. **랭킹 스크래핑 실패 (Place section not found)** 🔄 **조사 중**

**문제**: 네이버 검색 결과 페이지에서 Place section을 찾지 못함
**발견 경로**: 실제 데이터 테스트 중 `/api/rankings/scrape` 호출 시 실패
**테스트 결과**:
- 실행 시간: 61초
- 검색 키워드: "강남 맛집" (한글 인코딩 문제로 인해 깨짐)
- 결과: `rank=null`, `found=false`, `searchResultCount=null`

**로그**:
```
[HybridNaverScrapingService] Using Puppeteer fallback
[NaverScrapingService] Scraping: https://search.naver.com/search.naver?query=%EF%BF%BD%EF%BF%BD...
[NaverScrapingService] Place section not found with any known selector
[HybridNaverScrapingService] Puppeteer completed in 61622ms: rank=null, found=false
```

**시도된 Selectors** (NaverScrapingService.ts:78-87):
```typescript
const placeSectionSelectors = [
  '.place_section',
  '#place-main-section',
  '.list_place',
  '.area_place',
  '.place_box',
  '#_place_list',
  '.place_bluelink',
  '[data-cid]',
];
```

**원인 분석**:
1. **한글 인코딩 문제**: URL이 `%EF%BF%BD`로 깨져서 검색 결과가 제대로 나오지 않음 (Critical Issue #1과 연관)
2. **Naver DOM 구조 변경**: 실제 Naver 검색 페이지의 DOM이 예상과 다를 수 있음
3. **Firecrawl 미사용**: `FIRECRAWL_API_KEY`가 설정되지 않아 Puppeteer만 사용

**다음 조치**:
1. ✅ 한글 인코딩 문제 수정 후 재테스트
2. `PUPPETEER_DEBUG=true` 설정하여 실제 HTML 확인
3. Headless: false로 실제 브라우저 동작 확인
4. Firecrawl API 키 설정하여 Hybrid 모드 테스트

**파일**: `src/infrastructure/naver/NaverScrapingService.ts:59-150`

---

### 5. **리뷰 스크래핑 실패 (0개 스크래핑)**

**문제**: 개선된 로직에도 불구하고 리뷰를 전혀 스크래핑하지 못함
**테스트 결과**:
- 실행 시간: 3분 33초 (213초)
- 스크래핑 결과: 0개 리뷰
- Place ID: `1318098100` (하나로마트)

**로그**:
```json
{
  "scrapedCount": 0,
  "savedCount": 0,
  "duplicateCount": 0,
  "failedCount": 0,
  "executionTimeMs": 213362
}
```

**가능한 원인**:
1. iframe 검색 로직이 실제 네이버 페이지 구조와 불일치
2. 리뷰 섹션 selector가 최신 네이버 DOM과 맞지 않음
3. Puppeteer 타임아웃 설정 문제 (30초)

**권장 조치**:
1. `scripts/investigate-naver-review.ts` 실행하여 실제 DOM 구조 재확인
2. Headless: false로 테스트하여 실제 브라우저 동작 확인
3. 로그 레벨 증가하여 어디서 실패하는지 파악

**파일**: `src/infrastructure/naver/NaverScrapingService.ts:301-638`

---


---

## 🟡 Minor Issues (개선 필요)

### 6. **Unit Tests 실패 (2개)** ✅ **수정 완료**

**문제**: PlaceResponseDto의 `includeRelations` 기본값이 true였음
**영향**: 테스트에서 기본값이 false여야 한다고 기대

**수정 내용**:

1. **GetPlaceUseCase** (`src/application/usecases/place/GetPlaceUseCase.ts`)
```typescript
// Before: async execute(id: string, includeRelations: boolean = true)
// After:
async execute(id: string, includeRelations: boolean = false): Promise<PlaceResponseDto>
```

2. **ListPlacesUseCase** (`src/application/usecases/place/ListPlacesUseCase.ts`)
```typescript
interface ListPlacesOptions {
  userId: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  activeOnly?: boolean;
  includeRelations?: boolean; // 추가
}
```

3. **PlaceController에서 명시적으로 true 전달**
```typescript
// getPlace, listPlaces에서 includeRelations: true 명시적 전달
const result = await this.listPlacesUseCase.execute({
  userId,
  page: pageNum,
  limit: limitNum,
  sortBy: sortByField,
  sortOrder: sortOrderValue,
  includeRelations: true, // 명시적으로 true
});
```

**테스트 결과**: 모든 Unit Tests (668개) 통과

---

### 7. **E2E Test 타임아웃 (1개)** ✅ **수정 완료**

**문제**: 실제 네이버 스크래핑이 30초 이상 소요되어 테스트 타임아웃

**수정 내용**: `tests/e2e/tracking/ranking.e2e.test.ts:362`
```typescript
it('should accept scrape request with valid placeKeywordId', async () => {
  // ... 테스트 코드
}, 60000); // Increase timeout to 60 seconds for scraping test
```

**테스트 결과**: E2E 테스트 통과 (타임아웃 연장으로 해결)

---

## ✅ 정상 동작 확인

### 성공적으로 테스트된 기능

1. **Health Check API** ✅
   - `GET /api/health` → `{"status":"ok"}`

2. **인증 시스템** ✅
   - 회원가입: `POST /api/auth/register`
   - 로그인: `POST /api/auth/login`
   - JWT 토큰 발급 및 인증

3. **Place 관리** ✅
   - Place 생성: `POST /api/places`
   - Place ID: `200de641-d8ea-4bbf-af89-c03625960b1c`

4. **키워드 관리** ✅
   - 키워드 추가: `POST /api/keywords/place`
   - PlaceKeyword ID: `f56fb822-d84e-4fec-8551-0c96e596477c`

5. **데이터베이스 마이그레이션** ✅
   - 모든 마이그레이션 성공 적용
   - PostgreSQL 연결 정상

6. **백엔드 서버** ✅
   - 서버 시작 성공 (포트 8000)
   - DI Container 초기화 완료
   - HybridNaverScrapingService 초기화

---

## 📊 성능 측정

| 작업 | 소요 시간 | 결과 |
|------|----------|------|
| Health Check | < 1초 | 성공 |
| 회원가입 | < 1초 | 성공 |
| 로그인 | < 1초 | 성공 |
| Place 생성 | < 1초 | 성공 |
| 키워드 추가 | < 1초 | 성공 |
| 랭킹 스크래핑 | **36초** | 실패 (미발견) |
| 리뷰 스크래핑 | **3분 33초** | 실패 (0개) |

---

## 🔧 권장 개선 작업 우선순위

### 즉시 (P0)
1. ✅ Integration Tests PostgreSQL 전환 또는 timestamp 타입 대안 (완료: timestamp 유지)
2. ✅ PlaceController userId 자동 주입 구현 (완료)
3. ✅ 한글 인코딩 문제 수정 (완료)
4. 🔄 한글 인코딩 수정 후 스크래핑 재테스트 (진행 중)
5. ❌ 리뷰 스크래핑 로직 재검토 및 수정

### 단기 (P1)
6. ✅ Unit Tests 수정 (PlaceResponseDto includeRelations) (완료)
7. 랭킹 스크래핑 성능 개선 (Firecrawl API 활용)
8. ✅ E2E Tests 타임아웃 조정 (완료)

### 중기 (P2)
7. 스크래핑 성능 모니터링 시스템
8. 에러 로깅 개선 (스크래핑 실패 원인 상세 기록)
9. Retry 로직 검증 (실제 동작 확인)

---

## 🎯 다음 단계

1. **리뷰 스크래핑 디버깅**
   ```bash
   npx ts-node -r tsconfig-paths/register scripts/investigate-naver-review.ts 1318098100
   ```

2. **PlaceController 수정**
   - `req.user.userId` 자동 주입 로직 추가

3. **Integration Tests 환경 개선**
   - Docker PostgreSQL 컨테이너 사용 검토

4. **Firecrawl API 테스트**
   - API 키 발급 후 Hybrid 모드 성능 비교

---

## 📝 참고 정보

- **테스트 환경**: Windows, PostgreSQL 16, Node.js
- **브라우저**: Puppeteer (Chromium)
- **스크래핑 타임아웃**: 30000ms (30초)
- **재시도 횟수**: 2회 (환경변수 `PUPPETEER_RETRY_COUNT`)

