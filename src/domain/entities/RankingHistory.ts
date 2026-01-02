import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { PlaceKeyword } from './PlaceKeyword';

@Entity('ranking_histories')
@Index('idx_ranking_histories_place_keyword_checked', ['placeKeyword', 'checkedAt'])
@Index('idx_ranking_histories_checked_at', ['checkedAt'])
export class RankingHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => PlaceKeyword, (placeKeyword) => placeKeyword.rankingHistories, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'place_keyword_id' })
  placeKeyword: PlaceKeyword;

  @Column({ name: 'rank', type: 'integer', nullable: true })
  rank: number | null;

  @Column({ name: 'search_result_count', type: 'integer', nullable: true })
  searchResultCount: number | null;

  @Column({ name: 'checked_at', type: 'timestamp' })
  checkedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
