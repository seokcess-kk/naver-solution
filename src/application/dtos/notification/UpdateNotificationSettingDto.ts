import { IsString, IsBoolean, IsOptional, IsObject, MaxLength } from 'class-validator';

export class UpdateNotificationSettingDto {
  @IsString()
  @MaxLength(50)
  @IsOptional()
  notificationType?: string;

  @IsString()
  @MaxLength(20)
  @IsOptional()
  channel?: string;

  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;

  @IsObject()
  @IsOptional()
  conditions?: Record<string, any>;
}
