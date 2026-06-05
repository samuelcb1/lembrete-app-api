import { Controller, Get, Post, Body, Req, UseGuards, BadRequestException, ValidationPipe, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { GoogleTokenDto } from './dto/google-token.dto';
import { JwtAuthGuard } from './guards/jwt.guard';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('google/token')
  @UseGuards(ValidationPipe)
  async googleTokenLogin(@Body() body: GoogleTokenDto) {
    this.logger.log(`Received Google token login request accessToken=${body.accessToken ? 'present' : 'missing'} refreshToken=${body.refreshToken ? 'present' : 'missing'} serverAuthCode=${body.serverAuthCode ? 'present' : 'missing'}`);
    return this.authService.validateGoogleToken(body.idToken, body.accessToken, body.refreshToken, body.serverAuthCode);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req: any) {
    const user = await this.authService.getProfile(req.user.userId);
    return user;
  }

  @Post('refresh')
  async refreshTokens(@Body('refreshToken') refreshToken: string) {
    if (!refreshToken) {
      throw new BadRequestException('Refresh token is required');
    }
    return this.authService.refreshTokens(refreshToken);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  googleAuthRedirect(@Req() req: any) {
    return req.user;
  }
}
