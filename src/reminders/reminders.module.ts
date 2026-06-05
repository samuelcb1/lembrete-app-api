import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Reminder, ReminderSchema } from './schemas/reminder.schema';
import { RemindersService } from './reminders.service';
import { RemindersController } from './reminders.controller';
import { VisionService } from './vision.service';
import { CalendarModule } from '../calendar/calendar.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Reminder.name, schema: ReminderSchema }]),
    CalendarModule,
    UsersModule,
  ],
  controllers: [RemindersController],
  providers: [RemindersService, VisionService],
  exports: [RemindersService],
})
export class RemindersModule {}
