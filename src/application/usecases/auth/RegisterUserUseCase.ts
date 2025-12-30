import { IUserRepository } from '@domain/repositories/IUserRepository';
import { IPasswordHashService } from '@domain/services/IPasswordHashService';
import { User } from '@domain/entities/User';
import { RegisterUserDto } from '@application/dtos/auth/RegisterUserDto';
import { UserProfileResponseDto } from '@application/dtos/auth/UserProfileResponseDto';
import { ConflictError } from '@application/errors/HttpError';

export class RegisterUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHashService: IPasswordHashService
  ) {}

  async execute(dto: RegisterUserDto): Promise<UserProfileResponseDto> {
    // 1. Check for duplicate email
    const existingUser = await this.userRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictError('Email already exists');
    }

    // 2. Hash password
    const passwordHash = await this.passwordHashService.hash(dto.password);

    // 3. Create User entity
    const user = new User();
    user.email = dto.email;
    user.passwordHash = passwordHash;
    user.name = dto.name;

    // 4. Save to repository
    const savedUser = await this.userRepository.save(user);

    // 5. Return user profile (without tokens - user needs to log in)
    return UserProfileResponseDto.fromEntity(savedUser);
  }
}
