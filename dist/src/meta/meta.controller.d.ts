import type { Request, Response } from 'express';
import { AiAgentService } from '../ai-agent/ai-agent.service';
import { MetaService } from './meta.service';
import { PrismaService } from '../prisma/prisma.service';
export declare class MetaController {
    private readonly aiAgentService;
    private readonly metaService;
    private readonly prisma;
    private readonly verifyToken;
    private messageBuffers;
    constructor(aiAgentService: AiAgentService, metaService: MetaService, prisma: PrismaService);
    verifyWebhook(mode: string, token: string, challenge: string, res: Response): Response<any, Record<string, any>>;
    renderPaymentPage(amount: string, info: string, res: Response): Promise<void>;
    handleIncomingMessage(req: Request, body: any, res: Response): Promise<void>;
    submitOrder(body: any): Promise<{
        success: boolean;
    }>;
    scanUnansweredMessages(req: Request): Promise<{
        success: boolean;
        processedCount: number;
    }>;
}
