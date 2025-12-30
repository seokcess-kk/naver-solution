import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Place } from './Place';
import { NotificationSetting } from './NotificationSetting';
import { RefreshToken } from './RefreshToken';

@Entity('users')
@Index('idx_users_email', ['email'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'email', type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash: string;

  @Column({ name: 'name', type: 'varchar', length: 100 })
  name: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Place, (place) => place.user, { cascade: ['insert', 'update'] })
  places: Place[];

  @OneToMany(() => NotificationSetting, (setting) => setting.user, {
    cascade: ['insert', 'update'],
  })
  notificationSettings: NotificationSetting[];

  @OneToMany(() => RefreshToken, (token) => token.user, {
    cascade: ['insert', 'update'],
  })
  refreshTokens: RefreshToken[];
}
