import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Place } from './Place';

@Entity('review_histories')
@Index('idx_review_histories_place_checked', ['place', 'checkedAt'])
export class ReviewHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Place, (place) => place.reviewHistories, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'place_id' })
  place: Place;

  @Column({ name: 'blog_review_count', type: 'integer', default: 0 })
  blogReviewCount: number;

  @Column({ name: 'visitor_review_count', type: 'integer', default: 0 })
  visitorReviewCount: number;

  @Column({ name: 'average_rating', type: 'decimal', precision: 2, scale: 1, nullable: true })
  averageRating: number | null;

  @Column({ name: 'checked_at', type: 'datetime' })
  checkedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
