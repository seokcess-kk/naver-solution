import { IRefreshTokenRepository } from '@domain/repositories/IRefreshTokenRepository';

export class LogoutUseCase {
  constructor(private readonly refreshTokenRepository: IRefreshTokenRepository) {}

  async execute(refreshToken: string): Promise<void> {
    // 1. Find refresh token in database
    const token = await this.refreshTokenRepository.findByToken(refreshToken);

    // 2. If token exists and not already revoked, revoke it
    if (token && !token.isRevoked) {
      await this.refreshTokenRepository.revokeToken(token.id);
    }

    // No error if token doesn't exist - logout is idempotent
  }
}
