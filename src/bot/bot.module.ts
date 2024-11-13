import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { User, UserSchema } from '../users/schemas/user.schema';
import { Chat, ChatSchema } from '../chats/schemas/chat.schema';
import { BotService } from './bot.service';
import { BotController } from './bot.controller';
import { TrelloModule } from '../trello/trello.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([{ name: Chat.name, schema: ChatSchema }]),

    forwardRef(() => TrelloModule),
  ],
  controllers: [BotController],
  providers: [BotService],
  exports: [BotService],
})
export class BotModule {}
