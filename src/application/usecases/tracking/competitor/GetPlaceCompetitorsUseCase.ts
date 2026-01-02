import { ICompetitorRepository } from '@domain/repositories/ICompetitorRepository';
import { GetPlaceCompetitorsDto } from '@application/dtos/tracking/competitor/GetPlaceCompetitorsDto';
import { CompetitorResponseDto } from '@application/dtos/tracking/competitor/CompetitorResponseDto';

export class GetPlaceCompetitorsUseCase {
  constructor(private readonly competitorRepository: ICompetitorRepository) {}

  async execute(dto: GetPlaceCompetitorsDto): Promise<CompetitorResponseDto[]> {
    const competitors = dto.activeOnly
      ? await this.competitorRepository.findActiveByPlaceId(dto.placeId)
      : await this.competitorRepository.findByPlaceId(dto.placeId);

    return competitors.map((competitor) =>
      CompetitorResponseDto.fromEntity(competitor, false)
    );
  }
}
