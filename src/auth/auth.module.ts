import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { GoogleStrategy } from './google.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleTokenService } from './google-token.service';
import { JwtService } from './jwt.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'google', session: false }),
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: parseInt(configService.get<string>('JWT_EXPIRATION') || '3600') },
      }),
    }),
    ConfigModule,
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, GoogleStrategy, JwtStrategy, GoogleTokenService, JwtService],
  exports: [AuthService, JwtService],
})
export class AuthModule {}

