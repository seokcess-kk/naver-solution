import { IPlaceKeywordRepository } from '@domain/repositories/IPlaceKeywordRepository';
import { NotFoundError } from '@application/errors/HttpError';

export class RemovePlaceKeywordUseCase {
  constructor(private readonly placeKeywordRepository: IPlaceKeywordRepository) {}

  async execute(placeKeywordId: string): Promise<void> {
    const placeKeyword = await this.placeKeywordRepository.findById(placeKeywordId);

    if (!placeKeyword) {
      throw new NotFoundError(`PlaceKeyword with id ${placeKeywordId} not found`);
    }

    await this.placeKeywordRepository.delete(placeKeywordId);
  }
}
