import { ProcurementBotService } from './procurement-bot.service';
export declare class ProcurementBotController {
    private readonly procurementBotService;
    constructor(procurementBotService: ProcurementBotService);
    triggerLowStockCheck(): Promise<{
        message: string;
    }>;
    triggerNotifySupplier(poId: string): Promise<{
        message: string;
    }>;
}
