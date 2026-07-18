import { AiAgentService, SupplierResult } from './ai-agent.service';
export declare class AiAgentController {
    private readonly aiAgentService;
    constructor(aiAgentService: AiAgentService);
    findSuppliers(query: string): Promise<{
        data: SupplierResult[];
    }>;
}
