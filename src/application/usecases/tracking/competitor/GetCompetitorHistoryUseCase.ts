import { ICompetitorSnapshotRepository } from '@domain/repositories/ICompetitorSnapshotRepository';
import { ICompetitorRepository } from '@domain/repositories/ICompetitorRepository';
import { CompetitorSnapshot } from '@domain/entities/CompetitorSnapshot';
import { GetCompetitorHistoryDto } from '@application/dtos/tracking/competitor/GetCompetitorHistoryDto';
import { CompetitorSnapshotResponseDto } from '@application/dtos/tracking/competitor/CompetitorSnapshotResponseDto';

export class GetCompetitorHistoryUseCase {
  constructor(
    private readonly snapshotRepository: ICompetitorSnapshotRepository,
    private readonly competitorRepository: ICompetitorRepository
  ) {}

  async execute(dto: GetCompetitorHistoryDto): Promise<CompetitorSnapshotResponseDto[]> {
    // 1. Validate Competitor exists
    const competitor = await this.competitorRepository.findById(dto.competitorId);
    if (!competitor) {
      throw new Error('Competitor not found');
    }

    // 2. Get history based on date range or limit
    let snapshots: CompetitorSnapshot[];

    if (dto.startDate && dto.endDate) {
      snapshots = await this.snapshotRepository.findByCompetitorIdInDateRange(
        dto.competitorId,
        dto.startDate,
        dto.endDate
      );
    } else {
      snapshots = await this.snapshotRepository.findByCompetitorId(
        dto.competitorId,
        dto.limit || 100
      );
    }

    // 3. Convert to DTOs with computed fields
    return snapshots.map((s) => CompetitorSnapshotResponseDto.fromEntity(s, true));
  }
}
