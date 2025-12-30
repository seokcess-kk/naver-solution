import { DataSource, Repository } from 'typeorm';
import { ICompetitorRepository } from '@domain/repositories/ICompetitorRepository';
import { PaginationOptions, PaginatedResult } from '@domain/repositories/IBaseRepository';
import { Competitor } from '@domain/entities/Competitor';
import { NotFoundError } from '@application/errors/HttpError';

export class CompetitorRepository implements ICompetitorRepository {
  private readonly repository: Repository<Competitor>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(Competitor);
  }

  async findById(id: string): Promise<Competitor | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findAll(options: PaginationOptions = {}): Promise<PaginatedResult<Competitor>> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC' } = options;
    const skip = (page - 1) * limit;

    const [data, total] = await this.repository.findAndCount({
      skip,
      take: limit,
      order: { [sortBy]: sortOrder },
      relations: ['place'],
    });

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async save(competitor: Competitor): Promise<Competitor> {
    return this.repository.save(competitor);
  }

  async update(id: string, data: Partial<Competitor>): Promise<Competitor> {
    const exists = await this.exists(id);
    if (!exists) {
      throw new NotFoundError(`Competitor with id ${id} not found`);
    }
    await this.repository.update(id, data);
    return (await this.findById(id))!;
  }

  async delete(id: string): Promise<void> {
    const exists = await this.exists(id);
    if (!exists) {
      throw new NotFoundError(`Competitor with id ${id} not found`);
    }
    await this.repository.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    return this.repository.exist({ where: { id } });
  }

  async count(): Promise<number> {
    return this.repository.count();
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
