import { DataSource } from 'typeorm';
import { PlaceKeywordRepository } from '@infrastructure/repositories/PlaceKeywordRepository';
import { PlaceKeyword } from '@domain/entities/PlaceKeyword';
import { Place } from '@domain/entities/Place';
import { Keyword } from '@domain/entities/Keyword';
import { User } from '@domain/entities/User';
import { createTestDataSource, closeTestDataSource, resetDatabase } from '@tests/helpers/database.helper';
import { PlaceKeywordFixture } from '@tests/fixtures/placeKeywords';
import { PlaceFixture } from '@tests/fixtures/places';
import { KeywordFixture } from '@tests/fixtures/keywords';
import { UserFixture } from '@tests/fixtures/users';
import { NotFoundError } from '@application/errors/HttpError';

describe('PlaceKeywordRepository Integration Tests', () => {
  let dataSource: DataSource;
  let repository: PlaceKeywordRepository;
  let testUser: User;
  let testPlace: Place;
  let testKeyword: Keyword;

  beforeAll(async () => {
    dataSource = await createTestDataSource();
  });

  afterAll(async () => {
    await closeTestDataSource(dataSource);
  });

  beforeEach(async () => {
    await resetDatabase(dataSource);
    repository = new PlaceKeywordRepository(dataSource);

    // Create test user, place, and keyword
    const userRepo = dataSource.getRepository(User);
    const placeRepo = dataSource.getRepository(Place);
    const keywordRepo = dataSource.getRepository(Keyword);

    testUser = await userRepo.save(UserFixture.create());
    testPlace = await placeRepo.save(PlaceFixture.create(testUser));
    testKeyword = await keywordRepo.save(KeywordFixture.create());
  });

  describe('save', () => {
    it('should save a new place-keyword association', async () => {
      const placeKeyword = PlaceKeywordFixture.create(testPlace, testKeyword);
      const saved = await repository.save(placeKeyword);

      expect(saved.id).toBeDefined();
      expect(saved.place.id).toBe(testPlace.id);
      expect(saved.keyword.id).toBe(testKeyword.id);
      expect(saved.isActive).toBe(true);
    });

    it('should save with region', async () => {
      const placeKeyword = PlaceKeywordFixture.withRegion(testPlace, testKeyword, '서울');
      const saved = await repository.save(placeKeyword);

      expect(saved.region).toBe('서울');
    });

    it('should save without region (null)', async () => {
      const placeKeyword = PlaceKeywordFixture.create(testPlace, testKeyword);
      const saved = await repository.save(placeKeyword);

      expect(saved.region).toBeNull();
    });

    it('should update existing place-keyword', async () => {
      const placeKeyword = PlaceKeywordFixture.create(testPlace, testKeyword);
      const saved = await repository.save(placeKeyword);

      saved.region = '경기';
      const updated = await repository.save(saved);

      expect(updated.id).toBe(saved.id);
      expect(updated.region).toBe('경기');
    });
  });

  describe('findById', () => {
    it('should find place-keyword by id', async () => {
      const placeKeyword = PlaceKeywordFixture.create(testPlace, testKeyword);
      const saved = await repository.save(placeKeyword);

      const found = await repository.findById(saved.id);

      expect(found).not.toBeNull();
      expect(found!.id).toBe(saved.id);
      expect(found!.place).toBeDefined();
      expect(found!.keyword).toBeDefined();
    });

    it('should return null for non-existent id', async () => {
      const found = await repository.findById('non-existent-id');
      expect(found).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all place-keywords with relations', async () => {
      const placeKeywords = PlaceKeywordFixture.createMany(testPlace, [
        await dataSource.getRepository(Keyword).save(KeywordFixture.create()),
        await dataSource.getRepository(Keyword).save(KeywordFixture.create()),
        await dataSource.getRepository(Keyword).save(KeywordFixture.create()),
      ]);
      await Promise.all(placeKeywords.map(pk => repository.save(pk)));

      const result = await repository.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(3);
      expect(result.pagination.total).toBe(3);
      expect(result.data[0].place).toBeDefined();
      expect(result.data[0].keyword).toBeDefined();
    });

    it('should paginate correctly', async () => {
      const keywords = await Promise.all(
        Array.from({ length: 5 }, () => dataSource.getRepository(Keyword).save(KeywordFixture.create()))
      );
      const placeKeywords = PlaceKeywordFixture.createMany(testPlace, keywords);
      await Promise.all(placeKeywords.map(pk => repository.save(pk)));

      const page1 = await repository.findAll({ page: 1, limit: 2 });
      const page2 = await repository.findAll({ page: 2, limit: 2 });

      expect(page1.data).toHaveLength(2);
      expect(page2.data).toHaveLength(2);
      expect(page1.pagination.totalPages).toBe(3);
    });

    it('should return empty array when no place-keywords exist', async () => {
      const result = await repository.findAll();

      expect(result.data).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });
  });

  describe('findByPlaceId', () => {
    it('should find all keywords for a place', async () => {
      const keywords = await Promise.all([
        dataSource.getRepository(Keyword).save(KeywordFixture.create()),
        dataSource.getRepository(Keyword).save(KeywordFixture.create()),
        dataSource.getRepository(Keyword).save(KeywordFixture.create()),
      ]);
      const placeKeywords = PlaceKeywordFixture.createMany(testPlace, keywords);
      await Promise.all(placeKeywords.map(pk => repository.save(pk)));

      const found = await repository.findByPlaceId(testPlace.id);

      expect(found).toHaveLength(3);
      found.forEach(pk => {
        expect(pk.place.id).toBe(testPlace.id);
        expect(pk.keyword).toBeDefined();
      });
    });

    it('should return empty array for place with no keywords', async () => {
      const found = await repository.findByPlaceId(testPlace.id);

      expect(found).toHaveLength(0);
    });

    it('should include both active and inactive keywords', async () => {
      const keyword1 = await dataSource.getRepository(Keyword).save(KeywordFixture.create());
      const keyword2 = await dataSource.getRepository(Keyword).save(KeywordFixture.create());

      await repository.save(PlaceKeywordFixture.active(testPlace, keyword1));
      await repository.save(PlaceKeywordFixture.inactive(testPlace, keyword2));

      const found = await repository.findByPlaceId(testPlace.id);

      expect(found).toHaveLength(2);
      const activeCount = found.filter(pk => pk.isActive).length;
      const inactiveCount = found.filter(pk => !pk.isActive).length;
      expect(activeCount).toBe(1);
      expect(inactiveCount).toBe(1);
    });
  });

  describe('findActiveByPlaceId', () => {
    it('should return only active keywords for a place', async () => {
      const keyword1 = await dataSource.getRepository(Keyword).save(KeywordFixture.create());
      const keyword2 = await dataSource.getRepository(Keyword).save(KeywordFixture.create());
      const keyword3 = await dataSource.getRepository(Keyword).save(KeywordFixture.create());

      await repository.save(PlaceKeywordFixture.active(testPlace, keyword1));
      await repository.save(PlaceKeywordFixture.active(testPlace, keyword2));
      await repository.save(PlaceKeywordFixture.inactive(testPlace, keyword3));

      const found = await repository.findActiveByPlaceId(testPlace.id);

      expect(found).toHaveLength(2);
      found.forEach(pk => {
        expect(pk.isActive).toBe(true);
        expect(pk.place.id).toBe(testPlace.id);
      });
    });

    it('should return empty array when no active keywords', async () => {
      const keyword = await dataSource.getRepository(Keyword).save(KeywordFixture.create());
      await repository.save(PlaceKeywordFixture.inactive(testPlace, keyword));

      const found = await repository.findActiveByPlaceId(testPlace.id);

      expect(found).toHaveLength(0);
    });
  });

  describe('findByPlaceAndKeyword', () => {
    it('should find place-keyword by place, keyword, and region', async () => {
      const placeKeyword = PlaceKeywordFixture.withRegion(testPlace, testKeyword, '서울');
      const saved = await repository.save(placeKeyword);

      const found = await repository.findByPlaceAndKeyword(testPlace.id, testKeyword.id, '서울');

      expect(found).not.toBeNull();
      expect(found!.id).toBe(saved.id);
      expect(found!.region).toBe('서울');
    });

    it('should return null when combination does not exist', async () => {
      const found = await repository.findByPlaceAndKeyword(testPlace.id, testKeyword.id, '서울');

      expect(found).toBeNull();
    });

    it('should distinguish between different regions', async () => {
      const pk1 = PlaceKeywordFixture.withRegion(testPlace, testKeyword, '서울');
      await repository.save(pk1);

      const foundSeoul = await repository.findByPlaceAndKeyword(testPlace.id, testKeyword.id, '서울');
      const foundGyeonggi = await repository.findByPlaceAndKeyword(testPlace.id, testKeyword.id, '경기');

      expect(foundSeoul).not.toBeNull();
      expect(foundGyeonggi).toBeNull();
    });

    it('should handle null region', async () => {
      const placeKeyword = PlaceKeywordFixture.create(testPlace, testKeyword);
      await repository.save(placeKeyword);

      const found = await repository.findByPlaceAndKeyword(testPlace.id, testKeyword.id, null as any);

      expect(found).not.toBeNull();
      expect(found!.region).toBeNull();
    });
  });

  describe('update', () => {
    it('should update place-keyword fields', async () => {
      const placeKeyword = PlaceKeywordFixture.create(testPlace, testKeyword);
      const saved = await repository.save(placeKeyword);

      const updated = await repository.update(saved.id, {
        region: '경기',
        isActive: false,
      });

      expect(updated.id).toBe(saved.id);
      expect(updated.region).toBe('경기');
      expect(updated.isActive).toBe(false);
    });

    it('should throw NotFoundError when place-keyword does not exist', async () => {
      await expect(repository.update('non-existent-id', { region: '서울' }))
        .rejects
        .toThrow(NotFoundError);
    });
  });

  describe('updateActiveStatus', () => {
    it('should update active status to false', async () => {
      const placeKeyword = PlaceKeywordFixture.active(testPlace, testKeyword);
      const saved = await repository.save(placeKeyword);

      await repository.updateActiveStatus(saved.id, false);

      const updated = await repository.findById(saved.id);
      expect(updated!.isActive).toBe(false);
    });

    it('should update active status to true', async () => {
      const placeKeyword = PlaceKeywordFixture.inactive(testPlace, testKeyword);
      const saved = await repository.save(placeKeyword);

      await repository.updateActiveStatus(saved.id, true);

      const updated = await repository.findById(saved.id);
      expect(updated!.isActive).toBe(true);
    });
  });

  describe('delete', () => {
    it('should delete place-keyword', async () => {
      const placeKeyword = PlaceKeywordFixture.create(testPlace, testKeyword);
      const saved = await repository.save(placeKeyword);

      await repository.delete(saved.id);

      const found = await repository.findById(saved.id);
      expect(found).toBeNull();
    });

    it('should throw NotFoundError when deleting non-existent place-keyword', async () => {
      await expect(repository.delete('non-existent-id'))
        .rejects
        .toThrow(NotFoundError);
    });

    it('should not delete associated place or keyword', async () => {
      const placeKeyword = PlaceKeywordFixture.create(testPlace, testKeyword);
      const saved = await repository.save(placeKeyword);

      await repository.delete(saved.id);

      const placeRepo = dataSource.getRepository(Place);
      const keywordRepo = dataSource.getRepository(Keyword);

      const placeExists = await placeRepo.findOne({ where: { id: testPlace.id } });
      const keywordExists = await keywordRepo.findOne({ where: { id: testKeyword.id } });

      expect(placeExists).not.toBeNull();
      expect(keywordExists).not.toBeNull();
    });
  });

  describe('exists', () => {
    it('should return true for existing place-keyword', async () => {
      const placeKeyword = PlaceKeywordFixture.create(testPlace, testKeyword);
      const saved = await repository.save(placeKeyword);

      const exists = await repository.exists(saved.id);
      expect(exists).toBe(true);
    });

    it('should return false for non-existent place-keyword', async () => {
      const exists = await repository.exists('non-existent-id');
      expect(exists).toBe(false);
    });
  });

  describe('count', () => {
    it('should return correct count of place-keywords', async () => {
      const keywords = await Promise.all([
        dataSource.getRepository(Keyword).save(KeywordFixture.create()),
        dataSource.getRepository(Keyword).save(KeywordFixture.create()),
        dataSource.getRepository(Keyword).save(KeywordFixture.create()),
      ]);
      const placeKeywords = PlaceKeywordFixture.createMany(testPlace, keywords);
      await Promise.all(placeKeywords.map(pk => repository.save(pk)));

      const count = await repository.count();
      expect(count).toBe(3);
    });

    it('should return 0 when no place-keywords exist', async () => {
      const count = await repository.count();
      expect(count).toBe(0);
    });
  });

  describe('Constraint Tests', () => {
    it('should allow same keyword for different places', async () => {
      const anotherPlace = await dataSource.getRepository(Place).save(PlaceFixture.create(testUser));

      const pk1 = PlaceKeywordFixture.create(testPlace, testKeyword);
      const pk2 = PlaceKeywordFixture.create(anotherPlace, testKeyword);

      await repository.save(pk1);
      await expect(repository.save(pk2)).resolves.toBeDefined();
    });

    it('should allow same keyword with different regions for same place', async () => {
      const pk1 = PlaceKeywordFixture.withRegion(testPlace, testKeyword, '서울');
      const pk2 = PlaceKeywordFixture.withRegion(testPlace, testKeyword, '경기');

      await repository.save(pk1);
      await expect(repository.save(pk2)).resolves.toBeDefined();

      const all = await repository.findByPlaceId(testPlace.id);
      expect(all).toHaveLength(2);
    });
  });
});
