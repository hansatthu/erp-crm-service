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
exports.ProcurementBotController = void 0;
const common_1 = require("@nestjs/common");
const procurement_bot_service_1 = require("./procurement-bot.service");
let ProcurementBotController = class ProcurementBotController {
    procurementBotService;
    constructor(procurementBotService) {
        this.procurementBotService = procurementBotService;
    }
    async triggerLowStockCheck() {
        await this.procurementBotService.handleLowStockNotifications();
        return {
            message: 'Triggered low stock check manually. Check backend console logs for results.'
        };
    }
    async triggerNotifySupplier(poId) {
        await this.procurementBotService.notifySupplierOnPurchaseOrder(poId);
        return {
            message: `Triggered PO notification for PO ID: ${poId}`
        };
    }
};
exports.ProcurementBotController = ProcurementBotController;
__decorate([
    (0, common_1.Get)('test-low-stock'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ProcurementBotController.prototype, "triggerLowStockCheck", null);
__decorate([
    (0, common_1.Post)('test-po/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ProcurementBotController.prototype, "triggerNotifySupplier", null);
exports.ProcurementBotController = ProcurementBotController = __decorate([
    (0, common_1.Controller)('procurement-bot'),
    __metadata("design:paramtypes", [procurement_bot_service_1.ProcurementBotService])
], ProcurementBotController);
//# sourceMappingURL=procurement-bot.controller.js.map