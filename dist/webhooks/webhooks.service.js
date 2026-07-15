"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhooksService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let WebhooksService = class WebhooksService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async processVendorQuote(payload) {
        const { supplier, quote_details } = payload;
        if (!supplier || !supplier.phone || !quote_details) {
            throw new common_1.BadRequestException('Invalid payload format');
        }
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
        return {
            status: 'success',
            message: 'Quote received and vendor price list updated successfully.',
            data: {
                partner_id: partner.id,
                updated_items: updatedItems
            }
        };
    }
};
exports.WebhooksService = WebhooksService;
exports.WebhooksService = WebhooksService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WebhooksService);
//# sourceMappingURL=webhooks.service.js.map