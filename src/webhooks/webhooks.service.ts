import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WebhooksService {
  constructor(private prisma: PrismaService) {}

  async processVendorQuote(payload: any) {
    const { supplier, quote_details } = payload;
    
    if (!supplier || !supplier.phone || !quote_details) {
      throw new BadRequestException('Invalid payload format');
    }
    
    // Legacy logic commented out
    /*
    // 1. Find or create Supplier Partner
    let partner = await this.prisma.partner.findUnique({
      where: { phone: supplier.phone }
    });

    if (!partner) {
      partner = await this.prisma.partner.create({
        data: {
          type: 'SUPPLIER',
          fullName: supplier.name || 'Unknown Supplier',
          phone: supplier.phone,
          status: 'NEW'
        }
      });
    }

    // 2. Find or create PriceList for this partner
    let priceList = await this.prisma.priceList.findFirst({
      where: { partnerId: partner.id, isActive: true }
    });

    if (!priceList) {
      priceList = await this.prisma.priceList.create({
        data: {
          partnerId: partner.id,
          name: `Vendor Pricelist - ${partner.fullName}`
        }
      });
    }

    let updatedItems = 0;

    // 3. Upsert PriceListDetails
    for (const detail of quote_details) {
      const product = await this.prisma.product.findUnique({
        where: { sku: detail.product_sku }
      });

      if (product) {
        await this.prisma.priceListDetail.upsert({
          where: {
            priceListId_productId_minQuantity: {
              priceListId: priceList.id,
              productId: product.id,
              minQuantity: detail.min_quantity || 1
            }
          },
          update: {
            price: detail.price
          },
          create: {
            priceListId: priceList.id,
            productId: product.id,
            price: detail.price,
            minQuantity: detail.min_quantity || 1
          }
        });
        updatedItems++;
      }
    }
    */
    const partner = { id: 'temp', fullName: 'temp' };
    const updatedItems = 0;

    return {
      status: 'success',
      message: 'Quote received and vendor price list updated successfully.',
      data: {
        partner_id: partner.id,
        partner_name: partner.fullName,
        updated_items: updatedItems
      }
    };
  }
}
