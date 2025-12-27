import { Exclude, Expose } from 'class-transformer';
import { Competitor } from '@domain/entities/Competitor';

@Exclude()
export class CompetitorResponseDto {
  @Expose()
  id: string;

  @Expose()
  placeId: string;

  @Expose()
  competitorNaverPlaceId: string;

  @Expose()
  competitorName: string;

  @Expose()
  category: string | null;

  @Expose()
  isActive: boolean;

  @Expose()
  createdAt: Date;

  // Optional: place relation data
  @Expose()
  placeName?: string;

  static fromEntity(competitor: Competitor, includeRelations = false): CompetitorResponseDto {
    const dto = new CompetitorResponseDto();
    dto.id = competitor.id;
    dto.placeId = competitor.place.id;
    dto.competitorNaverPlaceId = competitor.competitorNaverPlaceId;
    dto.competitorName = competitor.competitorName;
    dto.category = competitor.category;
    dto.isActive = competitor.isActive;
    dto.createdAt = competitor.createdAt;

    if (includeRelations && competitor.place) {
      dto.placeName = competitor.place.name;
    }

    return dto;
  }
}
