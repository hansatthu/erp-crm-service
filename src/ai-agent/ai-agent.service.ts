import { Injectable, Logger, HttpException, HttpStatus, OnModuleInit } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ChatOpenAI } from '@langchain/openai';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
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

const DEFAULT_SYSTEM_PROMPT = `
Bạn là một nhân viên CSKH. Vui lòng kiểm tra file rules.txt.
`;

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
    
    // Seed default system prompt to database if not exists
    try {
      const existing = await this.prisma.botConfig.findUnique({ where: { key: 'SYSTEM_PROMPT' } });
      if (!existing) {
        await this.prisma.botConfig.create({
          data: {
            key: 'SYSTEM_PROMPT',
            value: DEFAULT_SYSTEM_PROMPT,
          }
        });
        this.logger.log('Seeded default SYSTEM_PROMPT to database.');
      }
    } catch (e) {
      this.logger.error('Failed to seed SYSTEM_PROMPT to database', e);
    }
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
   * Inject a message from the human Admin into the AI's history
   * so the AI knows what the Admin said when it takes over again.
   */
  injectAdminMessage(sessionId: string, text: string) {
    const history = this.chatHistories.get(sessionId) || [];
    history.push(['assistant', text]);
    if (history.length > 40) history.splice(0, history.length - 40);
    this.chatHistories.set(sessionId, history);
    this.saveHistoryToDisk();
  }

  /**
   * Inject a message from the User into the AI's history
   * when the bot is paused by Admin intervention.
   */
  injectUserMessage(sessionId: string, text: string) {
    const history = this.chatHistories.get(sessionId) || [];
    history.push(['user', text]);
    if (history.length > 40) history.splice(0, history.length - 40);
    this.chatHistories.set(sessionId, history);
    this.saveHistoryToDisk();
  }

  /**
   * Truy vấn các QA mẫu mà bot đã học (từ hội thoại được admin đánh giá tốt / sửa)
   * và chọn những mẫu liên quan nhất tới câu hỏi hiện tại.
   */
  async getLearnedKnowledge(text: string, limit = 4): Promise<string> {
    try {
      const all = await this.prisma.learnedKnowledge.findMany({
        orderBy: [{ upvotes: 'desc' }, { used: 'asc' }],
        take: 50,
      });
      if (!all.length) return '';

      const q = text.toLowerCase().split(/\s+/).filter(w => w.length > 2);
      const scored = all.map(k => {
        const kq = (k.question || '').toLowerCase();
        const ka = (k.answer || '').toLowerCase();
        const hay = `${kq} ${ka}`;
        const score = q.filter(w => hay.includes(w)).length;
        return { k, score };
      }).filter(x => x.score > 0).sort((a, b) => b.score - a.score).slice(0, limit);

      if (!scored.length) return '';

      // Ghi nhận lượt đã sử dụng để admin biết mẫu nào hay được dùng
      try {
        await this.prisma.learnedKnowledge.updateMany({
          where: { id: { in: scored.map(x => x.k.id) } },
          data: { used: { increment: 1 } },
        });
      } catch (e) {
        this.logger.warn('Failed to increment knowledge usage', e);
      }

      const block = scored.map(({ k }) => `- Câu hỏi khách: "${k.question}"\n  → Cách tư vấn tốt (đã được đánh giá): "${k.answer}"`).join('\n\n');
      return `\n\n# KIẾN THỨC HỌC ĐƯỢC TỪ CÁC KHÁCH HÀNG TRƯỚC (THAM KHẢO)\nDưới đây là cách bot đã tư vấn hiệu quả cho các khách hàng trước (được admin duyệt). Hãy tham khảo để trả lời tự nhiên, chính xác tương tự:\n${block}\n(Chỉ dùng làm tham khảo, không nhắc tên hay thông tin khách hàng trước cho khách hiện tại.)`;
    } catch (e) {
      this.logger.warn('Failed to load learned knowledge', e);
      return '';
    }
  }

  /**
   * Admin đánh giá tốt một câu trả lời → bot học từ đó.
   */
  async approveKnowledge(question: string, answer: string, source?: string) {
    if (!question || !answer) return null;
    const existing = await this.prisma.learnedKnowledge.findFirst({
      where: { question: { equals: question }, answer: { equals: answer } },
    });
    if (existing) {
      return this.prisma.learnedKnowledge.update({
        where: { id: existing.id },
        data: { upvotes: { increment: 1 } },
      });
    }
    return this.prisma.learnedKnowledge.create({
      data: { question, answer, source },
    });
  }

  /**
   * Process incoming messages from Meta or Zalo
   */
  /**
   * Loại bỏ mọi dạng "quá trình suy luận/thinking" lỡ bị model trả ra cùng câu trả lời.
   * Xử lý được 2 dạng phổ biến:
   *  1) Chuỗi agent của LangChain: "Thought: ... Action: ... Action Input: ..."
   *  2) Đoạn cân nhắc nội bộ trước câu trả lời cuối (model giải thích từng bước).
   */
  private stripReasoning(raw: string): string {
    if (!raw) return raw;
    let text = raw;

    // Dạng 1: agent_scratchpad của LangChain. Nếu có nhãn "Final Answer:",
    // lấy đúng phần sau nhãn đó (kết quả cuối) — bỏ toàn bộ chuỗi Thought/Action phía trước.
    const finalMatch = text.match(/Final\s+Answer\s*:\s*/i);
    if (finalMatch && finalMatch.index !== undefined) {
      text = text.slice(finalMatch.index + finalMatch[0].length).trim();
    } else {
      // Không có "Final Answer:" → loại bỏ từng vòng Thought/Action thừa đầu dòng.
      const actionSteps = /(^\s*Thought\s*:.*\n?)(?=\s*(?:Action|Final|$))|^\s*Action\s*(?:Input)?\s*:.*\n?/gim;
      for (let i = 0; i < 20; i++) {
        const next = text.replace(actionSteps, '').trim();
        if (next === text) break;
        text = next;
      }
    }

    // Dạng 2: DeepSeek reasoning_content có thể bị nối vào content.
    // Nếu còn các nhãn suy luận đầu dòng, cắt bỏ phần suy luận.
    const reasoningPrefix = /^[\s\S]*?\n(?=(Dạ|Chào|Xin chào|Em|Mình|Bạn|Anh|Chị|Để em|Dạ em|Kết quả|Tóm lại|Vậy))/i;
    // Chỉ áp dụng nếu có dấu hiệu reasoning (đoạn quá dài, nhiều dòng giải thích nội bộ).
    if (/em (đang|sẽ|cân nhắc|tính)|tôi sẽ|đầu tiên,|trước tiên,|bước 1[:\s]|để giải quyết|suy luận/i.test(text)) {
      const m = text.match(reasoningPrefix);
      if (m) {
        text = text.slice(m[0].length).trim();
      }
    }

    return text.trim();
  }

  async processMessage(text: string, sessionId: string, customerName?: string, pageId?: string): Promise<string> {
    if (!process.env.DEEPSEEK_API_KEY) {
      this.logger.warn('DEEPSEEK_API_KEY is missing, throwing error to prevent sending message.');
      throw new Error('Missing DEEPSEEK_API_KEY');
    }

    try {
      const searchProductsTool = tool(
        async ({ query }) => {
          try {
            const products = await this.prisma.product.findMany({
              where: {
                OR: [
                  { name: { contains: query, mode: 'insensitive' } },
                  { sku: { contains: query, mode: 'insensitive' } },
                  { note: { contains: query, mode: 'insensitive' } },
                ]
              },
              take: 10,
            });
            return JSON.stringify(products);
          } catch(err) {
            return "Lỗi khi tìm kiếm sản phẩm";
          }
        },
        {
          name: 'search_products',
          description: 'Tìm kiếm sản phẩm theo tên, sku. Trả về thông tin chi tiết và giá cả.',
          schema: z.object({
            query: z.string().describe('Tên sản phẩm hoặc từ khóa cần tìm (VD: 500ml, PP, nắp cầu, ống hút)'),
          }),
        }
      );

      const tools = [searchProductsTool];

      const llm = new ChatOpenAI({
        modelName: 'deepseek-chat',
        temperature: 0.7,
        maxRetries: 2,
        apiKey: process.env.DEEPSEEK_API_KEY,
        configuration: {
          baseURL: 'https://api.deepseek.com/v1',
        }
      });

      // We don't use vector DB context for products anymore, relying on tools
      const context = '';

      const customerInfo = customerName
        ? `\nTên của khách hàng trên Facebook/Zalo là: "${customerName}". Hãy tự suy luận giới tính qua tên để gọi Anh/Chị. NHƯNG NẾU tên nửa nam nửa nữ (không rõ ràng), BẮT BUỘC dùng xưng hô "Mình" và "Bạn" để tránh gọi sai giới tính gây mất lòng khách nhé.`
        : '';

      let rawPrompt = DEFAULT_SYSTEM_PROMPT;
      try {
        const rulesPath = path.join(process.cwd(), 'src/ai-agent/rules.txt');
        if (fs.existsSync(rulesPath)) {
          rawPrompt = fs.readFileSync(rulesPath, 'utf8');
        }
      } catch(e) {
        this.logger.warn('Failed to load rules.txt', e);
      }

      // Prepend the persona context to the rules
      const reasoningBan = `
==================================================
# 0. QUY TẮC TUYỆT ĐỐI (BẮT BUỘC)
- CHỈ trả lời bằng câu trả lời CUỐI CÙNG dành cho khách hàng.
- TUYỆT ĐỐI KHÔNG được đưa ra/hiển thị quá trình suy luận, các bước phân tích,
  lý do nội bộ, hay mô tả "em đang nghĩ/em tính toán/em cân nhắc" vào tin nhắn trả về.
- Không kể lại cách em tìm kiếm hay xử lý. Khách chỉ cần kết quả.
- Đầu ra phải bắt đầu ngay bằng lời trả lời tự nhiên (VD: "Dạ em gửi mình...", "Dạ được ạ...").
==================================================
`;

      let fullSystemPrompt = `# VAI TRÒ
Bạn là nhân viên tư vấn của xưởng in GETA Tây Ninh.
TUYỆT ĐỐI KHÔNG nhận mình là AI, trợ lý ảo. Bạn là người thật 100%.${customerInfo}

${reasoningBan}

${rawPrompt}`;

      // Bơm kiến thức đã học từ các hội thoại được admin đánh giá tốt
      const learned = await this.getLearnedKnowledge(text);
      if (learned) {
        fullSystemPrompt += learned;
      }

      const systemPrompt = fullSystemPrompt;
      const history = this.chatHistories.get(sessionId) || [];
      
      const prompt = ChatPromptTemplate.fromMessages([
        ['system', systemPrompt],
        new MessagesPlaceholder('history'),
        ['user', '{input}'],
        new MessagesPlaceholder('agent_scratchpad'),
      ]);

      const agent = createToolCallingAgent({
        llm,
        tools,
        prompt,
      });

      const agentExecutor = new AgentExecutor({
        agent,
        tools,
        maxIterations: 10,
      });

      let response;
      let timeoutId: NodeJS.Timeout;
      try {
        response = await Promise.race([
          agentExecutor.invoke({
            input: text,
            history: history,
          }),
          new Promise((_, reject) => {
            timeoutId = setTimeout(() => reject(new Error('LLM Timeout (Rate Limited)')), 45000);
          })
        ]) as any;
      } catch (err) {
        this.logger.error('Deepseek API failed or timed out:', err);
        throw err;
      } finally {
        clearTimeout(timeoutId!);
      }

      // Extract Label and track Partner status
      let textToProcess = response.output as string;

      // Guard: một số bản LangChain trả text lỗi trong output thay vì throw.
      // Không bao giờ gửi text lỗi cho khách hàng.
      const errorMarkers = ['max iterations', 'Agent stopped', 'rate limit', 'internal server error'];
      if (!textToProcess || errorMarkers.some(m => textToProcess.toLowerCase().includes(m))) {
        this.logger.warn(`Agent returned error text for session ${sessionId}: "${textToProcess}". Sending graceful reply.`);
        return 'Dạ anh/chị ơi, em đang tra cứu thông tin giúp anh/chị. Anh/chị chờ em chút rồi em trả lời ngay nhé!';
      }

      // Loại bỏ mọi dạng "quá trình suy nghĩ" bị lộ ra khỏi tin nhắn gửi khách.
      textToProcess = this.stripReasoning(textToProcess);

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
