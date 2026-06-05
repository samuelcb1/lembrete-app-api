import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';
import { CalendarService } from './calendar.service';
import { CalendarController } from './calendar.controller';

@Module({
  imports: [ConfigModule, AuthModule],
  controllers: [CalendarController],
  providers: [CalendarService],
  exports: [CalendarService],
})
export class CalendarModule {}
