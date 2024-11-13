import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Chat } from './schemas/chat.schema';

@Injectable()
export class ChatsService {
  constructor(@InjectModel(Chat.name) private chatModel: Model<Chat>) {}

  async createChat(chatData: Partial<Chat>): Promise<Chat> {
    const chat = new this.chatModel(chatData);
    return chat.save();
  }

  async findChatByBoardId(boardId: string): Promise<Chat | null> {
    return this.chatModel.findOne({ boardId });
  }

  async getAllChats(): Promise<Chat[]> {
    return this.chatModel.find().exec();
  }

  async findChatByChatId(chatId: number): Promise<Chat | null> {
    return this.chatModel.findOne({ chatId });
  }
}
