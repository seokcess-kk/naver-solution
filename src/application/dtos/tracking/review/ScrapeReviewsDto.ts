import { IsUUID, IsInt, IsOptional, Min, Max } from 'class-validator';

/**
 * DTO for triggering Naver review scraping request
 */
export class ScrapeReviewsDto {
  @IsUUID()
  placeId: string;

  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(50) // 최대 50개까지 허용
  limit?: number;
}
