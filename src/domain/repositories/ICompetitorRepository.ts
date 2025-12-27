import { Competitor } from '../entities/Competitor';

export interface ICompetitorRepository {
  findById(id: string): Promise<Competitor | null>;
  findAll(): Promise<Competitor[]>;
  save(competitor: Competitor): Promise<Competitor>;
  update(id: string, data: Partial<Competitor>): Promise<Competitor>;
  delete(id: string): Promise<void>;

  findByPlaceId(placeId: string): Promise<Competitor[]>;
  findActiveByPlaceId(placeId: string): Promise<Competitor[]>;
  findByPlaceAndNaverId(
    placeId: string,
    competitorNaverPlaceId: string
  ): Promise<Competitor | null>;
  updateActiveStatus(id: string, isActive: boolean): Promise<void>;
}
