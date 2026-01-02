'use client';

import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { PlaceForm } from '@/components/places/PlaceForm';
import { getPlace, updatePlace } from '@/lib/api/place';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { PlaceFormData } from '@/lib/validations/place';
import { toast } from 'sonner';
import type { ApiErrorResponse } from '@/types/api';
import { Skeleton } from '@/components/ui/skeleton';

export default function EditPlacePage() {
  const router = useRouter();
  const params = useParams();
  const placeId = params.id as string;

  const { data: place, isLoading, error } = useQuery({
    queryKey: ['place', placeId],
    queryFn: () => getPlace(placeId),
  });

  const updateMutation = useMutation({
    mutationFn: (data: PlaceFormData) => updatePlace(placeId, data),
    onSuccess: () => {
      toast.success('Place가 수정되었습니다.');
      router.push('/places');
    },
    onError: (error: ApiErrorResponse) => {
      toast.error(error.response?.data?.message || 'Place 수정에 실패했습니다');
    },
  });

  const handleSubmit = (data: PlaceFormData) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </CardHeader>
          <CardContent className="space-y-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
            <div className="flex gap-4">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !place) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-red-500">오류 발생</CardTitle>
            <CardDescription>Place를 불러오는데 실패했습니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              {error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'}
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => window.location.reload()}
                className="flex-1"
              >
                다시 시도
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/places')}
                className="flex-1"
              >
                목록으로
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Place 수정</CardTitle>
          <CardDescription>
            {place.name}의 정보를 수정하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PlaceForm
            defaultValues={{
              name: place.name,
              naverPlaceId: place.naverPlaceId,
              category: place.category || '',
              address: place.address || '',
              naverPlaceUrl: place.naverPlaceUrl,
            }}
            onSubmit={handleSubmit}
            isSubmitting={updateMutation.isPending}
            submitLabel="수정"
          />
        </CardContent>
      </Card>
    </div>
  );
}
