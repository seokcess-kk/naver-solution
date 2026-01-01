import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '@/lib/api/auth';
import { User } from '@/types/api';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  _hasHydrated: boolean;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<void>;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: User) => void;
  clearAuth: () => void;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      _hasHydrated: false,

      // 로그인
      login: async (email: string, password: string) => {
        try {
          const response = await authApi.login({ email, password });

          if (response.success && response.data) {
            const { accessToken, refreshToken, user } = response.data;

            // Zustand 상태 업데이트 (Zustand persist가 자동으로 localStorage 저장)
            set({
              user,
              accessToken,
              refreshToken,
              isAuthenticated: true,
            });
          } else {
            throw new Error(response.error?.message || '로그인 실패');
          }
        } catch (error) {
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
        } catch (error) {
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
        // Zustand 상태 초기화
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });

        // localStorage 완전히 클리어
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('auth-storage');
        }
      },

      // Set hydration state
      setHasHydrated: (state: boolean) => {
        set({ _hasHydrated: state });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        // _hasHydrated는 persist 하지 않음
      }),
      onRehydrateStorage: () => (state) => {
        // localStorage 복원 완료 후 호출됨
        state?.setHasHydrated(true);
      },
    }
  )
);
