import { DataSource, Repository } from 'typeorm';
import { IKeywordRepository } from '@domain/repositories/IKeywordRepository';
import { PaginationOptions, PaginatedResult } from '@domain/repositories/IBaseRepository';
import { Keyword } from '@domain/entities/Keyword';
import { NotFoundError } from '@application/errors/HttpError';

export class KeywordRepository implements IKeywordRepository {
  private readonly repository: Repository<Keyword>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(Keyword);
  }

  async findById(id: string): Promise<Keyword | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findAll(options: PaginationOptions = {}): Promise<PaginatedResult<Keyword>> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC' } = options;
    const skip = (page - 1) * limit;

    const [data, total] = await this.repository.findAndCount({
      skip,
      take: limit,
      order: { [sortBy]: sortOrder },
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

  async save(keyword: Keyword): Promise<Keyword> {
    return this.repository.save(keyword);
  }

  async update(id: string, data: Partial<Keyword>): Promise<Keyword> {
    const exists = await this.exists(id);
    if (!exists) {
      throw new NotFoundError(`Keyword with id ${id} not found`);
    }
    await this.repository.update(id, data);
    return (await this.findById(id))!;
  }

  async delete(id: string): Promise<void> {
    const exists = await this.exists(id);
    if (!exists) {
      throw new NotFoundError(`Keyword with id ${id} not found`);
    }
    await this.repository.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    return this.repository.exist({ where: { id } });
  }

  async count(): Promise<number> {
    return this.repository.count();
  }

  async findByKeyword(keyword: string): Promise<Keyword | null> {
    return this.repository.findOne({ where: { keyword } });
  }

  async findOrCreate(keyword: string): Promise<Keyword> {
    const existing = await this.findByKeyword(keyword);
    if (existing) {
      return existing;
    }

    const newKeyword = new Keyword();
    newKeyword.keyword = keyword;
    return this.save(newKeyword);
  }

  async existsByKeyword(keyword: string): Promise<boolean> {
    return this.repository.exist({ where: { keyword } });
  }
}
