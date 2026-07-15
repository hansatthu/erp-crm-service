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
var MetaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetaService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
let MetaService = MetaService_1 = class MetaService {
    httpService;
    logger = new common_1.Logger(MetaService_1.name);
    graphApiVersion = 'v19.0';
    graphApiUrl = `https://graph.facebook.com/${this.graphApiVersion}/me/messages`;
    serverUrl = '';
    constructor(httpService) {
        this.httpService = httpService;
    }
    async onModuleInit() {
        this.autoWhitelistDomain();
    }
    async autoWhitelistDomain() {
        try {
            const res = await (0, rxjs_1.firstValueFrom)(this.httpService.get('http://localhost:4040/api/tunnels'));
            const tunnels = res.data?.tunnels || [];
            const httpsTunnel = tunnels.find((t) => t.public_url.startsWith('https://'));
            if (httpsTunnel) {
                this.serverUrl = httpsTunnel.public_url;
                this.logger.log(`Found Ngrok URL: ${this.serverUrl}. Whitelisting...`);
                const accessToken = this.getPageAccessToken();
                if (accessToken) {
                    const profileUrl = `https://graph.facebook.com/${this.graphApiVersion}/me/messenger_profile?access_token=${accessToken}`;
                    await (0, rxjs_1.firstValueFrom)(this.httpService.post(profileUrl, {
                        whitelisted_domains: [this.serverUrl]
                    }));
                    this.logger.log(`Successfully whitelisted domain: ${this.serverUrl}`);
                }
            }
        }
        catch (error) {
            this.logger.warn(`Could not auto-whitelist domain (ngrok might not be running): ${error.message}`);
        }
    }
    getPageAccessToken() {
        return process.env.META_PAGE_ACCESS_TOKEN || '';
    }
    async getUserProfile(psid) {
        const accessToken = this.getPageAccessToken();
        if (!accessToken)
            return null;
        try {
            const url = `https://graph.facebook.com/${this.graphApiVersion}/${psid}`;
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(url, {
                params: {
                    fields: 'name,first_name,last_name',
                    access_token: accessToken,
                },
            }));
            return response.data;
        }
        catch (error) {
            this.logger.error(`Failed to fetch profile for PSID ${psid}`, error.message);
            return null;
        }
    }
    async addLabelToUser(psid, labelName) {
        const accessToken = this.getPageAccessToken();
        if (!accessToken)
            return false;
        try {
            let labelId = null;
            const getLabelsUrl = `https://graph.facebook.com/${this.graphApiVersion}/me/custom_labels`;
            const labelsRes = await (0, rxjs_1.firstValueFrom)(this.httpService.get(getLabelsUrl, {
                params: { access_token: accessToken, fields: 'name' }
            }));
            const existingLabels = labelsRes.data?.data || [];
            const found = existingLabels.find(l => l.name === labelName);
            if (found) {
                labelId = found.id;
            }
            else {
                const createRes = await (0, rxjs_1.firstValueFrom)(this.httpService.post(getLabelsUrl, {
                    name: labelName
                }, { params: { access_token: accessToken } }));
                labelId = createRes.data?.id;
            }
            if (!labelId)
                return false;
            const assignUrl = `https://graph.facebook.com/${this.graphApiVersion}/${labelId}/label`;
            await (0, rxjs_1.firstValueFrom)(this.httpService.post(assignUrl, {
                user: psid
            }, { params: { access_token: accessToken } }));
            this.logger.log(`Successfully assigned label "${labelName}" to user ${psid}`);
            return true;
        }
        catch (error) {
            this.logger.error(`Failed to assign label ${labelName} to PSID ${psid}`, error.response?.data || error.message);
            return false;
        }
    }
    async sendMessage(recipientId, text) {
        const accessToken = this.getPageAccessToken();
        if (!accessToken) {
            this.logger.warn('No META_PAGE_ACCESS_TOKEN configured. Cannot send message to Facebook.');
            return null;
        }
        try {
            const payload = {
                recipient: {
                    id: recipientId,
                },
                message: {
                    text: text,
                },
                messaging_type: 'RESPONSE'
            };
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(this.graphApiUrl, payload, {
                params: {
                    access_token: accessToken,
                },
            }));
            this.logger.log(`Message sent to Facebook User ${recipientId}`);
            return response.data;
        }
        catch (error) {
            this.logger.error(`Failed to send message to Facebook User ${recipientId}`, error.response?.data || error.message);
            return null;
        }
    }
    async sendOrderReceipt(recipientId, orderData) {
        const accessToken = this.getPageAccessToken();
        if (!accessToken) {
            this.logger.warn('No META_PAGE_ACCESS_TOKEN configured. Cannot send receipt.');
            return null;
        }
        try {
            const payload = {
                recipient: {
                    id: recipientId,
                },
                message: {
                    attachment: {
                        type: 'template',
                        payload: {
                            template_type: 'receipt',
                            recipient_name: orderData.customer_name || 'Khách hàng',
                            order_number: 'ORD-' + Math.floor(Math.random() * 1000000),
                            currency: 'VND',
                            payment_method: 'Thanh toán khi nhận hàng (COD)',
                            elements: [
                                {
                                    title: orderData.product,
                                    subtitle: `Số lượng: ${orderData.quantity}`,
                                    quantity: orderData.quantity,
                                    price: orderData.total_price || 0,
                                    currency: 'VND',
                                },
                            ],
                            address: {
                                street_1: orderData.address || 'Không rõ',
                                city: 'Tây Ninh',
                                postal_code: '840000',
                                state: 'TN',
                                country: 'VN',
                            },
                            summary: {
                                total_cost: orderData.total_price || 0,
                            },
                        },
                    },
                },
            };
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(this.graphApiUrl, payload, {
                params: { access_token: accessToken },
            }));
            this.logger.log(`Receipt Template sent to Facebook User ${recipientId}`);
            return response.data;
        }
        catch (error) {
            this.logger.error(`Failed to send Receipt Template to ${recipientId}`, error.response?.data || error.message);
            return null;
        }
    }
    async sendAction(recipientId, action) {
        const accessToken = this.getPageAccessToken();
        if (!accessToken)
            return null;
        try {
            const payload = {
                recipient: {
                    id: recipientId,
                },
                sender_action: action
            };
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(this.graphApiUrl, payload, {
                params: {
                    access_token: accessToken,
                }
            }));
            return response.data;
        }
        catch (error) {
            this.logger.error(`Failed to send action ${action} to Facebook User ${recipientId}`, error.message);
            return null;
        }
    }
    async sendFormButton(recipientId) {
        const accessToken = this.getPageAccessToken();
        if (!accessToken || !this.serverUrl)
            return null;
        try {
            const payload = {
                recipient: {
                    id: recipientId,
                },
                message: {
                    attachment: {
                        type: "template",
                        payload: {
                            template_type: "button",
                            text: "Tuyệt vời! Bạn nhấn vào nút bên dưới để điền thông tin giao hàng giúp Geta nhé 👇",
                            buttons: [
                                {
                                    type: "web_url",
                                    url: `${this.serverUrl}/order-form.html?psid=${recipientId}`,
                                    title: "📝 Điền Thông Tin",
                                    webview_height_ratio: "tall",
                                    messenger_extensions: true
                                }
                            ]
                        }
                    }
                }
            };
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(this.graphApiUrl, payload, {
                params: { access_token: accessToken },
            }));
            this.logger.log(`Form Button sent to Facebook User ${recipientId}`);
            return response.data;
        }
        catch (error) {
            this.logger.error(`Failed to send form button to Facebook User ${recipientId}`, error.response?.data || error.message);
            return null;
        }
    }
};
exports.MetaService = MetaService;
exports.MetaService = MetaService = MetaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService])
], MetaService);
//# sourceMappingURL=meta.service.js.map