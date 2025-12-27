import { IsUUID, IsInt, IsOptional, IsDate, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class RecordRankingDto {
  @IsUUID()
  placeKeywordId: string;

  @IsInt()
  @IsOptional()
  @Min(1)
  rank: number | null;

  @IsInt()
  @IsOptional()
  @Min(0)
  searchResultCount: number | null;

  @IsDate()
  @Type(() => Date)
  checkedAt: Date;
}
