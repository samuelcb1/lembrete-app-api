import { Injectable } from '@nestjs/common';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  sub: string;
  email: string;
  googleId: string;
}

@Injectable()
export class JwtService {
  constructor(
    private readonly jwtService: NestJwtService,
    private readonly configService: ConfigService,
  ) {}

  generateTokens(payload: JwtPayload) {
    const expiresIn = parseInt(this.configService.get<string>('JWT_EXPIRATION') || '3600');
    const refreshExpiresIn = parseInt(this.configService.get<string>('JWT_REFRESH_EXPIRATION') || '604800');

    const accessToken = this.jwtService.sign(payload as any, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn,
    });

    const refreshToken = this.jwtService.sign(payload as any, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: refreshExpiresIn,
    });

    return { accessToken, refreshToken };
  }

  verifyAccessToken(token: string): JwtPayload {
    return this.jwtService.verify(token, {
      secret: this.configService.get<string>('JWT_SECRET'),
    });
  }

  verifyRefreshToken(token: string): JwtPayload {
    return this.jwtService.verify(token, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
    });
  }
}
