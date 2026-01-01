import { DataSource, Repository } from 'typeorm';
import { IPlaceKeywordRepository } from '@domain/repositories/IPlaceKeywordRepository';
import { PaginationOptions, PaginatedResult } from '@domain/repositories/IBaseRepository';
import { PlaceKeyword } from '@domain/entities/PlaceKeyword';
import { NotFoundError } from '@application/errors/HttpError';

export class PlaceKeywordRepository implements IPlaceKeywordRepository {
  private readonly repository: Repository<PlaceKeyword>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(PlaceKeyword);
  }

  async findById(id: string): Promise<PlaceKeyword | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['place', 'keyword'],
    });
  }

  async findAll(options: PaginationOptions = {}): Promise<PaginatedResult<PlaceKeyword>> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC' } = options;
    const skip = (page - 1) * limit;

    const [data, total] = await this.repository.findAndCount({
      skip,
      take: limit,
      order: { [sortBy]: sortOrder },
      relations: ['place', 'keyword'],
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

  async save(placeKeyword: PlaceKeyword): Promise<PlaceKeyword> {
    return this.repository.save(placeKeyword);
  }

  async update(id: string, data: Partial<PlaceKeyword>): Promise<PlaceKeyword> {
    const exists = await this.exists(id);
    if (!exists) {
      throw new NotFoundError(`PlaceKeyword with id ${id} not found`);
    }
    await this.repository.update(id, data);
    return (await this.findById(id))!;
  }

  async delete(id: string): Promise<void> {
    const exists = await this.exists(id);
    if (!exists) {
      throw new NotFoundError(`PlaceKeyword with id ${id} not found`);
    }
    await this.repository.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    return this.repository.exist({ where: { id } });
  }

  async count(): Promise<number> {
    return this.repository.count();
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
