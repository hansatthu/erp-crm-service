"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Bắt đầu đọc file chat_history.json...');
    const filePath = path.join(__dirname, '..', 'chat_history.json');
    if (!fs.existsSync(filePath)) {
        console.error('Không tìm thấy file chat_history.json tại', filePath);
        process.exit(1);
    }
    const rawData = fs.readFileSync(filePath, 'utf-8');
    const chatHistory = JSON.parse(rawData);
    const keys = Object.keys(chatHistory);
    console.log(`Tìm thấy ${keys.length} cuộc hội thoại cũ.`);
    for (const key of keys) {
        console.log(`Đang xử lý hội thoại: ${key}`);
        const messages = chatHistory[key];
        let platform = client_1.Platform.FACEBOOK;
        let metaUserId = key;
        if (key.startsWith('meta_')) {
            platform = client_1.Platform.FACEBOOK;
            metaUserId = key.replace('meta_', '');
        }
        else if (key.startsWith('zalo_')) {
            platform = client_1.Platform.ZALO;
            metaUserId = key.replace('zalo_', '');
        }
        let customer = await prisma.customer.findFirst({
            where: { metaUserId, platform }
        });
        if (!customer) {
            customer = await prisma.customer.create({
                data: {
                    metaUserId,
                    platform,
                    fullName: `Khách hàng ${metaUserId}`,
                }
            });
            console.log(`  -> Đã tạo mới Customer: ${customer.id}`);
        }
        else {
            console.log(`  -> Customer đã tồn tại: ${customer.id}`);
        }
        const conversation = await prisma.conversation.create({
            data: {
                customerId: customer.id,
                platform: platform,
                status: 'CLOSED',
            }
        });
        console.log(`  -> Đã tạo Conversation: ${conversation.id}`);
        const messageData = messages.map((msg) => {
            const role = msg[0];
            const content = msg[1];
            let sender = client_1.SenderType.CUSTOMER;
            if (role === 'assistant') {
                sender = client_1.SenderType.AI;
            }
            else if (role === 'admin') {
                sender = client_1.SenderType.ADMIN;
            }
            return {
                conversationId: conversation.id,
                sender,
                messageType: client_1.MessageType.TEXT,
                content,
            };
        });
        if (messageData.length > 0) {
            await prisma.message.createMany({
                data: messageData
            });
            console.log(`  -> Đã lưu ${messageData.length} tin nhắn.`);
        }
    }
    console.log('✅ Hoàn tất việc migrate dữ liệu!');
}
main()
    .catch((e) => {
    console.error('Lỗi khi migrate:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=migrate-chat-history.js.map