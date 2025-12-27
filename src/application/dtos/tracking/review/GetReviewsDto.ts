import { IsUUID, IsOptional, IsIn, IsInt, Min, Max, IsDate, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class GetReviewsDto {
  @IsUUID()
  placeId: string;

  @IsString()
  @IsOptional()
  @IsIn(['POSITIVE', 'NEGATIVE', 'NEUTRAL'])
  sentiment?: string;

  @IsString()
  @IsOptional()
  @IsIn(['BLOG', 'VISITOR', 'OTHER'])
  reviewType?: string;

  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(1000)
  limit?: number;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  publishedAfter?: Date;
}
