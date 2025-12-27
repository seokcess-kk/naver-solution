import { Exclude, Expose } from 'class-transformer';
import { CompetitorSnapshot } from '@domain/entities/CompetitorSnapshot';

@Exclude()
export class CompetitorSnapshotResponseDto {
  @Expose()
  id: string;

  @Expose()
  competitorId: string;

  @Expose()
  rank: number | null;

  @Expose()
  blogReviewCount: number | null;

  @Expose()
  visitorReviewCount: number | null;

  @Expose()
  averageRating: number | null;

  @Expose()
  checkedAt: Date;

  @Expose()
  createdAt: Date;

  // Computed field
  @Expose()
  totalReviewCount?: number;

  // Optional: competitor relation data
  @Expose()
  competitorName?: string;

  @Expose()
  category?: string | null;

  static fromEntity(
    snapshot: CompetitorSnapshot,
    includeComputed = false
  ): CompetitorSnapshotResponseDto {
    const dto = new CompetitorSnapshotResponseDto();
    dto.id = snapshot.id;
    dto.competitorId = snapshot.competitor.id;
    dto.rank = snapshot.rank;
    dto.blogReviewCount = snapshot.blogReviewCount;
    dto.visitorReviewCount = snapshot.visitorReviewCount;
    dto.averageRating = snapshot.averageRating;
    dto.checkedAt = snapshot.checkedAt;
    dto.createdAt = snapshot.createdAt;

    // Computed field - NULL check required (all metrics are nullable)
    if (
      includeComputed &&
      snapshot.blogReviewCount !== null &&
      snapshot.visitorReviewCount !== null
    ) {
      dto.totalReviewCount = snapshot.blogReviewCount + snapshot.visitorReviewCount;
    }

    // Include competitor relation data
    if (snapshot.competitor) {
      dto.competitorName = snapshot.competitor.competitorName;
      dto.category = snapshot.competitor.category;
    }

    return dto;
  }
}
