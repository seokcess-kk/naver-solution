'use client';

import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPlace, deletePlace } from '@/lib/api/place';
import { getPlaceKeywords, addPlaceKeyword, removePlaceKeyword } from '@/lib/api/keyword';
import { getLatestRanking, scrapeRanking } from '@/lib/api/ranking';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import type { PlaceKeyword, ApiErrorResponse } from '@/types/api';
import { Skeleton } from '@/components/ui/skeleton';

// 키워드 랭킹 아이템 컴포넌트
interface KeywordRankingItemProps {
  placeKeyword: PlaceKeyword;
  onRemove: () => void;
  onScrape: () => void;
  isRemoving: boolean;
  isScraping: boolean;
}

function KeywordRankingItem({
  placeKeyword,
  onRemove,
  onScrape,
  isRemoving,
  isScraping,
}: KeywordRankingItemProps) {
  const { data: latestRanking, isLoading: rankingLoading } = useQuery({
    queryKey: ['latestRanking', placeKeyword.id],
    queryFn: () => getLatestRanking(placeKeyword.id),
    enabled: !!placeKeyword.id,
  });

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md border">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{placeKeyword.keyword}</span>
          {placeKeyword.region && (
            <span className="text-sm text-gray-500">({placeKeyword.region})</span>
          )}
          <Badge variant={placeKeyword.isActive ? 'default' : 'secondary'}>
            {placeKeyword.isActive ? '활성' : '비활성'}
          </Badge>
        </div>
        {rankingLoading ? (
          <p className="text-sm text-gray-500 mt-1">랭킹 로딩 중...</p>
        ) : latestRanking ? (
          <div className="flex items-center gap-3 mt-2">
            <div className="text-sm">
              <span className="text-gray-600">현재 순위: </span>
              <span className="font-bold text-blue-600">
                {latestRanking.rank ? `${latestRanking.rank}위` : '순위 없음'}
              </span>
            </div>
            {latestRanking.searchResultCount && (
              <div className="text-sm">
                <span className="text-gray-600">검색 결과: </span>
                <span className="font-medium">
                  {latestRanking.searchResultCount.toLocaleString()}개
                </span>
              </div>
            )}
            <div className="text-xs text-gray-500">
              {new Date(latestRanking.checkedAt).toLocaleString('ko-KR')}
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500 mt-1">아직 랭킹 데이터가 없습니다</p>
        )}
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onScrape}
          disabled={isScraping}
          aria-label={`${placeKeyword.keyword} 랭킹 조회`}
        >
          {isScraping ? '조회 중...' : '랭킹 조회'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open(`/places/${placeKeyword.placeId}/keywords/${placeKeyword.id}/rankings`, '_blank')}
          aria-label={`${placeKeyword.keyword} 랭킹 상세보기`}
        >
          상세보기
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={onRemove}
          disabled={isRemoving}
          aria-label={`${placeKeyword.keyword} 제거`}
        >
          제거
        </Button>
      </div>
    </div>
  );
}

