import { Controller, Post, Body, Get } from '@nestjs/common';
import { TrelloService } from './trello.service';

@Controller('trello')
export class TrelloController {
  constructor(private readonly trelloService: TrelloService) {}

  @Post('create-webhook')
  async createWebhook() {
    return this.trelloService.createWebhook();
  }

  @Post('webhook')
  async handleWebhook(@Body() payload) {
    return this.trelloService.handleWebhook(payload);
  }

  @Get('webhook')
  async handleHeadRequest(@Body() payload) {
    return payload;
  }
}
