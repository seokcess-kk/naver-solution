import { IKeywordRepository } from '@domain/repositories/IKeywordRepository';
import { KeywordResponseDto } from '@application/dtos/keyword/KeywordResponseDto';
import { PaginationOptions, PaginatedResult } from '@domain/repositories/IBaseRepository';

export class ListKeywordsUseCase {
  constructor(private readonly keywordRepository: IKeywordRepository) {}

  async execute(options?: PaginationOptions): Promise<PaginatedResult<KeywordResponseDto>> {
    const result = await this.keywordRepository.findAll(options);

    return {
      data: result.data.map(
        (keyword) => new KeywordResponseDto(keyword.id, keyword.keyword, keyword.createdAt)
      ),
      pagination: result.pagination,
    };
  }
}
