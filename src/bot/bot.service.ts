import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as TelegramBot from 'node-telegram-bot-api';

import { User, UserDocument } from '../users/schemas/user.schema';
import { Chat, ChatDocument } from '../chats/schemas/chat.schema';
import { TrelloService } from '../trello/trello.service';

@Injectable()
export class BotService {
  private bot: TelegramBot;

  constructor(
    @InjectModel(User.name)
    private readonly _UserModel: Model<UserDocument>,

    @InjectModel(Chat.name)
    private readonly _ChatModel: Model<ChatDocument>,

    @Inject(forwardRef(() => TrelloService))
    private readonly _TrelloService: TrelloService,
  ) {
    this.bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
      polling: true,
    });
    this.bot.on('new_chat_members', (msg) => this.onNewChatMember(msg));

    this.bot.onText(/\/start/, (msg) => this.onStartCommand(msg));
    this.bot.onText(/\/boards_list/, (msg) => this.getBoardsList(msg));
    this.bot.onText(/\/connect_board (\w+)/, (msg, match) =>
      this.connectBoard(msg, match),
    );
  }

  async onModuleInit() {
    await this.bot.setWebHook(process.env.API_URL);
  }

  async processUpdate(update: any) {
    if (update.message && update.message.text === '/start') {
      await this.onStartCommand(update.message);
    }
  }

  private async onNewChatMember(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;

    const newMembers = msg.new_chat_members;
    const botId = this.bot.getMe().then((botInfo) => botInfo.id);

    for (const member of newMembers) {
      if (member.id === (await botId)) {
        this.bot.sendMessage(
          chatId,
          `/start - Початок роботи з ботом\n/boards_list - Список доступних дошок\n/connect_board [назва дошки] - Підключити дошку`,
        );
        break;
      }
    }
  }

  private async onStartCommand(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;
    const user = await this._UserModel.findOne({ userId: msg.from.id });

    const newChat = new this._ChatModel({ chatId });
    await newChat.save();

    if (user) return this.sendMessage(chatId, `Привіт, ${user.firstName}!`);

    const newUser = new this._UserModel({
      userId: msg.from.id,
      username: msg.from.username,
      firstName: msg.from.first_name,
      lastName: msg.from.last_name,
      chatId,
    });

    await newUser.save();

    this.sendMessage(chatId, `Привіт, ${newUser.firstName}!`);
  }

  private async getBoardsList(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;

    const boards = await this._TrelloService.getAllBoards();

    if (!boards || !boards.length) {
      return this.bot.sendMessage(chatId, 'У вас немає доступних бордів.');
    }

    const boardNames = boards
      .map((board, index) => `${index + 1}. ${board.name} - ${board.url}`)
      .join('\n');

    this.sendMessage(chatId, `Ось список ваших бордів:\n\n${boardNames}`);
  }

  private async connectBoard(
    msg: TelegramBot.Message,
    match: RegExpExecArray | null,
  ) {
    const chatId = msg.chat.id;
    const boardName = match?.[1];

    if (!boardName) {
      return this.sendMessage(
        chatId,
        'Будь ласка, вкажіть назву дошки після команди.',
      );
    }

    try {
      const boards = await this._TrelloService.getAllBoards();
      const board = boards.find(
        (b) => b.name.toLowerCase() === boardName.toLowerCase(),
      );

      const boardNames = boards
        .map((board, index) => `${index + 1}. ${board.name} - ${board.url}`)
        .join('\n');

      if (!board) {
        return this.sendMessage(
          chatId,
          `Не знайдено дошки з такою назвою. Ось список доступних бордів:\n\n${boardNames}`,
        );
      }

      const chat = await this._ChatModel.findOne({ chatId });
      if (!chat) {
        return this.sendMessage(
          chatId,
          'Не знайдено вашого профілю в системі.',
        );
      }

      if (chat.connectedBoards.includes(board.id)) {
        return this.sendMessage(chatId, 'Ви вже підключені до цієї дошки.');
      }

      chat.connectedBoards.push(board.id);
      await chat.save();

      this.bot.sendMessage(
        chatId,
        `Ви успішно підключили дошку: ${board.name}`,
      );
    } catch (error) {
      this.sendMessage(chatId, 'Сталася помилка при підключенні до дошки.');
    }
  }

  public async sendMessage(chatId, message) {
    this.bot.sendMessage(chatId, message);
  }
}
