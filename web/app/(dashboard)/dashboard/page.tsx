'use client';

import { useRequireAuth } from '@/lib/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { getPlaceStats, getPlaces } from '@/lib/api/place';
import { getPlaceReviews } from '@/lib/api/review';
import { getPlaceNotificationLogs } from '@/lib/api/notification';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { ArrowUp, ArrowDown, MessageSquare, Bell } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

const COLORS = ['#10b981', '#8b5cf6'];

export default function DashboardPage() {
  const { user } = useRequireAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['placeStats', user?.id],
    queryFn: () => getPlaceStats(user!.id),
    enabled: !!user,
  });

  // 사용자의 place 목록 조회
  const { data: placesData } = useQuery({
    queryKey: ['places', user?.id],
    queryFn: () => getPlaces({ userId: user!.id, limit: 5 }),
    enabled: !!user,
  });

  // 최근 리뷰 조회 (첫 번째 place만)
  const firstPlaceId = placesData?.data[0]?.id;
  const { data: recentReviews } = useQuery({
    queryKey: ['recentReviews', firstPlaceId],
    queryFn: () => getPlaceReviews(firstPlaceId!, { limit: 3 }),
    enabled: !!firstPlaceId,
  });

  // 활동 로그 조회 (알림 로그 - 첫 번째 place)
  const { data: activityLogs } = useQuery({
    queryKey: ['activityLogs', firstPlaceId],
    queryFn: () => getPlaceNotificationLogs(firstPlaceId!, 5),
    enabled: !!firstPlaceId,
  });

  const chartData = stats
    ? [
        { name: '활성', value: stats.activePlaces },
        { name: '비활성', value: stats.inactivePlaces },
      ]
    : [];

  return (
    <div className="px-4 py-6 sm:px-0">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">대시보드</h2>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            등록된 Place
          </h3>
          <p className="text-3xl font-bold text-blue-600">
            {isLoading ? '...' : stats?.totalPlaces ?? 0}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            활성 Place
          </h3>
          <p className="text-3xl font-bold text-green-600">
            {isLoading ? '...' : stats?.activePlaces ?? 0}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            비활성 Place
          </h3>
          <p className="text-3xl font-bold text-purple-600">
            {isLoading ? '...' : stats?.inactivePlaces ?? 0}
          </p>
        </div>
      </div>

      {/* 2열 레이아웃: 차트 + 최근 활동 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Place 활성 상태 분포 차트 */}
        {stats && stats.totalPlaces > 0 && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">
              Place 활성 상태 분포
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name ?? ''}: ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* 최근 리뷰 요약 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              최근 리뷰
            </h3>
          </div>
          <div className="space-y-3">
            {recentReviews && recentReviews.length > 0 ? (
              recentReviews.slice(0, 3).map((review) => (
                <div key={review.id} className="border-l-4 border-blue-500 pl-3 py-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-700">
                      {review.author || '익명'}
                    </span>
                    {review.rating && (
                      <span className="text-xs text-yellow-600">
                        ⭐ {review.rating}
                      </span>
                    )}
                    {review.sentiment && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          review.sentiment === 'POSITIVE'
                            ? 'bg-green-100 text-green-700'
                            : review.sentiment === 'NEGATIVE'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {review.sentiment === 'POSITIVE'
                          ? '긍정'
                          : review.sentiment === 'NEGATIVE'
                          ? '부정'
                          : '중립'}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {review.content || '내용 없음'}
                  </p>
                  {review.publishedAt && (
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDistanceToNow(new Date(review.publishedAt), {
                        addSuffix: true,
                        locale: ko,
                      })}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">
                아직 리뷰가 없습니다.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 활동 로그 */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
            <Bell className="w-5 h-5" />
            최근 활동 로그
          </h3>
        </div>
        <div className="space-y-2">
          {activityLogs && activityLogs.length > 0 ? (
            activityLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">
                    {log.notificationType} 알림
                  </p>
                  <p className="text-xs text-gray-500">
                    {log.channel} • {log.isSent ? '전송됨' : '전송 실패'}
                  </p>
                </div>
                <span className="text-xs text-gray-400">
                  {log.sentAt
                    ? formatDistanceToNow(new Date(log.sentAt), {
                        addSuffix: true,
                        locale: ko,
                      })
                    : formatDistanceToNow(new Date(log.createdAt), {
                        addSuffix: true,
                        locale: ko,
                      })}
                </span>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 text-center py-8">
              아직 활동 로그가 없습니다.
            </p>
          )}
        </div>
      </div>

      {/* 최근 Places 목록 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-700">내 Places</h3>
          <Link
            href="/places"
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            전체 보기 →
          </Link>
        </div>
        <div className="space-y-2">
          {placesData && placesData.data.length > 0 ? (
            placesData.data.map((place) => (
              <Link
                key={place.id}
                href={`/places/${place.id}`}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div>
                  <h4 className="font-medium text-gray-900">{place.name}</h4>
                  <p className="text-sm text-gray-500">{place.address}</p>
                </div>
                <span
                  className={`px-2 py-1 text-xs rounded ${
                    place.isActive
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {place.isActive ? '활성' : '비활성'}
                </span>
              </Link>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500 mb-4">
                아직 등록된 Place가 없습니다.
              </p>
              <Link
                href="/places/new"
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                첫 Place 등록하기
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
