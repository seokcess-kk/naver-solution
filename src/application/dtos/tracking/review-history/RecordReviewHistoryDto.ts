import { IsUUID, IsInt, IsNumber, IsDate, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class RecordReviewHistoryDto {
  @IsUUID()
  placeId: string;

  @IsInt()
  @Min(0)
  blogReviewCount: number;

  @IsInt()
  @Min(0)
  visitorReviewCount: number;

  @IsNumber({ maxDecimalPlaces: 1 })
  @IsOptional()
  @Min(0)
  @Max(5)
  averageRating: number | null;

  @IsDate()
  @Type(() => Date)
  checkedAt: Date;
}
