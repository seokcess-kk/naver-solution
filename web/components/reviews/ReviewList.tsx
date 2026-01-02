'use client';

import { Review } from '@/types/api';
import { ReviewCard } from './ReviewCard';

interface ReviewListProps {
  reviews: Review[];
  emptyMessage?: string;
}

export function ReviewList({
  reviews,
  emptyMessage = '리뷰가 없습니다',
}: ReviewListProps) {
  if (reviews.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <ReviewCard key={review.id} review={review} />
      ))}
    </div>
  );
}
