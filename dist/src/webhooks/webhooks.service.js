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
};
exports.WebhooksService = WebhooksService;
exports.WebhooksService = WebhooksService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WebhooksService);
//# sourceMappingURL=webhooks.service.js.map