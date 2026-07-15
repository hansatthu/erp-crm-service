"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcurementBotModule = void 0;
const common_1 = require("@nestjs/common");
const procurement_bot_service_1 = require("./procurement-bot.service");
const procurement_bot_controller_1 = require("./procurement-bot.controller");
const zalo_module_1 = require("../zalo/zalo.module");
const prisma_module_1 = require("../prisma/prisma.module");
let ProcurementBotModule = class ProcurementBotModule {
};
exports.ProcurementBotModule = ProcurementBotModule;
exports.ProcurementBotModule = ProcurementBotModule = __decorate([
    (0, common_1.Module)({
        imports: [zalo_module_1.ZaloModule, prisma_module_1.PrismaModule],
        controllers: [procurement_bot_controller_1.ProcurementBotController],
        providers: [procurement_bot_service_1.ProcurementBotService],
        exports: [procurement_bot_service_1.ProcurementBotService],
    })
], ProcurementBotModule);
//# sourceMappingURL=procurement-bot.module.js.map