import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { ZaloService } from '../zalo/zalo.service';

@Injectable()
export class ProcurementBotService {
  private readonly logger = new Logger(ProcurementBotService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly zaloService: ZaloService,
  ) {}

  /**
   * Cron job that runs every day at 8:00 AM.
   * It checks for low stock products and notifies suppliers via Zalo.
   */
  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async handleLowStockNotifications() {
    this.logger.log('Running daily low stock check for Procurement Bot...');

    // In a real scenario, you'd find products where quantityOnHand <= safeStockLevel
    // And group them by supplier. Since we don't have a direct Supplier-Product link,
    // we assume the user might have a mapping, or we just notify the admin.
    
    // Legacy code:
    // const suppliers = await this.prisma.partner.findMany({ ... });
    const suppliers: any[] = [];

    for (const supplier of suppliers) {
      if (supplier.phone) {
        // Try to send a ZNS message
        try {
          // You must have an approved template on Zalo OA
          const znsTemplateId = '123456'; 
          const znsData = {
            supplier_name: supplier.fullName,
            message: 'Chào anh/chị, hệ thống phát hiện một số mặt hàng sắp hết. Vui lòng kiểm tra email hoặc liên hệ lại để nhận danh sách đặt hàng.',
          };
          
          await this.zaloService.sendZnsToPhoneNumber(supplier.phone, znsTemplateId, znsData);
          this.logger.log(`Sent low stock notification to ${supplier.fullName}`);
        } catch (error) {
          this.logger.error(`Error notifying supplier ${supplier.fullName}`, error.message);
        }
      } else {
        // Check if there's a mapped Zalo User ID in dynamicAttributes
        const dynamicAttr: any = supplier.dynamicAttributes || {};
        if (dynamicAttr.zaloUserId) {
          try {
            await this.zaloService.sendMessageToUserId(
              dynamicAttr.zaloUserId,
              `Chào ${supplier.fullName}, chúng tôi cần đặt thêm hàng. Vui lòng phản hồi tin nhắn này.`
            );
          } catch (error) {
             this.logger.error(`Error notifying supplier via Zalo ID ${supplier.fullName}`, error.message);
          }
        }
      }
    }
  }

  /**
   * Triggered when a new Purchase Order is CONFIRMED.
   * Can be called by other services or webhooks.
   */
  async notifySupplierOnPurchaseOrder(poId: string) {
    // Legacy code
    // const po = await this.prisma.purchaseOrder.findUnique({ ... });
    const po: any = null;

    if (!po || !po.supplier) {
      this.logger.warn(`Purchase Order ${poId} not found or has no supplier.`);
      return;
    }

    const message = `Bạn nhận được một Đơn mua hàng mới (Mã: ${po.poNo}). Tổng tiền dự kiến: ${po.totalAmount}. Vui lòng kiểm tra và xác nhận.`;

    const supplier = po.supplier;

    // Prefer standard OA message if zaloUserId exists
    const dynamicAttr: any = supplier.dynamicAttributes || {};
    if (dynamicAttr.zaloUserId) {
      await this.zaloService.sendMessageToUserId(dynamicAttr.zaloUserId, message);
      return;
    }

    // Fallback to ZNS via phone
    if (supplier.phone) {
      const znsTemplateId = '789101'; // Another template
      const znsData = {
        po_no: po.poNo,
        amount: po.totalAmount,
      };
      await this.zaloService.sendZnsToPhoneNumber(supplier.phone, znsTemplateId, znsData);
    }
  }
}
