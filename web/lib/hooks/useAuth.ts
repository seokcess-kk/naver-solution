import { useAuthStore } from '@/lib/stores/authStore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function useAuth(requireAuth: boolean = false) {
  const router = useRouter();
  const {
    user,
    isAuthenticated,
    login,
    register,
    logout,
    refreshAccessToken,
  } = useAuthStore();

  useEffect(() => {
    // AuthHydrationProvider가 hydration을 처리하므로
    // 여기서는 _hasHydrated 체크 불필요

    // 인증 필요한 페이지인데 로그인 안 되어 있으면 로그인 페이지로 리다이렉트
    if (requireAuth && !isAuthenticated) {
      router.push('/login');
    }

    // 이미 로그인되어 있는데 로그인/회원가입 페이지 접근 시 대시보드로 리다이렉트
    if (!requireAuth && isAuthenticated && typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      if (pathname === '/login' || pathname === '/register') {
        router.push('/dashboard');
      }
    }
  }, [isAuthenticated, requireAuth, router]);

  return {
    user,
    isAuthenticated,
    login,
    register,
    logout,
    refreshAccessToken,
  };
}

// Protected Route용 훅
export function useRequireAuth() {
  return useAuth(true);
}
