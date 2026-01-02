'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ReviewStats } from '@/types/api';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface ReviewAnalyticsChartProps {
  stats: ReviewStats;
}

const COLORS = {
  positive: '#22c55e', // green-500
  negative: '#ef4444', // red-500
  neutral: '#6b7280', // gray-500
};

export function ReviewAnalyticsChart({ stats }: ReviewAnalyticsChartProps) {
  const data = [
    {
      name: '긍정',
      value: stats.positiveCount,
      color: COLORS.positive,
    },
    {
      name: '부정',
      value: stats.negativeCount,
      color: COLORS.negative,
    },
    {
      name: '중립',
      value: stats.neutralCount,
      color: COLORS.neutral,
    },
  ].filter((item) => item.value > 0);

  const totalReviews = stats.totalReviews;
  const averageRating = stats.averageRating?.toFixed(1) || '-';

  if (totalReviews === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>리뷰 감정 분석</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            분석할 리뷰가 없습니다
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>리뷰 감정 분석</CardTitle>
        <div className="flex gap-6 mt-2">
          <div>
            <p className="text-sm text-muted-foreground">전체 리뷰</p>
            <p className="text-2xl font-bold">{totalReviews}개</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">평균 평점</p>
            <p className="text-2xl font-bold">{averageRating}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value, percent }) =>
                `${name} ${value}개 (${((percent || 0) * 100).toFixed(0)}%)`
              }
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number | undefined, name: string | undefined) => [
                `${value || 0}개`,
                name || '',
              ]}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="text-center">
            <div
              className="w-4 h-4 rounded-full mx-auto mb-1"
              style={{ backgroundColor: COLORS.positive }}
            />
            <p className="text-sm font-medium">{stats.positiveCount}</p>
            <p className="text-xs text-muted-foreground">긍정</p>
          </div>
          <div className="text-center">
            <div
              className="w-4 h-4 rounded-full mx-auto mb-1"
              style={{ backgroundColor: COLORS.negative }}
            />
            <p className="text-sm font-medium">{stats.negativeCount}</p>
            <p className="text-xs text-muted-foreground">부정</p>
          </div>
          <div className="text-center">
            <div
              className="w-4 h-4 rounded-full mx-auto mb-1"
              style={{ backgroundColor: COLORS.neutral }}
            />
            <p className="text-sm font-medium">{stats.neutralCount}</p>
            <p className="text-xs text-muted-foreground">중립</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
