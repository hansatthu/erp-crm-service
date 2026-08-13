import { Controller, Post, Get, Delete, Body, Param, Query, Headers, HttpException, HttpStatus } from '@nestjs/common';
import { KnowledgeService } from './knowledge.service';

@Controller('knowledge')
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  private checkApiKey(apiKey: string) {
    if (!apiKey || apiKey !== process.env.ADMIN_API_KEY) {
      throw new HttpException('Unauthorized: Invalid x-api-key', HttpStatus.UNAUTHORIZED);
    }
  }

  @Post('learn')
  async learnText(
    @Headers('x-api-key') apiKey: string,
    @Body() body: { text: string; source: string; pageId?: string }
  ) {
    this.checkApiKey(apiKey);
    if (!body.text || !body.source) {
      throw new HttpException('Missing "text" or "source" in body', HttpStatus.BAD_REQUEST);
    }
    const result = await this.knowledgeService.learnFromText(body.text, body.source, body.pageId);
    return { success: true, message: 'Learning completed', data: result };
  }

  @Get('sources')
  async getSources(@Headers('x-api-key') apiKey: string, @Query('pageId') pageId?: string) {
    this.checkApiKey(apiKey);
    const sources = await this.knowledgeService.getSources(pageId);
    return { success: true, data: sources };
  }

  @Delete(':source')
  async deleteBySource(
    @Headers('x-api-key') apiKey: string,
    @Param('source') source: string,
    @Query('pageId') pageId?: string
  ) {
    this.checkApiKey(apiKey);
    if (!source) {
      throw new HttpException('Missing source', HttpStatus.BAD_REQUEST);
    }
    const deletedCount = await this.knowledgeService.deleteBySource(source, pageId);
    return { success: true, message: `Deleted ${deletedCount} chunks from source: ${source}` };
  }
}
