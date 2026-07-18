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
var ProcurementBotService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcurementBotService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../prisma/prisma.service");
const zalo_service_1 = require("../zalo/zalo.service");
let ProcurementBotService = ProcurementBotService_1 = class ProcurementBotService {
    prisma;
    zaloService;
    logger = new common_1.Logger(ProcurementBotService_1.name);
    constructor(prisma, zaloService) {
        this.prisma = prisma;
        this.zaloService = zaloService;
    }
    async handleLowStockNotifications() {
        this.logger.log('Running daily low stock check for Procurement Bot...');
        const suppliers = [];
        for (const supplier of suppliers) {
            if (supplier.phone) {
                try {
                    const znsTemplateId = '123456';
                    const znsData = {
                        supplier_name: supplier.fullName,
                        message: 'Chào anh/chị, hệ thống phát hiện một số mặt hàng sắp hết. Vui lòng kiểm tra email hoặc liên hệ lại để nhận danh sách đặt hàng.',
                    };
                    await this.zaloService.sendZnsToPhoneNumber(supplier.phone, znsTemplateId, znsData);
                    this.logger.log(`Sent low stock notification to ${supplier.fullName}`);
                }
                catch (error) {
                    this.logger.error(`Error notifying supplier ${supplier.fullName}`, error.message);
                }
            }
            else {
                const dynamicAttr = supplier.dynamicAttributes || {};
                if (dynamicAttr.zaloUserId) {
                    try {
                        await this.zaloService.sendMessageToUserId(dynamicAttr.zaloUserId, `Chào ${supplier.fullName}, chúng tôi cần đặt thêm hàng. Vui lòng phản hồi tin nhắn này.`);
                    }
                    catch (error) {
                        this.logger.error(`Error notifying supplier via Zalo ID ${supplier.fullName}`, error.message);
                    }
                }
            }
        }
    }
    async notifySupplierOnPurchaseOrder(poId) {
        const po = null;
        if (!po || !po.supplier) {
            this.logger.warn(`Purchase Order ${poId} not found or has no supplier.`);
            return;
        }
        const message = `Bạn nhận được một Đơn mua hàng mới (Mã: ${po.poNo}). Tổng tiền dự kiến: ${po.totalAmount}. Vui lòng kiểm tra và xác nhận.`;
        const supplier = po.supplier;
        const dynamicAttr = supplier.dynamicAttributes || {};
        if (dynamicAttr.zaloUserId) {
            await this.zaloService.sendMessageToUserId(dynamicAttr.zaloUserId, message);
            return;
        }
        if (supplier.phone) {
            const znsTemplateId = '789101';
            const znsData = {
                po_no: po.poNo,
                amount: po.totalAmount,
            };
            await this.zaloService.sendZnsToPhoneNumber(supplier.phone, znsTemplateId, znsData);
        }
    }
};
exports.ProcurementBotService = ProcurementBotService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_8AM),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ProcurementBotService.prototype, "handleLowStockNotifications", null);
exports.ProcurementBotService = ProcurementBotService = ProcurementBotService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        zalo_service_1.ZaloService])
], ProcurementBotService);
//# sourceMappingURL=procurement-bot.service.js.map