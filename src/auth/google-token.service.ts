import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';

@Injectable()
export class GoogleTokenService {
  private oauth2Client: any;

  constructor(private readonly configService: ConfigService) {
    this.oauth2Client = new google.auth.OAuth2(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
      this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
    );
  }

  async verifyIdToken(idToken: string) {
    try {
      const ticket = await this.oauth2Client.verifyIdToken({
        idToken,
        audience: this.configService.get<string>('GOOGLE_CLIENT_ID'),
      });

      return ticket.getPayload();
    } catch (error) {
      throw new UnauthorizedException('Invalid Google token');
    }
  }
}
