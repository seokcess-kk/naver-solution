import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/lib/stores/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// Axios 인스턴스 생성
export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

// Request 인터셉터 - JWT 토큰 자동 첨부
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 로그인, 회원가입, refresh API는 토큰 추가 제외
    const publicEndpoints = ['/auth/login', '/auth/register', '/auth/refresh'];
    const isPublicEndpoint = publicEndpoints.some((endpoint) =>
      config.url?.includes(endpoint)
    );

    if (!isPublicEndpoint) {
      // Zustand store에서 직접 토큰 가져오기 (localStorage 대신)
      const token = useAuthStore.getState().accessToken;
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response 인터셉터 - 401 응답 시 토큰 갱신
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // 로그인, 회원가입, refresh API의 401은 그대로 반환 (refresh 시도 안 함)
    const publicEndpoints = ['/auth/login', '/auth/register', '/auth/refresh'];
    const isPublicEndpoint = publicEndpoints.some((endpoint) =>
      originalRequest.url?.includes(endpoint)
    );

    // 401 에러이고, 아직 재시도하지 않았고, public endpoint가 아닌 경우만 refresh 시도
    if (error.response?.status === 401 && !originalRequest._retry && !isPublicEndpoint) {
      originalRequest._retry = true;

      try {
        // Zustand store에서 직접 토큰 가져오기
        const refreshToken = useAuthStore.getState().refreshToken;
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken } = response.data.data;

        // Zustand store에 새 토큰 저장
        useAuthStore.setState({ accessToken });

        // 원래 요청 재시도
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh Token도 만료된 경우 로그아웃
        useAuthStore.getState().logout();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
