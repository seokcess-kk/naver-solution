import { IPlaceRepository } from '@domain/repositories/IPlaceRepository';
import { UpdatePlaceActiveStatusDto } from '@application/dtos/place/UpdatePlaceActiveStatusDto';
import { PlaceResponseDto } from '@application/dtos/place/PlaceResponseDto';
import { NotFoundError } from '@application/errors/HttpError';

export class UpdatePlaceActiveStatusUseCase {
  constructor(private readonly placeRepository: IPlaceRepository) {}

  async execute(id: string, dto: UpdatePlaceActiveStatusDto): Promise<PlaceResponseDto> {
    // 1. Validate place exists
    const place = await this.placeRepository.findById(id);
    if (!place) {
      throw new NotFoundError(`Place with id ${id} not found`);
    }

    // 2. Update active status
    await this.placeRepository.updateActiveStatus(id, dto.isActive);

    // 3. Fetch updated place
    const updatedPlace = await this.placeRepository.findById(id);

    // 4. Return DTO
    return PlaceResponseDto.fromEntity(updatedPlace!);
  }
}
