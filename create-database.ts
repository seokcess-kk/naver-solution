import { Client } from 'pg';

async function createDatabase() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'post123#',
    database: 'postgres', // Connect to default postgres database
  });

  try {
    await client.connect();
    console.log('✅ PostgreSQL에 연결되었습니다.');

    // Check if database exists
    const result = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = 'naver_place_monitor'"
    );

    if (result.rows.length > 0) {
      console.log('ℹ️  데이터베이스 "naver_place_monitor"가 이미 존재합니다.');
    } else {
      // Create database
      await client.query('CREATE DATABASE naver_place_monitor');
      console.log('✅ 데이터베이스 "naver_place_monitor"가 생성되었습니다.');
    }

    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    await client.end();
    process.exit(1);
  }
}

createDatabase();
