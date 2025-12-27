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
import { Keyword } from './Keyword';
import { RankingHistory } from './RankingHistory';

@Entity('place_keywords')
@Index('idx_place_keywords_place_id', ['place'])
@Index('idx_place_keywords_keyword_id', ['keyword'])
@Unique(['place', 'keyword', 'region'])
export class PlaceKeyword {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Place, (place) => place.placeKeywords, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'place_id' })
  place: Place;

  @ManyToOne(() => Keyword, (keyword) => keyword.placeKeywords, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'keyword_id' })
  keyword: Keyword;

  @Column({ name: 'region', type: 'varchar', length: 100, nullable: true })
  region: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @OneToMany(() => RankingHistory, (history) => history.placeKeyword, {
    cascade: ['insert', 'update'],
  })
  rankingHistories: RankingHistory[];
}
