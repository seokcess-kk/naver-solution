import {
  IsUUID,
  IsString,
  IsInt,
  IsOptional,
  IsIn,
  IsNumber,
  IsDate,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RecordReviewDto {
  @IsUUID()
  placeId: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  naverReviewId?: string;

  @IsString()
  @IsIn(['BLOG', 'VISITOR', 'OTHER'])
  reviewType: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  author?: string;

  @IsString()
  @IsOptional()
  @IsIn(['POSITIVE', 'NEGATIVE', 'NEUTRAL'])
  sentiment?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  @Min(-1)
  @Max(1)
  sentimentScore?: number;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  publishedAt?: Date;
}
