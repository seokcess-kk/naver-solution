import { GetPlaceUseCase } from '@application/usecases/place/GetPlaceUseCase';
import { IPlaceRepository } from '@domain/repositories/IPlaceRepository';
import { Place } from '@domain/entities/Place';
import { User } from '@domain/entities/User';
import { NotFoundError } from '@application/errors/HttpError';
import { MockFactory } from '@tests/helpers/mock.helper';

describe('GetPlaceUseCase', () => {
  let useCase: GetPlaceUseCase;
  let mockPlaceRepository: jest.Mocked<IPlaceRepository>;

  beforeEach(() => {
    mockPlaceRepository = MockFactory.createPlaceRepository();
    useCase = new GetPlaceUseCase(mockPlaceRepository);
  });

  describe('execute', () => {
    const placeId = 'place-123';

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
      id: placeId,
      user: mockUser,
      naverPlaceId: 'naver-place-123',
      name: 'Test Restaurant',
      category: 'Korean Restaurant',
      address: 'Seoul, Korea',
      naverPlaceUrl: 'https://naver.com/place/123',
      isActive: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
      placeKeywords: [],
      reviews: [],
      reviewHistories: [],
      competitors: [],
      notificationSettings: [],
      notificationLogs: [],
    };

    describe('Happy Path', () => {
      beforeEach(() => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
      });

      it('should return place for valid ID', async () => {
        const result = await useCase.execute(placeId);

        expect(result).toBeDefined();
        expect(result.id).toBe(mockPlace.id);
        expect(result.naverPlaceId).toBe(mockPlace.naverPlaceId);
        expect(result.name).toBe(mockPlace.name);
        expect(result.category).toBe(mockPlace.category);
        expect(result.address).toBe(mockPlace.address);
        expect(result.naverPlaceUrl).toBe(mockPlace.naverPlaceUrl);
        expect(result.isActive).toBe(mockPlace.isActive);
      });

      it('should call repository with correct place ID', async () => {
        await useCase.execute(placeId);

        expect(mockPlaceRepository.findById).toHaveBeenCalledWith(placeId);
        expect(mockPlaceRepository.findById).toHaveBeenCalledTimes(1);
      });

      it('should return PlaceResponseDto', async () => {
        const result = await useCase.execute(placeId);

        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('naverPlaceId');
        expect(result).toHaveProperty('name');
        expect(result).toHaveProperty('isActive');
        expect(result).toHaveProperty('createdAt');
        expect(result).toHaveProperty('updatedAt');
      });

      it('should not include relations by default', async () => {
        const result = await useCase.execute(placeId);

        expect(result).not.toHaveProperty('userId');
        expect(result).not.toHaveProperty('keywordCount');
        expect(result).not.toHaveProperty('reviewCount');
      });

      it('should include relations when requested', async () => {
        const placeWithRelations = {
          ...mockPlace,
          placeKeywords: [{}, {}, {}] as any,
          reviews: [{}, {}] as any,
        };
        mockPlaceRepository.findById.mockResolvedValue(placeWithRelations);

        const result = await useCase.execute(placeId, true);

        expect(result.userId).toBe(mockUser.id);
        expect(result.keywordCount).toBe(3);
        expect(result.reviewCount).toBe(2);
      });
    });

    describe('Error Cases', () => {
      it('should throw NotFoundError when place does not exist', async () => {
        mockPlaceRepository.findById.mockResolvedValue(null);

        await expect(useCase.execute(placeId)).rejects.toThrow(NotFoundError);
        await expect(useCase.execute(placeId)).rejects.toThrow(
          `Place with id ${placeId} not found`
        );
      });

      it('should propagate repository errors', async () => {
        const error = new Error('Database connection failed');
        mockPlaceRepository.findById.mockRejectedValue(error);

        await expect(useCase.execute(placeId)).rejects.toThrow(error);
      });
    });

    describe('Boundary Conditions', () => {
      beforeEach(() => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
      });

      it('should handle place with null optional fields', async () => {
        const placeWithNulls = {
          ...mockPlace,
          category: null,
          address: null,
        };
        mockPlaceRepository.findById.mockResolvedValue(placeWithNulls);

        const result = await useCase.execute(placeId);

        expect(result.category).toBeNull();
        expect(result.address).toBeNull();
      });

      it('should handle different place ID formats', async () => {
        const uuidPlaceId = '550e8400-e29b-41d4-a716-446655440000';
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);

        await useCase.execute(uuidPlaceId);

        expect(mockPlaceRepository.findById).toHaveBeenCalledWith(uuidPlaceId);
      });

      it('should handle place with inactive status', async () => {
        const inactivePlace = { ...mockPlace, isActive: false };
        mockPlaceRepository.findById.mockResolvedValue(inactivePlace);

        const result = await useCase.execute(placeId);

        expect(result.isActive).toBe(false);
      });

      it('should handle place with very long name', async () => {
        const longName = 'A'.repeat(200);
        const placeWithLongName = { ...mockPlace, name: longName };
        mockPlaceRepository.findById.mockResolvedValue(placeWithLongName);

        const result = await useCase.execute(placeId);

        expect(result.name).toBe(longName);
      });

      it('should handle includeRelations=false explicitly', async () => {
        const result = await useCase.execute(placeId, false);

        expect(result).not.toHaveProperty('userId');
        expect(result).not.toHaveProperty('keywordCount');
        expect(result).not.toHaveProperty('reviewCount');
      });
    });

    describe('Relations Handling', () => {
      it('should include userId when includeRelations is true and user exists', async () => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);

        const result = await useCase.execute(placeId, true);

        expect(result.userId).toBe(mockUser.id);
      });

      it('should include keywordCount when includeRelations is true', async () => {
        const placeWithKeywords = {
          ...mockPlace,
          placeKeywords: [{}, {}, {}, {}] as any,
        };
        mockPlaceRepository.findById.mockResolvedValue(placeWithKeywords);

        const result = await useCase.execute(placeId, true);

        expect(result.keywordCount).toBe(4);
      });

      it('should include reviewCount when includeRelations is true', async () => {
        const placeWithReviews = {
          ...mockPlace,
          reviews: [{}, {}, {}] as any,
        };
        mockPlaceRepository.findById.mockResolvedValue(placeWithReviews);

        const result = await useCase.execute(placeId, true);

        expect(result.reviewCount).toBe(3);
      });

      it('should handle zero counts for relations', async () => {
        const placeWithEmptyRelations = {
          ...mockPlace,
          placeKeywords: [],
          reviews: [],
        };
        mockPlaceRepository.findById.mockResolvedValue(placeWithEmptyRelations);

        const result = await useCase.execute(placeId, true);

        expect(result.keywordCount).toBe(0);
        expect(result.reviewCount).toBe(0);
      });
    });
  });
});
