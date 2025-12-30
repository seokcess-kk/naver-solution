import { Keyword } from '../entities/Keyword';
import { IBaseRepository } from './IBaseRepository';

/**
 * Keyword Repository Interface
 * Extends IBaseRepository with Keyword-specific query methods
 */
export interface IKeywordRepository extends IBaseRepository<Keyword> {
  /**
   * Find a keyword by its text value
   * @param keyword - The keyword text
   * @returns The keyword if found, null otherwise
   */
  findByKeyword(keyword: string): Promise<Keyword | null>;

  /**
   * Find existing keyword or create new one
   * @param keyword - The keyword text
   * @returns The found or created keyword
   */
  findOrCreate(keyword: string): Promise<Keyword>;
}
