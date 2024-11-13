import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { BotModule } from './bot/bot.module';
import { TrelloModule } from './trello/trello.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGODB_URL),

    BotModule,
    TrelloModule,
    UsersModule,
  ],
})
export class AppModule {}
