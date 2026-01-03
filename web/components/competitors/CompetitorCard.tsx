'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Competitor } from '@/types/api';
import { TrendingUp, Eye, Trash2 } from 'lucide-react';

interface CompetitorCardProps {
  competitor: Competitor;
  onViewDetails?: (competitorId: string) => void;
  onDelete?: (competitorId: string) => void;
}

export function CompetitorCard({
  competitor,
  onViewDetails,
  onDelete,
}: CompetitorCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold text-lg">
                {competitor.competitorName}
              </h3>
            </div>
            {competitor.category && (
              <p className="text-sm text-muted-foreground">
                {competitor.category}
              </p>
            )}
          </div>
          <Badge variant={competitor.isActive ? 'default' : 'secondary'}>
            {competitor.isActive ? '활성' : '비활성'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="text-xs text-muted-foreground">
            <p>
              <span className="font-medium">네이버 플레이스 ID:</span>{' '}
              {competitor.competitorNaverPlaceId}
            </p>
            <p className="mt-1">
              <span className="font-medium">등록일:</span>{' '}
              {formatDate(competitor.createdAt)}
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            {onViewDetails && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewDetails(competitor.id)}
                className="flex-1"
              >
                <Eye className="h-4 w-4 mr-1" />
                상세 보기
              </Button>
            )}
            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(competitor.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                삭제
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