export default function PlaceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const placeId = params.id as string;
  const [keyword, setKeyword] = useState('');
  const [region, setRegion] = useState('');

  const { data: place, isLoading, error } = useQuery({
    queryKey: ['place', placeId],
    queryFn: () => getPlace(placeId),
  });

  const { data: placeKeywords, isLoading: keywordsLoading } = useQuery({
    queryKey: ['placeKeywords', placeId],
    queryFn: () => getPlaceKeywords(placeId),
    enabled: !!placeId,
  });

  const deleteMutation = useMutation({
    mutationFn: () => deletePlace(placeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['places'] });
      toast.success('Place가 삭제되었습니다.');
      router.push('/places');
    },
    onError: (error: ApiErrorResponse) => {
      toast.error(error.response?.data?.message || 'Place 삭제에 실패했습니다');
    },
  });

  const addKeywordMutation = useMutation({
    mutationFn: () => addPlaceKeyword({ placeId, keyword, region: region || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['placeKeywords', placeId] });
      setKeyword('');
      setRegion('');
      toast.success('키워드가 추가되었습니다.');
    },
    onError: (error: ApiErrorResponse) => {
      toast.error(error.response?.data?.message || 'Keyword 추가에 실패했습니다');
    },
  });

  const removeKeywordMutation = useMutation({
    mutationFn: (placeKeywordId: string) => removePlaceKeyword(placeKeywordId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['placeKeywords', placeId] });
      toast.success('키워드가 제거되었습니다.');
    },
    onError: (error: ApiErrorResponse) => {
      toast.error(error.response?.data?.message || 'Keyword 제거에 실패했습니다');
    },
  });

  const scrapeRankingMutation = useMutation({
    mutationFn: (placeKeywordId: string) => scrapeRanking({ placeKeywordId }),
    onSuccess: (data, placeKeywordId) => {
      queryClient.invalidateQueries({ queryKey: ['latestRanking', placeKeywordId] });
      toast.success('랭킹 스크래핑이 완료되었습니다!');
    },
    onError: (error: ApiErrorResponse) => {
      toast.error(error.response?.data?.message || '랭킹 스크래핑에 실패했습니다');
    },
  });

  const handleDelete = () => {
    if (confirm('정말 이 Place를 삭제하시겠습니까?')) {
      deleteMutation.mutate();
    }
  };

  const handleAddKeyword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) {
      toast.error('키워드를 입력해주세요');
      return;
    }
    addKeywordMutation.mutate();
  };

  const handleRemoveKeyword = (placeKeywordId: string) => {
    if (confirm('정말 이 키워드를 제거하시겠습니까?')) {
      removeKeywordMutation.mutate(placeKeywordId);
    }
  };

  const handleScrapeRanking = (placeKeywordId: string) => {
    if (confirm('네이버에서 현재 랭킹을 조회하시겠습니까?')) {
      scrapeRankingMutation.mutate(placeKeywordId);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <Skeleton className="h-10 w-64" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48 mt-2" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48 mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        </div>
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
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">{place.name}</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/places/${placeId}/edit`)}
            >
              수정
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? '삭제 중...' : '삭제'}
            </Button>
            <Button variant="outline" onClick={() => router.push('/places')}>
              목록으로
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>기본 정보</CardTitle>
            <CardDescription>Place의 기본 정보입니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-gray-500">Place ID</div>
                <div className="mt-1 text-sm text-gray-900">{place.id}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">네이버 Place ID</div>
                <div className="mt-1 text-sm text-gray-900">{place.naverPlaceId}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">카테고리</div>
                <div className="mt-1 text-sm text-gray-900">
                  {place.category || '-'}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">활성 상태</div>
                <div className="mt-1 text-sm text-gray-900">
                  {place.isActive ? (
                    <span className="text-green-600">활성</span>
                  ) : (
                    <span className="text-red-600">비활성</span>
                  )}
                </div>
              </div>
              <div className="col-span-2">
                <div className="text-sm font-medium text-gray-500">주소</div>
                <div className="mt-1 text-sm text-gray-900">
                  {place.address || '-'}
                </div>
              </div>
              <div className="col-span-2">
                <div className="text-sm font-medium text-gray-500">네이버 Place URL</div>
                <div className="mt-1 text-sm text-gray-900">
                  <a
                    href={place.naverPlaceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {place.naverPlaceUrl}
                  </a>
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">생성일</div>
                <div className="mt-1 text-sm text-gray-900">
                  {new Date(place.createdAt).toLocaleString('ko-KR')}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">수정일</div>
                <div className="mt-1 text-sm text-gray-900">
                  {new Date(place.updatedAt).toLocaleString('ko-KR')}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {place.keywordCount !== undefined && (
          <Card>
            <CardHeader>
              <CardTitle>통계</CardTitle>
              <CardDescription>Place 관련 통계입니다</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-gray-500">키워드 수</div>
                  <div className="mt-1 text-2xl font-bold">{place.keywordCount}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">리뷰 수</div>
                  <div className="mt-1 text-2xl font-bold">{place.reviewCount || 0}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>키워드 관리</CardTitle>
            <CardDescription>이 Place와 연결된 키워드를 관리합니다</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddKeyword} className="mb-4">
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="키워드 입력 (예: 강남 맛집)"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="flex-1"
                />
                <Input
                  type="text"
                  placeholder="지역 (선택사항)"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-40"
                />
                <Button
                  type="submit"
                  disabled={addKeywordMutation.isPending}
                >
                  {addKeywordMutation.isPending ? '추가 중...' : '추가'}
                </Button>
              </div>
            </form>

            <div className="space-y-3">
              {keywordsLoading ? (
                <p className="text-sm text-gray-500">로딩 중...</p>
              ) : placeKeywords && placeKeywords.length > 0 ? (
                placeKeywords.map((pk) => (
                  <KeywordRankingItem
                    key={pk.id}
                    placeKeyword={pk}
                    onRemove={() => handleRemoveKeyword(pk.id)}
                    onScrape={() => handleScrapeRanking(pk.id)}
                    isRemoving={removeKeywordMutation.isPending}
                    isScraping={scrapeRankingMutation.isPending}
                  />
                ))
              ) : (
                <p className="text-sm text-gray-500">
                  연결된 키워드가 없습니다. 위에서 키워드를 추가하세요.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
