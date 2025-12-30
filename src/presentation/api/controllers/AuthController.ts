import { Request, Response, NextFunction } from 'express';
import { RegisterUserUseCase } from '@application/usecases/auth/RegisterUserUseCase';
import { LoginUseCase } from '@application/usecases/auth/LoginUseCase';
import { RefreshTokenUseCase } from '@application/usecases/auth/RefreshTokenUseCase';
import { GetUserProfileUseCase } from '@application/usecases/auth/GetUserProfileUseCase';
import { LogoutUseCase } from '@application/usecases/auth/LogoutUseCase';
import { RegisterUserDto } from '@application/dtos/auth/RegisterUserDto';
import { LoginRequestDto } from '@application/dtos/auth/LoginRequestDto';
import { RefreshTokenRequestDto } from '@application/dtos/auth/RefreshTokenRequestDto';

export class AuthController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly getUserProfileUseCase: GetUserProfileUseCase,
    private readonly logoutUseCase: LogoutUseCase
  ) {}

  /**
   * POST /api/auth/register
   * Register a new user
   */
  register = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const dto: RegisterUserDto = req.body;
      const result = await this.registerUserUseCase.execute(dto);

      res.status(201).json({
        success: true,
        data: result,
        message: 'User registered successfully. Please log in.',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/auth/login
   * Login with email and password
   */
  login = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const dto: LoginRequestDto = req.body;
      const deviceInfo = req.headers['user-agent'] || undefined;
      const result = await this.loginUseCase.execute(dto, deviceInfo);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/auth/refresh
   * Refresh access token using refresh token
   */
  refreshToken = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const dto: RefreshTokenRequestDto = req.body;
      const result = await this.refreshTokenUseCase.execute(dto);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/auth/profile
   * Get current user profile (requires authentication)
   */
  getProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // req.user is set by authMiddleware
      const userId = req.user!.userId;
      const result = await this.getUserProfileUseCase.execute(userId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/auth/logout
   * Logout and revoke refresh token (requires authentication)
   */
  logout = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { refreshToken } = req.body;

      if (refreshToken) {
        await this.logoutUseCase.execute(refreshToken);
      }

      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  };
}
