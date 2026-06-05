import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import type { Credentials } from 'google-auth-library';
import type { GoogleUser } from './interfaces/google-user.interface';
import { UsersService } from '../users/users.service';
import { GoogleTokenService } from './google-token.service';
import { JwtService, JwtPayload } from './jwt.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly googleTokenService: GoogleTokenService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(profile: any, accessToken: string, refreshToken: string): Promise<GoogleUser> {
    const googleUser: GoogleUser = {
      id: profile.id,
      displayName: profile.displayName,
      email: profile.emails?.[0]?.value,
      photoUrl: profile.photos?.[0]?.value,
      accessToken,
      refreshToken,
    };

    await this.usersService.findOrCreate(googleUser);

    return googleUser;
  }

  async validateGoogleToken(
    idToken: string,
    googleAccessToken?: string,
    googleRefreshToken?: string,
    serverAuthCode?: string,
  ) {
    const payload = await this.googleTokenService.verifyIdToken(idToken);

    let accessToken = googleAccessToken;
    let refreshToken = googleRefreshToken;

    if (serverAuthCode) {
      this.logger.log(`Exchanging serverAuthCode for tokens (sub=${payload.sub})`);
      const oauthClient = this.createOAuth2Client();
      const { tokens } = await oauthClient.getToken(serverAuthCode);
      this.logger.log(`Token exchange result: access_token=${tokens.access_token ? 'present' : 'missing'} refresh_token=${tokens.refresh_token ? 'present' : 'missing'} scope=${tokens.scope ?? 'none'}`);
      accessToken = tokens.access_token ?? accessToken;
      refreshToken = tokens.refresh_token ?? refreshToken;
    } else {
      this.logger.log(`No serverAuthCode — relying on stored tokens (sub=${payload.sub})`);
    }

    const googleUser: GoogleUser = {
      id: payload.sub,
      displayName: payload.name,
      email: payload.email,
      photoUrl: payload.picture,
      accessToken,
      refreshToken,
    };

    const user = await this.usersService.findOrCreate(googleUser);

    if (!user) {
      throw new Error('Failed to create user');
    }

    const hasCalendarAccess = !!user.googleRefreshToken;
    if (!hasCalendarAccess) {
      this.logger.warn(`User ${user._id} has no googleRefreshToken — Calendar API will fail until they sign out and back in`);
    }

    const jwtPayload: JwtPayload = {
      sub: user._id.toString(),
      email: user.email,
      googleId: user.googleId,
    };

    const tokens = this.jwtService.generateTokens(jwtPayload);

    return {
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        photoUrl: user.photoUrl ?? null,
      },
      requiresReauth: !hasCalendarAccess,
      ...tokens,
    };
  }

  async getProfile(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return {
      id: user._id,
      email: user.email,
      displayName: user.displayName,
      photoUrl: user.photoUrl ?? null,
    };
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verifyRefreshToken(refreshToken);

      const jwtPayload: JwtPayload = {
        sub: payload.sub,
        email: payload.email,
        googleId: payload.googleId,
      };

      const tokens = this.jwtService.generateTokens(jwtPayload);

      return tokens;
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  private normalizeCredentials(
    tokens?: { accessToken?: string; refreshToken?: string } | Credentials,
  ): Credentials | undefined {
    if (!tokens) {
      return undefined;
    }

    if ('accessToken' in tokens || 'refreshToken' in tokens) {
      const credentials: Credentials = {};
      if (tokens.accessToken) {
        credentials.access_token = tokens.accessToken;
      }
      if (tokens.refreshToken) {
        credentials.refresh_token = tokens.refreshToken;
      }
      return Object.keys(credentials).length ? credentials : undefined;
    }

    return tokens as Credentials;
  }

  createOAuth2Client(tokens?: { accessToken?: string; refreshToken?: string } | Credentials) {
    const client = new google.auth.OAuth2(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
      this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
      this.configService.get<string>('GOOGLE_CALLBACK_URL'),
    );

    const credentials = this.normalizeCredentials(tokens);
    if (credentials) {
      client.setCredentials(credentials);
    }

    return client;
  }
}
