import { Body, Controller, Post, BadRequestException, UsePipes, ValidationPipe, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { CalendarService } from './calendar.service';
import { CreateReminderRequestDto } from './dto/create-reminder-request.dto';

@Controller('calendar')
@UseGuards(JwtAuthGuard)
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Post('reminders')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async createReminder(@Body() body: CreateReminderRequestDto, @Req() req: any) {
    if (!body.accessToken) {
      throw new BadRequestException('accessToken is required to save reminders in Google Calendar');
    }

    const { accessToken, refreshToken, ...reminder } = body;
    return this.calendarService.createReminder({ accessToken, refreshToken }, reminder);
  }
}
