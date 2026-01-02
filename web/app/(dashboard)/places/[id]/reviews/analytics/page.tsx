'use client';

import { useRouter, useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getPlace } from '@/lib/api/place';
import { getLatestReviewStats, getReviewHistory } from '@/lib/api/review';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ReviewAnalyticsChart } from '@/components/reviews/ReviewAnalyticsChart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function ReviewAnalyticsPage() {
  const router = useRouter();
  const params = useParams();
  const placeId = params.id as string;

  const { data: place, isLoading: placeLoading } = useQuery({
    queryKey: ['place', placeId],
    queryFn: () => getPlace(placeId),
  });

  const { data: latestStats, isLoading: statsLoading } = useQuery({
    queryKey: ['latestReviewStats', placeId],
    queryFn: () => getLatestReviewStats(placeId),
    enabled: !!placeId,
  });

  const { data: reviewHistory = [], isLoading: historyLoading } = useQuery({
    queryKey: ['reviewHistory', placeId],
    queryFn: () => getReviewHistory(placeId),
    enabled: !!placeId,
  });

  const chartData = reviewHistory.map((history) => ({
    date: new Date(history.recordedAt).toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
    }),
    totalReviews: history.totalReviews,
    averageRating: history.averageRating || 0,
    positive: history.positiveCount,
    negative: history.negativeCount,
    neutral: history.neutralCount,
  }));

  if (placeLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
          </div>
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
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">{place.name}</h1>
            <p className="text-muted-foreground mt-1">리뷰 분석</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/places/${placeId}/reviews`)}
            >
              리뷰 목록
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/places/${placeId}`)}
            >
              Place 상세
            </Button>
          </div>
        </div>

        {statsLoading ? (
          <Skeleton className="h-96 w-full" />
        ) : latestStats ? (
          <ReviewAnalyticsChart stats={latestStats} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>리뷰 감정 분석</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                리뷰 통계 데이터가 없습니다
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>시간대별 리뷰 수 변화</CardTitle>
            <CardDescription>
              시간에 따른 총 리뷰 수 변화를 보여줍니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <Skeleton className="h-80 w-full" />
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="totalReviews"
                    stroke="#3b82f6"
                    name="전체 리뷰"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                리뷰 히스토리 데이터가 없습니다
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>평균 평점 변화</CardTitle>
            <CardDescription>
              시간에 따른 평균 평점 변화를 보여줍니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <Skeleton className="h-80 w-full" />
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 5]} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="averageRating"
                    stroke="#eab308"
                    name="평균 평점"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                리뷰 히스토리 데이터가 없습니다
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>감정 분포 변화</CardTitle>
            <CardDescription>
              시간에 따른 긍정/부정/중립 리뷰 수 변화를 보여줍니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <Skeleton className="h-80 w-full" />
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="positive"
                    stroke="#22c55e"
                    name="긍정"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="negative"
                    stroke="#ef4444"
                    name="부정"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="neutral"
                    stroke="#6b7280"
                    name="중립"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                리뷰 히스토리 데이터가 없습니다
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
