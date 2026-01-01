import { GetPlaceStatsUseCase } from '@application/usecases/place/GetPlaceStatsUseCase';
import { IPlaceRepository } from '@domain/repositories/IPlaceRepository';
import { MockFactory } from '@tests/helpers/mock.helper';

describe('GetPlaceStatsUseCase', () => {
  let useCase: GetPlaceStatsUseCase;
  let mockPlaceRepository: jest.Mocked<IPlaceRepository>;

  beforeEach(() => {
    mockPlaceRepository = MockFactory.createPlaceRepository();
    useCase = new GetPlaceStatsUseCase(mockPlaceRepository);
  });

  describe('execute', () => {
    const userId = 'user-123';

    describe('Happy Path', () => {
      beforeEach(() => {
        mockPlaceRepository.countByUserId.mockResolvedValue(10);
        mockPlaceRepository.countActiveByUserId.mockResolvedValue(7);
      });

      it('should return place statistics for user', async () => {
        const result = await useCase.execute(userId);

        expect(result.totalPlaces).toBe(10);
        expect(result.activePlaces).toBe(7);
        expect(result.inactivePlaces).toBe(3);
      });

      it('should call repository methods with correct userId', async () => {
        await useCase.execute(userId);

        expect(mockPlaceRepository.countByUserId).toHaveBeenCalledWith(userId);
        expect(mockPlaceRepository.countByUserId).toHaveBeenCalledTimes(1);
        expect(mockPlaceRepository.countActiveByUserId).toHaveBeenCalledWith(userId);
        expect(mockPlaceRepository.countActiveByUserId).toHaveBeenCalledTimes(1);
      });

      it('should return PlaceStatsResponseDto with correct properties', async () => {
        const result = await useCase.execute(userId);

        expect(result).toHaveProperty('totalPlaces');
        expect(result).toHaveProperty('activePlaces');
        expect(result).toHaveProperty('inactivePlaces');
        expect(typeof result.totalPlaces).toBe('number');
        expect(typeof result.activePlaces).toBe('number');
        expect(typeof result.inactivePlaces).toBe('number');
      });

      it('should calculate inactivePlaces correctly', async () => {
        const result = await useCase.execute(userId);

        expect(result.inactivePlaces).toBe(result.totalPlaces - result.activePlaces);
      });
    });

    describe('Edge Cases', () => {
      it('should handle user with no places', async () => {
        mockPlaceRepository.countByUserId.mockResolvedValue(0);
        mockPlaceRepository.countActiveByUserId.mockResolvedValue(0);

        const result = await useCase.execute(userId);

        expect(result.totalPlaces).toBe(0);
        expect(result.activePlaces).toBe(0);
        expect(result.inactivePlaces).toBe(0);
      });

      it('should handle user with all active places', async () => {
        mockPlaceRepository.countByUserId.mockResolvedValue(5);
        mockPlaceRepository.countActiveByUserId.mockResolvedValue(5);

        const result = await useCase.execute(userId);

        expect(result.totalPlaces).toBe(5);
        expect(result.activePlaces).toBe(5);
        expect(result.inactivePlaces).toBe(0);
      });

      it('should handle user with all inactive places', async () => {
        mockPlaceRepository.countByUserId.mockResolvedValue(8);
        mockPlaceRepository.countActiveByUserId.mockResolvedValue(0);

        const result = await useCase.execute(userId);

        expect(result.totalPlaces).toBe(8);
        expect(result.activePlaces).toBe(0);
        expect(result.inactivePlaces).toBe(8);
      });

      it('should handle large numbers of places', async () => {
        mockPlaceRepository.countByUserId.mockResolvedValue(10000);
        mockPlaceRepository.countActiveByUserId.mockResolvedValue(7500);

        const result = await useCase.execute(userId);

        expect(result.totalPlaces).toBe(10000);
        expect(result.activePlaces).toBe(7500);
        expect(result.inactivePlaces).toBe(2500);
      });

      it('should handle UUID format userId', async () => {
        const uuidUserId = '550e8400-e29b-41d4-a716-446655440000';
        mockPlaceRepository.countByUserId.mockResolvedValue(3);
        mockPlaceRepository.countActiveByUserId.mockResolvedValue(2);

        const result = await useCase.execute(uuidUserId);

        expect(result.totalPlaces).toBe(3);
        expect(result.activePlaces).toBe(2);
        expect(result.inactivePlaces).toBe(1);
      });
    });

    describe('Error Cases', () => {
      it('should propagate repository countByUserId errors', async () => {
        const error = new Error('Database connection failed');
        mockPlaceRepository.countByUserId.mockRejectedValue(error);

        await expect(useCase.execute(userId)).rejects.toThrow(error);
      });

      it('should propagate repository countActiveByUserId errors', async () => {
        mockPlaceRepository.countByUserId.mockResolvedValue(10);
        const error = new Error('Database connection failed');
        mockPlaceRepository.countActiveByUserId.mockRejectedValue(error);

        await expect(useCase.execute(userId)).rejects.toThrow(error);
      });

      it('should handle database timeout errors', async () => {
        const timeoutError = new Error('Query timeout');
        mockPlaceRepository.countByUserId.mockRejectedValue(timeoutError);

        await expect(useCase.execute(userId)).rejects.toThrow('Query timeout');
      });
    });

    describe('Method Call Order', () => {
      it('should call both count methods regardless of results', async () => {
        mockPlaceRepository.countByUserId.mockResolvedValue(0);
        mockPlaceRepository.countActiveByUserId.mockResolvedValue(0);

        await useCase.execute(userId);

        expect(mockPlaceRepository.countByUserId).toHaveBeenCalled();
        expect(mockPlaceRepository.countActiveByUserId).toHaveBeenCalled();
      });

      it('should not fail if countActiveByUserId is called with non-existent userId', async () => {
        mockPlaceRepository.countByUserId.mockResolvedValue(0);
        mockPlaceRepository.countActiveByUserId.mockResolvedValue(0);

        const result = await useCase.execute('non-existent-user');

        expect(result.totalPlaces).toBe(0);
        expect(result.activePlaces).toBe(0);
      });
    });

    describe('DTO Properties', () => {
      beforeEach(() => {
        mockPlaceRepository.countByUserId.mockResolvedValue(15);
        mockPlaceRepository.countActiveByUserId.mockResolvedValue(10);
      });

      it('should preserve totalPlaces exactly', async () => {
        const result = await useCase.execute(userId);

        expect(result.totalPlaces).toBe(15);
      });

      it('should preserve activePlaces exactly', async () => {
        const result = await useCase.execute(userId);

        expect(result.activePlaces).toBe(10);
      });

      it('should calculate inactivePlaces correctly', async () => {
        const result = await useCase.execute(userId);

        expect(result.inactivePlaces).toBe(5); // 15 - 10
      });

      it('should not have negative inactivePlaces', async () => {
        mockPlaceRepository.countByUserId.mockResolvedValue(10);
        mockPlaceRepository.countActiveByUserId.mockResolvedValue(10);

        const result = await useCase.execute(userId);

        expect(result.inactivePlaces).toBeGreaterThanOrEqual(0);
      });
    });

    describe('Repository Interaction', () => {
      it('should call countByUserId before returning', async () => {
        mockPlaceRepository.countByUserId.mockResolvedValue(5);
        mockPlaceRepository.countActiveByUserId.mockResolvedValue(3);

        const result = await useCase.execute(userId);

        expect(mockPlaceRepository.countByUserId).toHaveBeenCalled();
        expect(result).toBeDefined();
      });

      it('should call countActiveByUserId before returning', async () => {
        mockPlaceRepository.countByUserId.mockResolvedValue(5);
        mockPlaceRepository.countActiveByUserId.mockResolvedValue(3);

        const result = await useCase.execute(userId);

        expect(mockPlaceRepository.countActiveByUserId).toHaveBeenCalled();
        expect(result).toBeDefined();
      });

      it('should not make additional repository calls', async () => {
        mockPlaceRepository.countByUserId.mockResolvedValue(5);
        mockPlaceRepository.countActiveByUserId.mockResolvedValue(3);

        await useCase.execute(userId);

        expect(mockPlaceRepository.countByUserId).toHaveBeenCalledTimes(1);
        expect(mockPlaceRepository.countActiveByUserId).toHaveBeenCalledTimes(1);
        // Ensure no other repository methods were called
        expect(mockPlaceRepository.findById).not.toHaveBeenCalled();
        expect(mockPlaceRepository.findAll).not.toHaveBeenCalled();
      });
    });
  });
});
