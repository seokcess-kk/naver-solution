'use client';

import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPlace } from '@/lib/api/place';
import { getPlaceReviews, getReviewsBySentiment, scrapeReviews } from '@/lib/api/review';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';
import { toast } from 'sonner';
import type { ApiErrorResponse, ReviewSentiment, ReviewType } from '@/types/api';
import { Skeleton } from '@/components/ui/skeleton';
import { ReviewList } from '@/components/reviews/ReviewList';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function PlaceReviewsPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const placeId = params.id as string;
  const [sentimentFilter, setSentimentFilter] = useState<ReviewSentiment | 'ALL'>('ALL');
  const [reviewTypeFilter, setReviewTypeFilter] = useState<ReviewType | 'ALL'>('ALL');

  const { data: place, isLoading: placeLoading } = useQuery({
    queryKey: ['place', placeId],
    queryFn: () => getPlace(placeId),
  });

  const { data: reviews = [], isLoading: reviewsLoading } = useQuery({
    queryKey: ['reviews', placeId, sentimentFilter, reviewTypeFilter],
    queryFn: () => {
      if (sentimentFilter !== 'ALL') {
        return getReviewsBySentiment(placeId, sentimentFilter);
      }
      return getPlaceReviews(placeId, {
        reviewType: reviewTypeFilter !== 'ALL' ? reviewTypeFilter : undefined,
      });
    },
    enabled: !!placeId,
  });

  const scrapeMutation = useMutation({
    mutationFn: () => scrapeReviews({ placeId }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', placeId] });
      toast.success(`${data.scrapedCount}개의 리뷰를 스크래핑했습니다!`);
    },
    onError: (error: ApiErrorResponse) => {
      toast.error(error.response?.data?.message || '리뷰 스크래핑에 실패했습니다');
    },
  });

  const handleScrape = () => {
    if (confirm('네이버에서 최신 리뷰를 스크래핑하시겠습니까?')) {
      scrapeMutation.mutate();
    }
  };

  // 감정별 카운트
  const sentimentCounts = {
    POSITIVE: reviews.filter((r) => r.sentiment === 'POSITIVE').length,
    NEGATIVE: reviews.filter((r) => r.sentiment === 'NEGATIVE').length,
    NEUTRAL: reviews.filter((r) => r.sentiment === 'NEUTRAL').length,
  };

  if (placeLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!place) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-red-500">오류 발생</CardTitle>
            <CardDescription>Place를 불러오는데 실패했습니다</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/places')}>목록으로</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">{place.name}</h1>
            <p className="text-muted-foreground mt-1">리뷰 목록</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleScrape}
              disabled={scrapeMutation.isPending}
            >
              {scrapeMutation.isPending ? '스크래핑 중...' : '리뷰 스크래핑'}
            </Button>
            <Button variant="outline" onClick={() => router.push(`/places/${placeId}`)}>
              Place 상세
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>감정 분석 통계</CardTitle>
            <CardDescription>
              전체 {reviews.length}개의 리뷰
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {sentimentCounts.POSITIVE}
                </div>
                <div className="text-sm text-muted-foreground">긍정</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {sentimentCounts.NEGATIVE}
                </div>
                <div className="text-sm text-muted-foreground">부정</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {sentimentCounts.NEUTRAL}
                </div>
                <div className="text-sm text-muted-foreground">중립</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>필터링</CardTitle>
            <CardDescription>감정 및 리뷰 타입으로 필터링</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">감정</label>
                <Select
                  value={sentimentFilter}
                  onValueChange={(value) => setSentimentFilter(value as ReviewSentiment | 'ALL')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="감정 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">전체</SelectItem>
                    <SelectItem value="POSITIVE">긍정</SelectItem>
                    <SelectItem value="NEGATIVE">부정</SelectItem>
                    <SelectItem value="NEUTRAL">중립</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">리뷰 타입</label>
                <Select
                  value={reviewTypeFilter}
                  onValueChange={(value) => setReviewTypeFilter(value as ReviewType | 'ALL')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="타입 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">전체</SelectItem>
                    <SelectItem value="BLOG">블로그</SelectItem>
                    <SelectItem value="VISITOR">방문자</SelectItem>
                    <SelectItem value="OTHER">기타</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>리뷰 목록</CardTitle>
            <CardDescription>
              {sentimentFilter !== 'ALL' && `${sentimentFilter} 감정의 `}
              {reviewTypeFilter !== 'ALL' && `${reviewTypeFilter} 타입의 `}
              리뷰 {reviews.length}개
            </CardDescription>
          </CardHeader>
          <CardContent>
            {reviewsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            ) : (
              <ReviewList
                reviews={reviews}
                emptyMessage="리뷰가 없습니다. 스크래핑 버튼을 눌러 최신 리뷰를 가져오세요."
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
