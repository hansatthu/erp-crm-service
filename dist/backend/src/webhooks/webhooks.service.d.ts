import { PrismaService } from '../prisma/prisma.service';
export declare class WebhooksService {
    private prisma;
    constructor(prisma: PrismaService);
    processVendorQuote(payload: any): Promise<{
        status: string;
        message: string;
        data: {
            partner_id: any;
            updated_items: number;
        };
    }>;
}
