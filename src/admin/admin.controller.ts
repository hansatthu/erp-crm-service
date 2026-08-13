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
}
