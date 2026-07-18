import { OnModuleInit } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../prisma/prisma.service';
export interface SupplierResult {
    name: string;
    phone?: string;
    website?: string;
    address?: string;
    notes?: string;
}
export declare class AiAgentService implements OnModuleInit {
    private readonly httpService;
    private readonly prisma;
    private readonly logger;
    constructor(httpService: HttpService, prisma: PrismaService);
    onModuleInit(): Promise<void>;
    private createSearchTool;
    findSuppliers(query: string): Promise<SupplierResult[]>;
    private chatHistories;
    private readonly historyFilePath;
    private loadHistoryFromDisk;
    private saveHistoryToDisk;
    processMessage(text: string, sessionId: string, customerName?: string): Promise<string>;
}
