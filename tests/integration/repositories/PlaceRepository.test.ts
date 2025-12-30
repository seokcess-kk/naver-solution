import { DataSource } from 'typeorm';
import { PlaceRepository } from '@infrastructure/repositories/PlaceRepository';
import { Place } from '@domain/entities/Place';
import { User } from '@domain/entities/User';
import { createTestDataSource, closeTestDataSource, resetDatabase } from '@tests/helpers/database.helper';
import { PlaceFixture } from '@tests/fixtures/places';
import { UserFixture } from '@tests/fixtures/users';
import { NotFoundError } from '@application/errors/HttpError';

describe('PlaceRepository Integration Tests', () => {
  let dataSource: DataSource;
  let repository: PlaceRepository;
  let testUser: User;

  beforeAll(async () => {
    dataSource = await createTestDataSource();
  });

  afterAll(async () => {
    await closeTestDataSource(dataSource);
  });

  beforeEach(async () => {
    await resetDatabase(dataSource);
    repository = new PlaceRepository(dataSource);

    // Create and save a test user for place creation
    const userRepo = dataSource.getRepository(User);
    testUser = UserFixture.create();
    testUser = await userRepo.save(testUser);
  });

  describe('save', () => {
    it('should save a new place to database', async () => {
      const place = PlaceFixture.create(testUser);
      const saved = await repository.save(place);

      expect(saved.id).toBeDefined();
      expect(saved.naverPlaceId).toBe(place.naverPlaceId);
      expect(saved.name).toBe(place.name);
      expect(saved.user.id).toBe(testUser.id);
      expect(saved.isActive).toBe(true);
    });

    it('should update existing place', async () => {
      const place = PlaceFixture.create(testUser);
      const saved = await repository.save(place);

      saved.name = 'Updated Place Name';
      const updated = await repository.save(saved);

      expect(updated.id).toBe(saved.id);
      expect(updated.name).toBe('Updated Place Name');
    });
  });

  describe('findById', () => {
    it('should find place by id', async () => {
      const place = PlaceFixture.create(testUser);
      const saved = await repository.save(place);

      const found = await repository.findById(saved.id);

      expect(found).not.toBeNull();
      expect(found!.id).toBe(saved.id);
      expect(found!.name).toBe(saved.name);
    });

    it('should return null for non-existent id', async () => {
      const found = await repository.findById('non-existent-id');
      expect(found).toBeNull();
    });
  });

  describe('findByNaverPlaceId', () => {
    it('should find place by Naver Place ID', async () => {
      const place = PlaceFixture.withNaverPlaceId(testUser, 'naver-12345');
      const saved = await repository.save(place);

      const found = await repository.findByNaverPlaceId('naver-12345');

      expect(found).not.toBeNull();
      expect(found!.id).toBe(saved.id);
      expect(found!.naverPlaceId).toBe('naver-12345');
    });

    it('should return null for non-existent Naver Place ID', async () => {
      const found = await repository.findByNaverPlaceId('non-existent');
      expect(found).toBeNull();
    });

    it('should enforce unique constraint on naverPlaceId', async () => {
      const place1 = PlaceFixture.withNaverPlaceId(testUser, 'unique-12345');
      await repository.save(place1);

      const place2 = PlaceFixture.withNaverPlaceId(testUser, 'unique-12345');
      await expect(repository.save(place2)).rejects.toThrow();
    });
  });

  describe('findByUserId', () => {
    it('should find all places for a user', async () => {
      const places = PlaceFixture.createMany(testUser, 3);
      await Promise.all(places.map(p => repository.save(p)));

      const result = await repository.findByUserId(testUser.id);

      expect(result.data).toHaveLength(3);
      expect(result.pagination.total).toBe(3);
      expect(result.pagination.page).toBe(1);
    });

    it('should paginate user places correctly', async () => {
      const places = PlaceFixture.createMany(testUser, 5);
      await Promise.all(places.map(p => repository.save(p)));

      const page1 = await repository.findByUserId(testUser.id, { page: 1, limit: 2 });
      const page2 = await repository.findByUserId(testUser.id, { page: 2, limit: 2 });

      expect(page1.data).toHaveLength(2);
      expect(page2.data).toHaveLength(2);
      expect(page1.pagination.totalPages).toBe(3);
    });

    it('should return empty for user with no places', async () => {
      const result = await repository.findByUserId(testUser.id);

      expect(result.data).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });

    it('should only return places for specific user', async () => {
      // Create another user
      const userRepo = dataSource.getRepository(User);
      const otherUser = await userRepo.save(UserFixture.create());

      // Create places for both users
      await repository.save(PlaceFixture.create(testUser));
      await repository.save(PlaceFixture.create(otherUser));

      const result = await repository.findByUserId(testUser.id);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].user.id).toBe(testUser.id);
    });
  });

  describe('findActiveByUserId', () => {
    it('should return only active places', async () => {
      await repository.save(PlaceFixture.active(testUser));
      await repository.save(PlaceFixture.active(testUser));
      await repository.save(PlaceFixture.inactive(testUser));

      const activePlaces = await repository.findActiveByUserId(testUser.id);

      expect(activePlaces).toHaveLength(2);
      activePlaces.forEach(place => {
        expect(place.isActive).toBe(true);
      });
    });

    it('should return empty array when no active places', async () => {
      await repository.save(PlaceFixture.inactive(testUser));

      const activePlaces = await repository.findActiveByUserId(testUser.id);

      expect(activePlaces).toHaveLength(0);
    });
  });

  describe('findAll', () => {
    it('should return all places with pagination', async () => {
      const places = PlaceFixture.createMany(testUser, 3);
      await Promise.all(places.map(p => repository.save(p)));

      const result = await repository.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(3);
      expect(result.pagination.total).toBe(3);
      expect(result.data[0].user).toBeDefined(); // Relations loaded
    });

    it('should paginate correctly', async () => {
      const places = PlaceFixture.createMany(testUser, 5);
      await Promise.all(places.map(p => repository.save(p)));

      const result = await repository.findAll({ page: 2, limit: 2 });

      expect(result.data).toHaveLength(2);
      expect(result.pagination.page).toBe(2);
      expect(result.pagination.totalPages).toBe(3);
    });

    it('should sort by specified field', async () => {
      const place1 = await repository.save(PlaceFixture.create(testUser, { name: 'A Place' }));
      const place2 = await repository.save(PlaceFixture.create(testUser, { name: 'B Place' }));

      const result = await repository.findAll({ sortBy: 'name', sortOrder: 'ASC' });

      expect(result.data[0].name).toBe('A Place');
      expect(result.data[1].name).toBe('B Place');
    });
  });

  describe('update', () => {
    it('should update place fields', async () => {
      const place = PlaceFixture.create(testUser);
      const saved = await repository.save(place);

      const updated = await repository.update(saved.id, {
        name: 'New Name',
        category: 'New Category',
      });

      expect(updated.name).toBe('New Name');
      expect(updated.category).toBe('New Category');
      expect(updated.naverPlaceId).toBe(saved.naverPlaceId); // Unchanged
    });

    it('should throw NotFoundError when place does not exist', async () => {
      await expect(repository.update('non-existent-id', { name: 'New' }))
        .rejects
        .toThrow(NotFoundError);
    });
  });

  describe('updateActiveStatus', () => {
    it('should update active status to false', async () => {
      const place = PlaceFixture.active(testUser);
      const saved = await repository.save(place);

      await repository.updateActiveStatus(saved.id, false);

      const updated = await repository.findById(saved.id);
      expect(updated!.isActive).toBe(false);
    });

    it('should update active status to true', async () => {
      const place = PlaceFixture.inactive(testUser);
      const saved = await repository.save(place);

      await repository.updateActiveStatus(saved.id, true);

      const updated = await repository.findById(saved.id);
      expect(updated!.isActive).toBe(true);
    });
  });

  describe('delete', () => {
    it('should delete place', async () => {
      const place = PlaceFixture.create(testUser);
      const saved = await repository.save(place);

      await repository.delete(saved.id);

      const found = await repository.findById(saved.id);
      expect(found).toBeNull();
    });

    it('should throw NotFoundError when deleting non-existent place', async () => {
      await expect(repository.delete('non-existent-id'))
        .rejects
        .toThrow(NotFoundError);
    });
  });

  describe('exists', () => {
    it('should return true for existing place', async () => {
      const place = PlaceFixture.create(testUser);
      const saved = await repository.save(place);

      const exists = await repository.exists(saved.id);
      expect(exists).toBe(true);
    });

    it('should return false for non-existent place', async () => {
      const exists = await repository.exists('non-existent-id');
      expect(exists).toBe(false);
    });
  });

  describe('count', () => {
    it('should return correct count of places', async () => {
      const places = PlaceFixture.createMany(testUser, 3);
      await Promise.all(places.map(p => repository.save(p)));

      const count = await repository.count();
      expect(count).toBe(3);
    });

    it('should return 0 when no places exist', async () => {
      const count = await repository.count();
      expect(count).toBe(0);
    });
  });
});
