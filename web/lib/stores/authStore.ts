import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '@/lib/api/auth';
import { User } from '@/types/api';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<void>;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: User) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      // 로그인
      login: async (email: string, password: string) => {
        try {
          const response = await authApi.login({ email, password });

          if (response.success && response.data) {
            const { accessToken, refreshToken, user } = response.data;

            // 토큰 저장 (localStorage에도 저장 - API 클라이언트에서 사용)
            if (typeof window !== 'undefined') {
              localStorage.setItem('accessToken', accessToken);
              localStorage.setItem('refreshToken', refreshToken);
            }

            set({
              user,
              accessToken,
              refreshToken,
              isAuthenticated: true,
            });
          } else {
            throw new Error(response.error?.message || '로그인 실패');
          }
        } catch (error: any) {
          console.error('Login error:', error);
          throw error;
        }
      },

      // 회원가입
      register: async (email: string, password: string, name: string) => {
        try {
          const response = await authApi.register({ email, password, name });

          if (!response.success) {
            throw new Error(response.error?.message || '회원가입 실패');
          }

          // 회원가입 성공 후 자동 로그인
          await get().login(email, password);
        } catch (error: any) {
          console.error('Register error:', error);
          throw error;
        }
      },

      // 로그아웃
      logout: async () => {
        try {
          const { refreshToken } = get();

          if (refreshToken) {
            await authApi.logout(refreshToken);
          }
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          get().clearAuth();
        }
      },

      // Access Token 갱신
      refreshAccessToken: async () => {
        try {
          const { refreshToken } = get();

          if (!refreshToken) {
            throw new Error('No refresh token');
          }

          const response = await authApi.refreshToken(refreshToken);

          if (response.success && response.data) {
            const { accessToken } = response.data;

            if (typeof window !== 'undefined') {
              localStorage.setItem('accessToken', accessToken);
            }

            set({ accessToken });
          } else {
            throw new Error('Token refresh failed');
          }
        } catch (error) {
          console.error('Token refresh error:', error);
          get().clearAuth();
          throw error;
        }
      },

      // 토큰 설정
      setTokens: (accessToken: string, refreshToken: string) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
        }

        set({ accessToken, refreshToken, isAuthenticated: true });
      },

      // 사용자 정보 설정
      setUser: (user: User) => {
        set({ user, isAuthenticated: true });
      },

      // 인증 정보 초기화
      clearAuth: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }

        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
