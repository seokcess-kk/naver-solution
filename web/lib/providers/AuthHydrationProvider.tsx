'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useAuthStore } from '@/lib/stores/authStore';

export function AuthHydrationProvider({ children }: { children: ReactNode }) {
  const _hasHydrated = useAuthStore((state) => state._hasHydrated);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // hydration 완료 + 상태 전파를 위한 추가 tick 대기
    if (_hasHydrated) {
      // requestAnimationFrame으로 다음 렌더 사이클까지 대기
      requestAnimationFrame(() => {
        setIsReady(true);
      });
    }
  }, [_hasHydrated]);

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
