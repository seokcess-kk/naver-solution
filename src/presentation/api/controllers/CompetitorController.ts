import { Request, Response, NextFunction } from 'express';
import { AddCompetitorUseCase } from '@application/usecases/tracking/competitor/AddCompetitorUseCase';
import { RecordCompetitorSnapshotUseCase } from '@application/usecases/tracking/competitor/RecordCompetitorSnapshotUseCase';
import { GetCompetitorHistoryUseCase } from '@application/usecases/tracking/competitor/GetCompetitorHistoryUseCase';
import { GetPlaceCompetitorsUseCase } from '@application/usecases/tracking/competitor/GetPlaceCompetitorsUseCase';
import { AddCompetitorDto } from '@application/dtos/tracking/competitor/AddCompetitorDto';
import { RecordCompetitorSnapshotDto } from '@application/dtos/tracking/competitor/RecordCompetitorSnapshotDto';
import { GetCompetitorHistoryDto } from '@application/dtos/tracking/competitor/GetCompetitorHistoryDto';
import { GetPlaceCompetitorsDto } from '@application/dtos/tracking/competitor/GetPlaceCompetitorsDto';
import { BadRequestError } from '@application/errors/HttpError';

export class CompetitorController {
  constructor(
    private readonly addCompetitorUseCase: AddCompetitorUseCase,
    private readonly recordCompetitorSnapshotUseCase: RecordCompetitorSnapshotUseCase,
    private readonly getCompetitorHistoryUseCase: GetCompetitorHistoryUseCase,
    private readonly getPlaceCompetitorsUseCase: GetPlaceCompetitorsUseCase
  ) {}

  /**
   * POST /api/competitors
   * Add a new competitor
   */
  addCompetitor = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const dto: AddCompetitorDto = req.body;
      const result = await this.addCompetitorUseCase.execute(dto);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/competitors/snapshots
   * Record a competitor snapshot
   */
  recordCompetitorSnapshot = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const dto: RecordCompetitorSnapshotDto = req.body;
      const result = await this.recordCompetitorSnapshotUseCase.execute(dto);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/competitors/place/:placeId
   * Get all competitors for a place
   * Query params: activeOnly?
   */
  getPlaceCompetitors = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { placeId } = req.params;
      const { activeOnly } = req.query;

      if (!placeId) {
        throw new BadRequestError('placeId is required');
      }

      const dto: GetPlaceCompetitorsDto = {
        placeId,
        activeOnly: activeOnly === 'true',
      };

      const result = await this.getPlaceCompetitorsUseCase.execute(dto);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/competitors/:competitorId/history
   * Get competitor history
   * Query params: startDate?, endDate?
   */
  getCompetitorHistory = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { competitorId } = req.params;
      const { startDate, endDate } = req.query;

      if (!competitorId) {
        throw new BadRequestError('competitorId is required');
      }

      const dto: GetCompetitorHistoryDto = {
        competitorId,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      };

      const result = await this.getCompetitorHistoryUseCase.execute(dto);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}
