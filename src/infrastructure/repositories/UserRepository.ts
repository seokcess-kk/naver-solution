import { DataSource, Repository } from 'typeorm';
import { IUserRepository } from '@domain/repositories/IUserRepository';
import { PaginationOptions, PaginatedResult } from '@domain/repositories/IBaseRepository';
import { User } from '@domain/entities/User';
import { NotFoundError } from '@application/errors/HttpError';

export class UserRepository implements IUserRepository {
  private readonly repository: Repository<User>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(User);
  }

  async findById(id: string): Promise<User | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findAll(options: PaginationOptions = {}): Promise<PaginatedResult<User>> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC' } = options;
    const skip = (page - 1) * limit;

    const [data, total] = await this.repository.findAndCount({
      skip,
      take: limit,
      order: { [sortBy]: sortOrder },
    });

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async save(user: User): Promise<User> {
    return this.repository.save(user);
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    const exists = await this.exists(id);
    if (!exists) {
      throw new NotFoundError(`User with id ${id} not found`);
    }
    await this.repository.update(id, data);
    return (await this.findById(id))!;
  }

  async delete(id: string): Promise<void> {
    const exists = await this.exists(id);
    if (!exists) {
      throw new NotFoundError(`User with id ${id} not found`);
    }
    await this.repository.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    return this.repository.exist({ where: { id } });
  }

  async count(): Promise<number> {
    return this.repository.count();
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repository
      .createQueryBuilder('user')
      .where('LOWER(user.email) = LOWER(:email)', { email })
      .getOne();
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.repository
      .createQueryBuilder('user')
      .where('LOWER(user.email) = LOWER(:email)', { email })
      .getCount();
    return count > 0;
  }
}
