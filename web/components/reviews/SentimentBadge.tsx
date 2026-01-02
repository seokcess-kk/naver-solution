'use client';

import { Badge } from '@/components/ui/badge';
import { ReviewSentiment } from '@/types/api';

interface SentimentBadgeProps {
  sentiment: ReviewSentiment | null;
  score?: number | null;
}

const sentimentConfig = {
  POSITIVE: {
    label: '긍정',
    variant: 'default' as const,
    className: 'bg-green-500 hover:bg-green-600',
  },
  NEGATIVE: {
    label: '부정',
    variant: 'destructive' as const,
    className: 'bg-red-500 hover:bg-red-600',
  },
  NEUTRAL: {
    label: '중립',
    variant: 'secondary' as const,
    className: 'bg-gray-500 hover:bg-gray-600',
  },
};

export function SentimentBadge({ sentiment, score }: SentimentBadgeProps) {
  if (!sentiment) {
    return <Badge variant="outline">분석 전</Badge>;
  }

  const config = sentimentConfig[sentiment];

  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
      {score !== null && score !== undefined && ` (${score.toFixed(2)})`}
    </Badge>
  );
}
