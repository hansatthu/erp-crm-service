import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ZaloModule } from './zalo/zalo.module';
import { AiAgentModule } from './ai-agent/ai-agent.module';
import { MetaModule } from './meta/meta.module';
import { PaymentModule } from './payment/payment.module';
import { KnowledgeModule } from './knowledge/knowledge.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    PrismaModule,
    ScheduleModule.forRoot(),
    ZaloModule,
    AiAgentModule,
    MetaModule,
    PaymentModule,
    KnowledgeModule,
    AdminModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
