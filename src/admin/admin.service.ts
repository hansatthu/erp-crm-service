import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AdminService {
  private rulesPath = path.join(process.cwd(), 'src', 'ai-agent', 'rules.txt');

  constructor(private prisma: PrismaService) {}

  getRules() {
    try {
      if (!fs.existsSync(this.rulesPath)) {
        return { content: '' };
      }
      const content = fs.readFileSync(this.rulesPath, 'utf8');
      return { content };
    } catch (e) {
      return { content: '' };
    }
  }

  saveRules(content: string) {
    fs.writeFileSync(this.rulesPath, content, 'utf8');
    return { success: true };
  }

  getProducts() {
    return this.prisma.product.findMany({
      orderBy: { id: 'asc' }
    });
  }

  createProduct(data: Prisma.ProductCreateInput) {
    return this.prisma.product.create({
      data
    });
  }

  updateProduct(id: string, data: Prisma.ProductUpdateInput) {
    return this.prisma.product.update({
      where: { id },
      data
    });
  }

  deleteProduct(id: string) {
    return this.prisma.product.delete({
      where: { id }
    });
  }
}
