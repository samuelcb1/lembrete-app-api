import { IsString, IsOptional } from 'class-validator';
import { CreateReminderDto } from './create-reminder.dto';

export class CreateReminderRequestDto extends CreateReminderDto {
  @IsString()
  accessToken: string;

  @IsOptional()
  @IsString()
  refreshToken?: string;
}
