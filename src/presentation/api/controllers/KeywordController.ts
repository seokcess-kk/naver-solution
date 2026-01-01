import { Request, Response, NextFunction } from 'express';
import { ListKeywordsUseCase } from '@application/usecases/keyword/ListKeywordsUseCase';
import { GetPlaceKeywordsUseCase } from '@application/usecases/keyword/GetPlaceKeywordsUseCase';
import { AddPlaceKeywordUseCase } from '@application/usecases/keyword/AddPlaceKeywordUseCase';
import { RemovePlaceKeywordUseCase } from '@application/usecases/keyword/RemovePlaceKeywordUseCase';
import { AddPlaceKeywordDto } from '@application/dtos/keyword';
import { BadRequestError } from '@application/errors/HttpError';

export class KeywordController {
  constructor(
    private readonly listKeywordsUseCase: ListKeywordsUseCase,
    private readonly getPlaceKeywordsUseCase: GetPlaceKeywordsUseCase,
    private readonly addPlaceKeywordUseCase: AddPlaceKeywordUseCase,
    private readonly removePlaceKeywordUseCase: RemovePlaceKeywordUseCase
  ) {}

  /**
   * GET /api/keywords
   * List all keywords
   */
  listKeywords = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await this.listKeywordsUseCase.execute();

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
