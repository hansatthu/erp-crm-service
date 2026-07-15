import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { HttpModule } from '@nestjs/axios';
import { MetaModule } from '../meta/meta.module';

@Module({
  imports: [PrismaModule, HttpModule, MetaModule],
  providers: [ReportsService],
  controllers: [ReportsController],
})
export class ReportsModule {}
