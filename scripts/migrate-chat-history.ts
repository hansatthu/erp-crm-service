import { PrismaClient, Platform, SenderType, MessageType } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('Bắt đầu đọc file chat_history.json...');
  
  const filePath = path.join(__dirname, '..', 'chat_history.json');
  if (!fs.existsSync(filePath)) {
    console.error('Không tìm thấy file chat_history.json tại', filePath);
    process.exit(1);
  }

  const rawData = fs.readFileSync(filePath, 'utf-8');
  const chatHistory = JSON.parse(rawData);
  const keys = Object.keys(chatHistory);
  
  console.log(`Tìm thấy ${keys.length} cuộc hội thoại cũ.`);

  for (const key of keys) {
    console.log(`Đang xử lý hội thoại: ${key}`);
    const messages = chatHistory[key]; // Array of ["user"|"assistant", "message text"]
    
    // Parse platform and metaUserId
    // Format usually: meta_123456789 or zalo_123456789
    let platform: Platform = Platform.FACEBOOK;
    let metaUserId = key;

    if (key.startsWith('meta_')) {
      platform = Platform.FACEBOOK;
      metaUserId = key.replace('meta_', '');
    } else if (key.startsWith('zalo_')) {
      platform = Platform.ZALO;
      metaUserId = key.replace('zalo_', '');
    }

    // 1. Upsert Customer
    let customer = await prisma.customer.findFirst({
      where: { metaUserId, platform }
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          metaUserId,
          platform,
          fullName: `Khách hàng ${metaUserId}`, // Placeholder
        }
      });
      console.log(`  -> Đã tạo mới Customer: ${customer.id}`);
    } else {
      console.log(`  -> Customer đã tồn tại: ${customer.id}`);
    }

    // 2. Create Conversation
    const conversation = await prisma.conversation.create({
      data: {
        customerId: customer.id,
        platform: platform,
        status: 'CLOSED', // Các hội thoại cũ đánh dấu là CLOSED
      }
    });
    console.log(`  -> Đã tạo Conversation: ${conversation.id}`);

    // 3. Prepare Messages
    const messageData = messages.map((msg: [string, string]) => {
      const role = msg[0];
      const content = msg[1];
      
      let sender = SenderType.CUSTOMER;
      if (role === 'assistant') {
        sender = SenderType.AI;
      } else if (role === 'admin') {
        sender = SenderType.ADMIN;
      }

      return {
        conversationId: conversation.id,
        sender,
        messageType: MessageType.TEXT,
        content,
      };
    });

    // 4. Bulk insert messages
    if (messageData.length > 0) {
      await prisma.message.createMany({
        data: messageData
      });
      console.log(`  -> Đã lưu ${messageData.length} tin nhắn.`);
    }
  }

  console.log('✅ Hoàn tất việc migrate dữ liệu!');
}

main()
  .catch((e) => {
    console.error('Lỗi khi migrate:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
