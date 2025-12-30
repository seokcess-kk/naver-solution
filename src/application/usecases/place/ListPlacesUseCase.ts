import { IPlaceRepository } from '@domain/repositories/IPlaceRepository';
import { IUserRepository } from '@domain/repositories/IUserRepository';
import { PaginationOptions, PaginatedResult } from '@domain/repositories/IBaseRepository';
import { PlaceResponseDto } from '@application/dtos/place/PlaceResponseDto';
import { NotFoundError } from '@application/errors/HttpError';

interface ListPlacesOptions {
  userId: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  activeOnly?: boolean;
}

export class ListPlacesUseCase {
  constructor(
    private readonly placeRepository: IPlaceRepository,
    private readonly userRepository: IUserRepository
  ) {}

  async execute(options: ListPlacesOptions): Promise<PaginatedResult<PlaceResponseDto>> {
    const { userId, page, limit, sortBy, sortOrder, activeOnly = false } = options;

    // 1. Validate user exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError(`User with id ${userId} not found`);
    }

    // 2. Get places with pagination
    let result: PaginatedResult<any>;

    if (activeOnly) {
      // For activeOnly, we don't have pagination support yet, so fetch all and manually paginate
      const activePlaces = await this.placeRepository.findActiveByUserId(userId);
      const startIndex = ((page || 1) - 1) * (limit || 10);
      const endIndex = startIndex + (limit || 10);
      const paginatedData = activePlaces.slice(startIndex, endIndex);

      result = {
        data: paginatedData,
        pagination: {
          page: page || 1,
          limit: limit || 10,
          total: activePlaces.length,
          totalPages: Math.ceil(activePlaces.length / (limit || 10)),
        },
      };
    } else {
      // Use repository pagination
      result = await this.placeRepository.findByUserId(userId, {
        page,
        limit,
        sortBy,
        sortOrder,
      });
    }

    // 3. Convert to DTOs
    return {
      data: result.data.map((place) => PlaceResponseDto.fromEntity(place, false)),
      pagination: result.pagination,
    };
  }
}
