import { IsUUID } from 'class-validator';

/**
 * DTO for triggering Naver ranking scraping request
 */
export class ScrapeRankingDto {
  @IsUUID()
  placeKeywordId: string;
}
