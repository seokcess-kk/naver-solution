import { IsUUID, IsString, IsOptional, MaxLength } from 'class-validator';

export class AddCompetitorDto {
  @IsUUID()
  placeId: string;

  @IsString()
  @MaxLength(100)
  competitorNaverPlaceId: string;

  @IsString()
  @MaxLength(200)
  competitorName: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  category?: string;
}
