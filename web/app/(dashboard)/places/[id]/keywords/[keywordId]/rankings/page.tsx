'use client';

import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRankingHistory, scrapeRanking } from '@/lib/api/ranking';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';
import { toast } from 'sonner';
import type { ApiErrorResponse } from '@/types/api';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function RankingHistoryPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const placeId = params.id as string;
  const keywordId = params.keywordId as string;
  const [dateRange, setDateRange] = useState<{ start?: string; end?: string }>({});

  const { data: rankings, isLoading, error } = useQuery({
    queryKey: ['rankingHistory', keywordId, dateRange.start, dateRange.end],
    queryFn: () => getRankingHistory(keywordId, dateRange.start, dateRange.end),
    enabled: !!keywordId,
  });

  const scrapeRankingMutation = useMutation({
    mutationFn: () => scrapeRanking({ placeKeywordId: keywordId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rankingHistory', keywordId] });
      queryClient.invalidateQueries({ queryKey: ['latestRanking', keywordId] });
      toast.success('랭킹 스크래핑이 완료되었습니다!');
    },
    onError: (error: ApiErrorResponse) => {
      toast.error(error.response?.data?.message || '랭킹 스크래핑에 실패했습니다');
    },
  });

  const handleScrape = () => {
    if (confirm('네이버에서 현재 랭킹을 조회하시겠습니까?')) {
      scrapeRankingMutation.mutate();
    }
  };

  // 차트 데이터 변환 (순위는 낮을수록 좋으므로 Y축 반전)
  const chartData = rankings
    ?.map((r) => ({
      date: new Date(r.checkedAt).toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      순위: r.rank,
      검색결과수: r.searchResultCount,
    }))
    .reverse(); // 최신순 정렬

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <Skeleton className="h-10 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48 mt-2" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48 mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-96 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-red-500">오류 발생</CardTitle>
            <CardDescription>랭킹 히스토리를 불러오는데 실패했습니다</CardDescription>
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
                onClick={() => router.push(`/places/${placeId}`)}
                className="flex-1"
              >
                Place로 돌아가기
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const latestRanking = rankings && rankings.length > 0 ? rankings[0] : null;

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">랭킹 추적</h1>
            {latestRanking && (
              <p className="text-gray-600 mt-2">
                {latestRanking.placeName} - {latestRanking.keywordText}
                {latestRanking.region && ` (${latestRanking.region})`}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="default"
              onClick={handleScrape}
              disabled={scrapeRankingMutation.isPending}
            >
              {scrapeRankingMutation.isPending ? '조회 중...' : '랭킹 조회'}
            </Button>
            <Button variant="outline" onClick={() => router.push(`/places/${placeId}`)}>
              Place로 돌아가기
            </Button>
          </div>
        </div>

        {latestRanking && (
          <Card>
            <CardHeader>
              <CardTitle>현재 상태</CardTitle>
              <CardDescription>가장 최근 조회된 랭킹 정보입니다</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-sm font-medium text-gray-500">현재 순위</div>
                  <div className="mt-1 text-3xl font-bold text-blue-600">
                    {latestRanking.rank ? `${latestRanking.rank}위` : '순위 없음'}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">검색 결과 수</div>
                  <div className="mt-1 text-3xl font-bold">
                    {latestRanking.searchResultCount
                      ? latestRanking.searchResultCount.toLocaleString()
                      : '-'}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">마지막 업데이트</div>
                  <div className="mt-1 text-sm text-gray-900">
                    {new Date(latestRanking.checkedAt).toLocaleString('ko-KR')}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>랭킹 추이</CardTitle>
            <CardDescription>시간에 따른 순위 변화를 확인하세요</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData && chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis
                    yAxisId="left"
                    reversed
                    label={{ value: '순위', angle: -90, position: 'insideLeft' }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    label={{ value: '검색 결과 수', angle: 90, position: 'insideRight' }}
                  />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="순위"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="검색결과수"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-gray-500">
                아직 랭킹 데이터가 없습니다. 위의 "랭킹 조회" 버튼을 눌러 데이터를
                수집하세요.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>히스토리</CardTitle>
            <CardDescription>전체 랭킹 기록</CardDescription>
          </CardHeader>
          <CardContent>
            {rankings && rankings.length > 0 ? (
              <div className="space-y-2">
                {rankings.map((ranking) => (
                  <div
                    key={ranking.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-sm text-gray-500">
                        {new Date(ranking.checkedAt).toLocaleString('ko-KR')}
                      </div>
                      <div className="font-medium">
                        순위:{' '}
                        <span className="text-blue-600">
                          {ranking.rank ? `${ranking.rank}위` : '순위 없음'}
                        </span>
                      </div>
                      {ranking.searchResultCount && (
                        <div className="text-sm text-gray-600">
                          검색 결과: {ranking.searchResultCount.toLocaleString()}개
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                랭킹 히스토리가 없습니다
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
