import { UpdatePlaceActiveStatusUseCase } from '@application/usecases/place/UpdatePlaceActiveStatusUseCase';
import { UpdatePlaceActiveStatusDto } from '@application/dtos/place/UpdatePlaceActiveStatusDto';
import { IPlaceRepository } from '@domain/repositories/IPlaceRepository';
import { Place } from '@domain/entities/Place';
import { User } from '@domain/entities/User';
import { NotFoundError } from '@application/errors/HttpError';
import { MockFactory } from '@tests/helpers/mock.helper';

describe('UpdatePlaceActiveStatusUseCase', () => {
  let useCase: UpdatePlaceActiveStatusUseCase;
  let mockPlaceRepository: jest.Mocked<IPlaceRepository>;

  beforeEach(() => {
    mockPlaceRepository = MockFactory.createPlaceRepository();
    useCase = new UpdatePlaceActiveStatusUseCase(mockPlaceRepository);
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

    const createMockPlace = (isActive: boolean): Place => ({
      id: placeId,
      user: mockUser,
      naverPlaceId: 'naver-place-123',
      name: 'Test Restaurant',
      category: 'Korean Restaurant',
      address: 'Seoul, Korea',
      naverPlaceUrl: 'https://naver.com/place/123',
      isActive,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
      placeKeywords: [],
      reviews: [],
      reviewHistories: [],
      competitors: [],
      notificationSettings: [],
      notificationLogs: [],
    });

    describe('Happy Path', () => {
      it('should successfully deactivate an active place', async () => {
        const activePlace = createMockPlace(true);
        const inactivePlace = createMockPlace(false);

        mockPlaceRepository.findById.mockResolvedValueOnce(activePlace);
        mockPlaceRepository.updateActiveStatus.mockResolvedValue(undefined);
        mockPlaceRepository.findById.mockResolvedValueOnce(inactivePlace);

        const dto: UpdatePlaceActiveStatusDto = { isActive: false };
        const result = await useCase.execute(placeId, dto);

        expect(result).toBeDefined();
        expect(result.isActive).toBe(false);
        expect(mockPlaceRepository.updateActiveStatus).toHaveBeenCalledWith(placeId, false);
      });

      it('should successfully activate an inactive place', async () => {
        const inactivePlace = createMockPlace(false);
        const activePlace = createMockPlace(true);

        mockPlaceRepository.findById.mockResolvedValueOnce(inactivePlace);
        mockPlaceRepository.updateActiveStatus.mockResolvedValue(undefined);
        mockPlaceRepository.findById.mockResolvedValueOnce(activePlace);

        const dto: UpdatePlaceActiveStatusDto = { isActive: true };
        const result = await useCase.execute(placeId, dto);

        expect(result).toBeDefined();
        expect(result.isActive).toBe(true);
        expect(mockPlaceRepository.updateActiveStatus).toHaveBeenCalledWith(placeId, true);
      });

      it('should validate place exists before updating', async () => {
        const activePlace = createMockPlace(true);
        mockPlaceRepository.findById.mockResolvedValue(activePlace);
        mockPlaceRepository.updateActiveStatus.mockResolvedValue(undefined);

        const dto: UpdatePlaceActiveStatusDto = { isActive: false };
        await useCase.execute(placeId, dto);

        expect(mockPlaceRepository.findById).toHaveBeenCalledWith(placeId);
      });

      it('should fetch updated place after status change', async () => {
        const activePlace = createMockPlace(true);
        const inactivePlace = createMockPlace(false);

        mockPlaceRepository.findById.mockResolvedValueOnce(activePlace);
        mockPlaceRepository.updateActiveStatus.mockResolvedValue(undefined);
        mockPlaceRepository.findById.mockResolvedValueOnce(inactivePlace);

        const dto: UpdatePlaceActiveStatusDto = { isActive: false };
        await useCase.execute(placeId, dto);

        expect(mockPlaceRepository.findById).toHaveBeenCalledTimes(2);
      });

      it('should return PlaceResponseDto with updated status', async () => {
        const activePlace = createMockPlace(true);
        mockPlaceRepository.findById.mockResolvedValue(activePlace);
        mockPlaceRepository.updateActiveStatus.mockResolvedValue(undefined);

        const dto: UpdatePlaceActiveStatusDto = { isActive: true };
        const result = await useCase.execute(placeId, dto);

        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('naverPlaceId');
        expect(result).toHaveProperty('name');
        expect(result).toHaveProperty('isActive');
        expect(result).toHaveProperty('createdAt');
        expect(result).toHaveProperty('updatedAt');
      });
    });

    describe('Error Cases', () => {
      it('should throw NotFoundError when place does not exist', async () => {
        mockPlaceRepository.findById.mockResolvedValue(null);

        const dto: UpdatePlaceActiveStatusDto = { isActive: false };

        await expect(useCase.execute(placeId, dto)).rejects.toThrow(NotFoundError);
        await expect(useCase.execute(placeId, dto)).rejects.toThrow(
          `Place with id ${placeId} not found`
        );
      });

      it('should propagate repository errors when finding place', async () => {
        const error = new Error('Database connection failed');
        mockPlaceRepository.findById.mockRejectedValue(error);

        const dto: UpdatePlaceActiveStatusDto = { isActive: false };

        await expect(useCase.execute(placeId, dto)).rejects.toThrow(error);
      });

      it('should propagate repository errors when updating status', async () => {
        const activePlace = createMockPlace(true);
        mockPlaceRepository.findById.mockResolvedValue(activePlace);

        const error = new Error('Failed to update active status');
        mockPlaceRepository.updateActiveStatus.mockRejectedValue(error);

        const dto: UpdatePlaceActiveStatusDto = { isActive: false };

        await expect(useCase.execute(placeId, dto)).rejects.toThrow(error);
      });

      it('should propagate repository errors when fetching updated place', async () => {
        const activePlace = createMockPlace(true);
        mockPlaceRepository.findById.mockResolvedValueOnce(activePlace);
        mockPlaceRepository.updateActiveStatus.mockResolvedValue(undefined);

        const error = new Error('Failed to fetch updated place');
        mockPlaceRepository.findById.mockRejectedValueOnce(error);

        const dto: UpdatePlaceActiveStatusDto = { isActive: false };

        await expect(useCase.execute(placeId, dto)).rejects.toThrow(error);
      });
    });

    describe('Idempotent Behavior', () => {
      it('should allow setting active place to active again', async () => {
        const activePlace = createMockPlace(true);
        mockPlaceRepository.findById.mockResolvedValue(activePlace);
        mockPlaceRepository.updateActiveStatus.mockResolvedValue(undefined);

        const dto: UpdatePlaceActiveStatusDto = { isActive: true };
        const result = await useCase.execute(placeId, dto);

        expect(result.isActive).toBe(true);
        expect(mockPlaceRepository.updateActiveStatus).toHaveBeenCalledWith(placeId, true);
      });

      it('should allow setting inactive place to inactive again', async () => {
        const inactivePlace = createMockPlace(false);
        mockPlaceRepository.findById.mockResolvedValue(inactivePlace);
        mockPlaceRepository.updateActiveStatus.mockResolvedValue(undefined);

        const dto: UpdatePlaceActiveStatusDto = { isActive: false };
        const result = await useCase.execute(placeId, dto);

        expect(result.isActive).toBe(false);
        expect(mockPlaceRepository.updateActiveStatus).toHaveBeenCalledWith(placeId, false);
      });
    });

    describe('Boundary Conditions', () => {
      it('should handle different place ID formats', async () => {
        const uuidPlaceId = '550e8400-e29b-41d4-a716-446655440000';
        const activePlace = createMockPlace(true);
        mockPlaceRepository.findById.mockResolvedValue(activePlace);
        mockPlaceRepository.updateActiveStatus.mockResolvedValue(undefined);

        const dto: UpdatePlaceActiveStatusDto = { isActive: false };
        await useCase.execute(uuidPlaceId, dto);

        expect(mockPlaceRepository.findById).toHaveBeenCalledWith(uuidPlaceId);
        expect(mockPlaceRepository.updateActiveStatus).toHaveBeenCalledWith(uuidPlaceId, false);
      });

      it('should handle boolean true value', async () => {
        const inactivePlace = createMockPlace(false);
        const activePlace = createMockPlace(true);

        mockPlaceRepository.findById.mockResolvedValueOnce(inactivePlace);
        mockPlaceRepository.updateActiveStatus.mockResolvedValue(undefined);
        mockPlaceRepository.findById.mockResolvedValueOnce(activePlace);

        const dto: UpdatePlaceActiveStatusDto = { isActive: true };
        const result = await useCase.execute(placeId, dto);

        expect(result.isActive).toBe(true);
      });

      it('should handle boolean false value', async () => {
        const activePlace = createMockPlace(true);
        const inactivePlace = createMockPlace(false);

        mockPlaceRepository.findById.mockResolvedValueOnce(activePlace);
        mockPlaceRepository.updateActiveStatus.mockResolvedValue(undefined);
        mockPlaceRepository.findById.mockResolvedValueOnce(inactivePlace);

        const dto: UpdatePlaceActiveStatusDto = { isActive: false };
        const result = await useCase.execute(placeId, dto);

        expect(result.isActive).toBe(false);
      });
    });

    describe('Method Call Order', () => {
      it('should validate place exists before updating status', async () => {
        const activePlace = createMockPlace(true);
        mockPlaceRepository.findById.mockResolvedValue(activePlace);
        mockPlaceRepository.updateActiveStatus.mockResolvedValue(undefined);

        const dto: UpdatePlaceActiveStatusDto = { isActive: false };
        await useCase.execute(placeId, dto);

        const firstFindCall = mockPlaceRepository.findById.mock.invocationCallOrder[0];
        const updateCall = mockPlaceRepository.updateActiveStatus.mock.invocationCallOrder[0];

        expect(firstFindCall).toBeLessThan(updateCall);
      });

      it('should update status before fetching updated place', async () => {
        const activePlace = createMockPlace(true);
        mockPlaceRepository.findById.mockResolvedValue(activePlace);
        mockPlaceRepository.updateActiveStatus.mockResolvedValue(undefined);

        const dto: UpdatePlaceActiveStatusDto = { isActive: false };
        await useCase.execute(placeId, dto);

        const updateCall = mockPlaceRepository.updateActiveStatus.mock.invocationCallOrder[0];
        const secondFindCall = mockPlaceRepository.findById.mock.invocationCallOrder[1];

        expect(updateCall).toBeLessThan(secondFindCall);
      });

      it('should not update status if place not found', async () => {
        mockPlaceRepository.findById.mockResolvedValue(null);

        const dto: UpdatePlaceActiveStatusDto = { isActive: false };

        await expect(useCase.execute(placeId, dto)).rejects.toThrow();

        expect(mockPlaceRepository.updateActiveStatus).not.toHaveBeenCalled();
      });
    });

    describe('Status Transitions', () => {
      it('should transition from active to inactive', async () => {
        const activePlace = createMockPlace(true);
        const inactivePlace = createMockPlace(false);

        mockPlaceRepository.findById.mockResolvedValueOnce(activePlace);
        mockPlaceRepository.updateActiveStatus.mockResolvedValue(undefined);
        mockPlaceRepository.findById.mockResolvedValueOnce(inactivePlace);

        const dto: UpdatePlaceActiveStatusDto = { isActive: false };
        const result = await useCase.execute(placeId, dto);

        expect(result.isActive).toBe(false);
      });

      it('should transition from inactive to active', async () => {
        const inactivePlace = createMockPlace(false);
        const activePlace = createMockPlace(true);

        mockPlaceRepository.findById.mockResolvedValueOnce(inactivePlace);
        mockPlaceRepository.updateActiveStatus.mockResolvedValue(undefined);
        mockPlaceRepository.findById.mockResolvedValueOnce(activePlace);

        const dto: UpdatePlaceActiveStatusDto = { isActive: true };
        const result = await useCase.execute(placeId, dto);

        expect(result.isActive).toBe(true);
      });
    });
  });
});
