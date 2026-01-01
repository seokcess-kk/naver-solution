import { IPlaceKeywordRepository } from '@domain/repositories/IPlaceKeywordRepository';
import { IPlaceRepository } from '@domain/repositories/IPlaceRepository';
import { PlaceKeywordResponseDto } from '@application/dtos/keyword/PlaceKeywordResponseDto';
import { NotFoundError } from '@application/errors/HttpError';

export class GetPlaceKeywordsUseCase {
  constructor(
    private readonly placeKeywordRepository: IPlaceKeywordRepository,
    private readonly placeRepository: IPlaceRepository
  ) {}

  async execute(placeId: string): Promise<PlaceKeywordResponseDto[]> {
    // Verify place exists
    const place = await this.placeRepository.findById(placeId);
    if (!place) {
      throw new NotFoundError(`Place with id ${placeId} not found`);
    }

    const placeKeywords = await this.placeKeywordRepository.findByPlaceId(placeId);

    return placeKeywords.map(
      (pk) =>
        new PlaceKeywordResponseDto(
          pk.id,
          pk.place.id,
          pk.place.name,
          pk.keyword.id,
          pk.keyword.keyword,
          pk.region,
          pk.isActive,
          pk.createdAt
        )
    );
  }
}
