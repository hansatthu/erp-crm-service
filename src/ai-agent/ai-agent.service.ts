import { Injectable, Logger, HttpException, HttpStatus, OnModuleInit } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ChatOpenAI } from '@langchain/openai';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { GETA_KNOWLEDGE_DOCS } from './knowledge';
import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { createToolCallingAgent, AgentExecutor } from 'langchain/agents';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';

export interface SupplierResult {
  name: string;
  phone?: string;
  website?: string;
  address?: string;
  notes?: string;
}

@Injectable()
export class AiAgentService implements OnModuleInit {
  private readonly logger = new Logger(AiAgentService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly prisma: PrismaService,
  ) { }

  async onModuleInit() {
    this.logger.log('Bypassing Vector Store for DeepSeek RAG...');
    this.loadHistoryFromDisk();
  }

  /**
   * Defines the Google Search tool via Serper.dev
   */
  private createSearchTool() {
    return tool(
      async ({ query }) => {
        const apiKey = process.env.SERPER_API_KEY;
        if (!apiKey) {
          return 'Error: SERPER_API_KEY is not configured in .env. Please configure it to search Google.';
        }

        try {
          const response = await firstValueFrom(
            this.httpService.post(
              'https://google.serper.dev/search',
              { q: query, gl: 'vn', hl: 'vi' },
              {
                headers: {
                  'X-API-KEY': apiKey,
                  'Content-Type': 'application/json',
                },
              }
            )
          );

          const organic = response.data.organic || [];
          return organic.map((res: any) => `Title: ${res.title}\nLink: ${res.link}\nSnippet: ${res.snippet}`).join('\n\n');
        } catch (error) {
          this.logger.error('Failed to execute Serper search', error);
          return 'Failed to search the web.';
        }
      },
      {
        name: 'google_search',
        description: 'Searches Google for the given query and returns snippets of top results. Use this to find suppliers.',
        schema: z.object({
          query: z.string().describe('The search query, e.g. "nhà cung cấp ly nhựa PET tại TP.HCM"'),
        }),
      }
    );
  }

  /**
   * Main function to find suppliers and return them as a table (array of objects)
   */
  async findSuppliers(query: string): Promise<SupplierResult[]> {
    if (!process.env.DEEPSEEK_API_KEY) {
      throw new HttpException('DEEPSEEK_API_KEY is missing in .env', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    const searchTool = this.createSearchTool();
    const tools = [searchTool];

    // Initialize Deepseek LLM
    const llm = new ChatOpenAI({
      modelName: 'deepseek-chat',
      temperature: 0,
      apiKey: process.env.DEEPSEEK_API_KEY,
      configuration: {
        baseURL: 'https://api.deepseek.com/v1',
      }
    });

    // Create prompt
    const prompt = ChatPromptTemplate.fromMessages([
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
      new MessagesPlaceholder('agent_scratchpad'),
    ]);

    // Create Agent
    const agent = createToolCallingAgent({
      llm,
      tools,
      prompt,
    });

    const agentExecutor = new AgentExecutor({
      agent,
      tools,
      maxIterations: 5,
    });

    try {
      const result = await agentExecutor.invoke({
        input: `Tìm cho tôi danh sách các nhà cung cấp: ${query}. Xuất ra chuẩn JSON array.`,
      });

      // Parse output
      const rawText = result.output;
      const jsonMatch = rawText.match(/\[.*\]/s);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(rawText);
    } catch (error) {
      this.logger.error('Failed to find suppliers', error);
      throw new HttpException('Failed to process supplier search', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Disk-backed store for chat histories
  private chatHistories = new Map<string, [string, string][]>();
  private readonly historyFilePath = path.join(process.cwd(), 'chat_history.json');

  private loadHistoryFromDisk() {
    try {
      if (fs.existsSync(this.historyFilePath)) {
        const data = fs.readFileSync(this.historyFilePath, 'utf-8');
        const parsed = JSON.parse(data);
        this.chatHistories = new Map(Object.entries(parsed));
      }
    } catch (e) {
      this.logger.error('Could not load chat history from disk', e);
    }
  }

  private saveHistoryToDisk() {
    try {
      const obj = Object.fromEntries(this.chatHistories);
      fs.writeFileSync(this.historyFilePath, JSON.stringify(obj, null, 2));
    } catch (e) {
      this.logger.error('Could not save chat history to disk', e);
    }
  }

  /**
   * Process incoming messages from Meta or Zalo
   */
  async processMessage(text: string, sessionId: string, customerName?: string): Promise<string> {
    if (!process.env.DEEPSEEK_API_KEY) {
      this.logger.warn('DEEPSEEK_API_KEY is missing, throwing error to prevent sending message.');
      throw new Error('Missing DEEPSEEK_API_KEY');
    }

    try {
      const llm = new ChatOpenAI({
        modelName: 'deepseek-chat',
        temperature: 0.7,
        maxRetries: 2,
        apiKey: process.env.DEEPSEEK_API_KEY,
        configuration: {
          baseURL: 'https://api.deepseek.com/v1',
        }
      });

      // Inject full knowledge base directly
      const context = GETA_KNOWLEDGE_DOCS.map(doc => doc.pageContent).join('\n\n');

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
      const messages: any[] = [['system', systemPrompt], ...history, ['user', text]];

      let response;
      try {
        response = await Promise.race([
          llm.invoke(messages),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('LLM Timeout (Rate Limited)')), 15000)
          )
        ]) as any;
      } catch (err) {
        this.logger.error('Deepseek API failed or timed out:', err);
        throw err;
      }

      // Extract Label and track Partner status
      let textToProcess = response.content as string;
      const labelRegex = /\[LABEL:\s*([^\]]+)\]/i;
      const labelMatch = textToProcess.match(labelRegex);
      if (labelMatch) {
        const extractedLabel = labelMatch[1].trim();
        // Remove label from text so it doesn't show to user
        textToProcess = textToProcess.replace(labelRegex, '').trim();
        
        try {
          // Attempt to upsert partner based on sessionId (Legacy logic - commented out)
          /*
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
          */
        } catch (dbErr) {
          this.logger.error(`Failed to upsert Partner for session ${sessionId}`, dbErr);
        }
      }

      // Save to history
      history.push(['user', text]);
      history.push(['assistant', textToProcess]);
      // Keep only last 40 interactions to avoid token bloat
      if (history.length > 40) {
        history.splice(0, history.length - 40);
      }
      this.chatHistories.set(sessionId, history);
      this.saveHistoryToDisk();

      return textToProcess;
    } catch (error) {
      this.logger.error(`Error processing message for session ${sessionId}`, error);
      throw error;
    }
  }
}
