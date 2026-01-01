export class PlaceKeywordResponseDto {
  id: string;
  placeId: string;
  placeName: string;
  keywordId: string;
  keyword: string;
  region: string | null;
  isActive: boolean;
  createdAt: Date;

  constructor(
    id: string,
    placeId: string,
    placeName: string,
    keywordId: string,
    keyword: string,
    region: string | null,
    isActive: boolean,
    createdAt: Date
  ) {
    this.id = id;
    this.placeId = placeId;
    this.placeName = placeName;
    this.keywordId = keywordId;
    this.keyword = keyword;
    this.region = region;
    this.isActive = isActive;
    this.createdAt = createdAt;
  }
}
