import { IPlaceRepository } from '@domain/repositories/IPlaceRepository';
import { PlaceStatsResponseDto } from '@application/dtos/place/PlaceStatsResponseDto';

export class GetPlaceStatsUseCase {
  constructor(private readonly placeRepository: IPlaceRepository) {}

  async execute(userId: string): Promise<PlaceStatsResponseDto> {
    const totalPlaces = await this.placeRepository.countByUserId(userId);
    const activePlaces = await this.placeRepository.countActiveByUserId(userId);

    return new PlaceStatsResponseDto(totalPlaces, activePlaces);
  }
}
