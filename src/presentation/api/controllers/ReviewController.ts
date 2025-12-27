import { Request, Response, NextFunction } from 'express';
import { RecordReviewUseCase } from '@application/usecases/tracking/review/RecordReviewUseCase';
import { GetPlaceReviewsUseCase } from '@application/usecases/tracking/review/GetPlaceReviewsUseCase';
import { GetReviewsBySentimentUseCase } from '@application/usecases/tracking/review/GetReviewsBySentimentUseCase';
import { RecordReviewDto } from '@application/dtos/tracking/review/RecordReviewDto';
import { GetReviewsDto } from '@application/dtos/tracking/review/GetReviewsDto';
import { BadRequestError } from '../utils/errors';

export class ReviewController {
  constructor(
    private readonly recordReviewUseCase: RecordReviewUseCase,
    private readonly getPlaceReviewsUseCase: GetPlaceReviewsUseCase,
    private readonly getReviewsBySentimentUseCase: GetReviewsBySentimentUseCase
  ) {}

  /**
   * POST /api/reviews
   * Record a new review
   */
  recordReview = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const dto: RecordReviewDto = req.body;
      const result = await this.recordReviewUseCase.execute(dto);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/reviews/place/:placeId
   * Get all reviews for a place
   * Query params: publishedAfter?, limit?, sentiment?, reviewType?
   */
  getPlaceReviews = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { placeId } = req.params;
      const { publishedAfter, limit, sentiment, reviewType } = req.query;

      if (!placeId) {
        throw new BadRequestError('placeId is required');
      }

      const dto: GetReviewsDto = {
        placeId,
        publishedAfter: publishedAfter ? new Date(publishedAfter as string) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        sentiment: sentiment as string | undefined,
        reviewType: reviewType as string | undefined,
      };

      const result = await this.getPlaceReviewsUseCase.execute(dto);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/reviews/place/:placeId/sentiment/:sentiment
   * Get reviews filtered by sentiment (POSITIVE, NEGATIVE, NEUTRAL)
   */
  getReviewsBySentiment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { placeId, sentiment } = req.params;

      if (!placeId) {
        throw new BadRequestError('placeId is required');
      }

      if (!sentiment || !['POSITIVE', 'NEGATIVE', 'NEUTRAL'].includes(sentiment.toUpperCase())) {
        throw new BadRequestError('sentiment must be one of: POSITIVE, NEGATIVE, NEUTRAL');
      }

      const result = await this.getReviewsBySentimentUseCase.execute(placeId, sentiment.toUpperCase());

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}
