"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("../src/app.module");
const ai_agent_service_1 = require("../src/ai-agent/ai-agent.service");
async function bootstrap() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const service = app.get(ai_agent_service_1.AiAgentService);
    console.log('--- GỬI TIN NHẮN TỚI AI ---');
    console.log('Khách: Ly nắp cầu 500ml in logo 1 màu giá sao bạn?');
    const res = await service.processMessage('Ly nắp cầu 500ml in logo 1 màu giá sao bạn?', 'test-session-123', 'Khách hàng A');
    console.log('\n--- AI RESPONSE ---');
    console.log(res);
    await app.close();
}
bootstrap();
//# sourceMappingURL=test-chat.js.map