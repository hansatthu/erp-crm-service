import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { AiAgentService } from '../src/ai-agent/ai-agent.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const service = app.get(AiAgentService);
  console.log('--- GỬI TIN NHẮN TỚI AI ---');
  console.log('Khách: Ly nắp cầu 500ml in logo 1 màu giá sao bạn?');
  
  const res = await service.processMessage('Ly nắp cầu 500ml in logo 1 màu giá sao bạn?', 'test-session-123', 'Khách hàng A');
  
  console.log('\n--- AI RESPONSE ---');
  console.log(res);
  
  await app.close();
}
bootstrap();
