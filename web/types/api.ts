// API Response 타입
export interface ApiResponse<T = any> {
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
