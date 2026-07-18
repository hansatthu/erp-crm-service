import { PrismaService } from '../prisma/prisma.service';
import { ZaloService } from '../zalo/zalo.service';
export declare class ProcurementBotService {
    private readonly prisma;
    private readonly zaloService;
    private readonly logger;
    constructor(prisma: PrismaService, zaloService: ZaloService);
    handleLowStockNotifications(): Promise<void>;
    notifySupplierOnPurchaseOrder(poId: string): Promise<void>;
}
