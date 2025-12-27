import { IPlaceRepository } from '@domain/repositories/IPlaceRepository';
import { UpdatePlaceDto } from '@application/dtos/place/UpdatePlaceDto';
import { PlaceResponseDto } from '@application/dtos/place/PlaceResponseDto';
import { Place } from '@domain/entities/Place';

export class UpdatePlaceUseCase {
  constructor(private readonly placeRepository: IPlaceRepository) {}

  async execute(id: string, dto: UpdatePlaceDto): Promise<PlaceResponseDto> {
    // 1. Validate place exists
    const place = await this.placeRepository.findById(id);
    if (!place) {
      throw new Error('Place not found');
    }

    // 2. Build update data (only include provided fields)
    const updateData: Partial<Place> = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.category !== undefined) updateData.category = dto.category;
    if (dto.address !== undefined) updateData.address = dto.address;
    if (dto.naverPlaceUrl !== undefined) updateData.naverPlaceUrl = dto.naverPlaceUrl;

    // 3. Update place
    const updatedPlace = await this.placeRepository.update(id, updateData);

    // 4. Return DTO
    return PlaceResponseDto.fromEntity(updatedPlace);
  }
}
