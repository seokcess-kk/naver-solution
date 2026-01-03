import { IUserRepository } from '@domain/repositories/IUserRepository';
import { IPasswordHashService } from '@domain/services/IPasswordHashService';
import { ChangePasswordDto } from '@application/dtos/auth/ChangePasswordDto';
import { NotFoundError, UnauthorizedError } from '@application/errors/HttpError';

export class ChangePasswordUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHashService: IPasswordHashService
  ) {}

  async execute(userId: string, dto: ChangePasswordDto): Promise<void> {
    // 1. Find user by ID
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // 2. Verify old password
    const isOldPasswordValid = await this.passwordHashService.compare(
      dto.oldPassword,
      user.passwordHash
    );
    if (!isOldPasswordValid) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    // 3. Hash new password
    const newPasswordHash = await this.passwordHashService.hash(dto.newPassword);

    // 4. Update password
    await this.userRepository.update(userId, {
      passwordHash: newPasswordHash,
    });
  }
}
