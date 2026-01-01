import { IPlaceKeywordRepository } from '@domain/repositories/IPlaceKeywordRepository';
import { IPlaceRepository } from '@domain/repositories/IPlaceRepository';
import { IKeywordRepository } from '@domain/repositories/IKeywordRepository';
import { AddPlaceKeywordDto } from '@application/dtos/keyword/AddPlaceKeywordDto';
import { PlaceKeywordResponseDto } from '@application/dtos/keyword/PlaceKeywordResponseDto';
import { NotFoundError, ConflictError } from '@application/errors/HttpError';
import { PlaceKeyword } from '@domain/entities/PlaceKeyword';

export class AddPlaceKeywordUseCase {
  constructor(
    private readonly placeKeywordRepository: IPlaceKeywordRepository,
    private readonly placeRepository: IPlaceRepository,
    private readonly keywordRepository: IKeywordRepository
  ) {}

  async execute(dto: AddPlaceKeywordDto): Promise<PlaceKeywordResponseDto> {
    // Verify place exists
    const place = await this.placeRepository.findById(dto.placeId);
    if (!place) {
      throw new NotFoundError(`Place with id ${dto.placeId} not found`);
    }

    // Find or create keyword
    const keyword = await this.keywordRepository.findOrCreate(dto.keyword);

    // Check if this combination already exists
    const existing = await this.placeKeywordRepository.findByPlaceAndKeyword(
      dto.placeId,
      keyword.id,
      dto.region || ''
    );

    if (existing) {
      throw new ConflictError(
        `Keyword "${dto.keyword}" is already associated with this place${
          dto.region ? ` in region "${dto.region}"` : ''
        }`
      );
    }

    // Create new place-keyword relationship
    const placeKeyword = new PlaceKeyword();
    placeKeyword.place = place;
    placeKeyword.keyword = keyword;
    placeKeyword.region = dto.region || null;
    placeKeyword.isActive = true;

    const saved = await this.placeKeywordRepository.save(placeKeyword);

    return new PlaceKeywordResponseDto(
      saved.id,
      place.id,
      place.name,
      keyword.id,
      keyword.keyword,
      saved.region,
      saved.isActive,
      saved.createdAt
    );
  }
}
