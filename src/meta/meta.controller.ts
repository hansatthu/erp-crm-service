import { Controller, Get, Post, Body, Query, Req, Res, HttpStatus } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import type { Request, Response } from 'express';
import { AiAgentService } from '../ai-agent/ai-agent.service';
import { MetaService } from './meta.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('api/v1/meta')
export class MetaController {
  private readonly verifyToken = process.env.META_VERIFY_TOKEN || 'geta_meta_verify_token';
  private messageBuffers = new Map<string, { texts: string[], timer: NodeJS.Timeout | null, pageId?: string }>();
  private processingLocks = new Set<string>();
  private humanInterventionCache = new Map<string, number>();

  constructor(
    private readonly aiAgentService: AiAgentService,
    private readonly metaService: MetaService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('webhook')
  verifyWebhook(@Query('hub.mode') mode: string, @Query('hub.verify_token') token: string, @Query('hub.challenge') challenge: string, @Res() res: Response) {
    if (mode && token) {
      if (mode === 'subscribe' && token === this.verifyToken) {
        console.log('META WEBHOOK_VERIFIED');
        return res.status(HttpStatus.OK).send(challenge);
      } else {
        return res.sendStatus(HttpStatus.FORBIDDEN);
      }
    }
    return res.sendStatus(HttpStatus.BAD_REQUEST);
  }


  @Post('webhook')
  async handleIncomingMessage(@Req() req: Request, @Body() body: any, @Res() res: Response) {
    const host = req.get('host') || 'localhost:3000';
    // Return a '200 OK' response to all events
    res.status(HttpStatus.OK).send('EVENT_RECEIVED');
    console.log('--- RAW WEBHOOK PAYLOAD ---');
    console.log(JSON.stringify(body, null, 2));
    console.log('---------------------------');

    if (body.object === 'page') {
      for (const entry of body.entry) {
        const pageId = entry.id;
        if (!entry.messaging) continue;
        
        for (const webhookEvent of entry.messaging) {
          // Bắt sự kiện Echo (Tin nhắn do Admin hoặc Bot gửi)
          if (webhookEvent.message && webhookEvent.message.is_echo) {
            const metadata = webhookEvent.message.metadata;
            // Nếu không có metadata 'AI_BOT', tức là Admin (người thật) vừa nhắn cho khách
            if (metadata !== 'AI_BOT') {
              const customerPsid = webhookEvent.recipient.id;
              // Ngưng bot 5 phút
              const pauseExpiry = Date.now() + 5 * 60 * 1000;
              this.humanInterventionCache.set(customerPsid, pauseExpiry);
              console.log(`[HUMAN HANDOFF] Admin replied to ${customerPsid}. Pausing AI bot for 5 minutes.`);

              const adminText = webhookEvent.message.text;
              if (adminText) {
                // 1. Lưu tin nhắn của Admin vào bộ nhớ AI để bot follow cuộc trò chuyện
                this.aiAgentService.injectAdminMessage(`meta_${customerPsid}`, adminText);
                
                // 2. Lưu tin nhắn của Admin vào Database
                this.prisma.customer.findFirst({
                  where: { metaUserId: customerPsid, pageId: pageId, platform: 'FACEBOOK' }
                }).then(customer => {
                  if (customer) {
                    return this.prisma.conversation.findFirst({
                      where: { customerId: customer.id, pageId: pageId, platform: 'FACEBOOK', status: 'OPEN' }
                    });
                  }
                  return null;
                }).then(dbConversation => {
                  if (dbConversation) {
                    return this.prisma.message.create({
                      data: {
                        conversationId: dbConversation.id,
                        sender: 'ADMIN',
                        messageType: 'TEXT',
                        content: adminText
                      }
                    });
                  }
                }).catch(err => console.error('Error logging Admin message to DB:', err));
              }
            }
            continue;
          }

          // Check if it's a message and contains text
          if (webhookEvent.message && webhookEvent.message.text && !webhookEvent.message.is_echo) {
            const senderId = webhookEvent.sender.id;
            const text = webhookEvent.message.text;
            
            console.log(`Received message from Meta user ${senderId}: ${text}`);

            // Cửa hậu để lấy ID Sếp
            if (text.trim().toLowerCase() === 'admin id') {
              await this.metaService.sendMessage(senderId, `Mã ID của sếp là: ${senderId}`);
              continue;
            }

            // Initialize buffer for this sender if it doesn't exist
            if (!this.messageBuffers.has(senderId)) {
              this.messageBuffers.set(senderId, { texts: [], timer: null, pageId });
            }

            const buffer = this.messageBuffers.get(senderId)!;
            
            // Append new message text
            buffer.texts.push(text);

            // Gửi ngay trạng thái Đã xem (Seen)
            this.metaService.sendAction(senderId, 'mark_seen', pageId).catch(err => console.warn(err.message));
            
            // LƯU Ý: Không gửi typing_on ở đây để tránh làm khách tưởng bot đang trả lời mà ngừng gõ.

            // Clear previous timer
            if (buffer.timer) {
              clearTimeout(buffer.timer);
            }

            // Set a new timer to wait for 4 seconds before processing
            const processBuffer = async () => {
              if (this.processingLocks.has(senderId)) {
                buffer.timer = setTimeout(processBuffer, 2000);
                return;
              }
              this.processingLocks.add(senderId);

              // Extract combined text and clear buffer
              const combinedText = buffer.texts.join('\n');
              const savedPageId = buffer.pageId;
              this.messageBuffers.delete(senderId);
              
              console.log(`[Processing Combined Message from ${senderId}]: ${combinedText}`);

              // Chỉ gửi trạng thái Đang soạn tin nhắn (Typing) khi thực sự bắt đầu xử lý
              const isPaused = this.humanInterventionCache.get(senderId) && this.humanInterventionCache.get(senderId)! > Date.now();
              if (!isPaused) {
                this.metaService.sendAction(senderId, 'typing_on', savedPageId).catch(err => console.warn(err.message));
              }

              try {
                // Forward to AI Agent
                const sessionId = `meta_${senderId}`;
                let customerName = '';
                try {
                  const profile = await this.metaService.getUserProfile(senderId, savedPageId);
                  if (profile && profile.name) customerName = profile.name;
                } catch (e) {
                  console.warn('Could not fetch profile for', senderId);
                }

                // ==========================================
                // LƯU DATABASE: Khách hàng & Tin nhắn đến
                // ==========================================
                let dbConversation: any = null;
                try {
                  // 1. Tìm hoặc tạo Customer (Phân biệt rõ ràng bằng metaUserId VÀ pageId)
                  let customer = await this.prisma.customer.findFirst({
                    where: { metaUserId: senderId, pageId: savedPageId, platform: 'FACEBOOK' }
                  });
                  if (!customer) {
                    customer = await this.prisma.customer.create({
                      data: {
                        metaUserId: senderId,
                        pageId: savedPageId,
                        platform: 'FACEBOOK',
                        fullName: customerName || 'Khách hàng FB',
                      }
                    });
                  } else if (customerName && customer.fullName !== customerName) {
                    customer = await this.prisma.customer.update({
                      where: { id: customer.id },
                      data: { fullName: customerName }
                    });
                  }

                  // 2. Tìm hoặc tạo Conversation
                  dbConversation = await this.prisma.conversation.findFirst({
                    where: { customerId: customer.id, pageId: savedPageId, platform: 'FACEBOOK', status: 'OPEN' }
                  });
                  if (!dbConversation) {
                    dbConversation = await this.prisma.conversation.create({
                      data: {
                        customerId: customer.id,
                        pageId: savedPageId,
                        platform: 'FACEBOOK',
                        conversationId: sessionId,
                        status: 'OPEN'
                      }
                    });
                  } else {
                    dbConversation = await this.prisma.conversation.update({
                      where: { id: dbConversation.id },
                      data: { lastMessageAt: new Date() }
                    });
                  }

                  // 3. Lưu tin nhắn của khách
                  await this.prisma.message.create({
                    data: {
                      conversationId: dbConversation.id,
                      sender: 'CUSTOMER',
                      messageType: 'TEXT',
                      content: combinedText
                    }
                  });
                } catch (dbErr) {
                  console.error('Error logging incoming message to DB:', dbErr);
                }
                // ==========================================

                // Kiểm tra xem khách có đang trong thời gian ngưng Bot (do Admin vừa chat) không
                const pauseExpiry = this.humanInterventionCache.get(senderId);
                if (pauseExpiry && pauseExpiry > Date.now()) {
                  console.log(`[PAUSED] Ignoring message from ${senderId} due to recent admin intervention.`);
                  // Tuy ngưng gọi AI xử lý, nhưng vẫn bơm tin nhắn của khách vào bộ nhớ AI để bot ngầm follow
                  this.aiAgentService.injectUserMessage(sessionId, combinedText);
                  return; // Kết thúc, không sinh AI Response
                }

                const aiResponse = await this.aiAgentService.processMessage(combinedText, sessionId, customerName, savedPageId);
                
                // Send back to Meta (handle multiple bubbles split by ||| or newlines)
                if (aiResponse) {
                  console.log(`[AI Response to ${senderId}]: ${aiResponse}`);
                  
                  // ==========================================
                  // LƯU DATABASE: Tin nhắn phản hồi của AI
                  // ==========================================
                  try {
                    if (dbConversation) {
                      await this.prisma.message.create({
                        data: {
                          conversationId: dbConversation.id,
                          sender: 'AI',
                          messageType: 'TEXT',
                          content: aiResponse
                        }
                      });
                      await this.prisma.conversation.update({
                        where: { id: dbConversation.id },
                        data: { lastMessageAt: new Date() }
                      });
                    }
                  } catch (dbErr) {
                    console.error('Error logging AI message to DB:', dbErr);
                  }
                  // ==========================================

                  let textToProcess = aiResponse;

                  // Trích xuất đơn hàng (JSON block) ở cuối tin nhắn nếu có
                  let jsonStringToParse: string | null = null;
                  const mdMatch = textToProcess.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/i);
                  if (mdMatch) {
                    jsonStringToParse = mdMatch[1];
                    textToProcess = textToProcess.replace(mdMatch[0], '').trim();
                  } else {
                    const rawMatch = textToProcess.match(/\{[\s\S]*?\}/);
                    if (rawMatch) {
                      jsonStringToParse = rawMatch[0];
                      textToProcess = textToProcess.replace(rawMatch[0], '').trim();
                    }
                  }

                  let parsedOrderData: any = null;
                  if (jsonStringToParse) {
                    try {
                      parsedOrderData = JSON.parse(jsonStringToParse);
                      console.log(`[Order Extracted] for ${senderId}:`, parsedOrderData);
                      
                      if (parsedOrderData) {
                        console.log('Found order data, but inline creation is disabled in favor of extract-orders-ai script.');
                        /* Legacy logic commented out
                        // Tìm Partner ID để liên kết đơn hàng
                        let partner = await this.prisma.partner.findUnique({
                          where: { code: sessionId }
                        });

                        // Tự động tạo Partner nếu chưa tồn tại (đề phòng AI quên gắn nhãn)
                        if (!partner) {
                          partner = await this.prisma.partner.create({
                            data: {
                              code: sessionId,
                              type: 'LEAD',
                              fullName: parsedOrderData.customer_name || 'Khách hàng',
                            }
                          });
                        }

                        // Cập nhật thông tin khách hàng (Tên, SĐT) nếu AI có trích xuất được
                        if (partner) {
                          try {
                            partner = await this.prisma.partner.update({
                              where: { id: partner.id },
                              data: {
                                fullName: parsedOrderData.customer_name || partner.fullName,
                                phone: (parsedOrderData.phone && parsedOrderData.phone.trim() !== '') ? parsedOrderData.phone : partner.phone,
                              }
                            });
                          } catch (updateError) {
                            console.warn('Could not update partner info (possible duplicate phone):', updateError);
                          }
                        }

                        // Lưu vào Database chuẩn theo Schema
                        // Do bảng SalesOrder không có cột "product" dạng text, ta gộp tạm vào deliveryAddress
                        const addressWithProduct = `Địa chỉ: ${parsedOrderData.address || 'Trống'} | Mua: ${parsedOrderData.product || ''} (SL: ${parsedOrderData.quantity || 1})`;

                        await this.prisma.salesOrder.create({
                          data: {
                            orderNo: `SO-${Date.now()}`,
                            customerId: partner?.id || null,
                            totalAmount: parseInt(parsedOrderData.total_price) || 0,
                            status: 'CONFIRMED',
                            pipelineSource: 'META_AI',
                            deliveryAddress: addressWithProduct
                          }
                        });
                        console.log('Order and Partner updated in Database successfully');
                        */
                      }
                    } catch (e) {
                      console.error('Failed to parse or save order JSON', e);
                    }
                  }
                  
                  // Trích xuất các LABEL nếu có
                  const labelRegex = /\[LABEL:\s*(.+?)\]/g;
                  const matches = [...textToProcess.matchAll(labelRegex)];
                  for (const match of matches) {
                    const labelName = match[1].trim();
                    if (labelName) {
                      this.metaService.addLabelToUser(senderId, labelName, savedPageId);
                    }
                  }
                  
                  // Xóa phần LABEL khỏi tin nhắn
                  textToProcess = textToProcess.replace(labelRegex, '').trim();

                  // Bắt sự kiện UNKNOWN_QUESTION để báo cho Admin
                  if (textToProcess.includes('[UNKNOWN_QUESTION]')) {
                    textToProcess = textToProcess.replace(/\[UNKNOWN_QUESTION\]/g, '').trim();
                    console.log(`[UNKNOWN_QUESTION] detected for customer ${senderId}. Triggering Admin Webhook.`);
                    
                    const bossHan = process.env.BOSS_HAN_PSID;
                    const bossCuong = process.env.BOSS_CUONG_PSID;
                    
                    const warningMsg = `🚨 SẾP ƠI, CÓ KHÁCH HỎI!\nKhách: ${customerName}\nHỏi: "${combinedText}"\nBot đã trả lời: "${textToProcess}"\nSếp vào Fanpage trả lời giúp em nha!`;
                    
                    if (bossHan) {
                      await this.metaService.sendMessage(bossHan, warningMsg, savedPageId);
                    }
                    if (bossCuong) {
                      await this.metaService.sendMessage(bossCuong, warningMsg, savedPageId);
                    }
                  }

                  // Thay thế [CURRENT_HOST] bằng host thật của hệ thống để nhúng link thanh toán
                  textToProcess = textToProcess.replace(/\[CURRENT_HOST\]/g, host);

                  // Chỉ ngắt tin nhắn theo đoạn văn (xuống dòng kép) để tránh việc gửi quá nhiều tin nhắn lắt nhắt
                  let normalizedResponse = textToProcess.replace(/\n\n+/g, '|||');
                  
                  const bubbles = normalizedResponse.split('|||').map(b => b.trim()).filter(b => b.length > 0);
                  for (const bubble of bubbles) {
                    // Hiển thị trạng thái "Đang soạn tin nhắn..."
                    await this.metaService.sendAction(senderId, 'typing_on', savedPageId);

                    // Tính toán thời gian gõ phím giả lập (Chậm hơn: 70ms/ký tự, tối thiểu 1.5s, tối đa 8s)
                    const typingDelay = Math.min(Math.max(1500, bubble.length * 70), 8000);
                    await new Promise(resolve => setTimeout(resolve, typingDelay));

                    await this.metaService.sendMessage(senderId, bubble, savedPageId);
                    
                    // Chờ thêm 1 chút trước khi gõ tin tiếp theo
                    await new Promise(resolve => setTimeout(resolve, 800));
                  }

                  // Nếu có Đơn Hàng thì gửi Thẻ Đơn Hàng cực đẹp
                  if (parsedOrderData) {
                    await new Promise(resolve => setTimeout(resolve, 1500));
                    await this.metaService.sendOrderReceipt(senderId, parsedOrderData, savedPageId);
                  }
                }
              } catch (error) {
                console.error('Error processing AI response', error);
              } finally {
                this.processingLocks.delete(senderId);
              }
            };

            buffer.timer = setTimeout(processBuffer, 4000);
          }
        }
      }
    }
  }

