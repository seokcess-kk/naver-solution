import { IKeywordRepository } from '@domain/repositories/IKeywordRepository';
import { KeywordResponseDto } from '@application/dtos/keyword/KeywordResponseDto';

export class ListKeywordsUseCase {
  constructor(private readonly keywordRepository: IKeywordRepository) {}

  async execute(): Promise<KeywordResponseDto[]> {
    const keywords = await this.keywordRepository.findAll();

    return keywords.data.map(
      (keyword) => new KeywordResponseDto(keyword.id, keyword.keyword, keyword.createdAt)
    );
  }
}
