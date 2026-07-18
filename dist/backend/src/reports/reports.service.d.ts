import { PrismaService } from '../prisma/prisma.service';
import { HttpService } from '@nestjs/axios';
import { MetaService } from '../meta/meta.service';
export declare class ReportsService {
    private readonly prisma;
    private readonly httpService;
    private readonly metaService;
    private readonly logger;
    constructor(prisma: PrismaService, httpService: HttpService, metaService: MetaService);
    handleDailyReport(targetPsid?: string): Promise<void>;
}