  @Post('submit-order')
  async submitOrder(@Body() body: any) {
    const { psid, name, phone, address, note } = body;
    console.log(`Received order from PSID ${psid}:`, body);

    if (psid) {
      const summary = `Dạ Geta Tây Ninh đã nhận được thông tin đặt hàng của bạn:\n- Người nhận: ${name}\n- SĐT: ${phone}\n- Địa chỉ: ${address}\n${note ? `- Ghi chú: ${note}\n` : ''}\nBên mình sẽ tiến hành lên đơn và gửi bạn nha!`;
      await this.metaService.sendMessage(psid, summary);
      // Có thể thêm logic lưu vào Database Prisma ở đây
    }

    return { success: true };
  }

  // Tự động chạy quét mỗi 5 phút để dọn dẹp tin nhắn bị miss do timeout
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleCronScanUnanswered() {
    console.log('[CRON] Tự động chạy quét tin nhắn chưa rep...');
    await this.scanUnansweredMessages({ get: () => 'localhost:3000' } as any);
  }

  @Post('scan-unanswered')
  async scanUnansweredMessages(@Req() req: Request) {
    const host = req && req.get ? (req.get('host') || 'localhost:3000') : 'localhost:3000';
    console.log('Starting scan for unanswered messages...');
    
    // Tìm các conversation đang OPEN, có tin nhắn, sắp xếp lấy tin nhắn mới nhất
    const openConversations = await this.prisma.conversation.findMany({
      where: { status: 'OPEN', platform: 'FACEBOOK' },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        customer: true
      }
    });

