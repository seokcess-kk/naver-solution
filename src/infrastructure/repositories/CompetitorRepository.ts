import { DataSource, Repository } from 'typeorm';
import { ICompetitorRepository } from '@domain/repositories/ICompetitorRepository';
import { Competitor } from '@domain/entities/Competitor';

export class CompetitorRepository implements ICompetitorRepository {
  private readonly repository: Repository<Competitor>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(Competitor);
  }

  async findById(id: string): Promise<Competitor | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findAll(): Promise<Competitor[]> {
    return this.repository.find();
  }

  async save(competitor: Competitor): Promise<Competitor> {
    return this.repository.save(competitor);
  }

  async update(id: string, data: Partial<Competitor>): Promise<Competitor> {
    await this.repository.update(id, data);
    const updated = await this.findById(id);
    if (!updated) {
      throw new Error(`Competitor with id ${id} not found`);
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async findByPlaceId(placeId: string): Promise<Competitor[]> {
    return this.repository.find({
      where: { place: { id: placeId } },
      relations: ['place'],
    });
  }

  async findActiveByPlaceId(placeId: string): Promise<Competitor[]> {
    return this.repository.find({
      where: { place: { id: placeId }, isActive: true },
      relations: ['place'],
    });
  }

  async findByPlaceAndNaverId(
    placeId: string,
    competitorNaverPlaceId: string
  ): Promise<Competitor | null> {
    return this.repository.findOne({
      where: {
        place: { id: placeId },
        competitorNaverPlaceId,
      },
      relations: ['place'],
    });
  }

  async updateActiveStatus(id: string, isActive: boolean): Promise<void> {
    await this.repository.update(id, { isActive });
  }
}
