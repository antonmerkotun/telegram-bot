import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async createUser(userData: any): Promise<User> {
    const user = new this.userModel(userData);
    return user.save();
  }

  async findUserById(userId: number): Promise<User> {
    return this.userModel.findOne({ userId });
  }
}
