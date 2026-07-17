import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class MetaService implements OnModuleInit {
  private readonly logger = new Logger(MetaService.name);
  private readonly graphApiVersion = 'v19.0';
  private readonly graphApiUrl = `https://graph.facebook.com/${this.graphApiVersion}/me/messages`;
  public serverUrl = '';

  constructor(private readonly httpService: HttpService) {}

  async onModuleInit() {
    this.autoWhitelistDomain();
  }

  private async autoWhitelistDomain() {
    try {
      // 1. Fetch ngrok public URL
      const res = await firstValueFrom(this.httpService.get('http://localhost:4040/api/tunnels'));
      const tunnels = res.data?.tunnels || [];
      const httpsTunnel = tunnels.find((t: any) => t.public_url.startsWith('https://'));
      
      if (httpsTunnel) {
        this.serverUrl = httpsTunnel.public_url;
        this.logger.log(`Found Ngrok URL: ${this.serverUrl}. Whitelisting...`);
        
        // 2. Call Facebook API to whitelist
        const accessToken = this.getPageAccessToken();
        if (accessToken) {
          const profileUrl = `https://graph.facebook.com/${this.graphApiVersion}/me/messenger_profile?access_token=${accessToken}`;
          await firstValueFrom(this.httpService.post(profileUrl, {
            whitelisted_domains: [this.serverUrl]
          }));
          this.logger.log(`Successfully whitelisted domain: ${this.serverUrl}`);
        }
      }
    } catch (error) {
      this.logger.warn(`Could not auto-whitelist domain (ngrok might not be running): ${error.message}`);
    }
  }

  private getPageAccessToken(pageId?: string): string {
    if (pageId) {
      const specificToken = process.env[`META_PAGE_ACCESS_TOKEN_${pageId}`];
      if (specificToken) {
        return specificToken;
      }
    }
    return process.env.META_PAGE_ACCESS_TOKEN || '';
  }

  /**
   * Fetch user profile (name) from Meta Graph API
   */
  async getUserProfile(psid: string, pageId?: string): Promise<{ name?: string, first_name?: string, last_name?: string } | null> {
    const accessToken = this.getPageAccessToken(pageId);
    if (!accessToken) return null;

    try {
      const url = `https://graph.facebook.com/${this.graphApiVersion}/${psid}`;
      const response = await firstValueFrom(
        this.httpService.get(url, {
          params: {
            fields: 'name,first_name,last_name',
            access_token: accessToken,
          },
        })
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch profile for PSID ${psid}`, error.message);
      return null;
    }
  }

  /**
   * Add a custom label to a user (PSID)
   */
  async addLabelToUser(psid: string, labelName: string, pageId?: string): Promise<boolean> {
    const accessToken = this.getPageAccessToken(pageId);
    if (!accessToken) return false;

    try {
      // 1. Fetch existing labels to find the ID
      let labelId: string | null = null;
      const getLabelsUrl = `https://graph.facebook.com/${this.graphApiVersion}/me/custom_labels`;
      const labelsRes = await firstValueFrom(
        this.httpService.get(getLabelsUrl, {
          params: { access_token: accessToken, fields: 'name' }
        })
      );
      
      const existingLabels: any[] = labelsRes.data?.data || [];
      const found = existingLabels.find(l => l.name === labelName);
      
      if (found) {
        labelId = found.id;
      } else {
        // 2. Create label if not exists
        const createRes = await firstValueFrom(
          this.httpService.post(getLabelsUrl, {
            name: labelName
          }, { params: { access_token: accessToken }})
        );
        labelId = createRes.data?.id;
      }

      if (!labelId) return false;

      // 3. Assign label to PSID
      const assignUrl = `https://graph.facebook.com/${this.graphApiVersion}/${labelId}/label`;
      await firstValueFrom(
        this.httpService.post(assignUrl, {
          user: psid
        }, { params: { access_token: accessToken }})
      );
      
      this.logger.log(`Successfully assigned label "${labelName}" to user ${psid}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to assign label ${labelName} to PSID ${psid}`, error.response?.data || error.message);
      return false;
    }
  }

  /**
   * Send a text message back to the user on Messenger
   */
  async sendMessage(recipientId: string, text: string, pageId?: string): Promise<any> {
    const accessToken = this.getPageAccessToken(pageId);
    if (!accessToken) {
      this.logger.warn('No META_PAGE_ACCESS_TOKEN configured. Cannot send message to Facebook.');
      return null;
    }

    try {
      const payload = {
        recipient: {
          id: recipientId,
        },
        message: {
          text: text,
        },
        messaging_type: 'RESPONSE'
      };

      const response = await firstValueFrom(
        this.httpService.post(this.graphApiUrl, payload, {
          params: {
            access_token: accessToken,
          },
        })
      );

      this.logger.log(`Message sent to Facebook User ${recipientId}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to send message to Facebook User ${recipientId}`, error.response?.data || error.message);
      // We don't throw error to avoid crashing the webhook loop, just log it.
      return null;
    }
  }

  /**
   * Send an Order Receipt Template to the user
   */
  async sendOrderReceipt(recipientId: string, orderData: any, pageId?: string): Promise<any> {
    const accessToken = this.getPageAccessToken(pageId);
    if (!accessToken) {
      this.logger.warn('No META_PAGE_ACCESS_TOKEN configured. Cannot send receipt.');
      return null;
    }

    try {
      const payload = {
        recipient: {
          id: recipientId,
        },
        message: {
          attachment: {
            type: 'template',
            payload: {
              template_type: 'receipt',
              recipient_name: orderData.customer_name || 'Khách hàng',
              order_number: 'ORD-' + Math.floor(Math.random() * 1000000),
              currency: 'VND',
              payment_method: 'Thanh toán khi nhận hàng (COD)',
              elements: [
                {
                  title: orderData.product,
                  subtitle: `Số lượng: ${orderData.quantity}`,
                  quantity: orderData.quantity,
                  price: orderData.total_price || 0,
                  currency: 'VND',
                },
              ],
              address: {
                street_1: orderData.address || 'Không rõ',
                city: 'Tây Ninh', // Geta is in Tay Ninh
                postal_code: '840000',
                state: 'TN',
                country: 'VN',
              },
              summary: {
                total_cost: orderData.total_price || 0,
              },
            },
          },
        },
      };

      const response = await firstValueFrom(
        this.httpService.post(this.graphApiUrl, payload, {
          params: { access_token: accessToken },
        }),
      );

      this.logger.log(`Receipt Template sent to Facebook User ${recipientId}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to send Receipt Template to ${recipientId}`, error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Send a sender action (e.g., typing_on, typing_off, mark_seen)
   */
  async sendAction(recipientId: string, action: 'typing_on' | 'typing_off' | 'mark_seen', pageId?: string): Promise<any> {
    const accessToken = this.getPageAccessToken(pageId);
    if (!accessToken) return null;

    try {
      const payload = {
        recipient: {
          id: recipientId,
        },
        sender_action: action
      };

      const response = await firstValueFrom(
        this.httpService.post(this.graphApiUrl, payload, {
          params: {
            access_token: accessToken,
          }
        })
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to send action ${action} to Facebook User ${recipientId}`, error.message);
      return null;
    }
  }

  /**
   * Send a button template with Messenger Extensions Webview
   */
  async sendFormButton(recipientId: string): Promise<any> {
    const accessToken = this.getPageAccessToken();
    if (!accessToken || !this.serverUrl) return null;

    try {
      const payload = {
        recipient: {
          id: recipientId,
        },
        message: {
          attachment: {
            type: "template",
            payload: {
              template_type: "button",
              text: "Tuyệt vời! Bạn nhấn vào nút bên dưới để điền thông tin giao hàng giúp Geta nhé 👇",
              buttons: [
                {
                  type: "web_url",
                  url: `${this.serverUrl}/order-form.html?psid=${recipientId}`,
                  title: "📝 Điền Thông Tin",
                  webview_height_ratio: "tall",
                  messenger_extensions: true
                }
              ]
            }
          }
        }
      };

      const response = await firstValueFrom(
        this.httpService.post(this.graphApiUrl, payload, {
          params: { access_token: accessToken },
        })
      );

      this.logger.log(`Form Button sent to Facebook User ${recipientId}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to send form button to Facebook User ${recipientId}`, error.response?.data || error.message);
      return null;
    }
  }
}
