import { ICompetitorSnapshotRepository } from '@domain/repositories/ICompetitorSnapshotRepository';
import { ICompetitorRepository } from '@domain/repositories/ICompetitorRepository';
import { CompetitorSnapshot } from '@domain/entities/CompetitorSnapshot';
import { RecordCompetitorSnapshotDto } from '@application/dtos/tracking/competitor/RecordCompetitorSnapshotDto';
import { CompetitorSnapshotResponseDto } from '@application/dtos/tracking/competitor/CompetitorSnapshotResponseDto';
import { NotFoundError, BadRequestError } from '@application/errors/HttpError';

export class RecordCompetitorSnapshotUseCase {
  constructor(
    private readonly snapshotRepository: ICompetitorSnapshotRepository,
    private readonly competitorRepository: ICompetitorRepository
  ) {}

  async execute(dto: RecordCompetitorSnapshotDto): Promise<CompetitorSnapshotResponseDto> {
    // 1. Validate Competitor exists
    const competitor = await this.competitorRepository.findById(dto.competitorId);
    if (!competitor) {
      throw new NotFoundError(`Competitor with id ${dto.competitorId} not found`);
    }

    // 2. Business Rule: Competitor must be active
    if (!competitor.isActive) {
      throw new BadRequestError(`Cannot record snapshot for inactive competitor ${dto.competitorId}`);
    }

    // 3. Create CompetitorSnapshot entity
    const snapshot = new CompetitorSnapshot();
    snapshot.competitor = competitor;
    snapshot.rank = dto.rank;
    snapshot.blogReviewCount = dto.blogReviewCount;
    snapshot.visitorReviewCount = dto.visitorReviewCount;
    snapshot.averageRating = dto.averageRating;
    snapshot.checkedAt = dto.checkedAt;

    // 4. Save to repository
    const saved = await this.snapshotRepository.save(snapshot);

    // 5. Convert to DTO with computed fields
    return CompetitorSnapshotResponseDto.fromEntity(saved, true);
  }
}
