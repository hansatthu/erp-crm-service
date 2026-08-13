import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminGuard } from './admin.guard';
import { Prisma } from '@prisma/client';

@Controller('api/v1/admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('rules')
  getRules() {
    return this.adminService.getRules();
  }

  @Post('rules')
  saveRules(@Body() body: { content: string }) {
    return this.adminService.saveRules(body.content);
  }

  @Get('products')
  getProducts() {
    return this.adminService.getProducts();
  }

  @Post('products')
  createProduct(@Body() data: Prisma.ProductCreateInput) {
    return this.adminService.createProduct(data);
  }

  @Put('products/:id')
  updateProduct(@Param('id') id: string, @Body() data: Prisma.ProductUpdateInput) {
    return this.adminService.updateProduct(id, data);
  }

  @Delete('products/:id')
  deleteProduct(@Param('id') id: string) {
    return this.adminService.deleteProduct(id);
  }

  // ============ Học có admin đánh giá ============

  @Get('conversations')
  listConversations() {
    return this.adminService.listConversations();
  }

  @Get('conversations/:id')
  getConversation(@Param('id') id: string) {
    return this.adminService.getConversation(id);
  }

  @Post('messages/:messageId/rate')
  rateMessage(@Param('messageId') messageId: string, @Body() body: { rating: string; editedReply?: string; note?: string }) {
    return this.adminService.rateMessage(messageId, body);
  }

  @Get('learned-knowledge')
  listLearnedKnowledge() {
    return this.adminService.listLearnedKnowledge();
  }

  @Post('learned-knowledge')
  upsertKnowledge(@Body() body: { id?: string; question: string; answer: string }) {
    return this.adminService.upsertKnowledge(body);
  }

  @Delete('learned-knowledge/:id')
  deleteKnowledge(@Param('id') id: string) {
    return this.adminService.deleteKnowledge(id);
  }
}
