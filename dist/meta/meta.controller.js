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
exports.MetaController = void 0;
const common_1 = require("@nestjs/common");
const ai_agent_service_1 = require("../ai-agent/ai-agent.service");
const meta_service_1 = require("./meta.service");
const prisma_service_1 = require("../prisma/prisma.service");
let MetaController = class MetaController {
    aiAgentService;
    metaService;
    prisma;
    verifyToken = process.env.META_VERIFY_TOKEN || 'geta_meta_verify_token';
    messageBuffers = new Map();
    constructor(aiAgentService, metaService, prisma) {
        this.aiAgentService = aiAgentService;
        this.metaService = metaService;
        this.prisma = prisma;
    }
    verifyWebhook(mode, token, challenge, res) {
        if (mode && token) {
            if (mode === 'subscribe' && token === this.verifyToken) {
                console.log('META WEBHOOK_VERIFIED');
                return res.status(common_1.HttpStatus.OK).send(challenge);
            }
            else {
                return res.sendStatus(common_1.HttpStatus.FORBIDDEN);
            }
        }
        return res.sendStatus(common_1.HttpStatus.BAD_REQUEST);
    }
    async renderPaymentPage(amount, info, res) {
        const formattedAmount = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(amount) || 0);
        const html = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-width=1.0">
        <title>Thanh Toán Đơn Hàng - Geta Tây Ninh</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
            .card { background: white; border-radius: 16px; padding: 30px 24px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); max-width: 400px; width: 100%; text-align: center; }
            .logo-text { font-size: 24px; font-weight: 800; color: #4f46e5; margin-bottom: 5px; }
            .subtitle { color: #6b7280; font-size: 14px; margin-bottom: 20px; }
            .qr-container { background: #f9fafb; padding: 15px; border-radius: 12px; border: 1px dashed #d1d5db; display: inline-block; margin-bottom: 20px; width: 80%; }
            .qr-image { width: 100%; border-radius: 8px; mix-blend-mode: multiply; }
            .info-box { background: #f9fafb; border-radius: 12px; padding: 15px; margin-bottom: 20px; }
            .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; text-align: left; align-items: center; }
            .info-row:last-child { border-bottom: none; }
            .info-label { color: #6b7280; font-size: 13px; flex: 1; }
            .info-value { font-weight: 700; color: #111827; font-size: 14px; text-align: right; flex: 2; word-break: break-all; }
            .copy-btn { margin-left: 8px; background: #e0e7ff; color: #4f46e5; border: none; padding: 4px 8px; border-radius: 6px; font-size: 11px; cursor: pointer; font-weight: bold; transition: 0.2s; }
            .copy-btn:hover { background: #c7d2fe; }
            .open-app-btn { display: block; width: 100%; background: #4f46e5; color: white; padding: 14px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px; margin-top: 10px; transition: 0.2s; border: none; cursor: pointer; }
            .open-app-btn:hover { background: #4338ca; }
        </style>
        <script>
            function copyText(text, btn) {
                navigator.clipboard.writeText(text);
                const oldText = btn.innerText;
                btn.innerText = 'Đã copy';
                setTimeout(() => btn.innerText = oldText, 2000);
            }
        </script>
    </head>
    <body>
        <div class="card">
            <div class="logo-text">GETA TÂY NINH</div>
            <div class="subtitle">Thanh toán tự động 24/7</div>
            
            <div class="qr-container">
                <img class="qr-image" src="https://img.vietqr.io/image/MB-0000905816051-compact2.png?amount=${amount}&accountName=NGUYEN%20PHUOC%20HIEP&addInfo=${info}" alt="QR Code" />
            </div>
            
            <div class="info-box">
                <div class="info-row">
                    <span class="info-label">Ngân hàng</span>
                    <span class="info-value">MB Bank</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Chủ tài khoản</span>
                    <span class="info-value">NGUYEN PHUOC HIEP</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Số tài khoản</span>
                    <span class="info-value">0000905816051 <button class="copy-btn" onclick="copyText('0000905816051', this)">Copy</button></span>
                </div>
                <div class="info-row">
                    <span class="info-label">Số tiền cọc</span>
                    <span class="info-value" style="color: #e11d48;">${formattedAmount} <button class="copy-btn" onclick="copyText('${amount}', this)">Copy</button></span>
                </div>
                <div class="info-row">
                    <span class="info-label">Nội dung</span>
                    <span class="info-value">${info} <button class="copy-btn" onclick="copyText('${info}', this)">Copy</button></span>
                </div>
            </div>
            
            <p style="font-size: 12px; color: #9ca3af; margin-top: 20px;">Quý khách vui lòng kiểm tra kỹ số tiền và nội dung trước khi chuyển khoản. Xin cảm ơn!</p>
        </div>
    </body>
    </html>
    `;
        res.send(html);
    }
    async handleIncomingMessage(req, body, res) {
        const host = req.get('host') || 'localhost:3000';
        res.status(common_1.HttpStatus.OK).send('EVENT_RECEIVED');
        if (body.object === 'page') {
            for (const entry of body.entry) {
                if (!entry.messaging)
                    continue;
                for (const webhookEvent of entry.messaging) {
                    if (webhookEvent.message && webhookEvent.message.text && !webhookEvent.message.is_echo) {
                        const senderId = webhookEvent.sender.id;
                        const text = webhookEvent.message.text;
                        console.log(`Received message from Meta user ${senderId}: ${text}`);
                        if (text.trim().toLowerCase() === 'admin id') {
                            await this.metaService.sendMessage(senderId, `Mã ID của sếp là: ${senderId}`);
                            continue;
                        }
                        if (!this.messageBuffers.has(senderId)) {
                            this.messageBuffers.set(senderId, { texts: [], timer: null });
                        }
                        const buffer = this.messageBuffers.get(senderId);
                        buffer.texts.push(text);
                        if (buffer.timer) {
                            clearTimeout(buffer.timer);
                        }
                        buffer.timer = setTimeout(async () => {
                            const combinedText = buffer.texts.join(' ');
                            this.messageBuffers.delete(senderId);
                            console.log(`[Processing Combined Message from ${senderId}]: ${combinedText}`);
                            try {
                                const sessionId = `meta_${senderId}`;
                                let customerName = '';
                                try {
                                    const profile = await this.metaService.getUserProfile(senderId);
                                    if (profile && profile.name)
                                        customerName = profile.name;
                                }
                                catch (e) {
                                    console.warn('Could not fetch profile for', senderId);
                                }
                                const aiResponse = await this.aiAgentService.processMessage(combinedText, sessionId, customerName);
                                if (aiResponse) {
                                    console.log(`[AI Response to ${senderId}]: ${aiResponse}`);
                                    let textToProcess = aiResponse;
                                    let jsonStringToParse = null;
                                    const mdMatch = textToProcess.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/i);
                                    if (mdMatch) {
                                        jsonStringToParse = mdMatch[1];
                                        textToProcess = textToProcess.replace(mdMatch[0], '').trim();
                                    }
                                    else {
                                        const rawMatch = textToProcess.match(/\{[\s\S]*?\}/);
                                        if (rawMatch) {
                                            jsonStringToParse = rawMatch[0];
                                            textToProcess = textToProcess.replace(rawMatch[0], '').trim();
                                        }
                                    }
                                    let parsedOrderData = null;
                                    if (jsonStringToParse) {
                                        try {
                                            parsedOrderData = JSON.parse(jsonStringToParse);
                                            console.log(`[Order Extracted] for ${senderId}:`, parsedOrderData);
                                            if (parsedOrderData) {
                                                let partner = await this.prisma.partner.findUnique({
                                                    where: { code: sessionId }
                                                });
                                                if (!partner) {
                                                    partner = await this.prisma.partner.create({
                                                        data: {
                                                            code: sessionId,
                                                            type: 'LEAD',
                                                            fullName: parsedOrderData.customer_name || 'Khách hàng',
                                                        }
                                                    });
                                                }
                                                if (partner) {
                                                    try {
                                                        partner = await this.prisma.partner.update({
                                                            where: { id: partner.id },
                                                            data: {
                                                                fullName: parsedOrderData.customer_name || partner.fullName,
                                                                phone: (parsedOrderData.phone && parsedOrderData.phone.trim() !== '') ? parsedOrderData.phone : partner.phone,
                                                            }
                                                        });
                                                    }
                                                    catch (updateError) {
                                                        console.warn('Could not update partner info (possible duplicate phone):', updateError);
                                                    }
                                                }
                                                const addressWithProduct = `Địa chỉ: ${parsedOrderData.address || 'Trống'} | Mua: ${parsedOrderData.product || ''} (SL: ${parsedOrderData.quantity || 1})`;
                                                await this.prisma.salesOrder.create({
                                                    data: {
                                                        orderNo: `SO-${Date.now()}`,
                                                        customerId: partner?.id || null,
                                                        totalAmount: parseInt(parsedOrderData.total_price) || 0,
                                                        status: 'CONFIRMED',
                                                        pipelineSource: 'META_AI',
                                                        deliveryAddress: addressWithProduct
                                                    }
                                                });
                                                console.log('Order and Partner updated in Database successfully');
                                            }
                                        }
                                        catch (e) {
                                            console.error('Failed to parse or save order JSON', e);
                                        }
                                    }
                                    const labelRegex = /\[LABEL:\s*(.+?)\]/g;
                                    const matches = [...textToProcess.matchAll(labelRegex)];
                                    for (const match of matches) {
                                        const labelName = match[1].trim();
                                        if (labelName) {
                                            this.metaService.addLabelToUser(senderId, labelName);
                                        }
                                    }
                                    textToProcess = textToProcess.replace(labelRegex, '').trim();
                                    textToProcess = textToProcess.replace(/\[CURRENT_HOST\]/g, host);
                                    let normalizedResponse = textToProcess.replace(/\n+/g, '|||');
                                    normalizedResponse = normalizedResponse.replace(/([.!?])\s+/g, '$1|||');
                                    const bubbles = normalizedResponse.split('|||').map(b => b.trim()).filter(b => b.length > 0);
                                    for (const bubble of bubbles) {
                                        await this.metaService.sendAction(senderId, 'typing_on');
                                        const typingDelay = Math.min(Math.max(1500, bubble.length * 70), 8000);
                                        await new Promise(resolve => setTimeout(resolve, typingDelay));
                                        await this.metaService.sendMessage(senderId, bubble);
                                        await new Promise(resolve => setTimeout(resolve, 800));
                                    }
                                    if (parsedOrderData) {
                                        await new Promise(resolve => setTimeout(resolve, 1500));
                                        await this.metaService.sendOrderReceipt(senderId, parsedOrderData);
                                    }
                                }
                            }
                            catch (error) {
                                console.error('Error processing AI response', error);
                            }
                        }, 2500);
                    }
                }
            }
        }
    }
    async submitOrder(body) {
        const { psid, name, phone, address, note } = body;
        console.log(`Received order from PSID ${psid}:`, body);
        if (psid) {
            const summary = `Dạ Geta Tây Ninh đã nhận được thông tin đặt hàng của bạn:\n- Người nhận: ${name}\n- SĐT: ${phone}\n- Địa chỉ: ${address}\n${note ? `- Ghi chú: ${note}\n` : ''}\nBên mình sẽ tiến hành lên đơn và gửi bạn nha!`;
            await this.metaService.sendMessage(psid, summary);
        }
        return { success: true };
    }
};
exports.MetaController = MetaController;
__decorate([
    (0, common_1.Get)('webhook'),
    __param(0, (0, common_1.Query)('hub.mode')),
    __param(1, (0, common_1.Query)('hub.verify_token')),
    __param(2, (0, common_1.Query)('hub.challenge')),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", void 0)
], MetaController.prototype, "verifyWebhook", null);
__decorate([
    (0, common_1.Get)('pay'),
    __param(0, (0, common_1.Query)('amount')),
    __param(1, (0, common_1.Query)('info')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], MetaController.prototype, "renderPaymentPage", null);
__decorate([
    (0, common_1.Post)('webhook'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], MetaController.prototype, "handleIncomingMessage", null);
__decorate([
    (0, common_1.Post)('submit-order'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MetaController.prototype, "submitOrder", null);
exports.MetaController = MetaController = __decorate([
    (0, common_1.Controller)('api/v1/meta'),
    __metadata("design:paramtypes", [ai_agent_service_1.AiAgentService,
        meta_service_1.MetaService,
        prisma_service_1.PrismaService])
], MetaController);
//# sourceMappingURL=meta.controller.js.map