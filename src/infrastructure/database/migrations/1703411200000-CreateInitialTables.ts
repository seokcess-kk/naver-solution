import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInitialTables1703411200000 implements MigrationInterface {
  name = 'CreateInitialTables1703411200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. users 테이블
    await queryRunner.query(`
      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_users_email ON users(email)`);

    // 2. places 테이블
    await queryRunner.query(`
      CREATE TABLE places (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        naver_place_id VARCHAR(100) UNIQUE NOT NULL,
        name VARCHAR(200) NOT NULL,
        category VARCHAR(50),
        address TEXT,
        naver_place_url TEXT NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_places_user_id ON places(user_id)`);
    await queryRunner.query(`CREATE INDEX idx_places_naver_id ON places(naver_place_id)`);

    // 3. keywords 테이블
    await queryRunner.query(`
      CREATE TABLE keywords (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        keyword VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_keywords_keyword ON keywords(keyword)`);

    // 4. place_keywords 테이블
    await queryRunner.query(`
      CREATE TABLE place_keywords (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
        keyword_id UUID NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
        region VARCHAR(100),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(place_id, keyword_id, region)
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_place_keywords_place_id ON place_keywords(place_id)`);
    await queryRunner.query(
      `CREATE INDEX idx_place_keywords_keyword_id ON place_keywords(keyword_id)`
    );

    // 5. ranking_histories 테이블
    await queryRunner.query(`
      CREATE TABLE ranking_histories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        place_keyword_id UUID NOT NULL REFERENCES place_keywords(id) ON DELETE CASCADE,
        rank INTEGER,
        search_result_count INTEGER,
        checked_at TIMESTAMP NOT NULL DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX idx_ranking_histories_place_keyword_checked
        ON ranking_histories(place_keyword_id, checked_at DESC)
    `);
    await queryRunner.query(
      `CREATE INDEX idx_ranking_histories_checked_at ON ranking_histories(checked_at)`
    );

    // 6. review_histories 테이블
    await queryRunner.query(`
      CREATE TABLE review_histories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
        blog_review_count INTEGER DEFAULT 0,
        visitor_review_count INTEGER DEFAULT 0,
        average_rating DECIMAL(2,1),
        checked_at TIMESTAMP NOT NULL DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX idx_review_histories_place_checked
        ON review_histories(place_id, checked_at DESC)
    `);

    // 7. reviews 테이블
    await queryRunner.query(`
      CREATE TABLE reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
        naver_review_id VARCHAR(100) UNIQUE,
        review_type VARCHAR(20) NOT NULL,
        content TEXT,
        rating INTEGER,
        author VARCHAR(100),
        sentiment VARCHAR(20),
        sentiment_score DECIMAL(3,2),
        published_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_reviews_place_id ON reviews(place_id)`);
    await queryRunner.query(`CREATE INDEX idx_reviews_published_at ON reviews(published_at DESC)`);
    await queryRunner.query(`CREATE INDEX idx_reviews_sentiment ON reviews(sentiment)`);

    // 8. competitors 테이블
    await queryRunner.query(`
      CREATE TABLE competitors (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
        competitor_naver_place_id VARCHAR(100) NOT NULL,
        competitor_name VARCHAR(200) NOT NULL,
        category VARCHAR(50),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(place_id, competitor_naver_place_id)
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_competitors_place_id ON competitors(place_id)`);

    // 9. competitor_snapshots 테이블
    await queryRunner.query(`
      CREATE TABLE competitor_snapshots (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        competitor_id UUID NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
        rank INTEGER,
        blog_review_count INTEGER,
        visitor_review_count INTEGER,
        average_rating DECIMAL(2,1),
        checked_at TIMESTAMP NOT NULL DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX idx_competitor_snapshots_competitor_checked
        ON competitor_snapshots(competitor_id, checked_at DESC)
    `);

    // 10. notification_settings 테이블
    await queryRunner.query(`
      CREATE TABLE notification_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        place_id UUID REFERENCES places(id) ON DELETE CASCADE,
        notification_type VARCHAR(50) NOT NULL,
        channel VARCHAR(20) NOT NULL,
        is_enabled BOOLEAN DEFAULT true,
        conditions JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX idx_notification_settings_user_id ON notification_settings(user_id)`
    );
    await queryRunner.query(
      `CREATE INDEX idx_notification_settings_place_id ON notification_settings(place_id)`
    );

    // 11. notification_logs 테이블
    await queryRunner.query(`
      CREATE TABLE notification_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        notification_setting_id UUID NOT NULL REFERENCES notification_settings(id),
        place_id UUID NOT NULL REFERENCES places(id),
        notification_type VARCHAR(50) NOT NULL,
        channel VARCHAR(20) NOT NULL,
        message TEXT NOT NULL,
        is_sent BOOLEAN DEFAULT false,
        sent_at TIMESTAMP,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX idx_notification_logs_place_id ON notification_logs(place_id)`
    );
    await queryRunner.query(
      `CREATE INDEX idx_notification_logs_created_at ON notification_logs(created_at DESC)`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 역순으로 테이블 삭제
    await queryRunner.query(`DROP TABLE IF EXISTS notification_logs CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS notification_settings CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS competitor_snapshots CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS competitors CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS reviews CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS review_histories CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS ranking_histories CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS place_keywords CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS keywords CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS places CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS users CASCADE`);
  }
}
