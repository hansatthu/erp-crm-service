import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ZaloService } from './zalo.service';

@Module({
  imports: [HttpModule],
  providers: [ZaloService],
  exports: [ZaloService],
})
export class ZaloModule {}
