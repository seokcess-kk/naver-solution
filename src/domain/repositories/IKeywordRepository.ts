import { Keyword } from '../entities/Keyword';

export interface IKeywordRepository {
  findById(id: string): Promise<Keyword | null>;
  findAll(): Promise<Keyword[]>;
  save(keyword: Keyword): Promise<Keyword>;
  update(id: string, data: Partial<Keyword>): Promise<Keyword>;
  delete(id: string): Promise<void>;

  findByKeyword(keyword: string): Promise<Keyword | null>;
  findOrCreate(keyword: string): Promise<Keyword>;
}
