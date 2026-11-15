import { Body, Controller, Post } from '@nestjs/common';
import { SubscribeNewsletterDto } from './dto/subscribe-newsletter.dto';
import { NewsletterService } from './newsletter.service';

@Controller('newsletter')
export class NewsletterController {
  constructor(private readonly service: NewsletterService) {}

  @Post()
  subscribe(@Body() dto: SubscribeNewsletterDto) {
    return this.service.subscribe(dto);
  }
}
