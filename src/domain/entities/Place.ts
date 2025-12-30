import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './User';
import { PlaceKeyword } from './PlaceKeyword';
import { Review } from './Review';
import { ReviewHistory } from './ReviewHistory';
import { Competitor } from './Competitor';
import { NotificationSetting } from './NotificationSetting';
import { NotificationLog } from './NotificationLog';

@Entity('places')
@Index('idx_places_user_id', ['user'])
@Index('idx_places_naver_id', ['naverPlaceId'])
export class Place {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.places, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'naver_place_id', type: 'varchar', length: 100, unique: true })
  naverPlaceId: string;

  @Column({ name: 'name', type: 'varchar', length: 200 })
  name: string;

  @Column({ name: 'category', type: 'varchar', length: 50, nullable: true })
  category: string | null;

  @Column({ name: 'address', type: 'text', nullable: true })
  address: string | null;

  @Column({ name: 'naver_place_url', type: 'text' })
  naverPlaceUrl: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => PlaceKeyword, (placeKeyword) => placeKeyword.place, {
    cascade: ['insert', 'update'],
  })
  placeKeywords: PlaceKeyword[];

  @OneToMany(() => Review, (review) => review.place, { cascade: ['insert', 'update'] })
  reviews: Review[];

  @OneToMany(() => ReviewHistory, (reviewHistory) => reviewHistory.place, {
    cascade: ['insert', 'update'],
  })
  reviewHistories: ReviewHistory[];

  @OneToMany(() => Competitor, (competitor) => competitor.place, {
    cascade: ['insert', 'update'],
  })
  competitors: Competitor[];

  @OneToMany(() => NotificationSetting, (setting) => setting.place, {
    cascade: ['insert', 'update'],
  })
  notificationSettings: NotificationSetting[];

  @OneToMany(() => NotificationLog, (log) => log.place)
  notificationLogs: NotificationLog[];
}
