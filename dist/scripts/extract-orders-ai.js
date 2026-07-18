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
const openai_1 = require("@langchain/openai");
const zod_1 = require("zod");
const dotenv = __importStar(require("dotenv"));
const path = __importStar(require("path"));
dotenv.config({ path: path.join(__dirname, '..', '.env') });
const prisma = new client_1.PrismaClient();
const OrderSchema = zod_1.z.object({
    isOrderPlaced: zod_1.z.boolean().describe('Chỉ đánh dấu true nếu khách đã chốt số lượng, giá cả và cung cấp địa chỉ giao hàng.'),
    customerName: zod_1.z.string().optional().describe('Tên người nhận (nếu có).'),
    shippingAddress: zod_1.z.string().optional().describe('Địa chỉ giao hàng đầy đủ nhất có thể.'),
    paymentMethod: zod_1.z.string().optional().describe('Phương thức thanh toán (VD: COD, Chuyển khoản). Mặc định là COD nếu không nói.'),
    items: zod_1.z.array(zod_1.z.object({
        productName: zod_1.z.string().describe('Tên sản phẩm'),
        quantity: zod_1.z.number().describe('Số lượng'),
        unitPrice: zod_1.z.number().describe('Đơn giá (VND) của 1 sản phẩm. Lấy số nguyên.'),
        subtotal: zod_1.z.number().describe('Thành tiền của sản phẩm này (VND).'),
    })).optional().describe('Danh sách các sản phẩm khách đặt.'),
    totalAmount: zod_1.z.number().optional().describe('Tổng cộng tiền của toàn bộ đơn hàng (VND).'),
});
async function main() {
    console.log('Khởi tạo AI Model (DeepSeek)...');
    if (!process.env.DEEPSEEK_API_KEY) {
        console.error('Lỗi: Chưa cài đặt DEEPSEEK_API_KEY trong .env');
        process.exit(1);
    }
    const model = new openai_1.ChatOpenAI({
        modelName: 'deepseek-chat',
        openAIApiKey: process.env.DEEPSEEK_API_KEY,
        configuration: {
            baseURL: 'https://api.deepseek.com/v1',
        },
        temperature: 0.1,
    });
    console.log('Đang lấy danh sách các hội thoại từ Database...');
    const conversations = await prisma.conversation.findMany({
        include: {
            messages: {
                orderBy: { createdAt: 'asc' }
            },
            customer: true
        }
    });
    console.log(`Tìm thấy ${conversations.length} hội thoại. Tiến hành phân tích...`);
    for (const conv of conversations) {
        if (conv.messages.length === 0)
            continue;
        console.log(`\n===========================================`);
        console.log(`Đang phân tích hội thoại của khách: ${conv.customer.metaUserId || conv.customer.id}`);
        const transcript = conv.messages.map(m => {
            const role = m.sender === 'CUSTOMER' ? 'Khách hàng' : 'Nhân viên';
            return `${role}: ${m.content}`;
        }).join('\n');
        const prompt = `
Bạn là một nhân viên kiểm duyệt đơn hàng.
Nhiệm vụ của bạn là đọc đoạn hội thoại sau và trích xuất thông tin ĐƠN HÀNG nếu khách hàng đã chốt đơn.
CHÚ Ý:
- Khách hàng có thể hỏi giá nhiều loại, chỉ lấy loại khách CHỐT cuối cùng.
- Phải có địa chỉ giao hàng thì mới tính là chốt đơn (isOrderPlaced = true).
- Nếu không có đơn hàng nào được chốt, hãy trả về isOrderPlaced = false.
- ĐẶC BIỆT CHÚ Ý ĐẾN TIỀN CỌC: Nếu trong đoạn chat có nhắc đến việc khách đã cọc (ví dụ: cọc 40%, cọc 50%, đã chuyển khoản...), hãy tự động lấy (totalAmount * phần trăm cọc) để tính ra số tiền cọc và ghi vào trường depositAmount. Nếu khách không nhắc gì đến cọc, để 0. Đồng thời nếu khách đã cọc, đổi paymentMethod thành "CHUYỂN KHOẢN".

Hội thoại:
${transcript}

VUI LÒNG TRẢ VỀ ĐÚNG ĐỊNH DẠNG JSON NHƯ SAU, KHÔNG GIẢI THÍCH GÌ THÊM:
{
  "isOrderPlaced": boolean, // true nếu chốt, false nếu chưa
  "customerName": "Tên khách",
  "shippingAddress": "Địa chỉ giao hàng đầy đủ",
  "paymentMethod": "COD",
  "totalAmount": 100000, // Số nguyên
  "depositAmount": 40000, // Số tiền cọc khách đã chuyển (VD 40% của totalAmount). Nếu chưa cọc để 0.
  "items": [
    {
      "productName": "Tên sp",
      "quantity": 1,
      "unitPrice": 50000,
      "subtotal": 50000
    }
  ]
}
`;
        try {
            const response = await model.invoke(prompt, {
                response_format: { type: "json_object" }
            });
            const result = JSON.parse(response.content);
            if (result.isOrderPlaced && result.items && result.items.length > 0) {
                console.log(`🎯 Đã phát hiện đơn hàng! Khách mua: ${result.items.map(i => i.productName).join(', ')}`);
                const orderNo = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
                const order = await prisma.order.create({
                    data: {
                        orderNo: orderNo,
                        customerId: conv.customer.id,
                        totalAmount: result.totalAmount || 0,
                        depositAmount: result.depositAmount || 0,
                        status: 'PENDING',
                        paymentMethod: result.paymentMethod || 'COD',
                        shippingAddress: result.shippingAddress || '',
                        items: {
                            create: result.items.map(item => ({
                                productName: item.productName,
                                quantity: item.quantity,
                                unitPrice: item.unitPrice,
                                subtotal: item.subtotal
                            }))
                        }
                    }
                });
                console.log(`✅ Đã lưu đơn hàng vào DB: ${order.orderNo} - Tổng tiền: ${order.totalAmount}đ`);
            }
            else {
                console.log(`❌ Khách chưa chốt đơn hoặc chỉ hỏi giá.`);
            }
        }
        catch (error) {
            console.error(`Lỗi khi phân tích hội thoại ${conv.id}:`, error);
        }
    }
    console.log('\n✅ Quá trình bóc tách đơn hàng hoàn tất!');
}
main()
    .catch((e) => {
    console.error('Lỗi hệ thống:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=extract-orders-ai.js.map