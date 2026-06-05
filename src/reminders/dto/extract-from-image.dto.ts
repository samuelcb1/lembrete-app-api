import { IsString, IsIn } from 'class-validator';

export class ExtractFromImageDto {
  @IsString()
  image: string;

  @IsString()
  @IsIn(['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
  mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
}
