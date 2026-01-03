'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2, TrendingUp, Star, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CompetitorComparisonChart } from '@/components/competitors/CompetitorComparisonChart';
import { getPlaceCompetitors, getCompetitorHistory } from '@/lib/api/competitor';
import { getPlace } from '@/lib/api/place';

export default function CompetitorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const placeId = params.id as string;
  const competitorId = params.competitorId as string;

  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  // Place 정보 조회
  const { data: place } = useQuery({
    queryKey: ['place', placeId],
    queryFn: () => getPlace(placeId),
  });

  // 경쟁사 목록에서 현재 경쟁사 찾기
  const { data: competitors = [] } = useQuery({
    queryKey: ['competitors', placeId],
    queryFn: () => getPlaceCompetitors(placeId),
    enabled: !!placeId,
  });

  const competitor = competitors.find((c) => c.id === competitorId);

  // 경쟁사 히스토리 조회
  const {
    data: history = [],
    isLoading: isLoadingHistory,
    error,
  } = useQuery({
    queryKey: ['competitorHistory', competitorId, dateRange],
    queryFn: () =>
      getCompetitorHistory(competitorId, {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      }),
    enabled: !!competitorId,
  });

  // 최신 데이터
  const latestData = history.length > 0 ? history[history.length - 1] : null;

  // 총 리뷰 수 계산
  const totalReviews = latestData
    ? (latestData.blogReviewCount || 0) + (latestData.visitorReviewCount || 0)
    : 0;

  if (isLoadingHistory) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !competitor) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-destructive">
              경쟁사 정보를 불러오는데 실패했습니다.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push(`/places/${placeId}/competitors`)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          경쟁사 목록으로
        </Button>

        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold">{competitor.competitorName}</h1>
            <p className="text-muted-foreground mt-1">
              {place?.name} vs {competitor.competitorName}
            </p>
          </div>
          <Badge variant={competitor.isActive ? 'default' : 'secondary'}>
            {competitor.isActive ? '활성' : '비활성'}
          </Badge>
        </div>

        {competitor.category && (
          <p className="text-sm text-muted-foreground">
            카테고리: {competitor.category}
          </p>
        )}
      </div>

      {/* 최신 통계 */}
      {latestData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                현재 순위
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold">
                  {latestData.rank !== null ? `${latestData.rank}위` : 'N/A'}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                평균 평점
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="text-2xl font-bold">
                  {latestData.averageRating !== null
                    ? latestData.averageRating.toFixed(1)
                    : 'N/A'}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                총 리뷰 수
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold">
                  {totalReviews.toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                블로그: {latestData.blogReviewCount || 0} / 방문자:{' '}
                {latestData.visitorReviewCount || 0}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                데이터 수집
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">
                {history.length}개 기록
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                최근 30일 기준
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 차트 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <CompetitorComparisonChart
          data={history}
          dataKey="rank"
          competitorName={competitor.competitorName}
        />

        <CompetitorComparisonChart
          data={history}
          dataKey="averageRating"
          competitorName={competitor.competitorName}
        />

        <CompetitorComparisonChart
          data={history}
          dataKey="blogReviewCount"
          competitorName={competitor.competitorName}
        />

        <CompetitorComparisonChart
          data={history}
          dataKey="visitorReviewCount"
          competitorName={competitor.competitorName}
        />
      </div>

      {/* 안내 메시지 */}
      {history.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <p className="mb-2">아직 수집된 데이터가 없습니다.</p>
              <p className="text-sm">
                경쟁사 스냅샷을 기록하여 데이터를 수집하세요.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
