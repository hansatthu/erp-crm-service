import { WebhooksService } from './webhooks.service';
export declare class WebhooksController {
    private readonly webhooksService;
    constructor(webhooksService: WebhooksService);
    handleVendorQuote(secret: string, payload: any): Promise<{
        status: string;
        message: string;
        data: {
            partner_id: any;
            updated_items: number;
        };
    }>;
}
