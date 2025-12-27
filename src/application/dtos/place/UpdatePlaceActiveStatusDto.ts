import { IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdatePlaceActiveStatusDto {
  @IsBoolean()
  @IsNotEmpty()
  isActive: boolean;
}
