// API Response 타입
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Array<{
    field: string;
    errors: string[];
  }>;
}

// Axios 에러 응답 타입
export interface ApiErrorResponse {
  response?: {
    data?: {
      message?: string;
      error?: ApiError;
    };
    status?: number;
  };
  message: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// User 타입
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

// Auth 타입
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RegisterResponse {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

// Place 타입
export interface Place {
  id: string;
  naverPlaceId: string;
  name: string;
  category: string | null;
  address: string | null;
  naverPlaceUrl: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  userId?: string;
  keywordCount?: number;
  reviewCount?: number;
}

export interface CreatePlaceInput {
  naverPlaceId: string;
  name: string;
  category?: string;
  address?: string;
  naverPlaceUrl: string;
  userId: string;
}

export interface UpdatePlaceInput {
  naverPlaceId?: string;
  name?: string;
  category?: string;
  address?: string;
  naverPlaceUrl?: string;
}

export interface PlaceStats {
  totalPlaces: number;
  activePlaces: number;
  inactivePlaces: number;
}

// Keyword 타입
export interface Keyword {
  id: string;
  keyword: string;
  createdAt: string;
  placeCount?: number;
}

export interface PlaceKeyword {
  id: string;
  placeId: string;
  placeName: string;
  keywordId: string;
  keyword: string;
  region: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface AddPlaceKeywordInput {
  placeId: string;
  keyword: string;
  region?: string;
}

// RankingHistory 타입
export interface RankingHistory {
  id: string;
  placeKeywordId: string;
  rank: number | null;
  searchResultCount: number | null;
  checkedAt: string;
  createdAt: string;
  placeName?: string;
  keywordText?: string;
  region?: string | null;
}

export interface RecordRankingInput {
  placeKeywordId: string;
  rank: number | null;
  searchResultCount: number | null;
  checkedAt: string;
}

export interface ScrapeRankingInput {
  placeKeywordId: string;
}

export interface ScrapeRankingResponse {
  rankingHistory: RankingHistory;
  message: string;
}
