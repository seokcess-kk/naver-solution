'use client';

import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { PlaceForm } from '@/components/places/PlaceForm';
import { createPlace } from '@/lib/api/place';
import { useAuth } from '@/lib/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { PlaceFormData } from '@/lib/validations/place';
import { toast } from 'sonner';
import type { ApiErrorResponse } from '@/types/api';

export default function NewPlacePage() {
  const router = useRouter();
  const { user } = useAuth();

  const createMutation = useMutation({
    mutationFn: (data: PlaceFormData) => {
      if (!user?.id) {
        throw new Error('사용자 정보를 찾을 수 없습니다');
      }
      return createPlace({
        ...data,
        userId: user.id,
      });
    },
    onSuccess: () => {
      toast.success('Place가 추가되었습니다.');
      router.push('/places');
    },
    onError: (error: ApiErrorResponse) => {
      toast.error(error.response?.data?.message || 'Place 추가에 실패했습니다');
    },
  });

  const handleSubmit = (data: PlaceFormData) => {
    createMutation.mutate(data);
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>새 Place 추가</CardTitle>
          <CardDescription>
            모니터링할 네이버 플레이스 정보를 입력하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PlaceForm
            onSubmit={handleSubmit}
            isSubmitting={createMutation.isPending}
            submitLabel="추가"
          />
        </CardContent>
      </Card>
    </div>
  );
}
