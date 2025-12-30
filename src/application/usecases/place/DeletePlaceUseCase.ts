import { IPlaceRepository } from '@domain/repositories/IPlaceRepository';
import { NotFoundError } from '@application/errors/HttpError';

export class DeletePlaceUseCase {
  constructor(private readonly placeRepository: IPlaceRepository) {}

  async execute(id: string): Promise<void> {
    // 1. Validate place exists
    const place = await this.placeRepository.findById(id);
    if (!place) {
      throw new NotFoundError(`Place with id ${id} not found`);
    }

    // 2. Delete place (cascade deletes handled by DB)
    await this.placeRepository.delete(id);
  }
}
