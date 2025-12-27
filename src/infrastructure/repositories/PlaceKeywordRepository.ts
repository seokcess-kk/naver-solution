import { DataSource, Repository } from 'typeorm';
import { IPlaceKeywordRepository } from '@domain/repositories/IPlaceKeywordRepository';
import { PlaceKeyword } from '@domain/entities/PlaceKeyword';

export class PlaceKeywordRepository implements IPlaceKeywordRepository {
  private readonly repository: Repository<PlaceKeyword>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(PlaceKeyword);
  }

  async findById(id: string): Promise<PlaceKeyword | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findAll(): Promise<PlaceKeyword[]> {
    return this.repository.find();
  }

  async save(placeKeyword: PlaceKeyword): Promise<PlaceKeyword> {
    return this.repository.save(placeKeyword);
  }

  async update(id: string, data: Partial<PlaceKeyword>): Promise<PlaceKeyword> {
    await this.repository.update(id, data);
    const updated = await this.findById(id);
    if (!updated) {
      throw new Error(`PlaceKeyword with id ${id} not found`);
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async findByPlaceId(placeId: string): Promise<PlaceKeyword[]> {
    return this.repository.find({
      where: { place: { id: placeId } },
      relations: ['place', 'keyword'],
    });
  }

  async findActiveByPlaceId(placeId: string): Promise<PlaceKeyword[]> {
    return this.repository.find({
      where: { place: { id: placeId }, isActive: true },
      relations: ['place', 'keyword'],
    });
  }

  async findByPlaceAndKeyword(
    placeId: string,
    keywordId: string,
    region: string
  ): Promise<PlaceKeyword | null> {
    return this.repository.findOne({
      where: {
        place: { id: placeId },
        keyword: { id: keywordId },
        region,
      },
      relations: ['place', 'keyword'],
    });
  }

  async updateActiveStatus(id: string, isActive: boolean): Promise<void> {
    await this.repository.update(id, { isActive });
  }
}
