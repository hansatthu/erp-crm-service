import { PrismaService } from '../prisma/prisma.service';
export declare class WebhooksService {
    private prisma;
    constructor(prisma: PrismaService);
    processVendorQuote(payload: any): Promise<{
        status: string;
        message: string;
        data: {
            partner_id: string;
            partner_name: string;
            updated_items: number;
        };
    }>;
}
