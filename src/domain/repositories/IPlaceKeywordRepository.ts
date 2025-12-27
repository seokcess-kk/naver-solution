import { PlaceKeyword } from '../entities/PlaceKeyword';

export interface IPlaceKeywordRepository {
  findById(id: string): Promise<PlaceKeyword | null>;
  findAll(): Promise<PlaceKeyword[]>;
  save(placeKeyword: PlaceKeyword): Promise<PlaceKeyword>;
  update(id: string, data: Partial<PlaceKeyword>): Promise<PlaceKeyword>;
  delete(id: string): Promise<void>;

  findByPlaceId(placeId: string): Promise<PlaceKeyword[]>;
  findActiveByPlaceId(placeId: string): Promise<PlaceKeyword[]>;
  findByPlaceAndKeyword(
    placeId: string,
    keywordId: string,
    region: string
  ): Promise<PlaceKeyword | null>;
  updateActiveStatus(id: string, isActive: boolean): Promise<void>;
}
