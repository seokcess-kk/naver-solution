import { Request, Response, NextFunction } from 'express';
import { DIContainer } from '../config/DIContainer';
import { IPlaceRepository } from '@domain/repositories/IPlaceRepository';
import { ICompetitorRepository } from '@domain/repositories/ICompetitorRepository';
import { IReviewRepository } from '@domain/repositories/IReviewRepository';
import { Place, Competitor, Review } from '@domain/entities';
import { UnauthorizedError, ForbiddenError, NotFoundError } from '@application/errors/HttpError';

type ResourceType = 'place' | 'competitor' | 'review';

/**
 * Factory function to create authorization middleware that checks resource ownership
 * @param container - DI Container
 * @param resourceType - Type of resource to check
 * @param idParam - Name of the parameter containing resource ID (default: 'id')
 * @returns Middleware function
 */
export function requireResourceOwnership(
  container: DIContainer,
  resourceType: ResourceType,
  idParam: string = 'id'
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // 1. Check if user is authenticated
      if (!req.user?.userId) {
        throw new UnauthorizedError('Authentication required');
      }

      // 2. Extract resource ID from params
      const resourceId = req.params[idParam];
      if (!resourceId) {
        throw new NotFoundError(`Resource ID parameter '${idParam}' not found`);
      }

      // 3. Get repository based on resource type
      let resource: Place | Competitor | Review | null = null;

      switch (resourceType) {
        case 'place': {
          const placeRepo = container.get('PlaceRepository');
          resource = await placeRepo.findById(resourceId);
          break;
        }
        case 'competitor': {
          const competitorRepo = container.get('CompetitorRepository');
          resource = await competitorRepo.findById(resourceId);
          break;
        }
        case 'review': {
          const reviewRepo = container.get('ReviewRepository');
          resource = await reviewRepo.findById(resourceId);
          break;
        }
        default:
          throw new Error(`Unsupported resource type: ${resourceType}`);
      }

      // 4. Check if resource exists
      if (!resource) {
        throw new NotFoundError(`${resourceType} not found`);
      }

      // 5. Check ownership
      // Type guard helper functions
      const isPlace = (r: Place | Competitor | Review): r is Place => resourceType === 'place';
      const isCompetitor = (r: Place | Competitor | Review): r is Competitor => resourceType === 'competitor';
      const isReview = (r: Place | Competitor | Review): r is Review => resourceType === 'review';

      let ownerId: string;

      if (isPlace(resource)) {
        ownerId = resource.user.id;
      } else if (isCompetitor(resource)) {
        // Competitor belongs to a Place, which belongs to a User
        ownerId = resource.place.user.id;
      } else if (isReview(resource)) {
        // Review belongs to a Place, which belongs to a User
        ownerId = resource.place.user.id;
      } else {
        throw new Error(`Ownership check not implemented for ${resourceType}`);
      }

      if (ownerId !== req.user.userId) {
        throw new ForbiddenError('You do not have permission to access this resource');
      }

      // 6. Ownership verified - proceed
      next();
    } catch (error) {
      next(error);
    }
  };
}
