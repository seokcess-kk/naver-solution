import { IsUUID, IsOptional, IsBoolean } from 'class-validator';

export class GetPlaceCompetitorsDto {
  @IsUUID()
  placeId: string;

  @IsOptional()
  @IsBoolean()
  activeOnly?: boolean;
}
