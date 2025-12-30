import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { PlaceKeyword } from './PlaceKeyword';

@Entity('keywords')
@Index('idx_keywords_keyword', ['keyword'])
export class Keyword {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'keyword', type: 'varchar', length: 100, unique: true })
  keyword: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => PlaceKeyword, (placeKeyword) => placeKeyword.keyword, {
    cascade: ['insert', 'update'],
  })
  placeKeywords: PlaceKeyword[];
}
