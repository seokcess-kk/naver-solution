import { Exclude, Expose } from 'class-transformer';
import { Place } from '@domain/entities/Place';

@Exclude()
export class PlaceResponseDto {
  @Expose()
  id: string;

  @Expose()
  naverPlaceId: string;

  @Expose()
  name: string;

  @Expose()
  category: string | null;

  @Expose()
  address: string | null;

  @Expose()
  naverPlaceUrl: string;

  @Expose()
  isActive: boolean;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  userId?: string;

  @Expose()
  keywordCount?: number;

  @Expose()
  reviewCount?: number;

  static fromEntity(place: Place, includeRelations = false): PlaceResponseDto {
    const dto = new PlaceResponseDto();
    dto.id = place.id;
    dto.naverPlaceId = place.naverPlaceId;
    dto.name = place.name;
    dto.category = place.category;
    dto.address = place.address;
    dto.naverPlaceUrl = place.naverPlaceUrl;
    dto.isActive = place.isActive;
    dto.createdAt = place.createdAt;
    dto.updatedAt = place.updatedAt;

    if (includeRelations && place.user) {
      dto.userId = place.user.id;
    }

    if (includeRelations && place.placeKeywords) {
      dto.keywordCount = place.placeKeywords.length;
    }

    if (includeRelations && place.reviews) {
      dto.reviewCount = place.reviews.length;
    }

    return dto;
  }
}
