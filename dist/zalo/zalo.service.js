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
var ZaloService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZaloService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
let ZaloService = ZaloService_1 = class ZaloService {
    httpService;
    logger = new common_1.Logger(ZaloService_1.name);
    zaloOAApiUrl = 'https://openapi.zalo.me/v3.0/oa/message/cs';
    zaloZnsApiUrl = 'https://business.openapi.zalo.me/message/template';
    constructor(httpService) {
        this.httpService = httpService;
    }
    getAccessToken() {
        return process.env.ZALO_ACCESS_TOKEN || '';
    }
    async sendMessageToUserId(zaloUserId, text) {
        const accessToken = this.getAccessToken();
        if (!accessToken) {
            this.logger.warn('No Zalo Access Token configured');
            return null;
        }
        try {
            const payload = {
                recipient: {
                    user_id: zaloUserId,
                },
                message: {
                    text: text,
                },
            };
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(this.zaloOAApiUrl, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    access_token: accessToken,
                },
            }));
            this.logger.log(`Message sent to Zalo User ${zaloUserId}`);
            return response.data;
        }
        catch (error) {
            this.logger.error(`Failed to send message to Zalo User ${zaloUserId}`, error);
            throw error;
        }
    }
    async sendZnsToPhoneNumber(phone, templateId, templateData) {
        const accessToken = this.getAccessToken();
        if (!accessToken) {
            this.logger.warn('No Zalo Access Token configured');
            return null;
        }
        let formattedPhone = phone;
        if (phone.startsWith('0')) {
            formattedPhone = '84' + phone.substring(1);
        }
        try {
            const payload = {
                phone: formattedPhone,
                template_id: templateId,
                template_data: templateData,
            };
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(this.zaloZnsApiUrl, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    access_token: accessToken,
                },
            }));
            this.logger.log(`ZNS message sent to ${formattedPhone}`);
            return response.data;
        }
        catch (error) {
            this.logger.error(`Failed to send ZNS message to ${formattedPhone}`, error);
            throw error;
        }
    }
};
exports.ZaloService = ZaloService;
exports.ZaloService = ZaloService = ZaloService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService])
], ZaloService);
//# sourceMappingURL=zalo.service.js.map