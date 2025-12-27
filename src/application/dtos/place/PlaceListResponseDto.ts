import { Expose, Type } from 'class-transformer';
import { PlaceResponseDto } from './PlaceResponseDto';

export class PlaceListResponseDto {
  @Expose()
  @Type(() => PlaceResponseDto)
  items: PlaceResponseDto[];

  @Expose()
  total: number;

  @Expose()
  page: number;

  @Expose()
  pageSize: number;

  static create(
    places: PlaceResponseDto[],
    total: number,
    page: number = 1,
    pageSize: number = 10
  ): PlaceListResponseDto {
    const dto = new PlaceListResponseDto();
    dto.items = places;
    dto.total = total;
    dto.page = page;
    dto.pageSize = pageSize;
    return dto;
  }
}
