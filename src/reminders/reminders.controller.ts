import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards, Req, ValidationPipe, Logger } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RemindersService } from './reminders.service';
import { CalendarService } from '../calendar/calendar.service';
import { UsersService } from '../users/users.service';
import { VisionService } from './vision.service';
import { CreateReminderDto } from '../calendar/dto/create-reminder.dto';
import { ExtractFromImageDto } from './dto/extract-from-image.dto';

@Controller('reminders')
@UseGuards(JwtAuthGuard)
export class RemindersController {
  private readonly logger = new Logger(RemindersController.name);

  constructor(
    private readonly remindersService: RemindersService,
    private readonly calendarService: CalendarService,
    private readonly usersService: UsersService,
    private readonly visionService: VisionService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body(ValidationPipe) reminder: CreateReminderDto, @Req() req: any) {
    const userId = req.user.userId;
    this.logger.log(`Received reminder create request for userId=${userId} summary=${reminder.summary}`);
    this.logger.log(`Reminder body: ${JSON.stringify(reminder)}`);

    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    let googleEventId: string | undefined;
    try {
      const googleEvent = await this.calendarService.createReminder(
        { accessToken: user.googleAccessToken, refreshToken: user.googleRefreshToken },
        reminder,
      );
      googleEventId = googleEvent.id || undefined;
    } catch (calendarError: any) {
      const detail = calendarError?.response?.data ?? calendarError?.message ?? calendarError;
      this.logger.warn(`Calendar sync failed for userId=${userId}: ${JSON.stringify(detail)}`);
    }

    const savedReminder = await this.remindersService.create(userId, reminder, googleEventId);

    return savedReminder;
  }

  @Post('extract-from-image')
  async extractFromImage(@Body(ValidationPipe) body: ExtractFromImageDto) {
    return this.visionService.extractReminderFromImage(body.image, body.mediaType);
  }

  @Get()
  async findAll(@Req() req: any) {
    const userId = req.user.userId;
    return this.remindersService.findByUserId(userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.userId;
    return this.remindersService.findById(id, userId);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body(ValidationPipe) reminder: Partial<CreateReminderDto>,
    @Req() req: any,
  ) {
    const userId = req.user.userId;
    return this.remindersService.update(id, userId, reminder);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.userId;
    await this.remindersService.softDelete(id, userId);
    return { message: 'Reminder deleted successfully' };
  }
}
