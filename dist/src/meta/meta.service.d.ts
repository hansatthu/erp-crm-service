import { OnModuleInit } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
export declare class MetaService implements OnModuleInit {
    private readonly httpService;
    private readonly logger;
    private readonly graphApiVersion;
    private readonly graphApiUrl;
    serverUrl: string;
    constructor(httpService: HttpService);
    onModuleInit(): Promise<void>;
    private autoWhitelistDomain;
    private getPageAccessToken;
    getUserProfile(psid: string, pageId?: string): Promise<{
        name?: string;
        first_name?: string;
        last_name?: string;
    } | null>;
    addLabelToUser(psid: string, labelName: string, pageId?: string): Promise<boolean>;
    sendMessage(recipientId: string, text: string, pageId?: string): Promise<any>;
    sendOrderReceipt(recipientId: string, orderData: any, pageId?: string): Promise<any>;
    sendAction(recipientId: string, action: 'typing_on' | 'typing_off' | 'mark_seen', pageId?: string): Promise<any>;
    sendFormButton(recipientId: string): Promise<any>;
}
