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

@Entity('reviews')
@Index('idx_reviews_place_id', ['place'])
@Index('idx_reviews_published_at', ['publishedAt'])
@Index('idx_reviews_sentiment', ['sentiment'])
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Place, (place) => place.reviews, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'place_id' })
  place: Place;

  @Column({ name: 'naver_review_id', type: 'varchar', length: 100, unique: true, nullable: true })
  naverReviewId: string | null;

  @Column({ name: 'review_type', type: 'varchar', length: 20 })
  reviewType: string;

  @Column({ name: 'content', type: 'text', nullable: true })
  content: string | null;

  @Column({ name: 'rating', type: 'integer', nullable: true })
  rating: number | null;

  @Column({ name: 'author', type: 'varchar', length: 100, nullable: true })
  author: string | null;

  @Column({ name: 'sentiment', type: 'varchar', length: 20, nullable: true })
  sentiment: string | null;

  @Column({ name: 'sentiment_score', type: 'decimal', precision: 3, scale: 2, nullable: true })
  sentimentScore: number | null;

  @Column({ name: 'published_at', type: 'datetime', nullable: true })
  publishedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
