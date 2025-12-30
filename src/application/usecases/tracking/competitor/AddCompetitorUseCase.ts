import { ICompetitorRepository } from '@domain/repositories/ICompetitorRepository';
import { IPlaceRepository } from '@domain/repositories/IPlaceRepository';
import { Competitor } from '@domain/entities/Competitor';
import { AddCompetitorDto } from '@application/dtos/tracking/competitor/AddCompetitorDto';
import { CompetitorResponseDto } from '@application/dtos/tracking/competitor/CompetitorResponseDto';
import { NotFoundError, ConflictError } from '@application/errors/HttpError';

export class AddCompetitorUseCase {
  constructor(
    private readonly competitorRepository: ICompetitorRepository,
    private readonly placeRepository: IPlaceRepository
  ) {}

  async execute(dto: AddCompetitorDto): Promise<CompetitorResponseDto> {
    // 1. Validate Place exists
    const place = await this.placeRepository.findById(dto.placeId);
    if (!place) {
      throw new NotFoundError(`Place with id ${dto.placeId} not found`);
    }

    // 2. Business Rule: Check for duplicate competitor
    const existing = await this.competitorRepository.findByPlaceAndNaverId(
      dto.placeId,
      dto.competitorNaverPlaceId
    );
    if (existing) {
      throw new ConflictError(`Competitor with naverPlaceId ${dto.competitorNaverPlaceId} already exists for this place`);
    }

    // 3. Create Competitor entity
    const competitor = new Competitor();
    competitor.place = place;
    competitor.competitorNaverPlaceId = dto.competitorNaverPlaceId;
    competitor.competitorName = dto.competitorName;
    competitor.category = dto.category || null;
    competitor.isActive = true;

    // 4. Save to repository
    const saved = await this.competitorRepository.save(competitor);

    // 5. Convert to DTO with relations
    return CompetitorResponseDto.fromEntity(saved, true);
  }
}
