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
import { Place } from './Place';
import { NotificationLog } from './NotificationLog';

@Entity('notification_settings')
@Index('idx_notification_settings_user_id', ['user'])
@Index('idx_notification_settings_place_id', ['place'])
export class NotificationSetting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.notificationSettings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Place, (place) => place.notificationSettings, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'place_id' })
  place: Place | null;

  @Column({ name: 'notification_type', type: 'varchar', length: 50 })
  notificationType: string;

  @Column({ name: 'channel', type: 'varchar', length: 20 })
  channel: string;

  @Column({ name: 'is_enabled', type: 'boolean', default: true })
  isEnabled: boolean;

  @Column({ name: 'conditions', type: 'jsonb', nullable: true })
  conditions: Record<string, any> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @OneToMany(() => NotificationLog, (log) => log.notificationSetting)
  notificationLogs: NotificationLog[];
}
