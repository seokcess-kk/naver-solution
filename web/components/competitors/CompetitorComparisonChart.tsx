'use client';

import { useMemo } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CompetitorHistoryItem } from '@/types/api';

interface CompetitorComparisonChartProps {
  data: CompetitorHistoryItem[];
  title?: string;
  dataKey: 'averageRating' | 'blogReviewCount' | 'visitorReviewCount' | 'rank';
  competitorName?: string;
  yAxisLabel?: string;
}

export function CompetitorComparisonChart({
  data,
  title,
  dataKey,
  competitorName = '경쟁사',
  yAxisLabel,
}: CompetitorComparisonChartProps) {
  const chartData = useMemo(() => {
    return data
      .map((item) => ({
        date: new Date(item.checkedAt).toLocaleDateString('ko-KR', {
          month: 'short',
          day: 'numeric',
        }),
        value: item[dataKey] ?? 0,
        fullDate: item.checkedAt,
      }))
      .sort(
        (a, b) =>
          new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime()
      );
  }, [data, dataKey]);

  const getTitle = () => {
    if (title) return title;

    switch (dataKey) {
      case 'averageRating':
        return '평균 평점 추이';
      case 'blogReviewCount':
        return '블로그 리뷰 수 추이';
      case 'visitorReviewCount':
        return '방문자 리뷰 수 추이';
      case 'rank':
        return '순위 추이';
      default:
        return '데이터 추이';
    }
  };

  const getYAxisLabel = () => {
    if (yAxisLabel) return yAxisLabel;

    switch (dataKey) {
      case 'averageRating':
        return '평점';
      case 'blogReviewCount':
      case 'visitorReviewCount':
        return '리뷰 수';
      case 'rank':
        return '순위';
      default:
        return '';
    }
  };

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{getTitle()}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            데이터가 없습니다
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{getTitle()}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickMargin={10}
            />
            <YAxis
              label={{
                value: getYAxisLabel(),
                angle: -90,
                position: 'insideLeft',
              }}
              reversed={dataKey === 'rank'} // 순위는 낮을수록 좋으므로 역순
            />
            <Tooltip
              formatter={(value: number | undefined) => {
                if (value === undefined || value === null) return 'N/A';
                if (dataKey === 'averageRating') {
                  return value.toFixed(1);
                }
                return value;
              }}
              labelFormatter={(label) => `날짜: ${label}`}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="value"
              name={competitorName}
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
