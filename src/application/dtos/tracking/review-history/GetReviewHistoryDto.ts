import { IsUUID, IsDate, IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class GetReviewHistoryDto {
  @IsUUID()
  placeId: string;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  startDate?: Date;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  endDate?: Date;

  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(1000)
  limit?: number;
}
