import { IPlaceRepository } from '@domain/repositories/IPlaceRepository';
import { IUserRepository } from '@domain/repositories/IUserRepository';
import { Place } from '@domain/entities/Place';
import { CreatePlaceDto } from '@application/dtos/place/CreatePlaceDto';
import { PlaceResponseDto } from '@application/dtos/place/PlaceResponseDto';
import { NotFoundError, ConflictError } from '@application/errors/HttpError';

export class CreatePlaceUseCase {
  constructor(
    private readonly placeRepository: IPlaceRepository,
    private readonly userRepository: IUserRepository
  ) {}

  async execute(dto: CreatePlaceDto): Promise<PlaceResponseDto> {
    // 1. Validate user exists
    const user = await this.userRepository.findById(dto.userId);
    if (!user) {
      throw new NotFoundError(`User with id ${dto.userId} not found`);
    }

    // 2. Check for duplicate naverPlaceId
    const existingPlace = await this.placeRepository.findByNaverPlaceId(dto.naverPlaceId);
    if (existingPlace) {
      throw new ConflictError(`Place with naverPlaceId ${dto.naverPlaceId} already exists`);
    }

    // 3. Create Place entity
    const place = new Place();
    place.user = user;
    place.naverPlaceId = dto.naverPlaceId;
    place.name = dto.name;
    place.category = dto.category || null;
    place.address = dto.address || null;
    place.naverPlaceUrl = dto.naverPlaceUrl;
    place.isActive = true;

    // 4. Save to repository
    const savedPlace = await this.placeRepository.save(place);

    // 5. Convert to DTO and return
    return PlaceResponseDto.fromEntity(savedPlace);
  }
}
