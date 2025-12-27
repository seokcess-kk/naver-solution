import { Request, Response, NextFunction } from 'express';
import { RecordRankingUseCase } from '@application/usecases/tracking/ranking/RecordRankingUseCase';
import { GetRankingHistoryUseCase } from '@application/usecases/tracking/ranking/GetRankingHistoryUseCase';
import { GetLatestRankingUseCase } from '@application/usecases/tracking/ranking/GetLatestRankingUseCase';
import { RecordRankingDto } from '@application/dtos/tracking/ranking/RecordRankingDto';
import { GetRankingHistoryDto } from '@application/dtos/tracking/ranking/GetRankingHistoryDto';
import { BadRequestError } from '../utils/errors';

export class RankingController {
  constructor(
    private readonly recordRankingUseCase: RecordRankingUseCase,
    private readonly getRankingHistoryUseCase: GetRankingHistoryUseCase,
    private readonly getLatestRankingUseCase: GetLatestRankingUseCase
  ) {}

  /**
   * POST /api/rankings
   * Record a new ranking entry
   */
  recordRanking = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const dto: RecordRankingDto = req.body;
      const result = await this.recordRankingUseCase.execute(dto);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/rankings/history
   * Get ranking history for a place-keyword combination
   * Query params: placeKeywordId, startDate?, endDate?
   */
  getRankingHistory = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { placeKeywordId, startDate, endDate } = req.query;

      if (!placeKeywordId || typeof placeKeywordId !== 'string') {
        throw new BadRequestError('placeKeywordId query parameter is required');
      }

      const dto: GetRankingHistoryDto = {
        placeKeywordId,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      };

      const result = await this.getRankingHistoryUseCase.execute(dto);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/rankings/latest/:placeKeywordId
   * Get the latest ranking for a place-keyword combination
   */
  getLatestRanking = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { placeKeywordId } = req.params;

      if (!placeKeywordId) {
        throw new BadRequestError('placeKeywordId is required');
      }

      const result = await this.getLatestRankingUseCase.execute(placeKeywordId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}
