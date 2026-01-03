import { Request, Response, NextFunction } from 'express';
import { GetUserNotificationSettingsUseCase } from '@application/usecases/notification/GetUserNotificationSettingsUseCase';
import { CreateNotificationSettingUseCase } from '@application/usecases/notification/CreateNotificationSettingUseCase';
import { UpdateNotificationSettingUseCase } from '@application/usecases/notification/UpdateNotificationSettingUseCase';
import { DeleteNotificationSettingUseCase } from '@application/usecases/notification/DeleteNotificationSettingUseCase';
import { GetNotificationLogsUseCase } from '@application/usecases/notification/GetNotificationLogsUseCase';
import { CreateNotificationSettingDto, UpdateNotificationSettingDto } from '@application/dtos/notification';
import { BadRequestError } from '@application/errors/HttpError';

export class NotificationController {
  constructor(
    private readonly getUserNotificationSettingsUseCase: GetUserNotificationSettingsUseCase,
    private readonly createNotificationSettingUseCase: CreateNotificationSettingUseCase,
    private readonly updateNotificationSettingUseCase: UpdateNotificationSettingUseCase,
    private readonly deleteNotificationSettingUseCase: DeleteNotificationSettingUseCase,
    private readonly getNotificationLogsUseCase: GetNotificationLogsUseCase
  ) {}

  /**
   * GET /api/notifications/settings/user/:userId
   * Get all notification settings for a user
   */
  getUserSettings = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { userId } = req.params;

      if (!userId) {
        throw new BadRequestError('userId is required');
      }

      const result = await this.getUserNotificationSettingsUseCase.execute(userId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/notifications/settings
   * Create a new notification setting
   */
  createSetting = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const dto: CreateNotificationSettingDto = req.body;
      const result = await this.createNotificationSettingUseCase.execute(dto);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/notifications/settings/:id
   * Update a notification setting
   */
  updateSetting = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const dto: UpdateNotificationSettingDto = req.body;

      if (!id) {
        throw new BadRequestError('id is required');
      }

      const result = await this.updateNotificationSettingUseCase.execute(id, dto);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/notifications/settings/:id
   * Delete a notification setting
   */
  deleteSetting = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new BadRequestError('id is required');
      }

      await this.deleteNotificationSettingUseCase.execute(id);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/notifications/logs/place/:placeId
   * Get notification logs for a place
   */
  getPlaceLogs = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { placeId } = req.params;
      const { limit } = req.query;

      if (!placeId) {
        throw new BadRequestError('placeId is required');
      }

      const result = await this.getNotificationLogsUseCase.execute(
        placeId,
        limit ? parseInt(limit as string) : undefined
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}
