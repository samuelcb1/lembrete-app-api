import { IsString, IsOptional } from 'class-validator';

export class GoogleTokenDto {
  @IsString()
  idToken: string;

  @IsOptional()
  @IsString()
  accessToken?: string;

  @IsOptional()
  @IsString()
  refreshToken?: string;

  @IsOptional()
  @IsString()
  serverAuthCode?: string;
}
