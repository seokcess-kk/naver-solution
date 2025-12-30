import { RecordCompetitorSnapshotUseCase } from '@application/usecases/tracking/competitor/RecordCompetitorSnapshotUseCase';
import { RecordCompetitorSnapshotDto } from '@application/dtos/tracking/competitor/RecordCompetitorSnapshotDto';
import { ICompetitorSnapshotRepository } from '@domain/repositories/ICompetitorSnapshotRepository';
import { ICompetitorRepository } from '@domain/repositories/ICompetitorRepository';
import { CompetitorSnapshot } from '@domain/entities/CompetitorSnapshot';
import { Competitor } from '@domain/entities/Competitor';
import { Place } from '@domain/entities/Place';
import { User } from '@domain/entities/User';
import { NotFoundError, BadRequestError } from '@application/errors/HttpError';
import { MockFactory } from '@tests/helpers/mock.helper';

describe('RecordCompetitorSnapshotUseCase', () => {
  let useCase: RecordCompetitorSnapshotUseCase;
  let mockSnapshotRepository: jest.Mocked<ICompetitorSnapshotRepository>;
  let mockCompetitorRepository: jest.Mocked<ICompetitorRepository>;

  beforeEach(() => {
    mockSnapshotRepository = MockFactory.createCompetitorSnapshotRepository();
    mockCompetitorRepository = MockFactory.createCompetitorRepository();
    useCase = new RecordCompetitorSnapshotUseCase(
      mockSnapshotRepository,
      mockCompetitorRepository
    );
  });

  describe('execute', () => {
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
      id: 'competitor-123',
      place: mockPlace,
      competitorNaverPlaceId: 'competitor-naver-456',
      competitorName: 'Competitor Restaurant',
      category: 'Japanese Restaurant',
      isActive: true,
      createdAt: new Date(),
      competitorSnapshots: [],
    };

    const validDto: RecordCompetitorSnapshotDto = {
      competitorId: 'competitor-123',
      rank: 5,
      blogReviewCount: 25,
      visitorReviewCount: 40,
      averageRating: 4.3,
      checkedAt: new Date('2024-01-15'),
    };

    const mockSnapshot: CompetitorSnapshot = {
      id: 'snapshot-123',
      competitor: mockCompetitor,
      rank: 5,
      blogReviewCount: 25,
      visitorReviewCount: 40,
      averageRating: 4.3,
      checkedAt: new Date('2024-01-15'),
      createdAt: new Date(),
    };

    describe('Happy Path', () => {
      beforeEach(() => {
        mockCompetitorRepository.findById.mockResolvedValue(mockCompetitor);
        mockSnapshotRepository.save.mockResolvedValue(mockSnapshot);
      });

      it('should successfully record snapshot with valid data', async () => {
        const result = await useCase.execute(validDto);

        expect(result).toBeDefined();
        expect(result.id).toBe(mockSnapshot.id);
        expect(result.competitorId).toBe(mockCompetitor.id);
        expect(result.rank).toBe(validDto.rank);
        expect(result.blogReviewCount).toBe(validDto.blogReviewCount);
        expect(result.visitorReviewCount).toBe(validDto.visitorReviewCount);
        expect(result.averageRating).toBe(validDto.averageRating);
        expect(result.checkedAt).toEqual(validDto.checkedAt);
      });

      it('should validate Competitor exists', async () => {
        await useCase.execute(validDto);

        expect(mockCompetitorRepository.findById).toHaveBeenCalledWith(validDto.competitorId);
      });

      it('should save CompetitorSnapshot with correct data', async () => {
        await useCase.execute(validDto);

        expect(mockSnapshotRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            competitor: mockCompetitor,
            rank: validDto.rank,
            blogReviewCount: validDto.blogReviewCount,
            visitorReviewCount: validDto.visitorReviewCount,
            averageRating: validDto.averageRating,
            checkedAt: validDto.checkedAt,
          })
        );
      });

      it('should return CompetitorSnapshotResponseDto with computed fields', async () => {
        const result = await useCase.execute(validDto);

        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('competitorId');
        expect(result).toHaveProperty('rank');
        expect(result).toHaveProperty('blogReviewCount');
        expect(result).toHaveProperty('visitorReviewCount');
        expect(result).toHaveProperty('averageRating');
        expect(result).toHaveProperty('checkedAt');
        expect(result).toHaveProperty('createdAt');
        expect(result).toHaveProperty('totalReviewCount');
      });

      it('should calculate totalReviewCount correctly', async () => {
        const result = await useCase.execute(validDto);

        expect(result.totalReviewCount).toBe(65); // 25 + 40
      });

      it('should include competitor relation data', async () => {
        const result = await useCase.execute(validDto);

        expect(result).toHaveProperty('competitorName');
        expect(result).toHaveProperty('category');
        expect(result.competitorName).toBe(mockCompetitor.competitorName);
        expect(result.category).toBe(mockCompetitor.category);
      });
    });

    describe('Error Cases - Validation', () => {
      it('should throw NotFoundError when Competitor does not exist', async () => {
        mockCompetitorRepository.findById.mockResolvedValue(null);

        await expect(useCase.execute(validDto)).rejects.toThrow(NotFoundError);
        await expect(useCase.execute(validDto)).rejects.toThrow(
          `Competitor with id ${validDto.competitorId} not found`
        );
      });

      it('should throw BadRequestError when Competitor is inactive', async () => {
        const inactiveCompetitor = { ...mockCompetitor, isActive: false };
        mockCompetitorRepository.findById.mockResolvedValue(inactiveCompetitor);

        await expect(useCase.execute(validDto)).rejects.toThrow(BadRequestError);
        await expect(useCase.execute(validDto)).rejects.toThrow(
          `Cannot record snapshot for inactive competitor ${validDto.competitorId}`
        );
      });
    });

    describe('Error Cases - Repository Errors', () => {
      it('should propagate repository errors when finding Competitor', async () => {
        const error = new Error('Database connection failed');
        mockCompetitorRepository.findById.mockRejectedValue(error);

        await expect(useCase.execute(validDto)).rejects.toThrow(error);
      });

      it('should propagate repository errors when saving snapshot', async () => {
        mockCompetitorRepository.findById.mockResolvedValue(mockCompetitor);
        const error = new Error('Failed to save snapshot');
        mockSnapshotRepository.save.mockRejectedValue(error);

        await expect(useCase.execute(validDto)).rejects.toThrow(error);
      });
    });

    describe('Null Fields', () => {
      beforeEach(() => {
        mockCompetitorRepository.findById.mockResolvedValue(mockCompetitor);
      });

      it('should handle snapshot with null rank', async () => {
        const dtoWithNullRank: RecordCompetitorSnapshotDto = {
          ...validDto,
          rank: null,
        };
        const snapshotWithNullRank = { ...mockSnapshot, rank: null };
        mockSnapshotRepository.save.mockResolvedValue(snapshotWithNullRank);

        const result = await useCase.execute(dtoWithNullRank);

        expect(result.rank).toBeNull();
      });

      it('should handle snapshot with null blogReviewCount', async () => {
        const dtoWithNullBlog: RecordCompetitorSnapshotDto = {
          ...validDto,
          blogReviewCount: null,
        };
        const snapshotWithNullBlog = { ...mockSnapshot, blogReviewCount: null };
        mockSnapshotRepository.save.mockResolvedValue(snapshotWithNullBlog);

        const result = await useCase.execute(dtoWithNullBlog);

        expect(result.blogReviewCount).toBeNull();
      });

      it('should handle snapshot with null visitorReviewCount', async () => {
        const dtoWithNullVisitor: RecordCompetitorSnapshotDto = {
          ...validDto,
          visitorReviewCount: null,
        };
        const snapshotWithNullVisitor = { ...mockSnapshot, visitorReviewCount: null };
        mockSnapshotRepository.save.mockResolvedValue(snapshotWithNullVisitor);

        const result = await useCase.execute(dtoWithNullVisitor);

        expect(result.visitorReviewCount).toBeNull();
      });

      it('should handle snapshot with null averageRating', async () => {
        const dtoWithNullRating: RecordCompetitorSnapshotDto = {
          ...validDto,
          averageRating: null,
        };
        const snapshotWithNullRating = { ...mockSnapshot, averageRating: null };
        mockSnapshotRepository.save.mockResolvedValue(snapshotWithNullRating);

        const result = await useCase.execute(dtoWithNullRating);

        expect(result.averageRating).toBeNull();
      });

      it('should not calculate totalReviewCount when blogReviewCount is null', async () => {
        const dtoWithNullBlog: RecordCompetitorSnapshotDto = {
          ...validDto,
          blogReviewCount: null,
          visitorReviewCount: 40,
        };
        const snapshotWithNullBlog = {
          ...mockSnapshot,
          blogReviewCount: null,
          visitorReviewCount: 40,
        };
        mockSnapshotRepository.save.mockResolvedValue(snapshotWithNullBlog);

        const result = await useCase.execute(dtoWithNullBlog);

        expect(result.totalReviewCount).toBeUndefined();
      });

      it('should not calculate totalReviewCount when visitorReviewCount is null', async () => {
        const dtoWithNullVisitor: RecordCompetitorSnapshotDto = {
          ...validDto,
          blogReviewCount: 25,
          visitorReviewCount: null,
        };
        const snapshotWithNullVisitor = {
          ...mockSnapshot,
          blogReviewCount: 25,
          visitorReviewCount: null,
        };
        mockSnapshotRepository.save.mockResolvedValue(snapshotWithNullVisitor);

        const result = await useCase.execute(dtoWithNullVisitor);

        expect(result.totalReviewCount).toBeUndefined();
      });
    });

    describe('Boundary Conditions', () => {
      beforeEach(() => {
        mockCompetitorRepository.findById.mockResolvedValue(mockCompetitor);
        mockSnapshotRepository.save.mockResolvedValue(mockSnapshot);
      });

      it('should handle minimum rank (1)', async () => {
        const dtoWithMinRank: RecordCompetitorSnapshotDto = {
          ...validDto,
          rank: 1,
        };

        await useCase.execute(dtoWithMinRank);

        expect(mockSnapshotRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            rank: 1,
          })
        );
      });

      it('should handle very high rank', async () => {
        const dtoWithHighRank: RecordCompetitorSnapshotDto = {
          ...validDto,
          rank: 9999,
        };

        await useCase.execute(dtoWithHighRank);

        expect(mockSnapshotRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            rank: 9999,
          })
        );
      });

      it('should handle zero review counts', async () => {
        const dtoWithZeroCounts: RecordCompetitorSnapshotDto = {
          ...validDto,
          blogReviewCount: 0,
          visitorReviewCount: 0,
        };

        await useCase.execute(dtoWithZeroCounts);

        expect(mockSnapshotRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            blogReviewCount: 0,
            visitorReviewCount: 0,
          })
        );
      });

      it('should handle minimum rating (0)', async () => {
        const dtoWithMinRating: RecordCompetitorSnapshotDto = {
          ...validDto,
          averageRating: 0,
        };

        await useCase.execute(dtoWithMinRating);

        expect(mockSnapshotRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            averageRating: 0,
          })
        );
      });

      it('should handle maximum rating (5)', async () => {
        const dtoWithMaxRating: RecordCompetitorSnapshotDto = {
          ...validDto,
          averageRating: 5,
        };

        await useCase.execute(dtoWithMaxRating);

        expect(mockSnapshotRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            averageRating: 5,
          })
        );
      });

      it('should handle large review counts', async () => {
        const dtoWithLargeCounts: RecordCompetitorSnapshotDto = {
          ...validDto,
          blogReviewCount: 9999,
          visitorReviewCount: 8888,
        };

        await useCase.execute(dtoWithLargeCounts);

        expect(mockSnapshotRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            blogReviewCount: 9999,
            visitorReviewCount: 8888,
          })
        );
      });

      it('should handle different Competitor ID formats', async () => {
        const uuidCompetitorId = '550e8400-e29b-41d4-a716-446655440000';
        const dtoWithUuid: RecordCompetitorSnapshotDto = {
          ...validDto,
          competitorId: uuidCompetitorId,
        };

        await useCase.execute(dtoWithUuid);

        expect(mockCompetitorRepository.findById).toHaveBeenCalledWith(uuidCompetitorId);
      });

      it('should handle decimal average rating', async () => {
        const dtoWithDecimalRating: RecordCompetitorSnapshotDto = {
          ...validDto,
          averageRating: 4.7,
        };

        await useCase.execute(dtoWithDecimalRating);

        expect(mockSnapshotRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            averageRating: 4.7,
          })
        );
      });
    });

    describe('Method Call Order', () => {
      beforeEach(() => {
        mockCompetitorRepository.findById.mockResolvedValue(mockCompetitor);
        mockSnapshotRepository.save.mockResolvedValue(mockSnapshot);
      });

      it('should validate Competitor before saving', async () => {
        await useCase.execute(validDto);

        const findCompetitorCall = mockCompetitorRepository.findById.mock.invocationCallOrder[0];
        const saveCall = mockSnapshotRepository.save.mock.invocationCallOrder[0];

        expect(findCompetitorCall).toBeLessThan(saveCall);
      });

      it('should not save if Competitor not found', async () => {
        mockCompetitorRepository.findById.mockResolvedValue(null);

        await expect(useCase.execute(validDto)).rejects.toThrow();

        expect(mockSnapshotRepository.save).not.toHaveBeenCalled();
      });

      it('should not save if Competitor is inactive', async () => {
        const inactiveCompetitor = { ...mockCompetitor, isActive: false };
        mockCompetitorRepository.findById.mockResolvedValue(inactiveCompetitor);

        await expect(useCase.execute(validDto)).rejects.toThrow();

        expect(mockSnapshotRepository.save).not.toHaveBeenCalled();
      });
    });

    describe('Response DTO Mapping', () => {
      beforeEach(() => {
        mockCompetitorRepository.findById.mockResolvedValue(mockCompetitor);
        mockSnapshotRepository.save.mockResolvedValue(mockSnapshot);
      });

      it('should include all CompetitorSnapshot fields in response', async () => {
        const result = await useCase.execute(validDto);

        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('competitorId');
        expect(result).toHaveProperty('rank');
        expect(result).toHaveProperty('blogReviewCount');
        expect(result).toHaveProperty('visitorReviewCount');
        expect(result).toHaveProperty('averageRating');
        expect(result).toHaveProperty('checkedAt');
        expect(result).toHaveProperty('createdAt');
      });

      it('should map competitorId correctly', async () => {
        const result = await useCase.execute(validDto);

        expect(result.competitorId).toBe(mockCompetitor.id);
      });

      it('should include totalReviewCount when both counts are non-null', async () => {
        const result = await useCase.execute(validDto);

        expect(result.totalReviewCount).toBeDefined();
        expect(result.totalReviewCount).toBe(65); // 25 + 40
      });
    });
  });
});
