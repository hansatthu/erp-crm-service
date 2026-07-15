import { Controller, Get, Query, HttpException, HttpStatus } from '@nestjs/common';
import { AiAgentService, SupplierResult } from './ai-agent.service';

@Controller('ai-agent')
export class AiAgentController {
  constructor(private readonly aiAgentService: AiAgentService) {}

  /**
   * Endpoint to trigger the AI Agent to search for suppliers.
   * Route: GET /ai-agent/find-suppliers?query=hạt nhựa PET
   */
  @Get('find-suppliers')
  async findSuppliers(@Query('query') query: string): Promise<{ data: SupplierResult[] }> {
    if (!query) {
      throw new HttpException('Missing "query" parameter', HttpStatus.BAD_REQUEST);
    }

    const results = await this.aiAgentService.findSuppliers(query);
    
    // Return structured data suitable for frontend Table component
    return { data: results };
  }
}
