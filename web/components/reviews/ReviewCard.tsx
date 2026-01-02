'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Review } from '@/types/api';
import { SentimentBadge } from './SentimentBadge';
import { Star } from 'lucide-react';

interface ReviewCardProps {
  review: Review;
}

export function ReviewCard({ review }: ReviewCardProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const reviewTypeLabel = {
    BLOG: '블로그',
    VISITOR: '방문자',
    OTHER: '기타',
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">
                {review.author || '익명'}
              </span>
              <span className="text-xs text-muted-foreground">
                {reviewTypeLabel[review.reviewType]}
              </span>
            </div>
            {review.rating !== null && (
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3 w-3 ${
                      i < review.rating!
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'fill-gray-200 text-gray-200'
                    }`}
                  />
                ))}
                <span className="text-xs text-muted-foreground ml-1">
                  {review.rating}.0
                </span>
              </div>
            )}
          </div>
          <SentimentBadge
            sentiment={review.sentiment}
            score={review.sentimentScore}
          />
        </div>
      </CardHeader>
      <CardContent>
        {review.content ? (
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {review.content}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            리뷰 내용이 없습니다
          </p>
        )}
        <div className="mt-3 text-xs text-muted-foreground">
          {formatDate(review.publishedAt)}
        </div>
      </CardContent>
    </Card>
  );
}
