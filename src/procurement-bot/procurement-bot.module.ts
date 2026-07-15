import { Module } from '@nestjs/common';
import { ProcurementBotService } from './procurement-bot.service';
import { ProcurementBotController } from './procurement-bot.controller';
import { ZaloModule } from '../zalo/zalo.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [ZaloModule, PrismaModule],
  controllers: [ProcurementBotController],
  providers: [ProcurementBotService],
  exports: [ProcurementBotService],
})
export class ProcurementBotModule {}
