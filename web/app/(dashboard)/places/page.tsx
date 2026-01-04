'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { getPlaces, deletePlace } from '@/lib/api/place';
import { useRequireAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Pencil, Trash2, ExternalLink, Search, Filter, ArrowUpDown } from 'lucide-react';
import { useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function PlacesPage() {
  const router = useRouter();
  const { user } = useRequireAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const limit = 10;
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'createdAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

  // Place 목록 조회 (모든 데이터를 가져옴)
  const { data: allPlacesData, isLoading, error } = useQuery({
    queryKey: ['places', user?.id],
    queryFn: () =>
      getPlaces({
        userId: user!.id,
        page: 1,
        limit: 1000, // 클라이언트 사이드 필터링을 위해 모든 데이터 가져오기
        sortBy: 'createdAt',
        sortOrder: 'DESC',
      }),
    enabled: !!user,
  });

  // 검색, 필터링, 정렬 적용
  const filteredAndSortedPlaces = useMemo(() => {
    if (!allPlacesData?.data) return [];

    let filtered = [...allPlacesData.data];

    // 검색 필터
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (place) =>
          place.name.toLowerCase().includes(query) ||
          place.address?.toLowerCase().includes(query) ||
          place.category?.toLowerCase().includes(query)
      );
    }

    // 상태 필터
    if (statusFilter !== 'all') {
      filtered = filtered.filter((place) =>
        statusFilter === 'active' ? place.isActive : !place.isActive
      );
    }

    // 정렬
    filtered.sort((a, b) => {
      let compareValue = 0;
      if (sortBy === 'name') {
        compareValue = a.name.localeCompare(b.name, 'ko');
      } else if (sortBy === 'createdAt') {
        compareValue = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return sortOrder === 'ASC' ? compareValue : -compareValue;
    });

    return filtered;
  }, [allPlacesData, searchQuery, statusFilter, sortBy, sortOrder]);

  // 페이지네이션 적용
  const totalPages = Math.ceil(filteredAndSortedPlaces.length / limit);
  const paginatedPlaces = filteredAndSortedPlaces.slice(
    (page - 1) * limit,
    page * limit
  );

  // 페이지 변경 시 페이지 번호 조정
  if (page > totalPages && totalPages > 0) {
    setPage(totalPages);
  }

  // Place 삭제 mutation
  const deleteMutation = useMutation({
    mutationFn: deletePlace,
    onSuccess: () => {
      // 삭제 성공 시 목록 다시 불러오기
      queryClient.invalidateQueries({ queryKey: ['places'] });
      toast.success('장소가 삭제되었습니다.');
    },
    onError: () => {
      toast.error('장소 삭제에 실패했습니다.');
    },
  });

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`"${name}" 장소를 삭제하시겠습니까?`)) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
              <Skeleton className="h-10 w-32" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-red-500">오류 발생</CardTitle>
            <CardDescription>데이터를 불러오는데 실패했습니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              {error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'}
            </p>
            <Button
              onClick={() => window.location.reload()}
              className="w-full"
            >
              다시 시도
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>등록된 Place</CardTitle>
              <CardDescription>네이버 플레이스 목록을 관리합니다</CardDescription>
            </div>
            <Button onClick={() => router.push('/places/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Place 추가
            </Button>
          </div>

          {/* 검색, 필터링, 정렬 컨트롤 */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="이름, 주소, 카테고리 검색..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(value: 'all' | 'active' | 'inactive') => {
                setStatusFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="상태 필터" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="active">활성</SelectItem>
                <SelectItem value="inactive">비활성</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Select
                value={sortBy}
                onValueChange={(value: 'name' | 'createdAt') => setSortBy(value)}
              >
                <SelectTrigger className="flex-1">
                  <ArrowUpDown className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="정렬 기준" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">생성일</SelectItem>
                  <SelectItem value="name">이름</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC')}
                title={sortOrder === 'ASC' ? '오름차순' : '내림차순'}
              >
                {sortOrder === 'ASC' ? '↑' : '↓'}
              </Button>
            </div>
          </div>

          {/* 필터 적용 결과 표시 */}
          {(searchQuery || statusFilter !== 'all') && (
            <div className="mt-4 text-sm text-gray-600">
              {filteredAndSortedPlaces.length}개의 결과{' '}
              {allPlacesData?.data && (
                <span className="text-gray-400">
                  (전체 {allPlacesData.data.length}개 중)
                </span>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent>
          {!allPlacesData || filteredAndSortedPlaces.length === 0 ? (
            <div className="text-center py-12">
              {searchQuery || statusFilter !== 'all' ? (
                <>
                  <p className="text-gray-500 mb-4">검색 결과가 없습니다.</p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('all');
                      setPage(1);
                    }}
                  >
                    필터 초기화
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-gray-500 mb-4">등록된 Place가 없습니다.</p>
                  <Button onClick={() => router.push('/places/new')}>
                    <Plus className="mr-2 h-4 w-4" />
                    첫 Place 추가하기
                  </Button>
                </>
              )}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>이름</TableHead>
                    <TableHead>카테고리</TableHead>
                    <TableHead>주소</TableHead>
                    <TableHead>네이버 Place ID</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead className="text-right">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedPlaces.map((place) => (
                    <TableRow key={place.id}>
                      <TableCell className="font-medium">{place.name}</TableCell>
                      <TableCell>{place.category || '-'}</TableCell>
                      <TableCell>{place.address || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {place.naverPlaceId}
                          <a
                            href={place.naverPlaceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:text-blue-700"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            place.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {place.isActive ? '활성' : '비활성'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/places/${place.id}`)}
                          >
                            상세
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/places/${place.id}/edit`)}
                            aria-label={`${place.name} 수정`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(place.id, place.name)}
                            disabled={deleteMutation.isPending}
                            aria-label={`${place.name} 삭제`}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    이전
                  </Button>
                  <span className="text-sm">
                    {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    다음
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
