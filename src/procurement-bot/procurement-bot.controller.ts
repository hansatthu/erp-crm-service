import { Controller, Get, Param, Post } from '@nestjs/common';
import { ProcurementBotService } from './procurement-bot.service';

@Controller('procurement-bot')
export class ProcurementBotController {
  constructor(private readonly procurementBotService: ProcurementBotService) {}

  /**
   * Endpoint for testing the daily 8AM cron job manually.
   * Route: GET /procurement-bot/test-low-stock
   */
  @Get('test-low-stock')
  async triggerLowStockCheck() {
    await this.procurementBotService.handleLowStockNotifications();
    return {
      message: 'Triggered low stock check manually. Check backend console logs for results.'
    };
  }

  /**
   * Endpoint for testing sending a PO to a supplier.
   * Route: POST /procurement-bot/test-po/:id
   */
  @Post('test-po/:id')
  async triggerNotifySupplier(@Param('id') poId: string) {
    await this.procurementBotService.notifySupplierOnPurchaseOrder(poId);
    return {
      message: `Triggered PO notification for PO ID: ${poId}`
    };
  }
}
