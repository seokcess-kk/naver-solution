export class KeywordResponseDto {
  id: string;
  keyword: string;
  createdAt: Date;
  placeCount?: number; // Optional: number of places using this keyword

  constructor(id: string, keyword: string, createdAt: Date, placeCount?: number) {
    this.id = id;
    this.keyword = keyword;
    this.createdAt = createdAt;
    this.placeCount = placeCount;
  }
}
