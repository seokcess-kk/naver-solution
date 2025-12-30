import { IUserRepository } from '@domain/repositories/IUserRepository';
import { IRefreshTokenRepository } from '@domain/repositories/IRefreshTokenRepository';
import { IPasswordHashService } from '@domain/services/IPasswordHashService';
import { IJwtAuthService } from '@domain/services/IJwtAuthService';
import { RefreshToken } from '@domain/entities/RefreshToken';
import { LoginRequestDto } from '@application/dtos/auth/LoginRequestDto';
import { LoginResponseDto } from '@application/dtos/auth/LoginResponseDto';
import { UnauthorizedError } from '@application/errors/HttpError';

export class LoginUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHashService: IPasswordHashService,
    private readonly jwtAuthService: IJwtAuthService,
    private readonly refreshTokenRepository: IRefreshTokenRepository
  ) {}

  async execute(
    dto: LoginRequestDto,
    deviceInfo?: string
  ): Promise<LoginResponseDto> {
    // 1. Find user by email
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // 2. Verify password
    const isPasswordValid = await this.passwordHashService.compare(
      dto.password,
      user.passwordHash
    );
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // 3. Generate tokens
    const accessToken = this.jwtAuthService.generateAccessToken(user.id);
    const refreshTokenValue = this.jwtAuthService.generateRefreshToken(user.id);

    // 4. Save refresh token to database
    const refreshToken = new RefreshToken();
    refreshToken.user = user;
    refreshToken.token = refreshTokenValue;
    refreshToken.deviceInfo = deviceInfo || null;

    // Calculate expiration date (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    refreshToken.expiresAt = expiresAt;

    await this.refreshTokenRepository.save(refreshToken);

    // 5. Return login response
    return new LoginResponseDto(accessToken, refreshTokenValue, {
      id: user.id,
      email: user.email,
      name: user.name,
    });
  }
}
