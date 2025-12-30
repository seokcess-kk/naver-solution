import { GetUserProfileUseCase } from '@application/usecases/auth/GetUserProfileUseCase';
import { IUserRepository } from '@domain/repositories/IUserRepository';
import { User } from '@domain/entities/User';
import { NotFoundError } from '@application/errors/HttpError';
import { MockFactory } from '@tests/helpers/mock.helper';

describe('GetUserProfileUseCase', () => {
  let useCase: GetUserProfileUseCase;
  let mockUserRepository: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    mockUserRepository = MockFactory.createUserRepository();
    useCase = new GetUserProfileUseCase(mockUserRepository);
  });

  describe('execute', () => {
    const userId = 'user-123';
    const mockUser: User = {
      id: userId,
      email: 'test@example.com',
      passwordHash: 'hashedPassword',
      name: 'Test User',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
      places: [],
      notificationSettings: [],
      refreshTokens: [],
    };

    describe('Happy Path', () => {
      beforeEach(() => {
        mockUserRepository.findById.mockResolvedValue(mockUser);
      });

      it('should return user profile for valid user ID', async () => {
        const result = await useCase.execute(userId);

        expect(result).toBeDefined();
        expect(result.id).toBe(mockUser.id);
        expect(result.email).toBe(mockUser.email);
        expect(result.name).toBe(mockUser.name);
        expect(result.createdAt).toBe(mockUser.createdAt);
      });

      it('should not include password hash in response', async () => {
        const result = await useCase.execute(userId);

        expect(result).not.toHaveProperty('passwordHash');
      });

      it('should not include updatedAt in response', async () => {
        const result = await useCase.execute(userId);

        expect(result).not.toHaveProperty('updatedAt');
      });

      it('should call repository with correct user ID', async () => {
        await useCase.execute(userId);

        expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
        expect(mockUserRepository.findById).toHaveBeenCalledTimes(1);
      });
    });

    describe('Error Cases', () => {
      it('should throw NotFoundError when user does not exist', async () => {
        mockUserRepository.findById.mockResolvedValue(null);

        await expect(useCase.execute(userId)).rejects.toThrow(NotFoundError);
        await expect(useCase.execute(userId)).rejects.toThrow('User not found');
      });

      it('should propagate repository errors', async () => {
        const error = new Error('Database connection failed');
        mockUserRepository.findById.mockRejectedValue(error);

        await expect(useCase.execute(userId)).rejects.toThrow(error);
      });
    });

    describe('Boundary Conditions', () => {
      it('should handle user with empty name', async () => {
        const userWithEmptyName = { ...mockUser, name: '' };
        mockUserRepository.findById.mockResolvedValue(userWithEmptyName);

        const result = await useCase.execute(userId);

        expect(result.name).toBe('');
      });

      it('should handle user with very long name', async () => {
        const longName = 'A'.repeat(200);
        const userWithLongName = { ...mockUser, name: longName };
        mockUserRepository.findById.mockResolvedValue(userWithLongName);

        const result = await useCase.execute(userId);

        expect(result.name).toBe(longName);
      });

      it('should handle different user ID formats', async () => {
        const uuidUserId = '550e8400-e29b-41d4-a716-446655440000';
        mockUserRepository.findById.mockResolvedValue(mockUser);

        await useCase.execute(uuidUserId);

        expect(mockUserRepository.findById).toHaveBeenCalledWith(uuidUserId);
      });
    });
  });
});
