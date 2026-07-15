import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WebhooksModule } from './webhooks/webhooks.module';
import { PrismaModule } from './prisma/prisma.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ZaloModule } from './zalo/zalo.module';
import { ProcurementBotModule } from './procurement-bot/procurement-bot.module';
import { AiAgentModule } from './ai-agent/ai-agent.module';
import { MetaModule } from './meta/meta.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [
    WebhooksModule, 
    PrismaModule,
    ScheduleModule.forRoot(),
    ZaloModule,
    ProcurementBotModule,
    AiAgentModule,
    MetaModule,
    ReportsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
