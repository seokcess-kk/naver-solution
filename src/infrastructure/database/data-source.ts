import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'naver_place_monitor',
  synchronize: false, // 프로덕션에서는 false
  logging: process.env.NODE_ENV === 'development',
  entities: ['src/domain/entities/**/*.ts'],
  migrations: ['src/infrastructure/database/migrations/**/*.ts'],
  subscribers: [],
});
