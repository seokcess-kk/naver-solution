import { User } from '@domain/entities/User';

export class UserProfileResponseDto {
  id: string;
  email: string;
  name: string;
  createdAt: Date;

  constructor(id: string, email: string, name: string, createdAt: Date) {
    this.id = id;
    this.email = email;
    this.name = name;
    this.createdAt = createdAt;
  }

  static fromEntity(user: User): UserProfileResponseDto {
    return new UserProfileResponseDto(user.id, user.email, user.name, user.createdAt);
  }
}
