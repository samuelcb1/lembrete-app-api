import { IsString, IsDateString, IsOptional } from 'class-validator';

export class CreateReminderDto {
  @IsString()
  summary: string;

  @IsDateString()
  startDateTime: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  endDateTime?: string;

  @IsOptional()
  @IsString()
  timeZone?: string;
}
