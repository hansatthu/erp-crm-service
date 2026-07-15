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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AiAgentService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiAgentService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
const openai_1 = require("@langchain/openai");
const knowledge_1 = require("./knowledge");
const tools_1 = require("@langchain/core/tools");
const zod_1 = require("zod");
const agents_1 = require("langchain/agents");
const prompts_1 = require("@langchain/core/prompts");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const prisma_service_1 = require("../prisma/prisma.service");
let AiAgentService = AiAgentService_1 = class AiAgentService {
    httpService;
    prisma;
    logger = new common_1.Logger(AiAgentService_1.name);
    constructor(httpService, prisma) {
        this.httpService = httpService;
        this.prisma = prisma;
    }
    async onModuleInit() {
        this.logger.log('Bypassing Vector Store for DeepSeek RAG...');
        this.loadHistoryFromDisk();
    }
    createSearchTool() {
        return (0, tools_1.tool)(async ({ query }) => {
            const apiKey = process.env.SERPER_API_KEY;
            if (!apiKey) {
                return 'Error: SERPER_API_KEY is not configured in .env. Please configure it to search Google.';
            }
            try {
                const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post('https://google.serper.dev/search', { q: query, gl: 'vn', hl: 'vi' }, {
                    headers: {
                        'X-API-KEY': apiKey,
                        'Content-Type': 'application/json',
                    },
                }));
                const organic = response.data.organic || [];
                return organic.map((res) => `Title: ${res.title}\nLink: ${res.link}\nSnippet: ${res.snippet}`).join('\n\n');
            }
            catch (error) {
                this.logger.error('Failed to execute Serper search', error);
                return 'Failed to search the web.';
            }
        }, {
            name: 'google_search',
            description: 'Searches Google for the given query and returns snippets of top results. Use this to find suppliers.',
            schema: zod_1.z.object({
                query: zod_1.z.string().describe('The search query, e.g. "nhà cung cấp ly nhựa PET tại TP.HCM"'),
            }),
        });
    }
    async findSuppliers(query) {
        if (!process.env.DEEPSEEK_API_KEY) {
            throw new common_1.HttpException('DEEPSEEK_API_KEY is missing in .env', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
        const searchTool = this.createSearchTool();
        const tools = [searchTool];
        const llm = new openai_1.ChatOpenAI({
            modelName: 'deepseek-chat',
            temperature: 0,
            apiKey: process.env.DEEPSEEK_API_KEY,
            configuration: {
                baseURL: 'https://api.deepseek.com/v1',
            }
        });
        const prompt = prompts_1.ChatPromptTemplate.fromMessages([
            ['system', `Bạn là một trợ lý AI chuyên nghiệp về tìm kiếm nguồn hàng (Sourcing Agent) tại Việt Nam.
Nhiệm vụ của bạn là tìm kiếm các "Nhà Cung Cấp" (Suppliers) dựa trên yêu cầu của người dùng.
Hãy sử dụng công cụ 'google_search' để tìm kiếm thông tin trên web (tìm nhiều lần nếu cần để ra thông tin liên hệ).
Mục tiêu là trích xuất ra một danh sách các nhà cung cấp uy tín với các thông tin: Tên, Số điện thoại, Website, Địa chỉ, và Ghi chú ngắn gọn.

BẠN PHẢI TRẢ VỀ DỮ LIỆU DƯỚI ĐỊNH DẠNG JSON MẢNG (ARRAY) CHUẨN XÁC, không kèm text nào khác ngoài JSON.
Ví dụ:
[
  {{ "name": "Công ty A", "phone": "0901234567", "website": "https://a.com", "address": "TP.HCM", "notes": "Chuyên ly PET" }}
]`],
            ['user', '{input}'],
            new prompts_1.MessagesPlaceholder('agent_scratchpad'),
        ]);
        const agent = (0, agents_1.createToolCallingAgent)({
            llm,
            tools,
            prompt,
        });
        const agentExecutor = new agents_1.AgentExecutor({
            agent,
            tools,
            maxIterations: 5,
        });
        try {
            const result = await agentExecutor.invoke({
                input: `Tìm cho tôi danh sách các nhà cung cấp: ${query}. Xuất ra chuẩn JSON array.`,
            });
            const rawText = result.output;
            const jsonMatch = rawText.match(/\[.*\]/s);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            return JSON.parse(rawText);
        }
        catch (error) {
            this.logger.error('Failed to find suppliers', error);
            throw new common_1.HttpException('Failed to process supplier search', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    chatHistories = new Map();
    historyFilePath = path.join(process.cwd(), 'chat_history.json');
    loadHistoryFromDisk() {
        try {
            if (fs.existsSync(this.historyFilePath)) {
                const data = fs.readFileSync(this.historyFilePath, 'utf-8');
                const parsed = JSON.parse(data);
                this.chatHistories = new Map(Object.entries(parsed));
            }
        }
        catch (e) {
            this.logger.error('Could not load chat history from disk', e);
        }
    }
    saveHistoryToDisk() {
        try {
            const obj = Object.fromEntries(this.chatHistories);
            fs.writeFileSync(this.historyFilePath, JSON.stringify(obj, null, 2));
        }
        catch (e) {
            this.logger.error('Could not save chat history to disk', e);
        }
    }
    async processMessage(text, sessionId, customerName) {
        if (!process.env.DEEPSEEK_API_KEY) {
            this.logger.warn('DEEPSEEK_API_KEY is missing, throwing error to prevent sending message.');
            throw new Error('Missing DEEPSEEK_API_KEY');
        }
        try {
            const llm = new openai_1.ChatOpenAI({
                modelName: 'deepseek-chat',
                temperature: 0.7,
                maxRetries: 2,
                apiKey: process.env.DEEPSEEK_API_KEY,
                configuration: {
                    baseURL: 'https://api.deepseek.com/v1',
                }
            });
            const context = knowledge_1.GETA_KNOWLEDGE_DOCS.map(doc => doc.pageContent).join('\n\n');
            const customerInfo = customerName
                ? `\nTên của khách hàng trên Facebook/Zalo là: "${customerName}". Hãy tự suy luận giới tính qua tên để gọi Anh/Chị. NHƯNG NẾU tên nửa nam nửa nữ (không rõ ràng), BẮT BUỘC dùng xưng hô "Mình" và "Bạn" để tránh gọi sai giới tính gây mất lòng khách nhé.`
                : '';
            const systemPrompt = `
# VAI TRÒ
Bạn là một nhân viên chăm sóc khách hàng (CSKH) và tư vấn chốt đơn cực kỳ chuyên nghiệp, khéo léo của xưởng in GETA Tây Ninh.
TÊN CỦA BẠN LÀ: Nhân viên CSKH GETA.
TUYỆT ĐỐI KHÔNG BAO GIỜ nhận mình là AI, trợ lý ảo hay người máy. Bạn là người thật 100%.${customerInfo}


# GIỌNG ĐIỆU & PHONG CÁCH CHAT (QUAN TRỌNG NHẤT)
- Xưng hô: BẮT BUỘC xưng "mình" và gọi khách là "bạn" (hoặc xưng "em" gọi "anh/chị" tùy ngữ cảnh).
- Phong cách: Cực kỳ tự nhiên, giống như một nhân viên sale Gen Z hoặc Millennial đang nhắn tin trên điện thoại. Hãy dùng icon cảm xúc một cách tự nhiên (như 😊, 🥰, dạ vâng ạ 🙏, dạ đúng rồi hehe).
- CỰC KỲ NGẮN GỌN: Tuyệt đối KHÔNG LAN MAN. Khách hỏi gì trả lời đúng trọng tâm cái đó. Không giải thích dông dài. Một tin nhắn không được quá dài, hãy ngắt thành nhiều tin nhắn nhỏ.
- CẤM TUYỆT ĐỐI: Không dùng dấu sao (**) để bôi đậm, vì trông rất giống văn phong của Bot. Hãy viết chữ trơn.
- CHÍNH TẢ & DẤU CÂU: Có thể không cần quá cứng nhắc về dấu câu ở cuối (có thể bỏ dấu chấm câu ở cuối câu để trông tự nhiên hơn).
- HIỂU ĐÚNG Ý KHÁCH: Khách hay dùng từ viết tắt ("k", "ok", "dc", "ntn"), phải hiểu đúng ngữ cảnh. Không nói 1 ý 2 lần. Không lặp lại cùng một câu báo giá.

# HƯỚNG DẪN TƯ VẤN & BÁN HÀNG
1. Chào hỏi thân thiện: "Dạ Geta Tây Ninh chào bạn ạ, bạn đang quan tâm mẫu ly nào bên mình nè?"
2. Khai thác nhu cầu: Hỏi khéo léo về số lượng, dung tích (ví dụ: "Dạ bạn dự định in khoảng bao nhiêu cái ạ?", "Mình dùng ly bán trà sữa hay cà phê vậy bạn?"). Đừng hỏi dồn dập nhiều câu cùng lúc.
3. Báo giá: Dựa vào Kiến thức bên dưới để báo giá. "Dạ loại 500ml nếu in 1000 cái thì giá là 1.200đ/cái nha bạn".
4. Upsell: Khuyến khích khách in số lượng nhiều hơn để có giá tốt.

# CÁCH GỬI NHIỀU TIN NHẮN LIÊN TIẾP
Nếu bạn muốn nhắn nhiều ý, PHẢI dùng ký hiệu ||| để tách các tin nhắn ra, hệ thống sẽ gửi từng tin một cho khách.
VÍ DỤ ĐÚNG: "Dạ mẫu ly nắp cầu 500ml bên mình đang sẵn hàng đó ạ ||| Bạn định in logo 1 màu hay nhiều màu nè?"
VÍ DỤ SAI (Tuyệt đối không làm): "Dạ mẫu ly 500ml bên mình đang sẵn hàng. Bạn định in logo 1 màu hay nhiều màu?" (Gộp 2 câu vào 1 tin nhắn quá dài).

# BẮT BUỘC: MÃ LỆNH HỆ THỐNG (SYSTEM TAGS)
Để hệ thống phần mềm hoạt động, bạn BẮT BUỘC phải tự động chèn các Thẻ (Tag) sau vào BẤT CỨ ĐÂU trong câu trả lời của bạn. Khách sẽ không nhìn thấy các thẻ này.
1. THẺ GẮN NHÃN [LABEL: Tên Nhãn]: Bạn BẮT BUỘC phải tự đánh giá và chèn 1 thẻ Label để hệ thống phân loại khách.
   - Ví dụ: [LABEL: Khách Mới], [LABEL: Khách Lẻ] (nếu mua < 10 thùng), [LABEL: Khách Đại Lý] (nếu mua >= 10 thùng), [LABEL: Đã Báo Giá], [LABEL: Chốt Đơn].

# QUY TRÌNH CHỐT ĐƠN & LẤY THÔNG TIN
Khi khách ĐỒNG Ý CHỐT ĐƠN, bạn BẮT BUỘC phải xin đủ 3 thông tin: Tên, Số điện thoại, Địa chỉ giao hàng.
Bạn có thể hỏi gộp (Ví dụ: "Dạ bạn cho mình xin Tên, SĐT và Địa chỉ để lên đơn nha") hoặc hỏi từng câu một tùy ngữ cảnh. Khách sẽ nhắn tin trả lời lại.

# TẠO ĐƠN HÀNG (QUAN TRỌNG NHẤT)
Chỉ khi nào khách ĐÃ CUNG CẤP ĐỦ thông tin (Tên, SĐT, Địa chỉ, Sản phẩm, Số lượng), bạn PHẢI xác nhận lại đơn hàng và chèn đoạn mã JSON sau vào CUỐI tin nhắn để hệ thống lưu đơn:
{
    "customer_name":"Tên khách",
    "phone":"SĐT khách",
    "address":"Địa chỉ khách",
    "product":"Tên sản phẩm khách chốt",
    "quantity": Số lượng,
    "total_price": BẮT BUỘC ghi tổng số tiền (chỉ ghi số, ví dụ 150000. ĐỪNG BAO GIỜ BỎ QUÊN TRƯỜNG NÀY)
}

# THÔNG TIN KIẾN THỨC (DỰA VÀO ĐÂY ĐỂ TƯ VẤN)
${context}

`;
            const history = this.chatHistories.get(sessionId) || [];
            const messages = [['system', systemPrompt], ...history, ['user', text]];
            let response;
            try {
                response = await Promise.race([
                    llm.invoke(messages),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('LLM Timeout (Rate Limited)')), 15000))
                ]);
            }
            catch (err) {
                this.logger.error('Deepseek API failed or timed out:', err);
                throw err;
            }
            let textToProcess = response.content;
            const labelRegex = /\[LABEL:\s*([^\]]+)\]/i;
            const labelMatch = textToProcess.match(labelRegex);
            if (labelMatch) {
                const extractedLabel = labelMatch[1].trim();
                textToProcess = textToProcess.replace(labelRegex, '').trim();
                try {
                    await this.prisma.partner.upsert({
                        where: { code: sessionId },
                        update: { status: extractedLabel, updatedAt: new Date() },
                        create: {
                            code: sessionId,
                            type: 'LEAD',
                            fullName: customerName || 'Khách hàng',
                            status: extractedLabel,
                        }
                    });
                }
                catch (dbErr) {
                    this.logger.error(`Failed to upsert Partner for session ${sessionId}`, dbErr);
                }
            }
            history.push(['user', text]);
            history.push(['assistant', textToProcess]);
            if (history.length > 40) {
                history.splice(0, history.length - 40);
            }
            this.chatHistories.set(sessionId, history);
            this.saveHistoryToDisk();
            return textToProcess;
        }
        catch (error) {
            this.logger.error(`Error processing message for session ${sessionId}`, error);
            throw error;
        }
    }
};
exports.AiAgentService = AiAgentService;
exports.AiAgentService = AiAgentService = AiAgentService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService,
        prisma_service_1.PrismaService])
], AiAgentService);
//# sourceMappingURL=ai-agent.service.js.map