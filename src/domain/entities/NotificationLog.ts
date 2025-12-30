import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { NotificationSetting } from './NotificationSetting';
import { Place } from './Place';

@Entity('notification_logs')
@Index('idx_notification_logs_place_id', ['place'])
@Index('idx_notification_logs_created_at', ['createdAt'])
export class NotificationLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => NotificationSetting, (setting) => setting.notificationLogs)
  @JoinColumn({ name: 'notification_setting_id' })
  notificationSetting: NotificationSetting;

  @ManyToOne(() => Place, (place) => place.notificationLogs)
  @JoinColumn({ name: 'place_id' })
  place: Place;

  @Column({ name: 'notification_type', type: 'varchar', length: 50 })
  notificationType: string;

  @Column({ name: 'channel', type: 'varchar', length: 20 })
  channel: string;

  @Column({ name: 'message', type: 'text' })
  message: string;

  @Column({ name: 'is_sent', type: 'boolean', default: false })
  isSent: boolean;

  @Column({ name: 'sent_at', type: 'datetime', nullable: true })
  sentAt: Date | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
