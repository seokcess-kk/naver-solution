import { RegisterUserUseCase } from '@application/usecases/auth/RegisterUserUseCase';
import { IUserRepository } from '@domain/repositories/IUserRepository';
import { IPasswordHashService } from '@domain/services/IPasswordHashService';
import { RegisterUserDto } from '@application/dtos/auth/RegisterUserDto';
import { ConflictError } from '@application/errors/HttpError';
import { MockFactory } from '@tests/helpers/mock.helper';
import { UserFixture } from '@tests/fixtures/users';

describe('RegisterUserUseCase', () => {
  let useCase: RegisterUserUseCase;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockPasswordHashService: jest.Mocked<IPasswordHashService>;

  beforeEach(() => {
    // Create mocks using MockFactory
    mockUserRepository = MockFactory.createUserRepository();
    mockPasswordHashService = MockFactory.createPasswordHashService();

    // Create use case with mocked dependencies
    useCase = new RegisterUserUseCase(mockUserRepository, mockPasswordHashService);
  });

  describe('execute', () => {
    describe('Happy Path', () => {
      it('should successfully register a new user', async () => {
        // Arrange
        const dto: RegisterUserDto = {
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
        };

        const hashedPassword = 'hashedPassword123';
        const savedUser = UserFixture.withEmailAndName(dto.email, dto.name);
        savedUser.passwordHash = hashedPassword;

        mockUserRepository.findByEmail.mockResolvedValue(null);
        mockPasswordHashService.hash.mockResolvedValue(hashedPassword);
        mockUserRepository.save.mockResolvedValue(savedUser);

        // Act
        const result = await useCase.execute(dto);

        // Assert
        expect(result).toBeDefined();
        expect(result.email).toBe(dto.email);
        expect(result.name).toBe(dto.name);
        expect(result.id).toBeDefined();

        // Verify method calls
        expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(dto.email);
        expect(mockUserRepository.findByEmail).toHaveBeenCalledTimes(1);

        expect(mockPasswordHashService.hash).toHaveBeenCalledWith(dto.password);
        expect(mockPasswordHashService.hash).toHaveBeenCalledTimes(1);

        expect(mockUserRepository.save).toHaveBeenCalledTimes(1);
        const savedUserArg = mockUserRepository.save.mock.calls[0][0];
        expect(savedUserArg.email).toBe(dto.email);
        expect(savedUserArg.passwordHash).toBe(hashedPassword);
        expect(savedUserArg.name).toBe(dto.name);
      });

      it('should not return password hash in response', async () => {
        // Arrange
        const dto: RegisterUserDto = {
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
        };

        const savedUser = UserFixture.create();
        savedUser.passwordHash = 'hashedPassword123';

        mockUserRepository.findByEmail.mockResolvedValue(null);
        mockPasswordHashService.hash.mockResolvedValue('hashedPassword123');
        mockUserRepository.save.mockResolvedValue(savedUser);

        // Act
        const result = await useCase.execute(dto);

        // Assert
        expect(result).not.toHaveProperty('passwordHash');
        expect(result).not.toHaveProperty('password');
      });
    });

    describe('Error Cases', () => {
      it('should throw ConflictError when email already exists', async () => {
        // Arrange
        const dto: RegisterUserDto = {
          email: 'existing@example.com',
          password: 'password123',
          name: 'Test User',
        };

        const existingUser = UserFixture.withEmail(dto.email);
        mockUserRepository.findByEmail.mockResolvedValue(existingUser);

        // Act & Assert
        await expect(useCase.execute(dto)).rejects.toThrow(ConflictError);
        await expect(useCase.execute(dto)).rejects.toThrow('Email already exists');

        // Password should not be hashed if email exists
        expect(mockPasswordHashService.hash).not.toHaveBeenCalled();
        expect(mockUserRepository.save).not.toHaveBeenCalled();
      });

      it('should propagate password hashing errors', async () => {
        // Arrange
        const dto: RegisterUserDto = {
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
        };

        mockUserRepository.findByEmail.mockResolvedValue(null);
        mockPasswordHashService.hash.mockRejectedValue(
          new Error('Hashing service unavailable')
        );

        // Act & Assert
        await expect(useCase.execute(dto)).rejects.toThrow('Hashing service unavailable');
        expect(mockUserRepository.save).not.toHaveBeenCalled();
      });

      it('should propagate database save errors', async () => {
        // Arrange
        const dto: RegisterUserDto = {
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
        };

        mockUserRepository.findByEmail.mockResolvedValue(null);
        mockPasswordHashService.hash.mockResolvedValue('hashedPassword');
        mockUserRepository.save.mockRejectedValue(
          new Error('Database connection failed')
        );

        // Act & Assert
        await expect(useCase.execute(dto)).rejects.toThrow('Database connection failed');
      });
    });

    describe('Boundary Conditions', () => {
      it('should handle email with uppercase letters', async () => {
        // Arrange
        const dto: RegisterUserDto = {
          email: 'TEST@EXAMPLE.COM',
          password: 'password123',
          name: 'Test User',
        };

        const savedUser = UserFixture.withEmail(dto.email);

        mockUserRepository.findByEmail.mockResolvedValue(null);
        mockPasswordHashService.hash.mockResolvedValue('hashedPassword');
        mockUserRepository.save.mockResolvedValue(savedUser);

        // Act
        const result = await useCase.execute(dto);

        // Assert
        expect(result.email).toBe(dto.email);
        expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(dto.email);
      });

      it('should handle names with special characters', async () => {
        // Arrange
        const dto: RegisterUserDto = {
          email: 'test@example.com',
          password: 'password123',
          name: "O'Brien-Smith",
        };

        const savedUser = UserFixture.withName(dto.name);

        mockUserRepository.findByEmail.mockResolvedValue(null);
        mockPasswordHashService.hash.mockResolvedValue('hashedPassword');
        mockUserRepository.save.mockResolvedValue(savedUser);

        // Act
        const result = await useCase.execute(dto);

        // Assert
        expect(result.name).toBe(dto.name);
      });

      it('should handle long passwords', async () => {
        // Arrange
        const longPassword = 'a'.repeat(100); // 100 character password
        const dto: RegisterUserDto = {
          email: 'test@example.com',
          password: longPassword,
          name: 'Test User',
        };

        const savedUser = UserFixture.create();

        mockUserRepository.findByEmail.mockResolvedValue(null);
        mockPasswordHashService.hash.mockResolvedValue('hashedLongPassword');
        mockUserRepository.save.mockResolvedValue(savedUser);

        // Act
        const result = await useCase.execute(dto);

        // Assert
        expect(result).toBeDefined();
        expect(mockPasswordHashService.hash).toHaveBeenCalledWith(longPassword);
      });
    });

    describe('Method Call Order', () => {
      it('should check for existing email before hashing password', async () => {
        // Arrange
        const dto: RegisterUserDto = {
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
        };

        const savedUser = UserFixture.create();

        mockUserRepository.findByEmail.mockResolvedValue(null);
        mockPasswordHashService.hash.mockResolvedValue('hashedPassword');
        mockUserRepository.save.mockResolvedValue(savedUser);

        // Act
        await useCase.execute(dto);

        // Assert - findByEmail should be called before hash
        const findByEmailOrder = mockUserRepository.findByEmail.mock.invocationCallOrder[0];
        const hashOrder = mockPasswordHashService.hash.mock.invocationCallOrder[0];
        expect(findByEmailOrder).toBeLessThan(hashOrder);
      });

      it('should hash password before saving user', async () => {
        // Arrange
        const dto: RegisterUserDto = {
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
        };

        const savedUser = UserFixture.create();

        mockUserRepository.findByEmail.mockResolvedValue(null);
        mockPasswordHashService.hash.mockResolvedValue('hashedPassword');
        mockUserRepository.save.mockResolvedValue(savedUser);

        // Act
        await useCase.execute(dto);

        // Assert - hash should be called before save
        const hashOrder = mockPasswordHashService.hash.mock.invocationCallOrder[0];
        const saveOrder = mockUserRepository.save.mock.invocationCallOrder[0];
        expect(hashOrder).toBeLessThan(saveOrder);
      });
    });
  });
});
