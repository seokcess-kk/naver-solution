import { ListPlacesUseCase } from '@application/usecases/place/ListPlacesUseCase';
import { IPlaceRepository } from '@domain/repositories/IPlaceRepository';
import { IUserRepository } from '@domain/repositories/IUserRepository';
import { Place } from '@domain/entities/Place';
import { User } from '@domain/entities/User';
import { NotFoundError } from '@application/errors/HttpError';
import { MockFactory } from '@tests/helpers/mock.helper';
import { PaginatedResult } from '@domain/repositories/IBaseRepository';

describe('ListPlacesUseCase', () => {
  let useCase: ListPlacesUseCase;
  let mockPlaceRepository: jest.Mocked<IPlaceRepository>;
  let mockUserRepository: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    mockPlaceRepository = MockFactory.createPlaceRepository();
    mockUserRepository = MockFactory.createUserRepository();
    useCase = new ListPlacesUseCase(mockPlaceRepository, mockUserRepository);
  });

  describe('execute', () => {
    const userId = 'user-123';

    const mockUser: User = {
      id: userId,
      email: 'test@example.com',
      passwordHash: 'hashedPassword',
      name: 'Test User',
      createdAt: new Date(),
      updatedAt: new Date(),
      places: [],
      notificationSettings: [],
      refreshTokens: [],
    };

    const createMockPlace = (id: string, isActive: boolean = true): Place => ({
      id,
      user: mockUser,
      naverPlaceId: `naver-${id}`,
      name: `Place ${id}`,
      category: 'Restaurant',
      address: 'Seoul, Korea',
      naverPlaceUrl: `https://naver.com/place/${id}`,
      isActive,
      createdAt: new Date(),
      updatedAt: new Date(),
      placeKeywords: [],
      reviews: [],
      reviewHistories: [],
      competitors: [],
      notificationSettings: [],
      notificationLogs: [],
    });

    const mockPlaces = [
      createMockPlace('1'),
      createMockPlace('2'),
      createMockPlace('3'),
    ];

    describe('Happy Path', () => {
      beforeEach(() => {
        mockUserRepository.findById.mockResolvedValue(mockUser);
      });

      it('should return paginated places for valid user', async () => {
        const mockResult: PaginatedResult<Place> = {
          data: mockPlaces,
          pagination: {
            page: 1,
            limit: 10,
            total: 3,
            totalPages: 1,
          },
        };
        mockPlaceRepository.findByUserId.mockResolvedValue(mockResult);

        const result = await useCase.execute({ userId });

        expect(result).toBeDefined();
        expect(result.data).toHaveLength(3);
        expect(result.pagination.page).toBe(1);
        expect(result.pagination.total).toBe(3);
      });

      it('should validate user exists', async () => {
        mockPlaceRepository.findByUserId.mockResolvedValue({
          data: [],
          pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
        });

        await useCase.execute({ userId });

        expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      });

      it('should convert places to DTOs', async () => {
        const mockResult: PaginatedResult<Place> = {
          data: mockPlaces,
          pagination: { page: 1, limit: 10, total: 3, totalPages: 1 },
        };
        mockPlaceRepository.findByUserId.mockResolvedValue(mockResult);

        const result = await useCase.execute({ userId });

        expect(result.data[0]).toHaveProperty('id');
        expect(result.data[0]).toHaveProperty('naverPlaceId');
        expect(result.data[0]).toHaveProperty('name');
        expect(result.data[0]).toHaveProperty('isActive');
      });

      it('should not include relations in DTOs', async () => {
        const mockResult: PaginatedResult<Place> = {
          data: mockPlaces,
          pagination: { page: 1, limit: 10, total: 3, totalPages: 1 },
        };
        mockPlaceRepository.findByUserId.mockResolvedValue(mockResult);

        const result = await useCase.execute({ userId });

        expect(result.data[0]).not.toHaveProperty('userId');
        expect(result.data[0]).not.toHaveProperty('keywordCount');
      });
    });

    describe('Pagination', () => {
      beforeEach(() => {
        mockUserRepository.findById.mockResolvedValue(mockUser);
      });

      it('should use custom page and limit', async () => {
        mockPlaceRepository.findByUserId.mockResolvedValue({
          data: mockPlaces.slice(0, 2),
          pagination: { page: 2, limit: 2, total: 10, totalPages: 5 },
        });

        const result = await useCase.execute({ userId, page: 2, limit: 2 });

        expect(mockPlaceRepository.findByUserId).toHaveBeenCalledWith(userId, {
          page: 2,
          limit: 2,
          sortBy: undefined,
          sortOrder: undefined,
        });
        expect(result.pagination.page).toBe(2);
        expect(result.pagination.limit).toBe(2);
      });

      it('should use custom sorting', async () => {
        mockPlaceRepository.findByUserId.mockResolvedValue({
          data: mockPlaces,
          pagination: { page: 1, limit: 10, total: 3, totalPages: 1 },
        });

        await useCase.execute({ userId, sortBy: 'createdAt', sortOrder: 'DESC' });

        expect(mockPlaceRepository.findByUserId).toHaveBeenCalledWith(userId, {
          page: undefined,
          limit: undefined,
          sortBy: 'createdAt',
          sortOrder: 'DESC',
        });
      });

      it('should handle empty results', async () => {
        mockPlaceRepository.findByUserId.mockResolvedValue({
          data: [],
          pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
        });

        const result = await useCase.execute({ userId });

        expect(result.data).toHaveLength(0);
        expect(result.pagination.total).toBe(0);
      });

      it('should handle last page with fewer items', async () => {
        mockPlaceRepository.findByUserId.mockResolvedValue({
          data: [mockPlaces[0]],
          pagination: { page: 3, limit: 10, total: 21, totalPages: 3 },
        });

        const result = await useCase.execute({ userId, page: 3, limit: 10 });

        expect(result.data).toHaveLength(1);
        expect(result.pagination.page).toBe(3);
        expect(result.pagination.totalPages).toBe(3);
      });
    });

    describe('Active Only Filter', () => {
      beforeEach(() => {
        mockUserRepository.findById.mockResolvedValue(mockUser);
      });

      it('should filter active places only when activeOnly is true', async () => {
        const activePlaces = [createMockPlace('1'), createMockPlace('2')];
        mockPlaceRepository.findActiveByUserId.mockResolvedValue(activePlaces);

        const result = await useCase.execute({ userId, activeOnly: true });

        expect(mockPlaceRepository.findActiveByUserId).toHaveBeenCalledWith(userId);
        expect(result.data).toHaveLength(2);
      });

      it('should manually paginate active places', async () => {
        const activePlaces = Array.from({ length: 25 }, (_, i) =>
          createMockPlace(`${i + 1}`)
        );
        mockPlaceRepository.findActiveByUserId.mockResolvedValue(activePlaces);

        const result = await useCase.execute({ userId, activeOnly: true, page: 2, limit: 10 });

        expect(result.data).toHaveLength(10);
        expect(result.pagination.page).toBe(2);
        expect(result.pagination.limit).toBe(10);
        expect(result.pagination.total).toBe(25);
        expect(result.pagination.totalPages).toBe(3);
      });

      it('should handle first page of active places', async () => {
        const activePlaces = Array.from({ length: 15 }, (_, i) =>
          createMockPlace(`${i + 1}`)
        );
        mockPlaceRepository.findActiveByUserId.mockResolvedValue(activePlaces);

        const result = await useCase.execute({ userId, activeOnly: true, page: 1, limit: 10 });

        expect(result.data).toHaveLength(10);
        expect(result.data[0].id).toBe('1');
        expect(result.data[9].id).toBe('10');
      });

      it('should handle last page of active places', async () => {
        const activePlaces = Array.from({ length: 25 }, (_, i) =>
          createMockPlace(`${i + 1}`)
        );
        mockPlaceRepository.findActiveByUserId.mockResolvedValue(activePlaces);

        const result = await useCase.execute({ userId, activeOnly: true, page: 3, limit: 10 });

        expect(result.data).toHaveLength(5);
        expect(result.pagination.totalPages).toBe(3);
      });

      it('should use default pagination for activeOnly', async () => {
        const activePlaces = Array.from({ length: 5 }, (_, i) => createMockPlace(`${i + 1}`));
        mockPlaceRepository.findActiveByUserId.mockResolvedValue(activePlaces);

        const result = await useCase.execute({ userId, activeOnly: true });

        expect(result.data).toHaveLength(5);
        expect(result.pagination.page).toBe(1);
        expect(result.pagination.limit).toBe(10);
      });

      it('should not call findByUserId when activeOnly is true', async () => {
        mockPlaceRepository.findActiveByUserId.mockResolvedValue([]);

        await useCase.execute({ userId, activeOnly: true });

        expect(mockPlaceRepository.findActiveByUserId).toHaveBeenCalled();
        expect(mockPlaceRepository.findByUserId).not.toHaveBeenCalled();
      });
    });

    describe('Error Cases', () => {
      it('should throw NotFoundError when user does not exist', async () => {
        mockUserRepository.findById.mockResolvedValue(null);

        await expect(useCase.execute({ userId })).rejects.toThrow(NotFoundError);
        await expect(useCase.execute({ userId })).rejects.toThrow(
          `User with id ${userId} not found`
        );
      });

      it('should propagate repository errors when finding user', async () => {
        const error = new Error('Database connection failed');
        mockUserRepository.findById.mockRejectedValue(error);

        await expect(useCase.execute({ userId })).rejects.toThrow(error);
      });

      it('should propagate repository errors when finding places', async () => {
        mockUserRepository.findById.mockResolvedValue(mockUser);
        const error = new Error('Failed to fetch places');
        mockPlaceRepository.findByUserId.mockRejectedValue(error);

        await expect(useCase.execute({ userId })).rejects.toThrow(error);
      });

      it('should propagate repository errors when finding active places', async () => {
        mockUserRepository.findById.mockResolvedValue(mockUser);
        const error = new Error('Failed to fetch active places');
        mockPlaceRepository.findActiveByUserId.mockRejectedValue(error);

        await expect(useCase.execute({ userId, activeOnly: true })).rejects.toThrow(error);
      });
    });

    describe('Boundary Conditions', () => {
      beforeEach(() => {
        mockUserRepository.findById.mockResolvedValue(mockUser);
      });

      it('should handle very large page number', async () => {
        mockPlaceRepository.findByUserId.mockResolvedValue({
          data: [],
          pagination: { page: 1000, limit: 10, total: 3, totalPages: 1 },
        });

        const result = await useCase.execute({ userId, page: 1000 });

        expect(result.data).toHaveLength(0);
      });

      it('should handle very large limit', async () => {
        mockPlaceRepository.findByUserId.mockResolvedValue({
          data: mockPlaces,
          pagination: { page: 1, limit: 1000, total: 3, totalPages: 1 },
        });

        const result = await useCase.execute({ userId, limit: 1000 });

        expect(result.pagination.limit).toBe(1000);
      });

      it('should handle sorting by different fields', async () => {
        mockPlaceRepository.findByUserId.mockResolvedValue({
          data: mockPlaces,
          pagination: { page: 1, limit: 10, total: 3, totalPages: 1 },
        });

        await useCase.execute({ userId, sortBy: 'name', sortOrder: 'ASC' });

        expect(mockPlaceRepository.findByUserId).toHaveBeenCalledWith(userId, {
          page: undefined,
          limit: undefined,
          sortBy: 'name',
          sortOrder: 'ASC',
        });
      });
    });

    describe('Method Call Order', () => {
      beforeEach(() => {
        mockUserRepository.findById.mockResolvedValue(mockUser);
        mockPlaceRepository.findByUserId.mockResolvedValue({
          data: mockPlaces,
          pagination: { page: 1, limit: 10, total: 3, totalPages: 1 },
        });
      });

      it('should validate user before fetching places', async () => {
        await useCase.execute({ userId });

        const findUserCall = mockUserRepository.findById.mock.invocationCallOrder[0];
        const findPlacesCall = mockPlaceRepository.findByUserId.mock.invocationCallOrder[0];

        expect(findUserCall).toBeLessThan(findPlacesCall);
      });

      it('should not fetch places if user not found', async () => {
        mockUserRepository.findById.mockResolvedValue(null);

        await expect(useCase.execute({ userId })).rejects.toThrow();

        expect(mockPlaceRepository.findByUserId).not.toHaveBeenCalled();
        expect(mockPlaceRepository.findActiveByUserId).not.toHaveBeenCalled();
      });
    });
  });
});
