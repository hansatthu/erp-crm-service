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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsController = void 0;
const common_1 = require("@nestjs/common");
const reports_service_1 = require("./reports.service");
const prisma_service_1 = require("../prisma/prisma.service");
let ReportsController = class ReportsController {
    reportsService;
    prisma;
    constructor(reportsService, prisma) {
        this.reportsService = reportsService;
        this.prisma = prisma;
    }
    async triggerDailyReport(boss) {
        let targetPsid = undefined;
        if (boss === 'han')
            targetPsid = process.env.BOSS_HAN_PSID;
        else if (boss === 'cuong')
            targetPsid = process.env.BOSS_CUONG_PSID;
        else
            targetPsid = process.env.BOSS_HAN_PSID;
        await this.reportsService.handleDailyReport(targetPsid);
        return { success: true, message: 'Daily report triggered manually.' };
    }
    async findBoss() {
        const leads = await this.prisma.partner.findMany({
            orderBy: { updatedAt: 'desc' },
            take: 10
        });
        return {
            message: 'Here are the latest people who messaged the bot:',
            leads: leads.map(l => ({ name: l.fullName, psid_code: l.code }))
        };
    }
};
exports.ReportsController = ReportsController;
__decorate([
    (0, common_1.Get)('trigger-daily'),
    (0, common_1.Post)('trigger-daily'),
    __param(0, (0, common_1.Query)('boss')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "triggerDailyReport", null);
__decorate([
    (0, common_1.Get)('find-boss'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "findBoss", null);
exports.ReportsController = ReportsController = __decorate([
    (0, common_1.Controller)('api/v1/reports'),
    __metadata("design:paramtypes", [reports_service_1.ReportsService,
        prisma_service_1.PrismaService])
], ReportsController);
//# sourceMappingURL=reports.controller.js.map