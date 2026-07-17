import { Controller, Get, Post, Body, Query, Req, Res, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AiAgentService } from '../ai-agent/ai-agent.service';
import { MetaService } from './meta.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('api/v1/meta')
export class MetaController {
  private readonly verifyToken = process.env.META_VERIFY_TOKEN || 'geta_meta_verify_token';
  private messageBuffers = new Map<string, { texts: string[], timer: NodeJS.Timeout | null, pageId?: string }>();

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





  @Get('pay')
  async renderPaymentPage(@Query('amount') amount: string, @Query('info') info: string, @Res() res: Response) {
    const formattedAmount = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(amount) || 0);
    const html = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-width=1.0">
        <title>Thanh Toán Đơn Hàng - Geta Tây Ninh</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
            .card { background: white; border-radius: 16px; padding: 30px 24px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); max-width: 400px; width: 100%; text-align: center; }
            .logo-text { font-size: 24px; font-weight: 800; color: #4f46e5; margin-bottom: 5px; }
            .subtitle { color: #6b7280; font-size: 14px; margin-bottom: 20px; }
            .qr-container { background: #f9fafb; padding: 15px; border-radius: 12px; border: 1px dashed #d1d5db; display: inline-block; margin-bottom: 20px; width: 80%; }
            .qr-image { width: 100%; border-radius: 8px; mix-blend-mode: multiply; }
            .info-box { background: #f9fafb; border-radius: 12px; padding: 15px; margin-bottom: 20px; }
            .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; text-align: left; align-items: center; }
            .info-row:last-child { border-bottom: none; }
            .info-label { color: #6b7280; font-size: 13px; flex: 1; }
            .info-value { font-weight: 700; color: #111827; font-size: 14px; text-align: right; flex: 2; word-break: break-all; }
            .copy-btn { margin-left: 8px; background: #e0e7ff; color: #4f46e5; border: none; padding: 4px 8px; border-radius: 6px; font-size: 11px; cursor: pointer; font-weight: bold; transition: 0.2s; }
            .copy-btn:hover { background: #c7d2fe; }
            .open-app-btn { display: block; width: 100%; background: #4f46e5; color: white; padding: 14px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px; margin-top: 10px; transition: 0.2s; border: none; cursor: pointer; }
            .open-app-btn:hover { background: #4338ca; }
        </style>
        <script>
            function copyText(text, btn) {
                navigator.clipboard.writeText(text);
                const oldText = btn.innerText;
                btn.innerText = 'Đã copy';
                setTimeout(() => btn.innerText = oldText, 2000);
            }
        </script>
    </head>
    <body>
        <div class="card">
            <div class="logo-text">GETA TÂY NINH</div>
            <div class="subtitle">Thanh toán tự động 24/7</div>
            
            <div class="qr-container">
                <img class="qr-image" src="https://img.vietqr.io/image/MB-0000905816051-compact2.png?amount=${amount}&accountName=NGUYEN%20PHUOC%20HIEP&addInfo=${info}" alt="QR Code" />
            </div>
            
            <div class="info-box">
                <div class="info-row">
                    <span class="info-label">Ngân hàng</span>
                    <span class="info-value">MB Bank</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Chủ tài khoản</span>
                    <span class="info-value">NGUYEN PHUOC HIEP</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Số tài khoản</span>
                    <span class="info-value">0000905816051 <button class="copy-btn" onclick="copyText('0000905816051', this)">Copy</button></span>
                </div>
                <div class="info-row">
                    <span class="info-label">Số tiền cọc</span>
                    <span class="info-value" style="color: #e11d48;">${formattedAmount} <button class="copy-btn" onclick="copyText('${amount}', this)">Copy</button></span>
                </div>
                <div class="info-row">
                    <span class="info-label">Nội dung</span>
                    <span class="info-value">${info} <button class="copy-btn" onclick="copyText('${info}', this)">Copy</button></span>
                </div>
            </div>
            
            <p style="font-size: 12px; color: #9ca3af; margin-top: 20px;">Quý khách vui lòng kiểm tra kỹ số tiền và nội dung trước khi chuyển khoản. Xin cảm ơn!</p>
        </div>
    </body>
    </html>
    `;
    res.send(html);
  }

  @Post('webhook')
  async handleIncomingMessage(@Req() req: Request, @Body() body: any, @Res() res: Response) {
    const host = req.get('host') || 'localhost:3000';
    // Return a '200 OK' response to all events
    res.status(HttpStatus.OK).send('EVENT_RECEIVED');

    if (body.object === 'page') {
      for (const entry of body.entry) {
        const pageId = entry.id;
        if (!entry.messaging) continue;
        
        for (const webhookEvent of entry.messaging) {
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

            // Clear previous timer
            if (buffer.timer) {
              clearTimeout(buffer.timer);
            }

            // Set a new timer to wait for 2.5 seconds before processing
            buffer.timer = setTimeout(async () => {
              // Extract combined text and clear buffer
              const combinedText = buffer.texts.join(' ');
              const savedPageId = buffer.pageId;
              this.messageBuffers.delete(senderId);
              
              console.log(`[Processing Combined Message from ${senderId}]: ${combinedText}`);

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
                const aiResponse = await this.aiAgentService.processMessage(combinedText, sessionId, customerName);
                
                // Send back to Meta (handle multiple bubbles split by ||| or newlines)
                if (aiResponse) {
                  console.log(`[AI Response to ${senderId}]: ${aiResponse}`);
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

                  // Thay thế [CURRENT_HOST] bằng host thật của hệ thống để nhúng link thanh toán
                  textToProcess = textToProcess.replace(/\[CURRENT_HOST\]/g, host);

                  // Split by ||| first, then replace newlines with |||
                  let normalizedResponse = textToProcess.replace(/\n+/g, '|||');
                  // Tự động ngắt tin nhắn nếu thấy dấu chấm câu theo sau là dấu cách
                  normalizedResponse = normalizedResponse.replace(/([.!?])\s+/g, '$1|||');
                  
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
              }
            }, 2500); // Wait 2.5s for more messages
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
}
