import { DataSource, Repository } from 'typeorm';
import { IKeywordRepository } from '@domain/repositories/IKeywordRepository';
import { Keyword } from '@domain/entities/Keyword';

export class KeywordRepository implements IKeywordRepository {
  private readonly repository: Repository<Keyword>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(Keyword);
  }

  async findById(id: string): Promise<Keyword | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findAll(): Promise<Keyword[]> {
    return this.repository.find();
  }

  async save(keyword: Keyword): Promise<Keyword> {
    return this.repository.save(keyword);
  }

  async update(id: string, data: Partial<Keyword>): Promise<Keyword> {
    await this.repository.update(id, data);
    const updated = await this.findById(id);
    if (!updated) {
      throw new Error(`Keyword with id ${id} not found`);
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
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
    const count = await this.repository.count({ where: { keyword } });
    return count > 0;
  }
}
