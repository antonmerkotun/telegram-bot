import { Controller, Post, Req, Res } from '@nestjs/common';
import { BotService } from './bot.service';

@Controller('bot')
export class BotController {
  constructor(private readonly botService: BotService) {}

  @Post()
  async onUpdate(@Req() req, @Res() res) {
    const update = req.body;
    await this.botService.processUpdate(update);
    res.sendStatus(200);
  }
}
