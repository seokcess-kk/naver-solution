import { DataSource, Repository } from 'typeorm';
import { IPlaceRepository } from '@domain/repositories/IPlaceRepository';
import { Place } from '@domain/entities/Place';

export class PlaceRepository implements IPlaceRepository {
  private readonly repository: Repository<Place>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(Place);
  }

  async findById(id: string): Promise<Place | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findAll(): Promise<Place[]> {
    return this.repository.find();
  }

  async save(place: Place): Promise<Place> {
    return this.repository.save(place);
  }

  async update(id: string, data: Partial<Place>): Promise<Place> {
    await this.repository.update(id, data);
    const updated = await this.findById(id);
    if (!updated) {
      throw new Error(`Place with id ${id} not found`);
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async findByUserId(userId: string): Promise<Place[]> {
    return this.repository.find({
      where: { user: { id: userId } },
      relations: ['user'],
    });
  }

  async findByNaverPlaceId(naverPlaceId: string): Promise<Place | null> {
    return this.repository.findOne({ where: { naverPlaceId } });
  }

  async findActiveByUserId(userId: string): Promise<Place[]> {
    return this.repository.find({
      where: { user: { id: userId }, isActive: true },
      relations: ['user'],
    });
  }

  async updateActiveStatus(id: string, isActive: boolean): Promise<void> {
    await this.repository.update(id, { isActive });
  }
}
