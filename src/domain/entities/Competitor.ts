import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { Place } from './Place';
import { CompetitorSnapshot } from './CompetitorSnapshot';

@Entity('competitors')
@Index('idx_competitors_place_id', ['place'])
@Unique(['place', 'competitorNaverPlaceId'])
export class Competitor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Place, (place) => place.competitors, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'place_id' })
  place: Place;

  @Column({ name: 'competitor_naver_place_id', type: 'varchar', length: 100 })
  competitorNaverPlaceId: string;

  @Column({ name: 'competitor_name', type: 'varchar', length: 200 })
  competitorName: string;

  @Column({ name: 'category', type: 'varchar', length: 50, nullable: true })
  category: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @OneToMany(() => CompetitorSnapshot, (snapshot) => snapshot.competitor, {
    cascade: ['insert', 'update'],
  })
  competitorSnapshots: CompetitorSnapshot[];
}
