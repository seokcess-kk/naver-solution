'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { getPlaces, deletePlace } from '@/lib/api/place';
import { useRequireAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/button';
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
import { Plus, Pencil, Trash2, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function PlacesPage() {
  const router = useRouter();
  const { user } = useRequireAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const limit = 10;

  // Place 목록 조회
  const { data, isLoading, error } = useQuery({
    queryKey: ['places', user?.id, page, limit],
    queryFn: () =>
      getPlaces({
        userId: user!.id,
        page,
        limit,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
      }),
    enabled: !!user,
  });

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
        </CardHeader>
        <CardContent>
          {!data || data.data.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">등록된 Place가 없습니다.</p>
              <Button onClick={() => router.push('/places/new')}>
                <Plus className="mr-2 h-4 w-4" />
                첫 Place 추가하기
              </Button>
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
                  {data.data.map((place) => (
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
              {data.pagination.totalPages > 1 && (
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
                    {page} / {data.pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                    disabled={page === data.pagination.totalPages}
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
