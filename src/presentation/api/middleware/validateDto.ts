import { Request, Response, NextFunction } from 'express';
import { plainToInstance } from 'class-transformer';
import { validate, ValidationError as ClassValidatorError } from 'class-validator';
import { ValidationError } from '@application/errors/HttpError';

type ClassType<T> = new (...args: any[]) => T;

/**
 * Middleware factory for DTO validation
 * Transforms request body to DTO class instance and validates using class-validator
 *
 * @param dtoClass - The DTO class to validate against
 * @returns Express middleware function
 */
export const validateDto = <T extends object>(dtoClass: ClassType<T>) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Transform plain object to class instance
      const dtoInstance = plainToInstance(dtoClass, req.body);

      // Validate the DTO instance
      const errors: ClassValidatorError[] = await validate(dtoInstance as object, {
        whitelist: true, // Strip properties that don't have decorators
        forbidNonWhitelisted: true, // Throw error if non-whitelisted properties exist
      });

      // If validation fails, format errors and throw ValidationError
      if (errors.length > 0) {
        const formattedErrors = errors.map((error) => ({
          field: error.property,
          errors: Object.values(error.constraints || {}),
        }));

        throw new ValidationError('Validation failed', formattedErrors);
      }

      // Replace request body with validated DTO instance
      req.body = dtoInstance;

      next();
    } catch (error) {
      next(error);
    }
  };
};
