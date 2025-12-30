import { GetCompetitorHistoryUseCase } from '@application/usecases/tracking/competitor/GetCompetitorHistoryUseCase';
import { GetCompetitorHistoryDto } from '@application/dtos/tracking/competitor/GetCompetitorHistoryDto';
import { ICompetitorSnapshotRepository } from '@domain/repositories/ICompetitorSnapshotRepository';
import { ICompetitorRepository } from '@domain/repositories/ICompetitorRepository';
import { CompetitorSnapshot } from '@domain/entities/CompetitorSnapshot';
import { Competitor } from '@domain/entities/Competitor';
import { Place } from '@domain/entities/Place';
import { User } from '@domain/entities/User';
import { NotFoundError } from '@application/errors/HttpError';
import { MockFactory } from '@tests/helpers/mock.helper';

describe('GetCompetitorHistoryUseCase', () => {
  let useCase: GetCompetitorHistoryUseCase;
  let mockSnapshotRepository: jest.Mocked<ICompetitorSnapshotRepository>;
  let mockCompetitorRepository: jest.Mocked<ICompetitorRepository>;

  beforeEach(() => {
    mockSnapshotRepository = MockFactory.createCompetitorSnapshotRepository();
    mockCompetitorRepository = MockFactory.createCompetitorRepository();
    useCase = new GetCompetitorHistoryUseCase(mockSnapshotRepository, mockCompetitorRepository);
  });

  describe('execute', () => {
    const competitorId = 'competitor-123';

    const mockUser: User = {
      id: 'user-123',
      email: 'test@example.com',
      passwordHash: 'hashedPassword',
      name: 'Test User',
      createdAt: new Date(),
      updatedAt: new Date(),
      places: [],
      notificationSettings: [],
      refreshTokens: [],
    };

    const mockPlace: Place = {
      id: 'place-123',
      user: mockUser,
      naverPlaceId: 'naver-123',
      name: 'Test Restaurant',
      category: 'Korean Restaurant',
      address: 'Seoul, Korea',
      naverPlaceUrl: 'https://naver.com/place/123',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      placeKeywords: [],
      reviews: [],
      reviewHistories: [],
      competitors: [],
      notificationSettings: [],
      notificationLogs: [],
    };

    const mockCompetitor: Competitor = {
      id: competitorId,
      place: mockPlace,
      competitorNaverPlaceId: 'competitor-naver-456',
      competitorName: 'Competitor Restaurant',
      category: 'Japanese Restaurant',
      isActive: true,
      createdAt: new Date(),
      competitorSnapshots: [],
    };

    const createMockSnapshot = (
      id: string,
      rank: number | null,
      blogCount: number | null,
      visitorCount: number | null,
      checkedAt: Date
    ): CompetitorSnapshot => ({
      id,
      competitor: mockCompetitor,
      rank,
      blogReviewCount: blogCount,
      visitorReviewCount: visitorCount,
      averageRating: 4.5,
      checkedAt,
      createdAt: new Date(),
    });

    const mockSnapshots: CompetitorSnapshot[] = [
      createMockSnapshot('cs-1', 5, 10, 20, new Date('2024-01-15')),
      createMockSnapshot('cs-2', 4, 12, 22, new Date('2024-01-16')),
      createMockSnapshot('cs-3', 3, 15, 25, new Date('2024-01-17')),
    ];

    describe('Happy Path - Date Range Query', () => {
      const startDate = new Date('2024-01-15');
      const endDate = new Date('2024-01-17');

      beforeEach(() => {
        mockCompetitorRepository.findById.mockResolvedValue(mockCompetitor);
        mockSnapshotRepository.findByCompetitorIdInDateRange.mockResolvedValue(mockSnapshots);
      });

      it('should return snapshots within date range', async () => {
        const dto: GetCompetitorHistoryDto = { competitorId, startDate, endDate };
        const result = await useCase.execute(dto);

        expect(result).toHaveLength(3);
        expect(result[0].id).toBe('cs-1');
        expect(result[1].id).toBe('cs-2');
        expect(result[2].id).toBe('cs-3');
      });

      it('should call repository with correct date range', async () => {
        const dto: GetCompetitorHistoryDto = { competitorId, startDate, endDate };
        await useCase.execute(dto);

        expect(mockSnapshotRepository.findByCompetitorIdInDateRange).toHaveBeenCalledWith(
          competitorId,
          startDate,
          endDate
        );
      });

      it('should validate Competitor exists', async () => {
        const dto: GetCompetitorHistoryDto = { competitorId, startDate, endDate };
        await useCase.execute(dto);

        expect(mockCompetitorRepository.findById).toHaveBeenCalledWith(competitorId);
      });

      it('should not call limit-based query when date range provided', async () => {
        const dto: GetCompetitorHistoryDto = { competitorId, startDate, endDate, limit: 50 };
        await useCase.execute(dto);

        expect(mockSnapshotRepository.findByCompetitorId).not.toHaveBeenCalled();
      });
    });

    describe('Happy Path - Limit Query', () => {
      beforeEach(() => {
        mockCompetitorRepository.findById.mockResolvedValue(mockCompetitor);
        mockSnapshotRepository.findByCompetitorId.mockResolvedValue(mockSnapshots);
      });

      it('should return snapshots with custom limit', async () => {
        const dto: GetCompetitorHistoryDto = { competitorId, limit: 50 };
        const result = await useCase.execute(dto);

        expect(result).toHaveLength(3);
        expect(mockSnapshotRepository.findByCompetitorId).toHaveBeenCalledWith(competitorId, 50);
      });

      it('should use default limit of 100 when not provided', async () => {
        const dto: GetCompetitorHistoryDto = { competitorId };
        await useCase.execute(dto);

        expect(mockSnapshotRepository.findByCompetitorId).toHaveBeenCalledWith(competitorId, 100);
      });

      it('should not call date range query when dates not provided', async () => {
        const dto: GetCompetitorHistoryDto = { competitorId, limit: 50 };
        await useCase.execute(dto);

        expect(mockSnapshotRepository.findByCompetitorIdInDateRange).not.toHaveBeenCalled();
      });
    });

    describe('Response DTO', () => {
      beforeEach(() => {
        mockCompetitorRepository.findById.mockResolvedValue(mockCompetitor);
        mockSnapshotRepository.findByCompetitorId.mockResolvedValue(mockSnapshots);
      });

      it('should return CompetitorSnapshotResponseDto array', async () => {
        const dto: GetCompetitorHistoryDto = { competitorId };
        const result = await useCase.execute(dto);

        expect(result[0]).toHaveProperty('id');
        expect(result[0]).toHaveProperty('competitorId');
        expect(result[0]).toHaveProperty('rank');
        expect(result[0]).toHaveProperty('blogReviewCount');
        expect(result[0]).toHaveProperty('visitorReviewCount');
        expect(result[0]).toHaveProperty('averageRating');
        expect(result[0]).toHaveProperty('checkedAt');
        expect(result[0]).toHaveProperty('createdAt');
      });

      it('should include totalReviewCount computed field', async () => {
        const dto: GetCompetitorHistoryDto = { competitorId };
        const result = await useCase.execute(dto);

        expect(result[0]).toHaveProperty('totalReviewCount');
        expect(result[0].totalReviewCount).toBe(30); // 10 + 20
        expect(result[1].totalReviewCount).toBe(34); // 12 + 22
        expect(result[2].totalReviewCount).toBe(40); // 15 + 25
      });

      it('should include competitor relation data', async () => {
        const dto: GetCompetitorHistoryDto = { competitorId };
        const result = await useCase.execute(dto);

        expect(result[0]).toHaveProperty('competitorName');
        expect(result[0]).toHaveProperty('category');
        expect(result[0].competitorName).toBe(mockCompetitor.competitorName);
        expect(result[0].category).toBe(mockCompetitor.category);
      });
    });

    describe('Empty Results', () => {
      beforeEach(() => {
        mockCompetitorRepository.findById.mockResolvedValue(mockCompetitor);
      });

      it('should return empty array when no snapshots in date range', async () => {
        const dto: GetCompetitorHistoryDto = {
          competitorId,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-14'),
        };
        mockSnapshotRepository.findByCompetitorIdInDateRange.mockResolvedValue([]);

        const result = await useCase.execute(dto);

        expect(result).toEqual([]);
      });

      it('should return empty array when no snapshots exist', async () => {
        const dto: GetCompetitorHistoryDto = { competitorId };
        mockSnapshotRepository.findByCompetitorId.mockResolvedValue([]);

        const result = await useCase.execute(dto);

        expect(result).toEqual([]);
      });
    });

    describe('Error Cases', () => {
      it('should throw NotFoundError when Competitor does not exist', async () => {
        mockCompetitorRepository.findById.mockResolvedValue(null);
        const dto: GetCompetitorHistoryDto = { competitorId };

        await expect(useCase.execute(dto)).rejects.toThrow(NotFoundError);
        await expect(useCase.execute(dto)).rejects.toThrow(
          `Competitor with id ${competitorId} not found`
        );
      });

      it('should propagate repository errors when finding Competitor', async () => {
        const error = new Error('Database connection failed');
        mockCompetitorRepository.findById.mockRejectedValue(error);
        const dto: GetCompetitorHistoryDto = { competitorId };

        await expect(useCase.execute(dto)).rejects.toThrow(error);
      });

      it('should propagate repository errors when finding snapshots by date range', async () => {
        mockCompetitorRepository.findById.mockResolvedValue(mockCompetitor);
        const error = new Error('Failed to fetch snapshots');
        mockSnapshotRepository.findByCompetitorIdInDateRange.mockRejectedValue(error);
        const dto: GetCompetitorHistoryDto = {
          competitorId,
          startDate: new Date('2024-01-15'),
          endDate: new Date('2024-01-17'),
        };

        await expect(useCase.execute(dto)).rejects.toThrow(error);
      });

      it('should propagate repository errors when finding snapshots by limit', async () => {
        mockCompetitorRepository.findById.mockResolvedValue(mockCompetitor);
        const error = new Error('Failed to fetch snapshots');
        mockSnapshotRepository.findByCompetitorId.mockRejectedValue(error);
        const dto: GetCompetitorHistoryDto = { competitorId };

        await expect(useCase.execute(dto)).rejects.toThrow(error);
      });
    });

    describe('Filter Priority', () => {
      beforeEach(() => {
        mockCompetitorRepository.findById.mockResolvedValue(mockCompetitor);
        mockSnapshotRepository.findByCompetitorIdInDateRange.mockResolvedValue(mockSnapshots);
        mockSnapshotRepository.findByCompetitorId.mockResolvedValue(mockSnapshots);
      });

      it('should prefer date range query over limit when both provided', async () => {
        const dto: GetCompetitorHistoryDto = {
          competitorId,
          startDate: new Date('2024-01-15'),
          endDate: new Date('2024-01-17'),
          limit: 50,
        };

        await useCase.execute(dto);

        expect(mockSnapshotRepository.findByCompetitorIdInDateRange).toHaveBeenCalled();
        expect(mockSnapshotRepository.findByCompetitorId).not.toHaveBeenCalled();
      });

      it('should use limit query when only startDate provided', async () => {
        const dto: GetCompetitorHistoryDto = {
          competitorId,
          startDate: new Date('2024-01-15'),
        };

        await useCase.execute(dto);

        expect(mockSnapshotRepository.findByCompetitorId).toHaveBeenCalled();
        expect(mockSnapshotRepository.findByCompetitorIdInDateRange).not.toHaveBeenCalled();
      });

      it('should use limit query when only endDate provided', async () => {
        const dto: GetCompetitorHistoryDto = {
          competitorId,
          endDate: new Date('2024-01-17'),
        };

        await useCase.execute(dto);

        expect(mockSnapshotRepository.findByCompetitorId).toHaveBeenCalled();
        expect(mockSnapshotRepository.findByCompetitorIdInDateRange).not.toHaveBeenCalled();
      });
    });

    describe('Boundary Conditions', () => {
      beforeEach(() => {
        mockCompetitorRepository.findById.mockResolvedValue(mockCompetitor);
      });

      it('should handle minimum limit (1)', async () => {
        mockSnapshotRepository.findByCompetitorId.mockResolvedValue([mockSnapshots[0]]);
        const dto: GetCompetitorHistoryDto = { competitorId, limit: 1 };

        await useCase.execute(dto);

        expect(mockSnapshotRepository.findByCompetitorId).toHaveBeenCalledWith(competitorId, 1);
      });

      it('should handle maximum limit (1000)', async () => {
        mockSnapshotRepository.findByCompetitorId.mockResolvedValue(mockSnapshots);
        const dto: GetCompetitorHistoryDto = { competitorId, limit: 1000 };

        await useCase.execute(dto);

        expect(mockSnapshotRepository.findByCompetitorId).toHaveBeenCalledWith(competitorId, 1000);
      });

      it('should handle large number of snapshots', async () => {
        const manySnapshots = Array.from({ length: 1000 }, (_, i) =>
          createMockSnapshot(`cs-${i}`, i + 1, 10, 20, new Date(`2024-01-${(i % 28) + 1}`))
        );
        mockSnapshotRepository.findByCompetitorId.mockResolvedValue(manySnapshots);
        const dto: GetCompetitorHistoryDto = { competitorId };

        const result = await useCase.execute(dto);

        expect(result).toHaveLength(1000);
      });

      it('should handle same start and end date', async () => {
        const sameDate = new Date('2024-01-15');
        mockSnapshotRepository.findByCompetitorIdInDateRange.mockResolvedValue([mockSnapshots[0]]);
        const dto: GetCompetitorHistoryDto = {
          competitorId,
          startDate: sameDate,
          endDate: sameDate,
        };

        await useCase.execute(dto);

        expect(mockSnapshotRepository.findByCompetitorIdInDateRange).toHaveBeenCalledWith(
          competitorId,
          sameDate,
          sameDate
        );
      });

      it('should handle different Competitor ID formats', async () => {
        const uuidCompetitorId = '550e8400-e29b-41d4-a716-446655440000';
        mockSnapshotRepository.findByCompetitorId.mockResolvedValue([]);
        const dto: GetCompetitorHistoryDto = { competitorId: uuidCompetitorId };

        await useCase.execute(dto);

        expect(mockCompetitorRepository.findById).toHaveBeenCalledWith(uuidCompetitorId);
      });

      it('should handle snapshots with null rank', async () => {
        const snapshotsWithNullRank = [
          createMockSnapshot('cs-1', null, 10, 20, new Date('2024-01-15')),
          createMockSnapshot('cs-2', null, 12, 22, new Date('2024-01-16')),
        ];
        mockSnapshotRepository.findByCompetitorId.mockResolvedValue(snapshotsWithNullRank);
        const dto: GetCompetitorHistoryDto = { competitorId };

        const result = await useCase.execute(dto);

        expect(result[0].rank).toBeNull();
        expect(result[1].rank).toBeNull();
      });

      it('should handle snapshots with null averageRating', async () => {
        const snapshotsWithNullRating = mockSnapshots.map((s) => ({ ...s, averageRating: null }));
        mockSnapshotRepository.findByCompetitorId.mockResolvedValue(snapshotsWithNullRating);
        const dto: GetCompetitorHistoryDto = { competitorId };

        const result = await useCase.execute(dto);

        expect(result[0].averageRating).toBeNull();
        expect(result[1].averageRating).toBeNull();
        expect(result[2].averageRating).toBeNull();
      });

      it('should not calculate totalReviewCount when review counts are null', async () => {
        const snapshotsWithNullCounts = [
          createMockSnapshot('cs-1', 5, null, null, new Date('2024-01-15')),
          createMockSnapshot('cs-2', 4, null, 22, new Date('2024-01-16')),
          createMockSnapshot('cs-3', 3, 15, null, new Date('2024-01-17')),
        ];
        mockSnapshotRepository.findByCompetitorId.mockResolvedValue(snapshotsWithNullCounts);
        const dto: GetCompetitorHistoryDto = { competitorId };

        const result = await useCase.execute(dto);

        expect(result[0].totalReviewCount).toBeUndefined(); // both null
        expect(result[1].totalReviewCount).toBeUndefined(); // blog null
        expect(result[2].totalReviewCount).toBeUndefined(); // visitor null
      });
    });

    describe('Method Call Order', () => {
      beforeEach(() => {
        mockCompetitorRepository.findById.mockResolvedValue(mockCompetitor);
        mockSnapshotRepository.findByCompetitorId.mockResolvedValue(mockSnapshots);
      });

      it('should validate Competitor before fetching snapshots', async () => {
        const dto: GetCompetitorHistoryDto = { competitorId };
        await useCase.execute(dto);

        const findCompetitorCall = mockCompetitorRepository.findById.mock.invocationCallOrder[0];
        const findSnapshotsCall =
          mockSnapshotRepository.findByCompetitorId.mock.invocationCallOrder[0];

        expect(findCompetitorCall).toBeLessThan(findSnapshotsCall);
      });

      it('should not fetch snapshots if Competitor not found', async () => {
        mockCompetitorRepository.findById.mockResolvedValue(null);
        const dto: GetCompetitorHistoryDto = { competitorId };

        await expect(useCase.execute(dto)).rejects.toThrow();

        expect(mockSnapshotRepository.findByCompetitorId).not.toHaveBeenCalled();
        expect(mockSnapshotRepository.findByCompetitorIdInDateRange).not.toHaveBeenCalled();
      });
    });

    describe('Inactive Competitor', () => {
      it('should return snapshots even for inactive Competitor', async () => {
        const inactiveCompetitor = { ...mockCompetitor, isActive: false };
        mockCompetitorRepository.findById.mockResolvedValue(inactiveCompetitor);
        mockSnapshotRepository.findByCompetitorId.mockResolvedValue(mockSnapshots);
        const dto: GetCompetitorHistoryDto = { competitorId };

        const result = await useCase.execute(dto);

        expect(result).toBeDefined();
        expect(result).toHaveLength(3);
      });
    });
  });
});
