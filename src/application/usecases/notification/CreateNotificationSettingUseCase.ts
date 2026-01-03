import { INotificationSettingRepository } from '@domain/repositories/INotificationSettingRepository';
import { IUserRepository } from '@domain/repositories/IUserRepository';
import { IPlaceRepository } from '@domain/repositories/IPlaceRepository';
import { NotificationSetting } from '@domain/entities/NotificationSetting';
import { CreateNotificationSettingDto, NotificationSettingResponseDto } from '@application/dtos/notification';
import { NotFoundError } from '@application/errors/HttpError';

export class CreateNotificationSettingUseCase {
  constructor(
    private readonly notificationSettingRepository: INotificationSettingRepository,
    private readonly userRepository: IUserRepository,
    private readonly placeRepository: IPlaceRepository
  ) {}

  async execute(dto: CreateNotificationSettingDto): Promise<NotificationSettingResponseDto> {
    // Verify user exists
    const user = await this.userRepository.findById(dto.userId);
    if (!user) {
      throw new NotFoundError(`User with id ${dto.userId} not found`);
    }

    // Verify place exists if placeId is provided
    let place = null;
    if (dto.placeId) {
      place = await this.placeRepository.findById(dto.placeId);
      if (!place) {
        throw new NotFoundError(`Place with id ${dto.placeId} not found`);
      }
    }

    const setting = new NotificationSetting();
    setting.user = user;
    setting.place = place;
    setting.notificationType = dto.notificationType;
    setting.channel = dto.channel;
    setting.isEnabled = dto.isEnabled ?? true;
    setting.conditions = dto.conditions || null;

    const savedSetting = await this.notificationSettingRepository.save(setting);
    return NotificationSettingResponseDto.fromEntity(savedSetting);
  }
}
