import { Controller, Get, Query, Res } from '@nestjs/common';
import type { Response } from 'express';

@Controller('api/v1/payment')
export class PaymentController {
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
                <img class="qr-image" src="https://img.vietqr.io/image/MB-0000905816051-compact2.png?amount=\${amount}&accountName=NGUYEN%20PHUOC%20HIEP&addInfo=\${info}" alt="QR Code" />
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
                    <span class="info-value" style="color: #e11d48;">\${formattedAmount} <button class="copy-btn" onclick="copyText('\${amount}', this)">Copy</button></span>
                </div>
                <div class="info-row">
                    <span class="info-label">Nội dung</span>
                    <span class="info-value">\${info} <button class="copy-btn" onclick="copyText('\${info}', this)">Copy</button></span>
                </div>
            </div>

            <a href="https://dl.vietqr.io/pay?app=mb&ba=0000905816051&am=\${amount}&tn=\${info}" class="open-app-btn">Mở App Ngân Hàng</a>
        </div>
    </body>
    </html>
    `;
    res.send(html);
  }
}
