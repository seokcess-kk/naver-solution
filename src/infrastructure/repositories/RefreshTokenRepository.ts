import { DataSource, Repository, LessThan } from 'typeorm';
import { IRefreshTokenRepository } from '@domain/repositories/IRefreshTokenRepository';
import { PaginationOptions, PaginatedResult } from '@domain/repositories/IBaseRepository';
import { RefreshToken } from '@domain/entities/RefreshToken';
import { NotFoundError } from '@application/errors/HttpError';

export class RefreshTokenRepository implements IRefreshTokenRepository {
  private readonly repository: Repository<RefreshToken>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(RefreshToken);
  }

  async findById(id: string): Promise<RefreshToken | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findAll(options: PaginationOptions = {}): Promise<PaginatedResult<RefreshToken>> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC' } = options;
    const skip = (page - 1) * limit;

    const [data, total] = await this.repository.findAndCount({
      skip,
      take: limit,
      order: { [sortBy]: sortOrder },
      relations: ['user'],
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

  async save(refreshToken: RefreshToken): Promise<RefreshToken> {
    return this.repository.save(refreshToken);
  }

  async update(id: string, data: Partial<RefreshToken>): Promise<RefreshToken> {
    const exists = await this.exists(id);
    if (!exists) {
      throw new NotFoundError(`RefreshToken with id ${id} not found`);
    }
    await this.repository.update(id, data);
    return (await this.findById(id))!;
  }

  async delete(id: string): Promise<void> {
    const exists = await this.exists(id);
    if (!exists) {
      throw new NotFoundError(`RefreshToken with id ${id} not found`);
    }
    await this.repository.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    return this.repository.exist({ where: { id } });
  }

  async count(): Promise<number> {
    return this.repository.count();
  }

  async findByToken(token: string): Promise<RefreshToken | null> {
    return this.repository.findOne({
      where: { token },
      relations: ['user'],
    });
  }

  async findByUserId(userId: string): Promise<RefreshToken[]> {
    return this.repository.find({
      where: { user: { id: userId } },
      relations: ['user'],
    });
  }

  async revokeToken(id: string): Promise<void> {
    await this.repository.update(id, {
      isRevoked: true,
      revokedAt: new Date(),
    });
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.repository.update(
      { user: { id: userId }, isRevoked: false },
      {
        isRevoked: true,
        revokedAt: new Date(),
      }
    );
  }

  async deleteExpiredTokens(): Promise<void> {
    await this.repository.delete({
      expiresAt: LessThan(new Date()),
    });
  }
}
