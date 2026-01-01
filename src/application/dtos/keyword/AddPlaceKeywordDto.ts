import { IsString, IsOptional, IsUUID, MaxLength } from 'class-validator';

export class AddPlaceKeywordDto {
  @IsUUID()
  placeId: string;

  @IsString()
  @MaxLength(100)
  keyword: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  region?: string;
}
