import { Place } from '../entities/Place';

export interface IPlaceRepository {
  findById(id: string): Promise<Place | null>;
  findAll(): Promise<Place[]>;
  save(place: Place): Promise<Place>;
  update(id: string, data: Partial<Place>): Promise<Place>;
  delete(id: string): Promise<void>;

  findByUserId(userId: string): Promise<Place[]>;
  findByNaverPlaceId(naverPlaceId: string): Promise<Place | null>;
  findActiveByUserId(userId: string): Promise<Place[]>;
  updateActiveStatus(id: string, isActive: boolean): Promise<void>;
}
