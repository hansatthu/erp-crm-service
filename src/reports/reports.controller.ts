import { Controller, Get, Post, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('api/v1/reports')
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly prisma: PrismaService
  ) {}

  @Get('trigger-daily')
  @Post('trigger-daily')
  async triggerDailyReport(@Query('boss') boss?: string) {
    let targetPsid = undefined;
    if (boss === 'han') targetPsid = process.env.BOSS_HAN_PSID;
    else if (boss === 'cuong') targetPsid = process.env.BOSS_CUONG_PSID;
    else targetPsid = process.env.BOSS_HAN_PSID; // Mặc định gửi cho Sếp Hân nếu không truyền tham số boss
    
    await this.reportsService.handleDailyReport(targetPsid);
    return { success: true, message: 'Daily report triggered manually.' };
  }

  @Get('find-boss')
  async findBoss() {
    const leads = await this.prisma.partner.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 10
    });
    return {
      message: 'Here are the latest people who messaged the bot:',
      leads: leads.map(l => ({ name: l.fullName, psid_code: l.code }))
    };
  }
}
