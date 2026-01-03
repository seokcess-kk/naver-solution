'use client';

import { Competitor } from '@/types/api';
import { CompetitorCard } from './CompetitorCard';

interface CompetitorListProps {
  competitors: Competitor[];
  emptyMessage?: string;
  onViewDetails?: (competitorId: string) => void;
  onDelete?: (competitorId: string) => void;
}

export function CompetitorList({
  competitors,
  emptyMessage = '등록된 경쟁사가 없습니다',
  onViewDetails,
  onDelete,
}: CompetitorListProps) {
  if (competitors.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {competitors.map((competitor) => (
        <CompetitorCard
          key={competitor.id}
          competitor={competitor}
          onViewDetails={onViewDetails}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
