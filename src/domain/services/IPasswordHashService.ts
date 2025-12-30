/**
 * Interface for password hashing operations
 * Defines contract for password encryption and verification
 */
export interface IPasswordHashService {
  /**
   * Hash a plain text password
   * @param password - Plain text password
   * @returns Hashed password
   */
  hash(password: string): Promise<string>;

  /**
   * Compare a plain text password with a hashed password
   * @param password - Plain text password
   * @param hash - Hashed password to compare against
   * @returns True if passwords match, false otherwise
   */
  compare(password: string, hash: string): Promise<boolean>;
}
