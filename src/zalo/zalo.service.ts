import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ZaloService {
  private readonly logger = new Logger(ZaloService.name);
  private readonly zaloOAApiUrl = 'https://openapi.zalo.me/v3.0/oa/message/cs';
  private readonly zaloZnsApiUrl = 'https://business.openapi.zalo.me/message/template';

  constructor(private readonly httpService: HttpService) {}

  /**
   * Retrieves the current access token for Zalo OA.
   * In a real system, you would store the access/refresh token in the DB or environment
   * and refresh it when it expires (every 25 hours).
   */
  private getAccessToken(): string {
    return process.env.ZALO_ACCESS_TOKEN || '';
  }

  /**
   * Send a standard Zalo OA message to a user who has interacted with your OA.
   * @param zaloUserId The Zalo user ID
   * @param text The message text
   */
  async sendMessageToUserId(zaloUserId: string, text: string): Promise<any> {
    const accessToken = this.getAccessToken();
    if (!accessToken) {
      this.logger.warn('No Zalo Access Token configured');
      return null;
    }

    try {
      const payload = {
        recipient: {
          user_id: zaloUserId,
        },
        message: {
          text: text,
        },
      };

      const response = await firstValueFrom(
        this.httpService.post(this.zaloOAApiUrl, payload, {
          headers: {
            'Content-Type': 'application/json',
            access_token: accessToken,
          },
        })
      );

      this.logger.log(`Message sent to Zalo User ${zaloUserId}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to send message to Zalo User ${zaloUserId}`, error);
      throw error;
    }
  }

  /**
   * Send a Zalo Notification Service (ZNS) message using a phone number.
   * Requires an approved ZNS template and paid Zalo OA.
   * @param phone The recipient's phone number
   * @param templateId The approved ZNS template ID
   * @param templateData The dynamic data for the template
   */
  async sendZnsToPhoneNumber(phone: string, templateId: string, templateData: any): Promise<any> {
    const accessToken = this.getAccessToken();
    if (!accessToken) {
      this.logger.warn('No Zalo Access Token configured');
      return null;
    }

    // Convert phone number to international format, e.g. 09... -> 849...
    let formattedPhone = phone;
    if (phone.startsWith('0')) {
      formattedPhone = '84' + phone.substring(1);
    }

    try {
      const payload = {
        phone: formattedPhone,
        template_id: templateId,
        template_data: templateData,
      };

      const response = await firstValueFrom(
        this.httpService.post(this.zaloZnsApiUrl, payload, {
          headers: {
            'Content-Type': 'application/json',
            access_token: accessToken,
          },
        })
      );

      this.logger.log(`ZNS message sent to ${formattedPhone}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to send ZNS message to ${formattedPhone}`, error);
      throw error;
    }
  }
}
