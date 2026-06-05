import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Reminder, ReminderDocument } from './schemas/reminder.schema';
import { CreateReminderDto } from '../calendar/dto/create-reminder.dto';

@Injectable()
export class RemindersService {
  constructor(@InjectModel(Reminder.name) private reminderModel: Model<ReminderDocument>) {}

  async create(userId: string, reminder: CreateReminderDto, googleEventId?: string): Promise<ReminderDocument> {
    const newReminder = new this.reminderModel({
      userId: new Types.ObjectId(userId),
      ...reminder,
      googleEventId,
      startDateTime: new Date(reminder.startDateTime),
      endDateTime: reminder.endDateTime ? new Date(reminder.endDateTime) : undefined,
    });

    return newReminder.save();
  }

  async findByUserId(userId: string): Promise<ReminderDocument[]> {
    return this.reminderModel.find({
      userId: new Types.ObjectId(userId),
      isDeleted: false,
    });
  }

  async findById(reminderId: string, userId: string): Promise<ReminderDocument> {
    const reminder = await this.reminderModel.findOne({
      _id: new Types.ObjectId(reminderId),
      userId: new Types.ObjectId(userId),
      isDeleted: false,
    });

    if (!reminder) {
      throw new NotFoundException('Reminder not found');
    }

    return reminder;
  }

  async update(
    reminderId: string,
    userId: string,
    updateData: Partial<CreateReminderDto>,
  ): Promise<ReminderDocument> {
    const reminder = await this.findById(reminderId, userId);

    Object.assign(reminder, updateData);
    reminder.updatedAt = new Date();

    return reminder.save();
  }

  async softDelete(reminderId: string, userId: string): Promise<void> {
    const reminder = await this.findById(reminderId, userId);
    reminder.isDeleted = true;
    await reminder.save();
  }

  async findByGoogleEventId(googleEventId: string): Promise<ReminderDocument | null> {
    return this.reminderModel.findOne({ googleEventId });
  }
}
