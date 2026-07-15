import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { MetaService } from '../meta/meta.service';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly metaService: MetaService,
  ) {}

  // Run at 11:50 every day
  // @Cron('50 11 * * *', { timeZone: 'Asia/Ho_Chi_Minh' })
  async handleDailyReport(targetPsid?: string) {
    this.logger.log('Starting daily end-of-day report generation...');

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Fetch all leads interacted today
      const leadsToday = await this.prisma.partner.findMany({
        where: {
          type: 'LEAD',
          updatedAt: {
            gte: today,
            lt: tomorrow,
          },
        },
      });

      // Group leads by status
      const groupedLeads = leadsToday.reduce((acc, lead) => {
        acc[lead.status] = (acc[lead.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Count total orders today
      const ordersToday = await this.prisma.salesOrder.count({
        where: {
          createdAt: {
            gte: today,
            lt: tomorrow,
          },
        },
      });

      const totalContacts = leadsToday.length;
      
      let reportMessage = `📊 BÁO CÁO CUỐI NGÀY GETA TÂY NINH 📊\n`;
      reportMessage += `${totalContacts} khách hàng liên hệ\n`;
      
      let hoiChoiCount = 0;
      let baoGiaCount = 0;
      for (const [status, count] of Object.entries(groupedLeads)) {
        if (status.includes('Mới') || status.includes('Hỏi')) {
          hoiChoiCount += count;
        } else if (status.includes('Báo Giá') || status.includes('Suy Nghĩ')) {
          baoGiaCount += count;
        } else {
          hoiChoiCount += count; // Default to hoi choi if unknown
        }
      }
      
      reportMessage += `${hoiChoiCount} khách hỏi chơi không mua\n`;
      reportMessage += `${baoGiaCount} khách báo giá rồi ko mua\n`;
      reportMessage += `${ordersToday} khách mua ( chốt đơn thành công)\n`;

      this.logger.log(`\n=== DAILY REPORT ===\n${reportMessage}\n====================`);

      // Determine who to send to
      const receivers: string[] = [];
      if (targetPsid) {
        receivers.push(targetPsid);
      } else {
        if (process.env.BOSS_HAN_PSID) receivers.push(process.env.BOSS_HAN_PSID);
        if (process.env.BOSS_CUONG_PSID) receivers.push(process.env.BOSS_CUONG_PSID);
      }

      if (receivers.length === 0) {
        this.logger.warn('No Boss PSID found in environment or arguments. Cannot send report via Meta.');
      } else {
        for (const psid of receivers) {
          await this.metaService.sendMessage(psid, reportMessage);
          this.logger.log(`Daily report sent to Meta user ${psid} successfully.`);
        }
      }

      // Send to Openclaw webhook if configured
      const openclawWebhook = process.env.OPENCLAW_WEBHOOK_URL;
      if (openclawWebhook) {
        await firstValueFrom(this.httpService.post(openclawWebhook, {
          text: reportMessage
        }));
        this.logger.log('Successfully sent report to Openclaw Webhook');
      }
    } catch (error) {
      this.logger.error('Failed to generate daily report', error);
    }
  }
}
