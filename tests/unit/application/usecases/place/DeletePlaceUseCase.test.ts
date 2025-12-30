import { DeletePlaceUseCase } from '@application/usecases/place/DeletePlaceUseCase';
import { IPlaceRepository } from '@domain/repositories/IPlaceRepository';
import { Place } from '@domain/entities/Place';
import { User } from '@domain/entities/User';
import { NotFoundError } from '@application/errors/HttpError';
import { MockFactory } from '@tests/helpers/mock.helper';

describe('DeletePlaceUseCase', () => {
  let useCase: DeletePlaceUseCase;
  let mockPlaceRepository: jest.Mocked<IPlaceRepository>;

  beforeEach(() => {
    mockPlaceRepository = MockFactory.createPlaceRepository();
    useCase = new DeletePlaceUseCase(mockPlaceRepository);
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
        mockPlaceRepository.delete.mockResolvedValue(undefined);
      });

      it('should successfully delete an existing place', async () => {
        await useCase.execute(placeId);

        expect(mockPlaceRepository.delete).toHaveBeenCalledWith(placeId);
      });

      it('should validate place exists before deleting', async () => {
        await useCase.execute(placeId);

        expect(mockPlaceRepository.findById).toHaveBeenCalledWith(placeId);
        expect(mockPlaceRepository.findById).toHaveBeenCalledTimes(1);
      });

      it('should return void on successful deletion', async () => {
        const result = await useCase.execute(placeId);

        expect(result).toBeUndefined();
      });

      it('should not throw error on successful deletion', async () => {
        await expect(useCase.execute(placeId)).resolves.not.toThrow();
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

      it('should propagate repository errors when finding place', async () => {
        const error = new Error('Database connection failed');
        mockPlaceRepository.findById.mockRejectedValue(error);

        await expect(useCase.execute(placeId)).rejects.toThrow(error);
      });

      it('should propagate repository errors when deleting place', async () => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
        const error = new Error('Failed to delete place');
        mockPlaceRepository.delete.mockRejectedValue(error);

        await expect(useCase.execute(placeId)).rejects.toThrow(error);
      });
    });

    describe('Cascade Deletion', () => {
      beforeEach(() => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
        mockPlaceRepository.delete.mockResolvedValue(undefined);
      });

      it('should delete place with related entities', async () => {
        const placeWithRelations = {
          ...mockPlace,
          placeKeywords: [{}, {}] as any,
          reviews: [{}] as any,
          reviewHistories: [{}, {}, {}] as any,
        };
        mockPlaceRepository.findById.mockResolvedValue(placeWithRelations);

        await useCase.execute(placeId);

        expect(mockPlaceRepository.delete).toHaveBeenCalledWith(placeId);
      });

      it('should delete active place', async () => {
        const activePlace = { ...mockPlace, isActive: true };
        mockPlaceRepository.findById.mockResolvedValue(activePlace);

        await useCase.execute(placeId);

        expect(mockPlaceRepository.delete).toHaveBeenCalledWith(placeId);
      });

      it('should delete inactive place', async () => {
        const inactivePlace = { ...mockPlace, isActive: false };
        mockPlaceRepository.findById.mockResolvedValue(inactivePlace);

        await useCase.execute(placeId);

        expect(mockPlaceRepository.delete).toHaveBeenCalledWith(placeId);
      });
    });

    describe('Boundary Conditions', () => {
      beforeEach(() => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
        mockPlaceRepository.delete.mockResolvedValue(undefined);
      });

      it('should handle different place ID formats', async () => {
        const uuidPlaceId = '550e8400-e29b-41d4-a716-446655440000';
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);

        await useCase.execute(uuidPlaceId);

        expect(mockPlaceRepository.findById).toHaveBeenCalledWith(uuidPlaceId);
        expect(mockPlaceRepository.delete).toHaveBeenCalledWith(uuidPlaceId);
      });

      it('should handle place with null optional fields', async () => {
        const placeWithNulls = {
          ...mockPlace,
          category: null,
          address: null,
        };
        mockPlaceRepository.findById.mockResolvedValue(placeWithNulls);

        await useCase.execute(placeId);

        expect(mockPlaceRepository.delete).toHaveBeenCalledWith(placeId);
      });

      it('should handle place with empty relations', async () => {
        const placeWithEmptyRelations = {
          ...mockPlace,
          placeKeywords: [],
          reviews: [],
          reviewHistories: [],
          competitors: [],
          notificationSettings: [],
          notificationLogs: [],
        };
        mockPlaceRepository.findById.mockResolvedValue(placeWithEmptyRelations);

        await useCase.execute(placeId);

        expect(mockPlaceRepository.delete).toHaveBeenCalledWith(placeId);
      });
    });

    describe('Method Call Order', () => {
      beforeEach(() => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
        mockPlaceRepository.delete.mockResolvedValue(undefined);
      });

      it('should validate place exists before deleting', async () => {
        await useCase.execute(placeId);

        const findCall = mockPlaceRepository.findById.mock.invocationCallOrder[0];
        const deleteCall = mockPlaceRepository.delete.mock.invocationCallOrder[0];

        expect(findCall).toBeLessThan(deleteCall);
      });

      it('should not delete if place not found', async () => {
        mockPlaceRepository.findById.mockResolvedValue(null);

        await expect(useCase.execute(placeId)).rejects.toThrow();

        expect(mockPlaceRepository.delete).not.toHaveBeenCalled();
      });
    });

    describe('Idempotency', () => {
      it('should not be idempotent - second deletion should fail', async () => {
        mockPlaceRepository.findById.mockResolvedValueOnce(mockPlace);
        mockPlaceRepository.delete.mockResolvedValue(undefined);
        mockPlaceRepository.findById.mockResolvedValueOnce(null);

        // First deletion succeeds
        await useCase.execute(placeId);

        // Second deletion should fail (place no longer exists)
        await expect(useCase.execute(placeId)).rejects.toThrow(NotFoundError);
      });

      it('should validate place exists on each deletion attempt', async () => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
        mockPlaceRepository.delete.mockResolvedValue(undefined);

        await useCase.execute(placeId);
        await useCase.execute(placeId);

        expect(mockPlaceRepository.findById).toHaveBeenCalledTimes(2);
      });
    });

    describe('Return Value', () => {
      beforeEach(() => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
        mockPlaceRepository.delete.mockResolvedValue(undefined);
      });

      it('should return void (undefined)', async () => {
        const result = await useCase.execute(placeId);

        expect(result).toBeUndefined();
      });

      it('should have Promise<void> return type', async () => {
        const promise = useCase.execute(placeId);

        expect(promise).toBeInstanceOf(Promise);
        await promise;
      });
    });
  });
});
