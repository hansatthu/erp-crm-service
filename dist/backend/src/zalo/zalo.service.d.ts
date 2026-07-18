import { HttpService } from '@nestjs/axios';
export declare class ZaloService {
    private readonly httpService;
    private readonly logger;
    private readonly zaloOAApiUrl;
    private readonly zaloZnsApiUrl;
    constructor(httpService: HttpService);
    private getAccessToken;
    sendMessageToUserId(zaloUserId: string, text: string): Promise<any>;
    sendZnsToPhoneNumber(phone: string, templateId: string, templateData: any): Promise<any>;
}
