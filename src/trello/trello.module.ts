import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { User, UserSchema } from '../users/schemas/user.schema';
import { Chat, ChatSchema } from '../chats/schemas/chat.schema';
import { TrelloService } from './trello.service';
import { TrelloController } from './trello.controller';
import { BotModule } from '../bot/bot.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([{ name: Chat.name, schema: ChatSchema }]),

    forwardRef(() => BotModule),
  ],
  controllers: [TrelloController],
  providers: [TrelloService],
  exports: [TrelloService],
})
export class TrelloModule {}
