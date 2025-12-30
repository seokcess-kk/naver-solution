import { IRefreshTokenRepository } from '@domain/repositories/IRefreshTokenRepository';
import { IJwtAuthService } from '@domain/services/IJwtAuthService';
import { RefreshToken } from '@domain/entities/RefreshToken';
import { RefreshTokenRequestDto } from '@application/dtos/auth/RefreshTokenRequestDto';
import { RefreshTokenResponseDto } from '@application/dtos/auth/RefreshTokenResponseDto';
import { UnauthorizedError } from '@application/errors/HttpError';

export class RefreshTokenUseCase {
  constructor(
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly jwtAuthService: IJwtAuthService
  ) {}

  async execute(dto: RefreshTokenRequestDto): Promise<RefreshTokenResponseDto> {
    // 1. Verify JWT signature
    let userId: string;
    try {
      const decoded = this.jwtAuthService.verifyRefreshToken(dto.refreshToken);
      userId = decoded.userId;
    } catch (error) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    // 2. Find token in database
    const refreshToken = await this.refreshTokenRepository.findByToken(dto.refreshToken);
    if (!refreshToken) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    // 3. Check if token is revoked
    if (refreshToken.isRevoked) {
      throw new UnauthorizedError('Refresh token has been revoked');
    }

    // 4. Check if token is expired
    if (refreshToken.expiresAt < new Date()) {
      throw new UnauthorizedError('Refresh token has expired');
    }

    // 5. Generate new token pair (Token Rotation)
    const newAccessToken = this.jwtAuthService.generateAccessToken(userId);
    const newRefreshTokenValue = this.jwtAuthService.generateRefreshToken(userId);

    // 6. Revoke old refresh token
    await this.refreshTokenRepository.revokeToken(refreshToken.id);

    // 7. Save new refresh token
    const newRefreshToken = new RefreshToken();
    newRefreshToken.user = refreshToken.user;
    newRefreshToken.token = newRefreshTokenValue;
    newRefreshToken.deviceInfo = refreshToken.deviceInfo;

    // Calculate expiration date (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    newRefreshToken.expiresAt = expiresAt;

    await this.refreshTokenRepository.save(newRefreshToken);

    // 8. Return new tokens
    return new RefreshTokenResponseDto(newAccessToken, newRefreshTokenValue);
  }
}
