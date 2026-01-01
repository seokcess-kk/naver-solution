import { DataSource } from 'typeorm';
import { CompetitorSnapshotRepository } from '@infrastructure/repositories/CompetitorSnapshotRepository';
import { CompetitorSnapshot } from '@domain/entities/CompetitorSnapshot';
import { Competitor } from '@domain/entities/Competitor';
import { Place } from '@domain/entities/Place';
import { User } from '@domain/entities/User';
import { createTestDataSource, closeTestDataSource, resetDatabase } from '@tests/helpers/database.helper';
import { CompetitorSnapshotFixture, CompetitorFixture } from '@tests/fixtures/competitors';
import { PlaceFixture } from '@tests/fixtures/places';
import { UserFixture } from '@tests/fixtures/users';
import { NotFoundError } from '@application/errors/HttpError';

describe('CompetitorSnapshotRepository Integration Tests', () => {
  let dataSource: DataSource;
  let repository: CompetitorSnapshotRepository;
  let testUser: User;
  let testPlace: Place;
  let testCompetitor: Competitor;

  beforeAll(async () => {
    dataSource = await createTestDataSource();
  });

  afterAll(async () => {
    await closeTestDataSource(dataSource);
  });

  beforeEach(async () => {
    await resetDatabase(dataSource);
    repository = new CompetitorSnapshotRepository(dataSource);

    // Create test dependencies
    const userRepo = dataSource.getRepository(User);
    testUser = UserFixture.create();
    testUser = await userRepo.save(testUser);

    const placeRepo = dataSource.getRepository(Place);
    testPlace = PlaceFixture.create(testUser);
    testPlace = await placeRepo.save(testPlace);

    const competitorRepo = dataSource.getRepository(Competitor);
    testCompetitor = CompetitorFixture.create(testPlace);
    testCompetitor = await competitorRepo.save(testCompetitor);
  });

  describe('save', () => {
    it('should save a new competitor snapshot to database', async () => {
      const snapshot = CompetitorSnapshotFixture.create(testCompetitor);
      const saved = await repository.save(snapshot);

      expect(saved.id).toBeDefined();
      expect(saved.rank).toBe(snapshot.rank);
      expect(saved.blogReviewCount).toBe(snapshot.blogReviewCount);
      expect(saved.visitorReviewCount).toBe(snapshot.visitorReviewCount);
      expect(saved.averageRating).toBe(snapshot.averageRating);
      expect(saved.checkedAt).toBeInstanceOf(Date);
      expect(saved.createdAt).toBeInstanceOf(Date);
    });

    it('should update existing snapshot', async () => {
      const snapshot = CompetitorSnapshotFixture.create(testCompetitor);
      const saved = await repository.save(snapshot);

      saved.rank = 5;
      saved.blogReviewCount = 150;
      saved.averageRating = 4.8;
      const updated = await repository.save(saved);

      expect(updated.id).toBe(saved.id);
      expect(updated.rank).toBe(5);
      expect(updated.blogReviewCount).toBe(150);
      expect(updated.averageRating).toBe(4.8);
    });

    it('should save popular competitor snapshot', async () => {
      const snapshot = CompetitorSnapshotFixture.popular(testCompetitor);
      const saved = await repository.save(snapshot);

      expect(saved.rank).toBe(2);
      expect(saved.blogReviewCount).toBe(300);
      expect(saved.visitorReviewCount).toBe(800);
      expect(saved.averageRating).toBe(4.7);
    });

    it('should save unpopular competitor snapshot', async () => {
      const snapshot = CompetitorSnapshotFixture.unpopular(testCompetitor);
      const saved = await repository.save(snapshot);

      expect(saved.rank).toBe(12);
      expect(saved.blogReviewCount).toBe(10);
      expect(saved.visitorReviewCount).toBe(30);
      expect(saved.averageRating).toBe(3.5);
    });
  });

  describe('findById', () => {
    it('should find competitor snapshot by id', async () => {
      const snapshot = CompetitorSnapshotFixture.create(testCompetitor);
      const saved = await repository.save(snapshot);

      const found = await repository.findById(saved.id);

      expect(found).not.toBeNull();
      expect(found!.id).toBe(saved.id);
      expect(found!.rank).toBe(saved.rank);
    });

    it('should return null for non-existent id', async () => {
      const found = await repository.findById('non-existent-id');
      expect(found).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all snapshots with pagination', async () => {
      const snapshots = CompetitorSnapshotFixture.createMany(testCompetitor, 3);
      await Promise.all(snapshots.map(s => repository.save(s)));

      const result = await repository.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(3);
      expect(result.pagination.total).toBe(3);
      expect(result.pagination.page).toBe(1);
    });

    it('should paginate correctly', async () => {
      const snapshots = CompetitorSnapshotFixture.createMany(testCompetitor, 5);
      await Promise.all(snapshots.map(s => repository.save(s)));

      const page1 = await repository.findAll({ page: 1, limit: 2 });
      const page2 = await repository.findAll({ page: 2, limit: 2 });

      expect(page1.data).toHaveLength(2);
      expect(page2.data).toHaveLength(2);
      expect(page1.pagination.totalPages).toBe(3);
    });

    it('should sort by createdAt DESC by default', async () => {
      const snapshot1 = await repository.save(CompetitorSnapshotFixture.create(testCompetitor));
      await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
      const snapshot2 = await repository.save(CompetitorSnapshotFixture.create(testCompetitor));
      await new Promise(resolve => setTimeout(resolve, 10));
      const snapshot3 = await repository.save(CompetitorSnapshotFixture.create(testCompetitor));

      const result = await repository.findAll();

      expect(result.data[0].id).toBe(snapshot3.id); // Most recent
      expect(result.data[1].id).toBe(snapshot2.id);
      expect(result.data[2].id).toBe(snapshot1.id);
    });

    it('should load competitor relations', async () => {
      const snapshot = CompetitorSnapshotFixture.create(testCompetitor);
      await repository.save(snapshot);

      const result = await repository.findAll();

      expect(result.data[0].competitor).toBeDefined();
      expect(result.data[0].competitor.id).toBe(testCompetitor.id);
    });

    it('should return empty array when no snapshots exist', async () => {
      const result = await repository.findAll();

      expect(result.data).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });
  });

  describe('findByCompetitorId', () => {
    it('should find all snapshots for a competitor', async () => {
      const snapshots = CompetitorSnapshotFixture.createMany(testCompetitor, 3);
      await Promise.all(snapshots.map(s => repository.save(s)));

      const found = await repository.findByCompetitorId(testCompetitor.id);

      expect(found).toHaveLength(3);
      found.forEach(snapshot => {
        expect(snapshot.competitor.id).toBe(testCompetitor.id);
      });
    });

    it('should limit results when limit is provided', async () => {
      const snapshots = CompetitorSnapshotFixture.createMany(testCompetitor, 5);
      await Promise.all(snapshots.map(s => repository.save(s)));

      const found = await repository.findByCompetitorId(testCompetitor.id, 3);

      expect(found).toHaveLength(3);
    });

    it('should order by checkedAt DESC', async () => {
      const snapshot1 = await repository.save(
        CompetitorSnapshotFixture.withCheckedAt(testCompetitor, new Date('2024-01-01'))
      );
      const snapshot2 = await repository.save(
        CompetitorSnapshotFixture.withCheckedAt(testCompetitor, new Date('2024-01-03'))
      );
      const snapshot3 = await repository.save(
        CompetitorSnapshotFixture.withCheckedAt(testCompetitor, new Date('2024-01-02'))
      );

      const found = await repository.findByCompetitorId(testCompetitor.id);

      expect(found[0].id).toBe(snapshot2.id); // Most recent
      expect(found[1].id).toBe(snapshot3.id);
      expect(found[2].id).toBe(snapshot1.id);
    });

    it('should return empty array for non-existent competitor', async () => {
      const found = await repository.findByCompetitorId('non-existent-id');
      expect(found).toEqual([]);
    });

    it('should load competitor relations', async () => {
      const snapshot = CompetitorSnapshotFixture.create(testCompetitor);
      await repository.save(snapshot);

      const found = await repository.findByCompetitorId(testCompetitor.id);

      expect(found[0].competitor).toBeDefined();
      expect(found[0].competitor.id).toBe(testCompetitor.id);
    });
  });

  describe('findByCompetitorIdInDateRange', () => {
    it('should find snapshots within date range', async () => {
      const snapshot1 = await repository.save(
        CompetitorSnapshotFixture.withCheckedAt(testCompetitor, new Date('2024-01-01'))
      );
      const snapshot2 = await repository.save(
        CompetitorSnapshotFixture.withCheckedAt(testCompetitor, new Date('2024-01-05'))
      );
      const snapshot3 = await repository.save(
        CompetitorSnapshotFixture.withCheckedAt(testCompetitor, new Date('2024-01-10'))
      );

      const found = await repository.findByCompetitorIdInDateRange(
        testCompetitor.id,
        new Date('2024-01-03'),
        new Date('2024-01-08')
      );

      expect(found).toHaveLength(1);
      expect(found[0].id).toBe(snapshot2.id);
    });

    it('should include boundaries in date range', async () => {
      const snapshot1 = await repository.save(
        CompetitorSnapshotFixture.withCheckedAt(testCompetitor, new Date('2024-01-01'))
      );
      const snapshot2 = await repository.save(
        CompetitorSnapshotFixture.withCheckedAt(testCompetitor, new Date('2024-01-05'))
      );

      const found = await repository.findByCompetitorIdInDateRange(
        testCompetitor.id,
        new Date('2024-01-01'),
        new Date('2024-01-05')
      );

      expect(found).toHaveLength(2);
    });

    it('should return empty array when no snapshots in date range', async () => {
      await repository.save(
        CompetitorSnapshotFixture.withCheckedAt(testCompetitor, new Date('2024-01-01'))
      );

      const found = await repository.findByCompetitorIdInDateRange(
        testCompetitor.id,
        new Date('2024-02-01'),
        new Date('2024-02-28')
      );

      expect(found).toEqual([]);
    });

    it('should order by checkedAt DESC', async () => {
      const snapshot1 = await repository.save(
        CompetitorSnapshotFixture.withCheckedAt(testCompetitor, new Date('2024-01-02'))
      );
      const snapshot2 = await repository.save(
        CompetitorSnapshotFixture.withCheckedAt(testCompetitor, new Date('2024-01-05'))
      );
      const snapshot3 = await repository.save(
        CompetitorSnapshotFixture.withCheckedAt(testCompetitor, new Date('2024-01-03'))
      );

      const found = await repository.findByCompetitorIdInDateRange(
        testCompetitor.id,
        new Date('2024-01-01'),
        new Date('2024-01-10')
      );

      expect(found[0].id).toBe(snapshot2.id); // 2024-01-05
      expect(found[1].id).toBe(snapshot3.id); // 2024-01-03
      expect(found[2].id).toBe(snapshot1.id); // 2024-01-02
    });

    it('should load competitor relations', async () => {
      await repository.save(
        CompetitorSnapshotFixture.withCheckedAt(testCompetitor, new Date('2024-01-05'))
      );

      const found = await repository.findByCompetitorIdInDateRange(
        testCompetitor.id,
        new Date('2024-01-01'),
        new Date('2024-01-10')
      );

      expect(found[0].competitor).toBeDefined();
      expect(found[0].competitor.id).toBe(testCompetitor.id);
    });
  });

  describe('findLatestByCompetitorId', () => {
    it('should find the most recent snapshot', async () => {
      const snapshot1 = await repository.save(
        CompetitorSnapshotFixture.withCheckedAt(testCompetitor, new Date('2024-01-01'))
      );
      const snapshot2 = await repository.save(
        CompetitorSnapshotFixture.withCheckedAt(testCompetitor, new Date('2024-01-05'))
      );
      const snapshot3 = await repository.save(
        CompetitorSnapshotFixture.withCheckedAt(testCompetitor, new Date('2024-01-03'))
      );

      const latest = await repository.findLatestByCompetitorId(testCompetitor.id);

      expect(latest).not.toBeNull();
      expect(latest!.id).toBe(snapshot2.id);
      expect(latest!.checkedAt).toEqual(new Date('2024-01-05'));
    });

    it('should return null when no snapshots exist', async () => {
      const latest = await repository.findLatestByCompetitorId(testCompetitor.id);
      expect(latest).toBeNull();
    });

    it('should return null for non-existent competitor', async () => {
      const latest = await repository.findLatestByCompetitorId('non-existent-id');
      expect(latest).toBeNull();
    });

    it('should load competitor relations', async () => {
      await repository.save(CompetitorSnapshotFixture.create(testCompetitor));

      const latest = await repository.findLatestByCompetitorId(testCompetitor.id);

      expect(latest!.competitor).toBeDefined();
      expect(latest!.competitor.id).toBe(testCompetitor.id);
    });
  });

  describe('update', () => {
    it('should update competitor snapshot', async () => {
      const snapshot = CompetitorSnapshotFixture.create(testCompetitor);
      const saved = await repository.save(snapshot);

      const updated = await repository.update(saved.id, {
        rank: 3,
        blogReviewCount: 200,
        visitorReviewCount: 500,
        averageRating: 4.5,
      });

      expect(updated.id).toBe(saved.id);
      expect(updated.rank).toBe(3);
      expect(updated.blogReviewCount).toBe(200);
      expect(updated.visitorReviewCount).toBe(500);
      expect(updated.averageRating).toBe(4.5);
    });

    it('should throw NotFoundError when snapshot does not exist', async () => {
      await expect(repository.update('non-existent-id', { rank: 1 }))
        .rejects
        .toThrow(NotFoundError);
    });
  });

  describe('delete', () => {
    it('should delete competitor snapshot', async () => {
      const snapshot = CompetitorSnapshotFixture.create(testCompetitor);
      const saved = await repository.save(snapshot);

      await repository.delete(saved.id);

      const found = await repository.findById(saved.id);
      expect(found).toBeNull();
    });

    it('should throw NotFoundError when deleting non-existent snapshot', async () => {
      await expect(repository.delete('non-existent-id'))
        .rejects
        .toThrow(NotFoundError);
    });
  });

  describe('exists', () => {
    it('should return true for existing snapshot', async () => {
      const snapshot = CompetitorSnapshotFixture.create(testCompetitor);
      const saved = await repository.save(snapshot);

      const exists = await repository.exists(saved.id);
      expect(exists).toBe(true);
    });

    it('should return false for non-existent snapshot', async () => {
      const exists = await repository.exists('non-existent-id');
      expect(exists).toBe(false);
    });
  });

  describe('count', () => {
    it('should return correct count of snapshots', async () => {
      const snapshots = CompetitorSnapshotFixture.createMany(testCompetitor, 3);
      await Promise.all(snapshots.map(s => repository.save(s)));

      const count = await repository.count();
      expect(count).toBe(3);
    });

    it('should return 0 when no snapshots exist', async () => {
      const count = await repository.count();
      expect(count).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple competitors separately', async () => {
      // Create another competitor
      const anotherCompetitor = CompetitorFixture.create(testPlace);
      await dataSource.getRepository(Competitor).save(anotherCompetitor);

      // Create snapshots for both
      const snapshot1 = await repository.save(CompetitorSnapshotFixture.create(testCompetitor));
      const snapshot2 = await repository.save(CompetitorSnapshotFixture.create(anotherCompetitor));

      const found1 = await repository.findByCompetitorId(testCompetitor.id);
      const found2 = await repository.findByCompetitorId(anotherCompetitor.id);

      expect(found1).toHaveLength(1);
      expect(found2).toHaveLength(1);
      expect(found1[0].id).toBe(snapshot1.id);
      expect(found2[0].id).toBe(snapshot2.id);
    });

    it('should handle snapshots with different metrics', async () => {
      const popular = await repository.save(CompetitorSnapshotFixture.popular(testCompetitor));
      const unpopular = await repository.save(CompetitorSnapshotFixture.unpopular(testCompetitor));

      const foundPopular = await repository.findById(popular.id);
      const foundUnpopular = await repository.findById(unpopular.id);

      expect(foundPopular!.rank).toBe(2);
      expect(foundPopular!.averageRating).toBe(4.7);
      expect(foundUnpopular!.rank).toBe(12);
      expect(foundUnpopular!.averageRating).toBe(3.5);
    });

    it('should handle time series data correctly', async () => {
      const snapshots = CompetitorSnapshotFixture.createMany(testCompetitor, 7);
      await Promise.all(snapshots.map(s => repository.save(s)));

      const all = await repository.findByCompetitorId(testCompetitor.id);
      const latest = await repository.findLatestByCompetitorId(testCompetitor.id);

      expect(all).toHaveLength(7);
      expect(latest!.id).toBe(all[0].id); // Latest should be first due to DESC order
    });

    it('should handle very high review counts', async () => {
      const snapshot = await repository.save(
        CompetitorSnapshotFixture.withMetrics(testCompetitor, 1, 5000, 10000, 4.9)
      );

      const found = await repository.findById(snapshot.id);
      expect(found!.blogReviewCount).toBe(5000);
      expect(found!.visitorReviewCount).toBe(10000);
    });

    it('should handle low review counts', async () => {
      const snapshot = await repository.save(
        CompetitorSnapshotFixture.withMetrics(testCompetitor, 20, 0, 0, 0)
      );

      const found = await repository.findById(snapshot.id);
      expect(found!.blogReviewCount).toBe(0);
      expect(found!.visitorReviewCount).toBe(0);
      expect(found!.averageRating).toBe(0);
    });

    it('should handle rating edge values', async () => {
      const snapshot1 = await repository.save(
        CompetitorSnapshotFixture.withMetrics(testCompetitor, 15, 10, 20, 1.0)
      );
      const snapshot2 = await repository.save(
        CompetitorSnapshotFixture.withMetrics(testCompetitor, 1, 100, 200, 5.0)
      );

      const found1 = await repository.findById(snapshot1.id);
      const found2 = await repository.findById(snapshot2.id);

      expect(found1!.averageRating).toBe(1.0);
      expect(found2!.averageRating).toBe(5.0);
    });
  });
});
