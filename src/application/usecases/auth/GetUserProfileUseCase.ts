import { IUserRepository } from '@domain/repositories/IUserRepository';
import { UserProfileResponseDto } from '@application/dtos/auth/UserProfileResponseDto';
import { NotFoundError } from '@application/errors/HttpError';

export class GetUserProfileUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(userId: string): Promise<UserProfileResponseDto> {
    // 1. Find user by ID
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // 2. Return user profile
    return UserProfileResponseDto.fromEntity(user);
  }
}
