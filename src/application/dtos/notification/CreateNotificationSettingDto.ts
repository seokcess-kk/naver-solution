import { IsUUID, IsString, IsBoolean, IsOptional, IsObject, MaxLength } from 'class-validator';

export class CreateNotificationSettingDto {
  @IsUUID()
  userId: string;

  @IsUUID()
  @IsOptional()
  placeId?: string;

  @IsString()
  @MaxLength(50)
  notificationType: string;

  @IsString()
  @MaxLength(20)
  channel: string;

  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;

  @IsObject()
  @IsOptional()
  conditions?: Record<string, any>;
}
