'use client';

import { useRequireAuth } from '@/lib/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { getPlaceStats } from '@/lib/api/place';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = ['#10b981', '#8b5cf6'];

export default function DashboardPage() {
  const { user } = useRequireAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['placeStats', user?.id],
    queryFn: () => getPlaceStats(user!.id),
    enabled: !!user,
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

      <div className="mt-8 text-center text-gray-600">
        <p>Place 관리 기능이 활성화되었습니다!</p>
        <p className="mt-2 text-sm">
          상단 메뉴에서 Places를 클릭하여 네이버 플레이스를 관리하세요.
        </p>
      </div>
    </div>
  );
}
