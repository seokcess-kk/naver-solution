import { UpdatePlaceUseCase } from '@application/usecases/place/UpdatePlaceUseCase';
import { UpdatePlaceDto } from '@application/dtos/place/UpdatePlaceDto';
import { IPlaceRepository } from '@domain/repositories/IPlaceRepository';
import { Place } from '@domain/entities/Place';
import { User } from '@domain/entities/User';
import { NotFoundError } from '@application/errors/HttpError';
import { MockFactory } from '@tests/helpers/mock.helper';

describe('UpdatePlaceUseCase', () => {
  let useCase: UpdatePlaceUseCase;
  let mockPlaceRepository: jest.Mocked<IPlaceRepository>;

  beforeEach(() => {
    mockPlaceRepository = MockFactory.createPlaceRepository();
    useCase = new UpdatePlaceUseCase(mockPlaceRepository);
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
      name: 'Old Restaurant Name',
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

    const updatedPlace: Place = {
      ...mockPlace,
      name: 'Updated Restaurant Name',
      updatedAt: new Date(),
    };

    describe('Happy Path', () => {
      beforeEach(() => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
        mockPlaceRepository.update.mockResolvedValue(updatedPlace);
      });

      it('should successfully update place with all fields', async () => {
        const updateDto: UpdatePlaceDto = {
          name: 'Updated Restaurant Name',
          category: 'Japanese Restaurant',
          address: 'Tokyo, Japan',
          naverPlaceUrl: 'https://naver.com/place/456',
        };

        const result = await useCase.execute(placeId, updateDto);

        expect(result).toBeDefined();
        expect(mockPlaceRepository.update).toHaveBeenCalledWith(
          placeId,
          expect.objectContaining({
            name: updateDto.name,
            category: updateDto.category,
            address: updateDto.address,
            naverPlaceUrl: updateDto.naverPlaceUrl,
          })
        );
      });

      it('should validate place exists', async () => {
        const updateDto: UpdatePlaceDto = { name: 'New Name' };

        await useCase.execute(placeId, updateDto);

        expect(mockPlaceRepository.findById).toHaveBeenCalledWith(placeId);
      });

      it('should only update provided fields', async () => {
        const updateDto: UpdatePlaceDto = { name: 'New Name' };

        await useCase.execute(placeId, updateDto);

        expect(mockPlaceRepository.update).toHaveBeenCalledWith(placeId, {
          name: 'New Name',
        });
      });

      it('should return PlaceResponseDto', async () => {
        const updateDto: UpdatePlaceDto = { name: 'New Name' };
        const result = await useCase.execute(placeId, updateDto);

        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('naverPlaceId');
        expect(result).toHaveProperty('name');
        expect(result).toHaveProperty('isActive');
        expect(result).toHaveProperty('createdAt');
        expect(result).toHaveProperty('updatedAt');
      });
    });

    describe('Partial Updates', () => {
      beforeEach(() => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
        mockPlaceRepository.update.mockResolvedValue(updatedPlace);
      });

      it('should update only name', async () => {
        const updateDto: UpdatePlaceDto = { name: 'New Name' };

        await useCase.execute(placeId, updateDto);

        expect(mockPlaceRepository.update).toHaveBeenCalledWith(placeId, {
          name: 'New Name',
        });
      });

      it('should update only category', async () => {
        const updateDto: UpdatePlaceDto = { category: 'New Category' };

        await useCase.execute(placeId, updateDto);

        expect(mockPlaceRepository.update).toHaveBeenCalledWith(placeId, {
          category: 'New Category',
        });
      });

      it('should update only address', async () => {
        const updateDto: UpdatePlaceDto = { address: 'New Address' };

        await useCase.execute(placeId, updateDto);

        expect(mockPlaceRepository.update).toHaveBeenCalledWith(placeId, {
          address: 'New Address',
        });
      });

      it('should update only naverPlaceUrl', async () => {
        const updateDto: UpdatePlaceDto = { naverPlaceUrl: 'https://naver.com/new' };

        await useCase.execute(placeId, updateDto);

        expect(mockPlaceRepository.update).toHaveBeenCalledWith(placeId, {
          naverPlaceUrl: 'https://naver.com/new',
        });
      });

      it('should update multiple fields', async () => {
        const updateDto: UpdatePlaceDto = {
          name: 'New Name',
          category: 'New Category',
        };

        await useCase.execute(placeId, updateDto);

        expect(mockPlaceRepository.update).toHaveBeenCalledWith(placeId, {
          name: 'New Name',
          category: 'New Category',
        });
      });

      it('should handle empty update object when no fields provided', async () => {
        const updateDto: UpdatePlaceDto = {};

        await useCase.execute(placeId, updateDto);

        expect(mockPlaceRepository.update).toHaveBeenCalledWith(placeId, {});
      });
    });

    describe('Error Cases', () => {
      it('should throw NotFoundError when place does not exist', async () => {
        mockPlaceRepository.findById.mockResolvedValue(null);
        const updateDto: UpdatePlaceDto = { name: 'New Name' };

        await expect(useCase.execute(placeId, updateDto)).rejects.toThrow(NotFoundError);
        await expect(useCase.execute(placeId, updateDto)).rejects.toThrow(
          `Place with id ${placeId} not found`
        );
      });

      it('should propagate repository errors when finding place', async () => {
        const error = new Error('Database connection failed');
        mockPlaceRepository.findById.mockRejectedValue(error);
        const updateDto: UpdatePlaceDto = { name: 'New Name' };

        await expect(useCase.execute(placeId, updateDto)).rejects.toThrow(error);
      });

      it('should propagate repository errors when updating place', async () => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
        const error = new Error('Failed to update place');
        mockPlaceRepository.update.mockRejectedValue(error);
        const updateDto: UpdatePlaceDto = { name: 'New Name' };

        await expect(useCase.execute(placeId, updateDto)).rejects.toThrow(error);
      });
    });

    describe('Boundary Conditions', () => {
      beforeEach(() => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
        mockPlaceRepository.update.mockResolvedValue(updatedPlace);
      });

      it('should handle very long name', async () => {
        const longName = 'A'.repeat(200);
        const updateDto: UpdatePlaceDto = { name: longName };

        await useCase.execute(placeId, updateDto);

        expect(mockPlaceRepository.update).toHaveBeenCalledWith(placeId, {
          name: longName,
        });
      });

      it('should handle empty string for optional fields', async () => {
        const updateDto: UpdatePlaceDto = {
          category: '',
          address: '',
        };

        await useCase.execute(placeId, updateDto);

        expect(mockPlaceRepository.update).toHaveBeenCalledWith(
          placeId,
          expect.objectContaining({
            category: '',
            address: '',
          })
        );
      });

      it('should handle special characters in fields', async () => {
        const updateDto: UpdatePlaceDto = {
          name: '맛집 & Restaurant!',
          category: 'Korean/Japanese',
        };

        await useCase.execute(placeId, updateDto);

        expect(mockPlaceRepository.update).toHaveBeenCalledWith(placeId, {
          name: '맛집 & Restaurant!',
          category: 'Korean/Japanese',
        });
      });

      it('should handle different place ID formats', async () => {
        const uuidPlaceId = '550e8400-e29b-41d4-a716-446655440000';
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
        const updateDto: UpdatePlaceDto = { name: 'New Name' };

        await useCase.execute(uuidPlaceId, updateDto);

        expect(mockPlaceRepository.findById).toHaveBeenCalledWith(uuidPlaceId);
        expect(mockPlaceRepository.update).toHaveBeenCalledWith(uuidPlaceId, { name: 'New Name' });
      });
    });

    describe('Method Call Order', () => {
      beforeEach(() => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
        mockPlaceRepository.update.mockResolvedValue(updatedPlace);
      });

      it('should validate place exists before updating', async () => {
        const updateDto: UpdatePlaceDto = { name: 'New Name' };

        await useCase.execute(placeId, updateDto);

        const findCall = mockPlaceRepository.findById.mock.invocationCallOrder[0];
        const updateCall = mockPlaceRepository.update.mock.invocationCallOrder[0];

        expect(findCall).toBeLessThan(updateCall);
      });

      it('should not update if place not found', async () => {
        mockPlaceRepository.findById.mockResolvedValue(null);
        const updateDto: UpdatePlaceDto = { name: 'New Name' };

        await expect(useCase.execute(placeId, updateDto)).rejects.toThrow();

        expect(mockPlaceRepository.update).not.toHaveBeenCalled();
      });
    });

    describe('Field Handling', () => {
      beforeEach(() => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
        mockPlaceRepository.update.mockResolvedValue(updatedPlace);
      });

      it('should not include undefined fields in update', async () => {
        const updateDto: UpdatePlaceDto = {
          name: 'New Name',
          category: undefined,
        };

        await useCase.execute(placeId, updateDto);

        const updateData = mockPlaceRepository.update.mock.calls[0][1];
        expect(updateData).toHaveProperty('name');
        expect(updateData).not.toHaveProperty('category');
      });

      it('should include fields set to empty string', async () => {
        const updateDto: UpdatePlaceDto = {
          category: '',
        };

        await useCase.execute(placeId, updateDto);

        const updateData = mockPlaceRepository.update.mock.calls[0][1];
        expect(updateData).toHaveProperty('category', '');
      });

      it('should handle all fields being undefined', async () => {
        const updateDto: UpdatePlaceDto = {
          name: undefined,
          category: undefined,
          address: undefined,
          naverPlaceUrl: undefined,
        };

        await useCase.execute(placeId, updateDto);

        expect(mockPlaceRepository.update).toHaveBeenCalledWith(placeId, {});
      });
    });
  });
});
