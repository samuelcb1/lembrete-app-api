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
    const startDate = reminder.startDateTime;
    const endDate = reminder.endDateTime ?? (() => {
      const d = new Date(reminder.startDateTime.endsWith('Z') ? reminder.startDateTime : reminder.startDateTime + 'Z');
      d.setUTCHours(d.getUTCHours() + 1);
      return d.toISOString().slice(0, 19);
    })();
    this.logger.log(`Event times — start: ${startDate} | end: ${endDate} | raw startDateTime: ${reminder.startDateTime} | raw endDateTime: ${reminder.endDateTime ?? 'not provided'}`);

    const event = {
      summary: reminder.summary,
      description: reminder.description,
      start: {
        dateTime: startDate,
        timeZone: reminder.timeZone ?? 'America/Sao_Paulo',
      },
      end: {
        dateTime: endDate,
        timeZone: reminder.timeZone ?? 'America/Sao_Paulo',
      },
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
    });

    return response.data;
  }
}
