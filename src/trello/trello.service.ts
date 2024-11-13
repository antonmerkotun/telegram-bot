import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import axios, { AxiosResponse } from 'axios';

import { User, UserDocument } from '../users/schemas/user.schema';
import { Chat, ChatDocument } from '../chats/schemas/chat.schema';
import { BotService } from 'src/bot/bot.service';

@Injectable()
export class TrelloService {
  constructor(
    @InjectModel(User.name)
    private readonly _UserModel: Model<UserDocument>,

    @InjectModel(Chat.name)
    private readonly _ChatModel: Model<ChatDocument>,

    @Inject(forwardRef(() => BotService))
    private readonly _BotService: BotService,
  ) {}

  async createWebhook(): Promise<AxiosResponse<any>> {
    const url = `${process.env.TRELLO_API_URL}/webhooks?key=${process.env.TRELLO_API_KEY}&token=${process.env.TRELLO_API_TOKEN}`;

    try {
      const response = await axios.post(url, {
        description: 'Trello Webhook',
        callbackURL: `${process.env.API_URL}/trello/webhook`,
        idModel: process.env.TRELLO_ID_MODEL,
      });

      return response.data;
    } catch (error) {
      console.log(error);
    }
  }

  async handleWebhook(payload) {
    const { action } = payload;
    const { data } = action;

    const cardName = data.card?.name;
    const listBefore = data.listBefore?.name;
    const listAfter = data.listAfter?.name;
    const boardId = data.board?.id;

    let message;

    if (
      action.type === 'addMemberToCard' ||
      action.type === 'removeMemberFromCard'
    ) {
      const user = await this._UserModel.findOne({
        username: action.member.username,
      });

      if (user) {
        const cardId = action.data.card.id;
        if (action.type === 'addMemberToCard') {
          if (!user.tasks.includes(cardId)) {
            user.tasks.push(cardId);
          }
        } else if (action.type === 'removeMemberFromCard') {
          user.tasks = user.tasks.filter((taskId) => taskId !== cardId);
        }

        await user.save();
      }
    }

    if (listBefore && listAfter) {
      message = `Картка '${cardName}' переміщена з колонки ${listBefore} в колонку ${listAfter}`;
    }

    try {
      const chats = await this._ChatModel.find({ connectedBoards: boardId });

      if (!chats.length) return { status: 'success' };

      for (const chat of chats) {
        const chatId = chat.chatId;
        if (message) await this._BotService.sendMessage(chatId, message);
      }
    } catch (error) {
      console.error('Error while handling webhook:', error);
    }

    return { status: 'success' };
  }

  async getAllBoards(): Promise<any> {
    try {
      const response = await axios.get(
        `${process.env.TRELLO_API_URL}/members/me/boards`,
        {
          params: {
            key: process.env.TRELLO_API_KEY,
            token: process.env.TRELLO_API_TOKEN,
          },
        },
      );

      return response.data;
    } catch (error) {
      throw new Error('Could not fetch Trello boards');
    }
  }
}
