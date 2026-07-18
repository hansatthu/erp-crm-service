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
var ReportsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
const meta_service_1 = require("../meta/meta.service");
let ReportsService = ReportsService_1 = class ReportsService {
    prisma;
    httpService;
    metaService;
    logger = new common_1.Logger(ReportsService_1.name);
    constructor(prisma, httpService, metaService) {
        this.prisma = prisma;
        this.httpService = httpService;
        this.metaService = metaService;
    }
    async handleDailyReport(targetPsid) {
        this.logger.log('Starting daily end-of-day report generation...');
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const totalContacts = 0;
            let reportMessage = `📊 BÁO CÁO CUỐI NGÀY GETA TÂY NINH 📊\n`;
            reportMessage += `${totalContacts} khách hàng liên hệ\n`;
            let hoiChoiCount = 0;
            let baoGiaCount = 0;
            reportMessage += `${hoiChoiCount} khách hỏi chơi không mua\n`;
            reportMessage += `${baoGiaCount} khách báo giá rồi ko mua\n`;
            reportMessage += `0 khách mua ( chốt đơn thành công)\n`;
            this.logger.log(`\n=== DAILY REPORT ===\n${reportMessage}\n====================`);
            const receivers = [];
            if (targetPsid) {
                receivers.push(targetPsid);
            }
            else {
                if (process.env.BOSS_HAN_PSID)
                    receivers.push(process.env.BOSS_HAN_PSID);
                if (process.env.BOSS_CUONG_PSID)
                    receivers.push(process.env.BOSS_CUONG_PSID);
            }
            if (receivers.length === 0) {
                this.logger.warn('No Boss PSID found in environment or arguments. Cannot send report via Meta.');
            }
            else {
                for (const psid of receivers) {
                    await this.metaService.sendMessage(psid, reportMessage);
                    this.logger.log(`Daily report sent to Meta user ${psid} successfully.`);
                }
            }
            const openclawWebhook = process.env.OPENCLAW_WEBHOOK_URL;
            if (openclawWebhook) {
                await (0, rxjs_1.firstValueFrom)(this.httpService.post(openclawWebhook, {
                    text: reportMessage
                }));
                this.logger.log('Successfully sent report to Openclaw Webhook');
            }
        }
        catch (error) {
            this.logger.error('Failed to generate daily report', error);
        }
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = ReportsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        axios_1.HttpService,
        meta_service_1.MetaService])
], ReportsService);
//# sourceMappingURL=reports.service.js.map