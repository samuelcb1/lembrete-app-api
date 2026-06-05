import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  googleId: string;

  @Prop({ required: true })
  displayName: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ default: null })
  googleAccessToken?: string;

  @Prop({ default: null })
  googleRefreshToken?: string;

  @Prop({ default: null })
  photoUrl?: string;

  @Prop({ default: new Date() })
  lastLogin: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
