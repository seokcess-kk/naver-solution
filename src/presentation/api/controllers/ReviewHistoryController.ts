import { Request, Response, NextFunction } from 'express';
import { RecordReviewHistoryUseCase } from '@application/usecases/tracking/review-history/RecordReviewHistoryUseCase';
import { GetReviewHistoryUseCase } from '@application/usecases/tracking/review-history/GetReviewHistoryUseCase';
import { GetLatestReviewStatsUseCase } from '@application/usecases/tracking/review-history/GetLatestReviewStatsUseCase';
import { RecordReviewHistoryDto } from '@application/dtos/tracking/review-history/RecordReviewHistoryDto';
import { GetReviewHistoryDto } from '@application/dtos/tracking/review-history/GetReviewHistoryDto';
import { BadRequestError } from '../utils/errors';

export class ReviewHistoryController {
  constructor(
    private readonly recordReviewHistoryUseCase: RecordReviewHistoryUseCase,
    private readonly getReviewHistoryUseCase: GetReviewHistoryUseCase,
    private readonly getLatestReviewStatsUseCase: GetLatestReviewStatsUseCase
  ) {}

  /**
   * POST /api/review-history
   * Record review history snapshot
   */
  recordReviewHistory = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const dto: RecordReviewHistoryDto = req.body;
      const result = await this.recordReviewHistoryUseCase.execute(dto);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/review-history/place/:placeId
   * Get review history for a place
   * Query params: startDate?, endDate?
   */
  getReviewHistory = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { placeId } = req.params;
      const { startDate, endDate } = req.query;

      if (!placeId) {
        throw new BadRequestError('placeId is required');
      }

      const dto: GetReviewHistoryDto = {
        placeId,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      };

      const result = await this.getReviewHistoryUseCase.execute(dto);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/review-history/place/:placeId/latest
   * Get latest review stats for a place
   */
  getLatestReviewStats = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { placeId } = req.params;

      if (!placeId) {
        throw new BadRequestError('placeId is required');
      }

      const result = await this.getLatestReviewStatsUseCase.execute(placeId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}
