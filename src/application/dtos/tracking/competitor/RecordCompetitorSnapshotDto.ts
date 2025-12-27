import { IsUUID, IsInt, IsOptional, IsDate, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class RecordCompetitorSnapshotDto {
  @IsUUID()
  competitorId: string;

  @IsInt()
  @IsOptional()
  @Min(1)
  rank: number | null;

  @IsInt()
  @IsOptional()
  @Min(0)
  blogReviewCount: number | null;

  @IsInt()
  @IsOptional()
  @Min(0)
  visitorReviewCount: number | null;

  @IsNumber({ maxDecimalPlaces: 1 })
  @IsOptional()
  @Min(0)
  @Max(5)
  averageRating: number | null;

  @IsDate()
  @Type(() => Date)
  checkedAt: Date;
}
