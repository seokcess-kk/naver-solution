import { IUserRepository } from '@domain/repositories/IUserRepository';
import { UserProfileResponseDto } from '@application/dtos/auth/UserProfileResponseDto';
import { UpdateUserProfileDto } from '@application/dtos/auth/UpdateUserProfileDto';
import { NotFoundError, ConflictError } from '@application/errors/HttpError';

export class UpdateUserProfileUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(userId: string, dto: UpdateUserProfileDto): Promise<UserProfileResponseDto> {
    // 1. Find user by ID
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // 2. Check if email is being changed and if it's already in use by another user
    if (dto.email && dto.email !== user.email) {
      const existingUser = await this.userRepository.findByEmail(dto.email);
      if (existingUser && existingUser.id !== userId) {
        throw new ConflictError('Email already in use');
      }
    }

    // 3. Update user profile
    const updatedUser = await this.userRepository.update(userId, {
      ...(dto.email && { email: dto.email }),
      ...(dto.name && { name: dto.name }),
    });

    // 4. Return updated profile
    return UserProfileResponseDto.fromEntity(updatedUser);
  }
}
