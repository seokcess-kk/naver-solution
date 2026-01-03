'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CompetitorList } from '@/components/competitors/CompetitorList';
import { CompetitorForm } from '@/components/competitors/CompetitorForm';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getPlaceCompetitors, addCompetitor } from '@/lib/api/competitor';
import { getPlace } from '@/lib/api/place';
import type { CompetitorFormData } from '@/lib/validations/competitor';

export default function CompetitorsPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const placeId = params.id as string;

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Place 정보 조회
  const { data: place, isLoading: isLoadingPlace } = useQuery({
    queryKey: ['place', placeId],
    queryFn: () => getPlace(placeId),
  });

  // 경쟁사 목록 조회
  const {
    data: competitors = [],
    isLoading: isLoadingCompetitors,
    error,
  } = useQuery({
    queryKey: ['competitors', placeId],
    queryFn: () => getPlaceCompetitors(placeId),
    enabled: !!placeId,
  });

  // 경쟁사 추가 mutation
  const addCompetitorMutation = useMutation({
    mutationFn: (data: CompetitorFormData) =>
      addCompetitor({
        placeId,
        ...data,
      }),
    onSuccess: () => {
      toast.success('경쟁사가 성공적으로 추가되었습니다');
      queryClient.invalidateQueries({ queryKey: ['competitors', placeId] });
      setIsAddDialogOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || '경쟁사 추가에 실패했습니다');
    },
  });

  const handleAddCompetitor = (data: CompetitorFormData) => {
    addCompetitorMutation.mutate(data);
  };

  const handleViewDetails = (competitorId: string) => {
    router.push(`/places/${placeId}/competitors/${competitorId}`);
  };

  if (isLoadingPlace || isLoadingCompetitors) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-destructive">
              경쟁사 목록을 불러오는데 실패했습니다.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold">경쟁사 관리</h1>
            <p className="text-muted-foreground mt-1">
              {place?.name || '로딩 중...'} - 경쟁사 모니터링
            </p>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            경쟁사 추가
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>등록된 경쟁사 ({competitors.length}개)</CardTitle>
        </CardHeader>
        <CardContent>
          <CompetitorList
            competitors={competitors}
            onViewDetails={handleViewDetails}
            emptyMessage="등록된 경쟁사가 없습니다. 경쟁사를 추가하여 비교 분석을 시작하세요."
          />
        </CardContent>
      </Card>

      {/* 경쟁사 추가 다이얼로그 */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>경쟁사 추가</DialogTitle>
            <DialogDescription>
              비교하고 싶은 경쟁사의 네이버 플레이스 정보를 입력하세요.
            </DialogDescription>
          </DialogHeader>
          <CompetitorForm
            onSubmit={handleAddCompetitor}
            isSubmitting={addCompetitorMutation.isPending}
            onCancel={() => setIsAddDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
