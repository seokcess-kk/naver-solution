import { AppDataSource } from './src/infrastructure/database/data-source';

async function testConnection() {
  try {
    console.log('🔄 PostgreSQL 연결 시도 중...');
    await AppDataSource.initialize();
    console.log('✅ PostgreSQL 연결 성공!');

    const result = await AppDataSource.query('SELECT NOW()');
    console.log('📅 현재 시간:', result[0].now);

    const tables = await AppDataSource.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log('\n📋 생성된 테이블:');
    if (tables.length === 0) {
      console.log('   (아직 테이블이 없습니다. 마이그레이션을 실행하세요.)');
    } else {
      tables.forEach((t: any) => console.log(`   - ${t.table_name}`));
    }

    await AppDataSource.destroy();
    console.log('\n✅ 테스트 완료!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ 연결 실패:', error);
    console.error('\n💡 확인사항:');
    console.error('   1. PostgreSQL Docker 컨테이너가 실행 중인지 확인: docker ps');
    console.error('   2. .env 파일의 DB 설정이 올바른지 확인');
    console.error('   3. 포트 5432가 사용 가능한지 확인');
    process.exit(1);
  }
}

testConnection();
