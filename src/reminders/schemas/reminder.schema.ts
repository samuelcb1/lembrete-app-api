import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type ReminderDocument = HydratedDocument<Reminder>;

@Schema({ timestamps: true })
export class Reminder {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  summary: string;

  @Prop()
  description?: string;

  @Prop({ required: true })
  startDateTime: Date;

  @Prop()
  endDateTime?: Date;

  @Prop({ default: 'America/Sao_Paulo' })
  timeZone: string;

  @Prop()
  googleEventId?: string;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: new Date() })
  createdAt: Date;

  @Prop({ default: new Date() })
  updatedAt: Date;
}

export const ReminderSchema = SchemaFactory.createForClass(Reminder);
