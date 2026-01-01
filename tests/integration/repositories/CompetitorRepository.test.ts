import { DataSource } from 'typeorm';
import { CompetitorRepository } from '@infrastructure/repositories/CompetitorRepository';
import { Competitor } from '@domain/entities/Competitor';
import { Place } from '@domain/entities/Place';
import { User } from '@domain/entities/User';
import { createTestDataSource, closeTestDataSource, resetDatabase } from '@tests/helpers/database.helper';
import { CompetitorFixture } from '@tests/fixtures/competitors';
import { PlaceFixture } from '@tests/fixtures/places';
import { UserFixture } from '@tests/fixtures/users';
import { NotFoundError } from '@application/errors/HttpError';

describe('CompetitorRepository Integration Tests', () => {
  let dataSource: DataSource;
  let repository: CompetitorRepository;
  let testUser: User;
  let testPlace: Place;

  beforeAll(async () => {
    dataSource = await createTestDataSource();
  });

  afterAll(async () => {
    await closeTestDataSource(dataSource);
  });

  beforeEach(async () => {
    await resetDatabase(dataSource);
    repository = new CompetitorRepository(dataSource);

    // Create test dependencies
    const userRepo = dataSource.getRepository(User);
    testUser = UserFixture.create();
    testUser = await userRepo.save(testUser);

    const placeRepo = dataSource.getRepository(Place);
    testPlace = PlaceFixture.create(testUser);
    testPlace = await placeRepo.save(testPlace);
  });

  describe('save', () => {
    it('should save a new competitor to database', async () => {
      const competitor = CompetitorFixture.create(testPlace);
      const saved = await repository.save(competitor);

      expect(saved.id).toBeDefined();
      expect(saved.competitorNaverPlaceId).toBe(competitor.competitorNaverPlaceId);
      expect(saved.competitorName).toBe(competitor.competitorName);
      expect(saved.category).toBe(competitor.category);
      expect(saved.isActive).toBe(true);
    });

    it('should update existing competitor', async () => {
      const competitor = CompetitorFixture.create(testPlace);
      const saved = await repository.save(competitor);

      saved.competitorName = '업데이트된 이름';
      saved.category = '업데이트된 카테고리';
      const updated = await repository.save(saved);

      expect(updated.id).toBe(saved.id);
      expect(updated.competitorName).toBe('업데이트된 이름');
      expect(updated.category).toBe('업데이트된 카테고리');
    });

    it('should save with specific details', async () => {
      const competitor = CompetitorFixture.withDetails(testPlace, '특정 업체명', '특정 카테고리');
      const saved = await repository.save(competitor);

      expect(saved.competitorName).toBe('특정 업체명');
      expect(saved.category).toBe('특정 카테고리');
    });

    it('should save inactive competitor', async () => {
      const competitor = CompetitorFixture.inactive(testPlace);
      const saved = await repository.save(competitor);

      expect(saved.isActive).toBe(false);
    });
  });

  describe('findById', () => {
    it('should find competitor by id', async () => {
      const competitor = CompetitorFixture.create(testPlace);
      const saved = await repository.save(competitor);

      const found = await repository.findById(saved.id);

      expect(found).not.toBeNull();
      expect(found!.id).toBe(saved.id);
      expect(found!.competitorName).toBe(saved.competitorName);
    });

    it('should return null for non-existent id', async () => {
      const found = await repository.findById('non-existent-id');
      expect(found).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all competitors with pagination', async () => {
      const competitors = CompetitorFixture.createMany(testPlace, 3);
      await Promise.all(competitors.map(c => repository.save(c)));

      const result = await repository.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(3);
      expect(result.pagination.total).toBe(3);
      expect(result.pagination.page).toBe(1);
    });

    it('should paginate correctly', async () => {
      const competitors = CompetitorFixture.createMany(testPlace, 5);
      await Promise.all(competitors.map(c => repository.save(c)));

      const page1 = await repository.findAll({ page: 1, limit: 2 });
      const page2 = await repository.findAll({ page: 2, limit: 2 });

      expect(page1.data).toHaveLength(2);
      expect(page2.data).toHaveLength(2);
      expect(page1.pagination.totalPages).toBe(3);
    });

    it('should load place relations', async () => {
      const competitor = CompetitorFixture.create(testPlace);
      await repository.save(competitor);

      const result = await repository.findAll();

      expect(result.data[0].place).toBeDefined();
      expect(result.data[0].place.id).toBe(testPlace.id);
    });

    it('should return empty array when no competitors exist', async () => {
      const result = await repository.findAll();

      expect(result.data).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });
  });

  describe('findByPlaceId', () => {
    it('should find all competitors for a place', async () => {
      const competitors = CompetitorFixture.createMany(testPlace, 3);
      await Promise.all(competitors.map(c => repository.save(c)));

      const found = await repository.findByPlaceId(testPlace.id);

      expect(found).toHaveLength(3);
      found.forEach(competitor => {
        expect(competitor.place.id).toBe(testPlace.id);
      });
    });

    it('should return empty array for place with no competitors', async () => {
      const found = await repository.findByPlaceId(testPlace.id);
      expect(found).toEqual([]);
    });

    it('should include both active and inactive competitors', async () => {
      await repository.save(CompetitorFixture.active(testPlace));
      await repository.save(CompetitorFixture.inactive(testPlace));

      const found = await repository.findByPlaceId(testPlace.id);

      expect(found).toHaveLength(2);
      expect(found.some(c => c.isActive)).toBe(true);
      expect(found.some(c => !c.isActive)).toBe(true);
    });

    it('should load place relations', async () => {
      const competitor = CompetitorFixture.create(testPlace);
      await repository.save(competitor);

      const found = await repository.findByPlaceId(testPlace.id);

      expect(found[0].place).toBeDefined();
      expect(found[0].place.id).toBe(testPlace.id);
    });
  });

  describe('findActiveByPlaceId', () => {
    it('should return only active competitors for a place', async () => {
      await repository.save(CompetitorFixture.active(testPlace));
      await repository.save(CompetitorFixture.active(testPlace));
      await repository.save(CompetitorFixture.inactive(testPlace));

      const found = await repository.findActiveByPlaceId(testPlace.id);

      expect(found).toHaveLength(2);
      found.forEach(competitor => {
        expect(competitor.isActive).toBe(true);
        expect(competitor.place.id).toBe(testPlace.id);
      });
    });

    it('should return empty array when no active competitors', async () => {
      await repository.save(CompetitorFixture.inactive(testPlace));

      const found = await repository.findActiveByPlaceId(testPlace.id);
      expect(found).toEqual([]);
    });

    it('should load place relations', async () => {
      await repository.save(CompetitorFixture.active(testPlace));

      const found = await repository.findActiveByPlaceId(testPlace.id);

      expect(found[0].place).toBeDefined();
      expect(found[0].place.id).toBe(testPlace.id);
    });
  });

  describe('findByPlaceAndNaverId', () => {
    it('should find competitor by place and naver place id', async () => {
      const competitor = CompetitorFixture.withNaverPlaceId(testPlace, 'unique-naver-id');
      await repository.save(competitor);

      const found = await repository.findByPlaceAndNaverId(testPlace.id, 'unique-naver-id');

      expect(found).not.toBeNull();
      expect(found!.competitorNaverPlaceId).toBe('unique-naver-id');
      expect(found!.place.id).toBe(testPlace.id);
    });

    it('should return null when combination does not exist', async () => {
      const found = await repository.findByPlaceAndNaverId(testPlace.id, 'non-existent-id');
      expect(found).toBeNull();
    });

    it('should distinguish between different places', async () => {
      // Create another place
      const anotherPlace = PlaceFixture.create(testUser);
      await dataSource.getRepository(Place).save(anotherPlace);

      const competitor1 = CompetitorFixture.withNaverPlaceId(testPlace, 'same-naver-id');
      const competitor2 = CompetitorFixture.withNaverPlaceId(anotherPlace, 'same-naver-id');
      await repository.save(competitor1);
      await repository.save(competitor2);

      const found1 = await repository.findByPlaceAndNaverId(testPlace.id, 'same-naver-id');
      const found2 = await repository.findByPlaceAndNaverId(anotherPlace.id, 'same-naver-id');

      expect(found1!.place.id).toBe(testPlace.id);
      expect(found2!.place.id).toBe(anotherPlace.id);
      expect(found1!.id).not.toBe(found2!.id);
    });

    it('should load place relations', async () => {
      await repository.save(CompetitorFixture.withNaverPlaceId(testPlace, 'test-id'));

      const found = await repository.findByPlaceAndNaverId(testPlace.id, 'test-id');

      expect(found!.place).toBeDefined();
      expect(found!.place.id).toBe(testPlace.id);
    });
  });

  describe('update', () => {
    it('should update competitor', async () => {
      const competitor = CompetitorFixture.create(testPlace);
      const saved = await repository.save(competitor);

      const updated = await repository.update(saved.id, {
        competitorName: '새로운 이름',
        category: '새로운 카테고리',
      });

      expect(updated.id).toBe(saved.id);
      expect(updated.competitorName).toBe('새로운 이름');
      expect(updated.category).toBe('새로운 카테고리');
    });

    it('should throw NotFoundError when competitor does not exist', async () => {
      await expect(repository.update('non-existent-id', { competitorName: '테스트' }))
        .rejects
        .toThrow(NotFoundError);
    });
  });

  describe('updateActiveStatus', () => {
    it('should update active status to false', async () => {
      const competitor = CompetitorFixture.active(testPlace);
      const saved = await repository.save(competitor);

      await repository.updateActiveStatus(saved.id, false);

      const found = await repository.findById(saved.id);
      expect(found!.isActive).toBe(false);
    });

    it('should update active status to true', async () => {
      const competitor = CompetitorFixture.inactive(testPlace);
      const saved = await repository.save(competitor);

      await repository.updateActiveStatus(saved.id, true);

      const found = await repository.findById(saved.id);
      expect(found!.isActive).toBe(true);
    });
  });

  describe('delete', () => {
    it('should delete competitor', async () => {
      const competitor = CompetitorFixture.create(testPlace);
      const saved = await repository.save(competitor);

      await repository.delete(saved.id);

      const found = await repository.findById(saved.id);
      expect(found).toBeNull();
    });

    it('should throw NotFoundError when deleting non-existent competitor', async () => {
      await expect(repository.delete('non-existent-id'))
        .rejects
        .toThrow(NotFoundError);
    });
  });

  describe('exists', () => {
    it('should return true for existing competitor', async () => {
      const competitor = CompetitorFixture.create(testPlace);
      const saved = await repository.save(competitor);

      const exists = await repository.exists(saved.id);
      expect(exists).toBe(true);
    });

    it('should return false for non-existent competitor', async () => {
      const exists = await repository.exists('non-existent-id');
      expect(exists).toBe(false);
    });
  });

  describe('count', () => {
    it('should return correct count of competitors', async () => {
      const competitors = CompetitorFixture.createMany(testPlace, 3);
      await Promise.all(competitors.map(c => repository.save(c)));

      const count = await repository.count();
      expect(count).toBe(3);
    });

    it('should return 0 when no competitors exist', async () => {
      const count = await repository.count();
      expect(count).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple places separately', async () => {
      // Create another place
      const anotherPlace = PlaceFixture.create(testUser);
      await dataSource.getRepository(Place).save(anotherPlace);

      // Create competitors for both
      const competitor1 = await repository.save(CompetitorFixture.create(testPlace));
      const competitor2 = await repository.save(CompetitorFixture.create(anotherPlace));

      const found1 = await repository.findByPlaceId(testPlace.id);
      const found2 = await repository.findByPlaceId(anotherPlace.id);

      expect(found1).toHaveLength(1);
      expect(found2).toHaveLength(1);
      expect(found1[0].id).toBe(competitor1.id);
      expect(found2[0].id).toBe(competitor2.id);
    });

    it('should handle multiple competitors for same place', async () => {
      const competitors = CompetitorFixture.createMany(testPlace, 5);
      await Promise.all(competitors.map(c => repository.save(c)));

      const found = await repository.findByPlaceId(testPlace.id);
      expect(found).toHaveLength(5);

      // All should belong to same place
      found.forEach(competitor => {
        expect(competitor.place.id).toBe(testPlace.id);
      });
    });

    it('should handle mix of active and inactive competitors', async () => {
      await repository.save(CompetitorFixture.active(testPlace));
      await repository.save(CompetitorFixture.active(testPlace));
      await repository.save(CompetitorFixture.inactive(testPlace));
      await repository.save(CompetitorFixture.inactive(testPlace));

      const allCompetitors = await repository.findByPlaceId(testPlace.id);
      const activeCompetitors = await repository.findActiveByPlaceId(testPlace.id);

      expect(allCompetitors).toHaveLength(4);
      expect(activeCompetitors).toHaveLength(2);
    });

    it('should maintain data integrity when toggling active status', async () => {
      const competitor = CompetitorFixture.active(testPlace);
      const saved = await repository.save(competitor);

      // Toggle off
      await repository.updateActiveStatus(saved.id, false);
      let activeCount = (await repository.findActiveByPlaceId(testPlace.id)).length;
      expect(activeCount).toBe(0);

      // Toggle on
      await repository.updateActiveStatus(saved.id, true);
      activeCount = (await repository.findActiveByPlaceId(testPlace.id)).length;
      expect(activeCount).toBe(1);
    });
  });
});
