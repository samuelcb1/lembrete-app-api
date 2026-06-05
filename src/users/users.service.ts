import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import type { GoogleUser } from '../auth/interfaces/google-user.interface';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findOrCreate(googleUser: GoogleUser): Promise<UserDocument | null> {
    const updateData: Partial<User> = {
      googleId: googleUser.id,
      displayName: googleUser.displayName,
      email: googleUser.email,
      lastLogin: new Date(),
    };

    if (googleUser.photoUrl) {
      updateData.photoUrl = googleUser.photoUrl;
    }

    if (googleUser.accessToken) {
      updateData.googleAccessToken = googleUser.accessToken;
    }

    if (googleUser.refreshToken) {
      updateData.googleRefreshToken = googleUser.refreshToken;
    }

    const user = await this.userModel.findOneAndUpdate(
      { googleId: googleUser.id },
      updateData,
      { upsert: true, new: true },
    );

    return user;
  }

  async findByGoogleId(googleId: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ googleId });
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email });
  }

  async updateTokens(
    googleId: string,
    googleAccessToken: string,
    googleRefreshToken?: string,
  ): Promise<UserDocument | null> {
    return this.userModel.findOneAndUpdate(
      { googleId },
      {
        googleAccessToken,
        googleRefreshToken,
        lastLogin: new Date(),
      },
      { new: true },
    );
  }

  async findById(userId: string): Promise<UserDocument | null> {
    return this.userModel.findById(userId);
  }
}
