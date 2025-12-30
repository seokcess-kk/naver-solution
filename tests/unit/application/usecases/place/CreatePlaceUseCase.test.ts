import { CreatePlaceUseCase } from '@application/usecases/place/CreatePlaceUseCase';
import { CreatePlaceDto } from '@application/dtos/place/CreatePlaceDto';
import { IPlaceRepository } from '@domain/repositories/IPlaceRepository';
import { IUserRepository } from '@domain/repositories/IUserRepository';
import { Place } from '@domain/entities/Place';
import { User } from '@domain/entities/User';
import { NotFoundError, ConflictError } from '@application/errors/HttpError';
import { MockFactory } from '@tests/helpers/mock.helper';

describe('CreatePlaceUseCase', () => {
  let useCase: CreatePlaceUseCase;
  let mockPlaceRepository: jest.Mocked<IPlaceRepository>;
  let mockUserRepository: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    mockPlaceRepository = MockFactory.createPlaceRepository();
    mockUserRepository = MockFactory.createUserRepository();
    useCase = new CreatePlaceUseCase(mockPlaceRepository, mockUserRepository);
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

    const validDto: CreatePlaceDto = {
      userId: 'user-123',
      naverPlaceId: 'naver-place-123',
      name: 'Test Restaurant',
      category: 'Korean Restaurant',
      address: 'Seoul, Korea',
      naverPlaceUrl: 'https://naver.com/place/123',
    };

    const mockPlace: Place = {
      id: 'place-123',
      user: mockUser,
      naverPlaceId: 'naver-place-123',
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

    describe('Happy Path', () => {
      beforeEach(() => {
        mockUserRepository.findById.mockResolvedValue(mockUser);
        mockPlaceRepository.findByNaverPlaceId.mockResolvedValue(null);
        mockPlaceRepository.save.mockResolvedValue(mockPlace);
      });

      it('should successfully create a place with all fields', async () => {
        const result = await useCase.execute(validDto);

        expect(result).toBeDefined();
        expect(result.id).toBe(mockPlace.id);
        expect(result.naverPlaceId).toBe(validDto.naverPlaceId);
        expect(result.name).toBe(validDto.name);
        expect(result.category).toBe(validDto.category);
        expect(result.address).toBe(validDto.address);
        expect(result.naverPlaceUrl).toBe(validDto.naverPlaceUrl);
        expect(result.isActive).toBe(true);
      });

      it('should validate user exists before creating place', async () => {
        await useCase.execute(validDto);

        expect(mockUserRepository.findById).toHaveBeenCalledWith(validDto.userId);
      });

      it('should check for duplicate naverPlaceId', async () => {
        await useCase.execute(validDto);

        expect(mockPlaceRepository.findByNaverPlaceId).toHaveBeenCalledWith(
          validDto.naverPlaceId
        );
      });

      it('should save place with user association', async () => {
        await useCase.execute(validDto);

        expect(mockPlaceRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            user: mockUser,
            naverPlaceId: validDto.naverPlaceId,
            name: validDto.name,
            category: validDto.category,
            address: validDto.address,
            naverPlaceUrl: validDto.naverPlaceUrl,
            isActive: true,
          })
        );
      });

      it('should set isActive to true by default', async () => {
        await useCase.execute(validDto);

        const savedPlace = mockPlaceRepository.save.mock.calls[0][0];
        expect(savedPlace.isActive).toBe(true);
      });

      it('should return PlaceResponseDto', async () => {
        const result = await useCase.execute(validDto);

        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('naverPlaceId');
        expect(result).toHaveProperty('name');
        expect(result).toHaveProperty('isActive');
        expect(result).toHaveProperty('createdAt');
        expect(result).toHaveProperty('updatedAt');
      });
    });

    describe('Error Cases', () => {
      it('should throw NotFoundError when user does not exist', async () => {
        mockUserRepository.findById.mockResolvedValue(null);

        await expect(useCase.execute(validDto)).rejects.toThrow(NotFoundError);
        await expect(useCase.execute(validDto)).rejects.toThrow(
          `User with id ${validDto.userId} not found`
        );
      });

      it('should throw ConflictError when naverPlaceId already exists', async () => {
        mockUserRepository.findById.mockResolvedValue(mockUser);
        mockPlaceRepository.findByNaverPlaceId.mockResolvedValue(mockPlace);

        await expect(useCase.execute(validDto)).rejects.toThrow(ConflictError);
        await expect(useCase.execute(validDto)).rejects.toThrow(
          `Place with naverPlaceId ${validDto.naverPlaceId} already exists`
        );
      });

      it('should propagate repository errors when finding user', async () => {
        const error = new Error('Database connection failed');
        mockUserRepository.findById.mockRejectedValue(error);

        await expect(useCase.execute(validDto)).rejects.toThrow(error);
      });

      it('should propagate repository errors when checking duplicate', async () => {
        mockUserRepository.findById.mockResolvedValue(mockUser);
        const error = new Error('Database query failed');
        mockPlaceRepository.findByNaverPlaceId.mockRejectedValue(error);

        await expect(useCase.execute(validDto)).rejects.toThrow(error);
      });

      it('should propagate repository errors when saving place', async () => {
        mockUserRepository.findById.mockResolvedValue(mockUser);
        mockPlaceRepository.findByNaverPlaceId.mockResolvedValue(null);
        const error = new Error('Failed to save place');
        mockPlaceRepository.save.mockRejectedValue(error);

        await expect(useCase.execute(validDto)).rejects.toThrow(error);
      });
    });

    describe('Boundary Conditions', () => {
      beforeEach(() => {
        mockUserRepository.findById.mockResolvedValue(mockUser);
        mockPlaceRepository.findByNaverPlaceId.mockResolvedValue(null);
        mockPlaceRepository.save.mockResolvedValue(mockPlace);
      });

      it('should handle place without optional category', async () => {
        const dtoWithoutCategory = { ...validDto, category: undefined };
        await useCase.execute(dtoWithoutCategory);

        expect(mockPlaceRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            category: null,
          })
        );
      });

      it('should handle place without optional address', async () => {
        const dtoWithoutAddress = { ...validDto, address: undefined };
        await useCase.execute(dtoWithoutAddress);

        expect(mockPlaceRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            address: null,
          })
        );
      });

      it('should handle place with only required fields', async () => {
        const minimalDto: CreatePlaceDto = {
          userId: validDto.userId,
          naverPlaceId: validDto.naverPlaceId,
          name: validDto.name,
          naverPlaceUrl: validDto.naverPlaceUrl,
        };

        await useCase.execute(minimalDto);

        expect(mockPlaceRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            naverPlaceId: minimalDto.naverPlaceId,
            name: minimalDto.name,
            naverPlaceUrl: minimalDto.naverPlaceUrl,
            category: null,
            address: null,
          })
        );
      });

      it('should handle very long place name', async () => {
        const longName = 'A'.repeat(200);
        const dtoWithLongName = { ...validDto, name: longName };
        const placeWithLongName = { ...mockPlace, name: longName };
        mockPlaceRepository.save.mockResolvedValue(placeWithLongName);

        const result = await useCase.execute(dtoWithLongName);

        expect(result.name).toBe(longName);
      });

      it('should handle special characters in naverPlaceId', async () => {
        const specialId = 'place-123_ABC!@#';
        const dtoWithSpecialId = { ...validDto, naverPlaceId: specialId };

        await useCase.execute(dtoWithSpecialId);

        expect(mockPlaceRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            naverPlaceId: specialId,
          })
        );
      });
    });

    describe('Method Call Order', () => {
      beforeEach(() => {
        mockUserRepository.findById.mockResolvedValue(mockUser);
        mockPlaceRepository.findByNaverPlaceId.mockResolvedValue(null);
        mockPlaceRepository.save.mockResolvedValue(mockPlace);
      });

      it('should validate user before checking duplicate', async () => {
        await useCase.execute(validDto);

        const findUserCall = mockUserRepository.findById.mock.invocationCallOrder[0];
        const findPlaceCall = mockPlaceRepository.findByNaverPlaceId.mock.invocationCallOrder[0];

        expect(findUserCall).toBeLessThan(findPlaceCall);
      });

      it('should check duplicate before saving', async () => {
        await useCase.execute(validDto);

        const findPlaceCall = mockPlaceRepository.findByNaverPlaceId.mock.invocationCallOrder[0];
        const saveCall = mockPlaceRepository.save.mock.invocationCallOrder[0];

        expect(findPlaceCall).toBeLessThan(saveCall);
      });

      it('should not check duplicate if user not found', async () => {
        mockUserRepository.findById.mockResolvedValue(null);

        await expect(useCase.execute(validDto)).rejects.toThrow();

        expect(mockPlaceRepository.findByNaverPlaceId).not.toHaveBeenCalled();
        expect(mockPlaceRepository.save).not.toHaveBeenCalled();
      });

      it('should not save if naverPlaceId already exists', async () => {
        mockPlaceRepository.findByNaverPlaceId.mockResolvedValue(mockPlace);

        await expect(useCase.execute(validDto)).rejects.toThrow();

        expect(mockPlaceRepository.save).not.toHaveBeenCalled();
      });
    });
  });
});
