import { User } from '../entities/User';
import { IBaseRepository } from './IBaseRepository';

/**
 * User Repository Interface
 * Extends IBaseRepository with User-specific query methods
 */
export interface IUserRepository extends IBaseRepository<User> {
  /**
   * Find a user by email address
   * @param email - The email address to search for
   * @returns The user if found, null otherwise
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Check if a user exists with the given email
   * @param email - The email address to check
   * @returns true if a user with this email exists, false otherwise
   */
  existsByEmail(email: string): Promise<boolean>;
}
