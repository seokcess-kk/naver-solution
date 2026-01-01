import { Request, Response, NextFunction } from 'express';
import { ListKeywordsUseCase } from '@application/usecases/keyword/ListKeywordsUseCase';
import { GetPlaceKeywordsUseCase } from '@application/usecases/keyword/GetPlaceKeywordsUseCase';
import { AddPlaceKeywordUseCase } from '@application/usecases/keyword/AddPlaceKeywordUseCase';
import { RemovePlaceKeywordUseCase } from '@application/usecases/keyword/RemovePlaceKeywordUseCase';
import { AddPlaceKeywordDto } from '@application/dtos/keyword';
import { BadRequestError, ValidationError } from '@application/errors/HttpError';
import { validate as isUuid } from 'uuid';

export class KeywordController {
  constructor(
    private readonly listKeywordsUseCase: ListKeywordsUseCase,
    private readonly getPlaceKeywordsUseCase: GetPlaceKeywordsUseCase,
    private readonly addPlaceKeywordUseCase: AddPlaceKeywordUseCase,
    private readonly removePlaceKeywordUseCase: RemovePlaceKeywordUseCase
  ) {}

  /**
   * GET /api/keywords
   * List all keywords with pagination
   */
  listKeywords = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const sortBy = req.query.sortBy as string | undefined;
      const sortOrder = req.query.sortOrder as 'ASC' | 'DESC' | undefined;

      const result = await this.listKeywordsUseCase.execute({
        page,
        limit,
        sortBy,
        sortOrder,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/keywords/place/:placeId
   * Get keywords for a specific place
   */
  getPlaceKeywords = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { placeId } = req.params;

      if (!placeId) {
        throw new BadRequestError('Place ID is required');
      }

      if (!isUuid(placeId)) {
        throw new ValidationError('Invalid place ID format');
      }

      const result = await this.getPlaceKeywordsUseCase.execute(placeId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/keywords/place
   * Add a keyword to a place
   */
  addPlaceKeyword = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const dto: AddPlaceKeywordDto = req.body;

      const result = await this.addPlaceKeywordUseCase.execute(dto);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/keywords/place/:placeKeywordId
   * Remove a keyword from a place
   */
  removePlaceKeyword = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { placeKeywordId } = req.params;

      if (!placeKeywordId) {
        throw new BadRequestError('PlaceKeyword ID is required');
      }

      if (!isUuid(placeKeywordId)) {
        throw new ValidationError('Invalid placeKeyword ID format');
      }

      await this.removePlaceKeywordUseCase.execute(placeKeywordId);

      res.status(200).json({
        success: true,
        message: 'Keyword removed from place successfully',
      });
    } catch (error) {
      next(error);
    }
  };
}
