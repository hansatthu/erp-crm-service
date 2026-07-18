import { ReportsService } from './reports.service';
import { PrismaService } from '../prisma/prisma.service';
export declare class ReportsController {
    private readonly reportsService;
    private readonly prisma;
    constructor(reportsService: ReportsService, prisma: PrismaService);
    triggerDailyReport(boss?: string): Promise<{
        success: boolean;
        message: string;
    }>;
    findBoss(): Promise<{
        message: string;
        leads: any;
    }>;
}
