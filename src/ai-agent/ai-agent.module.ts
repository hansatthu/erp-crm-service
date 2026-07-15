import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AiAgentService } from './ai-agent.service';
import { AiAgentController } from './ai-agent.controller';

import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [HttpModule, PrismaModule],
  controllers: [AiAgentController],
  providers: [AiAgentService],
  exports: [AiAgentService],
})
export class AiAgentModule {}
