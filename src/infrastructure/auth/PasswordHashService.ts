import bcrypt from 'bcrypt';
import { IPasswordHashService } from '@domain/services/IPasswordHashService';

/**
 * Service for hashing and verifying passwords using bcrypt
 */
export class PasswordHashService implements IPasswordHashService {
  private readonly saltRounds: number;

  constructor() {
    this.saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);
  }

  /**
   * Hash a plain text password
   * @param password - Plain text password
   * @returns Hashed password
   */
  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  /**
   * Compare a plain text password with a hashed password
   * @param password - Plain text password
   * @param hash - Hashed password to compare against
   * @returns True if passwords match, false otherwise
   */
  async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
