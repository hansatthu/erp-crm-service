import { Controller, Post, Body, Headers, UnauthorizedException } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';

@Controller('api/v1/webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('vendor-quotes')
  async handleVendorQuote(
    @Headers('x-webhook-secret') secret: string,
    @Body() payload: any,
  ) {
    // Basic verification - in production this would be stored in env
    if (secret !== 'geta_secret_key_123') {
      throw new UnauthorizedException('Invalid Webhook Secret');
    }
    return this.webhooksService.processVendorQuote(payload);
  }
}
