import { User } from '@domain/entities/User';
import { randomUUID } from 'crypto';

/**
 * Fixture factory for creating User test data
 */
export class UserFixture {
  private static counter = 0;

  /**
   * Create a single user with optional overrides
   */
  static create(overrides?: Partial<User>): User {
    this.counter++;
    const user = new User();
    user.id = randomUUID();
    user.email = `user${this.counter}@example.com`;
    user.passwordHash = 'hashedPassword123'; // Default hashed password
    user.name = `Test User ${this.counter}`;
    user.createdAt = new Date();
    user.updatedAt = new Date();
    user.places = [];
    user.notificationSettings = [];
    user.refreshTokens = [];

    return Object.assign(user, overrides);
  }

  /**
   * Create multiple users
   */
  static createMany(count: number, overrides?: Partial<User>): User[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }

  /**
   * Create a registered user with a specific email
   * Useful for consistent test scenarios
   */
  static registered(): User {
    return this.create({
      email: 'registered@example.com',
      name: 'Registered User',
    });
  }

  /**
   * Create an admin user
   */
  static admin(): User {
    return this.create({
      email: 'admin@example.com',
      name: 'Admin User',
    });
  }

  /**
   * Create a user with a specific email
   */
  static withEmail(email: string): User {
    return this.create({ email });
  }

  /**
   * Create a user with a specific name
   */
  static withName(name: string): User {
    return this.create({ name });
  }

  /**
   * Create a user with both email and name
   */
  static withEmailAndName(email: string, name: string): User {
    return this.create({ email, name });
  }
}
