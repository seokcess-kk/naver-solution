import { IPlaceRepository } from '@domain/repositories/IPlaceRepository';
import { PlaceResponseDto } from '@application/dtos/place/PlaceResponseDto';

export class GetPlaceUseCase {
  constructor(private readonly placeRepository: IPlaceRepository) {}

  async execute(id: string, includeRelations: boolean = false): Promise<PlaceResponseDto> {
    // 1. Find place with optional relations
    const place = await this.placeRepository.findById(id);
    if (!place) {
      throw new Error('Place not found');
    }

    // 2. Convert to DTO
    return PlaceResponseDto.fromEntity(place, includeRelations);
  }
}
