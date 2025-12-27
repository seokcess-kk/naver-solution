import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Competitor } from './Competitor';

@Entity('competitor_snapshots')
@Index('idx_competitor_snapshots_competitor_checked', ['competitor', 'checkedAt'])
export class CompetitorSnapshot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Competitor, (competitor) => competitor.competitorSnapshots, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'competitor_id' })
  competitor: Competitor;

  @Column({ name: 'rank', type: 'integer', nullable: true })
  rank: number | null;

  @Column({ name: 'blog_review_count', type: 'integer', nullable: true })
  blogReviewCount: number | null;

  @Column({ name: 'visitor_review_count', type: 'integer', nullable: true })
  visitorReviewCount: number | null;

  @Column({ name: 'average_rating', type: 'decimal', precision: 2, scale: 1, nullable: true })
  averageRating: number | null;

  @Column({ name: 'checked_at', type: 'timestamp' })
  checkedAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
