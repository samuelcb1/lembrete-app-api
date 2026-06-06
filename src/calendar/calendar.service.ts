import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { google } from 'googleapis';
import { AuthService } from '../auth/auth.service';
import { CreateReminderDto } from './dto/create-reminder.dto';

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);

  constructor(private readonly authService: AuthService) { }

  async createReminder(
    tokens: { accessToken?: string; refreshToken?: string },
    reminder: CreateReminderDto,
  ) {
    this.logger.log(
      `createReminder: accessToken=${tokens.accessToken ? 'present' : 'missing'} refreshToken=${tokens.refreshToken ? 'present' : 'missing'}`,
    );

    if (!tokens?.refreshToken && !tokens?.accessToken) {
      throw new UnauthorizedException(
        'No Google tokens available. The user must sign out and sign in again to grant Calendar access.',
      );
    }

    let authClient: ReturnType<AuthService['createOAuth2Client']>;

    if (tokens.refreshToken) {
      authClient = this.authService.createOAuth2Client({ refreshToken: tokens.refreshToken });
      const { token } = await authClient.getAccessToken();
      this.logger.log(`Got fresh access token via refresh token: ${token ? 'ok' : 'EMPTY — refresh token may be invalid or missing Calendar scope'}`);
      if (!token) {
        throw new UnauthorizedException(
          'Failed to obtain a Google access token. The refresh token may be revoked or lack Calendar scope.',
        );
      }
    } else {
      this.logger.warn('No refresh token — using access token directly. Calendar calls will fail once the token expires.');
      authClient = this.authService.createOAuth2Client({ accessToken: tokens.accessToken });
    }

    const calendar = google.calendar({ version: 'v3', auth: authClient });
    const timeZone = reminder.timeZone ?? 'America/Sao_Paulo';
    const hasExplicitOffset = (dt: string) =>
      dt.endsWith('Z') || dt.endsWith('z') || /[+-]\d{2}:\d{2}$/.test(dt);

    // If client sends UTC (with Z), convert to local São Paulo time so Google Calendar
    // interprets it correctly using the timeZone field (UTC-3, no DST since 2019).
    const SP_OFFSET_MS = -3 * 60 * 60 * 1000;
    const toLocalSP = (dt: string): string => {
      if (!hasExplicitOffset(dt)) return dt;
      const utcMs = new Date(dt).getTime();
      return new Date(utcMs + SP_OFFSET_MS).toISOString().slice(0, 19);
    };

    const startDate = timeZone === 'America/Sao_Paulo' ? toLocalSP(reminder.startDateTime) : reminder.startDateTime;
    const endDate = (() => {
      if (reminder.endDateTime) {
        return timeZone === 'America/Sao_Paulo' ? toLocalSP(reminder.endDateTime) : reminder.endDateTime;
      }
      const d = new Date(hasExplicitOffset(startDate) ? startDate : startDate + 'Z');
      d.setUTCHours(d.getUTCHours() + 1);
      return d.toISOString().slice(0, 19);
    })();
    this.logger.log(`Event times — start: ${startDate} | end: ${endDate} | raw startDateTime: ${reminder.startDateTime} | raw endDateTime: ${reminder.endDateTime ?? 'not provided'} | timeZone: ${timeZone}`);

    const event = {
      summary: reminder.summary,
      description: reminder.description,
      start: {
        dateTime: startDate,
        timeZone,
      },
      end: {
        dateTime: endDate,
        timeZone,
      },
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
    });

    return response.data;
  }
}
