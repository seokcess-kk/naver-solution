import { IsString, IsUrl, IsOptional, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdatePlaceDto {
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(200)
  @Transform(({ value }) => value?.trim())
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  @Transform(({ value }) => value?.trim())
  category?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  address?: string;

  @IsUrl()
  @IsOptional()
  naverPlaceUrl?: string;
}
