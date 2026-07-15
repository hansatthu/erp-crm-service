import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MetaService } from './meta.service';
import { MetaController } from './meta.controller';
import { AiAgentModule } from '../ai-agent/ai-agent.module';

@Module({
  imports: [HttpModule, AiAgentModule],
  controllers: [MetaController],
  providers: [MetaService],
  exports: [MetaService],
})
export class MetaModule {}
