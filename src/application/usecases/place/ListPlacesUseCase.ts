import { IPlaceRepository } from '@domain/repositories/IPlaceRepository';
import { IUserRepository } from '@domain/repositories/IUserRepository';
import { PlaceResponseDto } from '@application/dtos/place/PlaceResponseDto';

export class ListPlacesUseCase {
  constructor(
    private readonly placeRepository: IPlaceRepository,
    private readonly userRepository: IUserRepository
  ) {}

  async execute(userId: string, activeOnly: boolean = false): Promise<PlaceResponseDto[]> {
    // 1. Validate user exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // 2. Get places based on filter
    const places = activeOnly
      ? await this.placeRepository.findActiveByUserId(userId)
      : await this.placeRepository.findByUserId(userId);

    // 3. Convert to DTOs
    return places.map((place) => PlaceResponseDto.fromEntity(place, false));
  }
}
