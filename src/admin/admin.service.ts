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

  // ============ Học có admin đánh giá ============

  /**
   * Danh sách hội thoại (conversation) kèm khách hàng, tin cuối, để admin duyệt bot
   */
  listConversations() {
    return this.prisma.conversation.findMany({
      orderBy: { lastMessageAt: 'desc' },
      take: 50,
      include: {
        customer: true,
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 100,
        },
      },
    });
  }

  /**
   * Xem chi tiết một hội thoại + các câu trả lời của bot đã được đánh giá chưa
   */
  getConversation(id: string) {
    return this.prisma.conversation.findUnique({
      where: { id },
      include: {
        customer: true,
        messages: {
          orderBy: { createdAt: 'asc' },
          include: { feedback: true },
        },
      },
    });
  }

  /**
   * Đánh giá/sửa một câu trả lời của bot. rating: GOOD | BAD | EDITED.
   * Nếu GOOD/EDITED → lưu QA mẫu vào learned_knowledge để bot học.
   */
  async rateMessage(messageId: string, body: { rating: string; editedReply?: string; note?: string }) {
    const msg = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: { conversation: true },
    });
    if (!msg) throw new Error('Message not found');

    const rating = (body.rating || 'GOOD').toUpperCase();

    // Upsert feedback trên message
    const feedback = await this.prisma.messageFeedback.upsert({
      where: { messageId },
      create: {
        messageId,
        conversationId: msg.conversationId,
        rating,
        editedReply: body.editedReply || null,
        note: body.note || null,
      },
      update: {
        rating,
        editedReply: body.editedReply || null,
        note: body.note || null,
      },
    });

    // Nếu GOOD hoặc EDITED: tìm câu hỏi khách trước đó để học QA mẫu
    if (rating === 'GOOD' || rating === 'EDITED') {
      const msgs = await this.prisma.message.findMany({
        where: { conversationId: msg.conversationId, createdAt: { lt: msg.createdAt }, sender: 'CUSTOMER' },
        orderBy: { createdAt: 'desc' },
        take: 1,
      });
      const question = msgs[0]?.content || msg.content || '';
      const answer = body.editedReply || msg.content || '';
      if (question && answer) {
        await this.prisma.learnedKnowledge.create({
          data: {
            question,
            answer,
            source: msg.conversationId,
            upvotes: 1,
          },
        });
      }
    }

    return feedback;
  }

  /**
   * Danh sách kiến thức bot đã học
   */
  listLearnedKnowledge() {
    return this.prisma.learnedKnowledge.findMany({
      orderBy: [{ upvotes: 'desc' }, { used: 'desc' }],
      take: 200,
    });
  }

  /**
   * Admin tự thêm/sửa một QA mẫu cho bot học
   */
  upsertKnowledge(body: { id?: string; question: string; answer: string }) {
    if (body.id) {
      return this.prisma.learnedKnowledge.update({
        where: { id: body.id },
        data: { question: body.question, answer: body.answer },
      });
    }
    return this.prisma.learnedKnowledge.create({
      data: { question: body.question, answer: body.answer },
    });
  }

  deleteKnowledge(id: string) {
    return this.prisma.learnedKnowledge.delete({ where: { id } });
  }
}
