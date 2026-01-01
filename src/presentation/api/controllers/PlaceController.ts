import { Request, Response, NextFunction } from 'express';
import { CreatePlaceUseCase } from '@application/usecases/place/CreatePlaceUseCase';
import { GetPlaceUseCase } from '@application/usecases/place/GetPlaceUseCase';
import { ListPlacesUseCase } from '@application/usecases/place/ListPlacesUseCase';
import { UpdatePlaceUseCase } from '@application/usecases/place/UpdatePlaceUseCase';
import { UpdatePlaceActiveStatusUseCase } from '@application/usecases/place/UpdatePlaceActiveStatusUseCase';
import { DeletePlaceUseCase } from '@application/usecases/place/DeletePlaceUseCase';
import { GetPlaceStatsUseCase } from '@application/usecases/place/GetPlaceStatsUseCase';
import { CreatePlaceDto } from '@application/dtos/place/CreatePlaceDto';
import { UpdatePlaceDto } from '@application/dtos/place/UpdatePlaceDto';
import { UpdatePlaceActiveStatusDto } from '@application/dtos/place/UpdatePlaceActiveStatusDto';
import { NotFoundError, BadRequestError } from '@application/errors/HttpError';

export class PlaceController {
  constructor(
    private readonly createPlaceUseCase: CreatePlaceUseCase,
    private readonly getPlaceUseCase: GetPlaceUseCase,
    private readonly listPlacesUseCase: ListPlacesUseCase,
    private readonly updatePlaceUseCase: UpdatePlaceUseCase,
    private readonly updatePlaceActiveStatusUseCase: UpdatePlaceActiveStatusUseCase,
    private readonly deletePlaceUseCase: DeletePlaceUseCase,
    private readonly getPlaceStatsUseCase: GetPlaceStatsUseCase
  ) {}

  /**
   * POST /api/places
   * Create a new place
   */
  createPlace = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const dto: CreatePlaceDto = req.body;
      const result = await this.createPlaceUseCase.execute(dto);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/places/:id
   * Get a single place by ID
   */
  getPlace = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new BadRequestError('Place ID is required');
      }

      const result = await this.getPlaceUseCase.execute(id);

      if (!result) {
        throw new NotFoundError('Place not found');
      }

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/places
   * List all places for a user
   * Query params: userId (required), page?, limit?, sortBy?, sortOrder?
   */
  listPlaces = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { userId, page, limit, sortBy, sortOrder } = req.query;

      if (!userId || typeof userId !== 'string') {
        throw new BadRequestError('userId query parameter is required');
      }

      // Parse pagination parameters
      const pageNum = page ? parseInt(page as string, 10) : 1;
      const limitNum = limit ? Math.min(parseInt(limit as string, 10), 100) : 10;
      const sortByField = (sortBy as string) || 'createdAt';
      const sortOrderValue = (sortOrder as 'ASC' | 'DESC') || 'DESC';

      // Validate pagination parameters
      if (isNaN(pageNum) || pageNum < 1) {
        throw new BadRequestError('page must be a positive integer');
      }
      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        throw new BadRequestError('limit must be between 1 and 100');
      }

      const result = await this.listPlacesUseCase.execute({
        userId,
        page: pageNum,
        limit: limitNum,
        sortBy: sortByField,
        sortOrder: sortOrderValue,
      });

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /api/places/:id
   * Update a place
   */
  updatePlace = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const dto: UpdatePlaceDto = req.body;

      const result = await this.updatePlaceUseCase.execute(id, dto);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/places/:id/status
   * Update place active status
   */
  updatePlaceActiveStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      if (typeof isActive !== 'boolean') {
        throw new BadRequestError('isActive must be a boolean');
      }

      const dto: UpdatePlaceActiveStatusDto = { isActive };
      const result = await this.updatePlaceActiveStatusUseCase.execute(id, dto);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/places/:id
   * Delete a place (soft delete by setting isActive to false)
   */
  deletePlace = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new BadRequestError('Place ID is required');
      }

      await this.deletePlaceUseCase.execute(id);

      res.status(200).json({
        success: true,
        message: 'Place deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/places/stats
   * Get place statistics for a user
   * Query params: userId (required)
   */
  getPlaceStats = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { userId } = req.query;

      if (!userId || typeof userId !== 'string') {
        throw new BadRequestError('userId query parameter is required');
      }

      const result = await this.getPlaceStatsUseCase.execute(userId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}