    let processedCount = 0;
    // Các từ khóa cơ bản để xác định câu hỏi tư vấn
    const keywords = ['giá', 'sao', 'nhiêu', 'tiền', 'tư vấn', 'ly', 'in', 'cái'];

    for (const conv of openConversations) {
      if (!conv.messages || conv.messages.length === 0) continue;
      
      const lastMessage = conv.messages[0];
      
      // Nếu tin cuối là của khách
      if (lastMessage.sender === 'CUSTOMER') {
        const text = lastMessage.content?.toLowerCase() || '';
        
        // Kiểm tra xem có chứa từ khóa không
        const hasKeyword = keywords.some(kw => text.includes(kw));
        if (hasKeyword && conv.customer.metaUserId) {
          // Bỏ qua nếu khách đang nằm trong cửa sổ admin can thiệp (giống webhook)
          const pauseExpiry = this.humanInterventionCache.get(conv.customer.metaUserId);
          if (pauseExpiry && pauseExpiry > Date.now()) {
            console.log(`[PAUSED] Skip ${conv.customer.fullName} (PSID: ${conv.customer.metaUserId}) due to recent admin intervention.`);
            continue;
          }
          console.log(`[SCAN] Found unanswered message from ${conv.customer.fullName} (PSID: ${conv.customer.metaUserId}): ${lastMessage.content}`);
          
          try {
            // Lấy AI response
            const aiResponse = await this.aiAgentService.processMessage(
              lastMessage.content || '', 
              conv.conversationId || conv.customer.metaUserId, 
              conv.customer.fullName || 'Khách hàng',
              conv.pageId || undefined
            );
            
            if (aiResponse) {
              // Lưu vào DB
              await this.prisma.message.create({
                data: {
                  conversationId: conv.id,
                  sender: 'AI',
                  messageType: 'TEXT',
                  content: aiResponse
                }
              });
              await this.prisma.conversation.update({
                where: { id: conv.id },
                data: { lastMessageAt: new Date() }
              });

              // Xử lý gửi tin nhắn giống như webhook
              let textToProcess = aiResponse;

              if (textToProcess.includes('[UNKNOWN_QUESTION]')) {
                textToProcess = textToProcess.replace(/\[UNKNOWN_QUESTION\]/g, '').trim();
                const bossHan = process.env.BOSS_HAN_PSID;
                const bossCuong = process.env.BOSS_CUONG_PSID;
                const warningMsg = `🚨 SẾP ƠI, CÓ KHÁCH HỎI!\nKhách: ${conv.customer.fullName}\nHỏi: "${lastMessage.content}"\nBot đã trả lời: "${textToProcess}"\nSếp vào Fanpage trả lời giúp em nha!`;
                
                if (bossHan) {
                  await this.metaService.sendMessage(bossHan, warningMsg, conv.pageId || undefined);
                }
                if (bossCuong) {
                  await this.metaService.sendMessage(bossCuong, warningMsg, conv.pageId || undefined);
                }
              }

              textToProcess = textToProcess.replace(/\[CURRENT_HOST\]/g, host);

              // Split bubbles
              let normalizedResponse = textToProcess.replace(/\n+/g, '|||');
              normalizedResponse = normalizedResponse.replace(/([.!?])\s+/g, '$1|||');
              
              const bubbles = normalizedResponse.split('|||').map(b => b.trim()).filter(b => b.length > 0);
              const senderId = conv.customer.metaUserId;
              const savedPageId = conv.pageId || undefined;

              for (const bubble of bubbles) {
                await this.metaService.sendAction(senderId, 'typing_on', savedPageId);
                const typingDelay = Math.min(Math.max(1500, bubble.length * 70), 5000);
                await new Promise(resolve => setTimeout(resolve, typingDelay));
                await this.metaService.sendMessage(senderId, bubble, savedPageId);
                await new Promise(resolve => setTimeout(resolve, 800)); // Nghỉ 0.8s giữa các bubble
              }
              
              processedCount++;
              // Nghỉ 3 giây giữa mỗi khách hàng để tránh bị đánh dấu là spam
              await new Promise(resolve => setTimeout(resolve, 3000));
            }
          } catch (err) {
            console.error(`[SCAN] Error processing unanswered message for ${conv.customer.metaUserId}:`, err);
          }
        }
      }
    }

    console.log(`Finished scanning. Processed ${processedCount} unanswered messages.`);
    return { success: true, processedCount };
  }
}
