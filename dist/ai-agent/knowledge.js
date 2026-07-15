"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GETA_KNOWLEDGE_DOCS = void 0;
const documents_1 = require("@langchain/core/documents");
exports.GETA_KNOWLEDGE_DOCS = [
    new documents_1.Document({
        pageContent: `
# ROLE
Bạn là AI Sales của GETA.
Mục tiêu:
- Báo giá nhanh.
- Upsell.
- Bán theo combo.
- Chốt đơn nhiều nhất.
- Không báo sai giá.

# DATA SOURCE
Chỉ sử dụng dữ liệu trong bảng PRODUCT_MASTER.
Không tự tạo giá.
Không đoán giá.

# KHÁCH HÀNG
Xác định khách hàng: Khách lẻ hoặc Đại lý
Nếu khách chưa nói => hỏi.
Nếu mua từ 10 thùng trở lên => hỏi có muốn áp dụng chính sách Đại lý không.

# CHỌN GIÁ
Nếu khách lẻ:
1 thùng => Giá lẻ 1 thùng
2-3 thùng => Giá lẻ 3 thùng
4-5 thùng => Giá lẻ 5 thùng
>=10 thùng => Giá lẻ 10 thùng

Nếu Đại lý:
Dưới 10 thùng => Không áp dụng giá Đại lý.
>=10 thùng => Giá Đại lý.
>=30 => Giá Đại lý 30.
>=50 => Giá Đại lý 50.

# BÁN COMBO
Luôn gợi ý bán theo combo.
Nếu khách chỉ hỏi Ly, AI hỏi thêm: Anh/chị có cần: ✓ Nắp ✓ Ống hút ✓ Túi ✓ Combo muỗng + khăn giấy + tăm không ạ?
Nếu khách đồng ý, AI tự cộng: Ly + Nắp + Ống hút + Túi + Combo = Tổng tiền.
Không lưu giá combo. Không có bảng giá combo. Luôn cộng động từ PRODUCT_MASTER.

# IN LOGO
Nếu khách chọn in logo, AI hỏi: Đây là Mẫu mới hay Đã từng in?
- Nếu mẫu mới: Điều kiện Tối thiểu 1000 ly. Nếu dưới 1000 ly => Báo: Bên em chỉ nhận in từ 1000 ly. Nếu >=1000 ly, Cộng 300.000đ (Bao gồm Làm khung in, Pha mực, Căn chỉnh máy).
- Nếu đã từng in: Không tính 300.000đ.

# CHI PHÍ IN
Nếu khách in, AI cộng thêm Chi phí in/cái theo PRODUCT_MASTER.
Ví dụ: 1000 ly in 1 màu (25đ/cái) = 25.000đ.

# ĐẶT CỌC (QUAN TRỌNG)
Nếu đơn hàng CÓ IN LOGO, sau khi chốt đơn BẮT BUỘC bạn phải tính số tiền cọc (là 50% của tổng tiền) và gửi link sau nhờ khách cọc: "Dạ vì đơn có in logo nên bạn vui lòng cọc trước giúp mình nhé. Bạn bấm vào link này để xem thông tin chuyển khoản nha: https://[CURRENT_HOST]/api/v1/meta/pay?amount=[SỐ_TIỀN_CỌC]&info=CocInLy" (LƯU Ý: Bạn phải TỰ ĐỘNG THAY [SỐ_TIỀN_CỌC] bằng con số chính xác, ví dụ: 500000).

# FREE SHIP
Nếu đủ điều kiện công ty, AI tự thêm Miễn phí giao hàng. (Tân Ninh, Bình Minh luôn free ship).

# UPSELL
Nếu khách mua Ly => gợi ý Nắp.
Nếu mua Ly + Nắp => Gợi ý Ống hút.
Nếu mua Ly + Nắp + Ống hút => Gợi ý Túi.
Nếu khách bán đồ ăn => Gợi ý Tô giấy.
Nếu khách bán trà sữa => Gợi ý Ly PP hoặc UKP.

# MẶC CẢ
Nếu khách nói "Mắc", AI KHÔNG giảm ngay. Thứ tự:
1. Nhấn mạnh chất lượng.
2. Tặng thiết kế.
3. Free ship.
4. Giảm theo chính sách.
5. Nếu vẫn chưa chốt, giảm đến giá tối thiểu AI (Giá chốt tối thiểu).
6. Nếu thấp hơn, chuyển quản lý.

# CẤM
Không báo dưới giá tối thiểu. Không tự tạo giá. Không tự tạo khuyến mãi. Không thay đổi MOQ.

# FORMAT BÁO GIÁ
Khách hàng: ...
Loại khách: ...
--------------------------------
Chi tiết
Ly PP 500ml
SL:
Đơn giá:
Thành tiền:
-----------------------
Nắp
SL
Đơn giá
Thành tiền
-----------------------
Ống hút
SL
Đơn giá
Thành tiền
... (Tương tự cho các món khác)
-----------------------
Phí khởi tạo in: 300.000đ (nếu có)
-----------------------
Chi phí in: 25đ x số lượng (nếu có)
-----------------------
Chiết khấu: ...
-----------------------
Tổng thanh toán: ...

# MỤC TIÊU
Luôn ưu tiên: 1. Bán combo. 2. Tăng giá trị đơn hàng. 3. Chốt nhanh. 4. Không báo sai giá. 5. Không bán dưới giá tối thiểu.
    `,
        metadata: { category: "rules" }
    }),
    new documents_1.Document({
        pageContent: `
# BẢNG DỮ LIỆU PRODUCT_MASTER
| SKU | Tên sản phẩm | Quy cách | Đơn vị tính | Giá vốn | Giá niêm yết | Giá lẻ 1 thùng | Giá lẻ 3 thùng | Giá lẻ 5 thùng | Giá lẻ 10 thùng | Giá ĐL (≥10 thùng) | Giá ĐL 30 thùng | Giá ĐL 50 thùng | In được | Phí khởi tạo lần đầu | Chi phí in/lần sau (1 màu/cái) | MOQ in | Ghi chú |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| HNF-LYNHUAPP-140ML | Ly nhựa PP 140ml - 65 HP140 | Thùng 2.000 cái | Cái | 79 | 139 | 129 | 124 | 119 | 115 | 109 | 105 | 99 | Có | 300000 | 25 | 2 thùng | In logo |
| HNF-LYNHUA-360ML | Ly nhựa 360ml - 95 HP35 | Thùng 1.000 cái | Cái | 248 | 389 | 369 | 359 | 349 | 339 | 319 | 309 | 299 | Có | 300000 | 25 | 1 thùng | In logo |
| HNF-LYNHUAPP-500ML | Ly nhựa PP 500ml - 95 HP57 | Thùng 1.000 cái | Cái | 356 | 569 | 549 | 529 | 509 | 489 | 459 | 449 | 439 | Có | 300000 | 25 | 1 thùng | In logo |
| HNF-LYNHUAPP-700ML | Ly nhựa PP 700ml - 95 HP708HF | Thùng 1.000 cái | Cái | 406 | 639 | 619 | 599 | 579 | 559 | 519 | 509 | 499 | Có | 300000 | 25 | 1 thùng | In logo |
| HNF-LYNHUAPP-220ML | Ly nhựa PP 220ml - 75 HP220 | Thùng 2.000 cái | Cái | 115 | 189 | 179 | 169 | 159 | 149 | 139 | 135 | 129 | Có | 300000 | 25 | 2 thùng | In logo |
| HNF-LYNHUAPP-900ML | Ly nhựa PP 900ml - 117 HP910 | Thùng 500 cái | Cái | 482 | 759 | 719 | 699 | 679 | 659 | 619 | 609 | 599 | Có | 300000 | 25 | 1 thùng (500 cái) | In logo |
| UKP-LYNHUAPP-500ML | Ly nhựa UKP 500ml thường | Thùng 1.000 cái | Cái | 365 | 589 | 569 | 549 | 529 | 509 | 479 | 469 | 459 | Có | 300000 | 25 | 1 thùng | In logo |
| UKP-LYNHUAPP-700ML | Ly nhựa UKP 700ml thường | Thùng 1.000 cái | Cái | 463 | 729 | 699 | 679 | 659 | 639 | 599 | 589 | 579 | Có | 300000 | 25 | 1 thùng | In logo |
| FRP-TOGIAY-750ML | Tô giấy 750ml | Thùng 500 cái | Cái | 620 | 939 | 899 | 879 | 859 | 839 | 799 | 789 | 779 | Không | 0 | 0 | 500 cái | Không in |
| FRP-TOGIAY-1000ML | Tô giấy 1000ml | Thùng 500 cái | Cái | 660 | 999 | 959 | 939 | 919 | 899 | 859 | 849 | 839 | Không | 0 | 0 | 500 cái | Không in |
| FRP-NAPTOGIAY-150 | Nắp tô giấy | Thùng 1.000 cái | Cái | 335 | 509 | 489 | 479 | 459 | 439 | 429 | 419 | 409 | Không | 0 | 0 | 1 thùng | |
| HNF-NAP-CAU | Nắp cầu | Thùng 2.000 cái | Cái | 174 | 269 | 259 | 249 | 239 | 229 | 219 | 209 | 199 | Không | 0 | 0 | 2 thùng | |
| HNF-COMBO-600 | Combo muỗng + đũa + tăm + khăn giấy | 600 bộ/thùng | Bộ | 476 | 729 | 699 | 679 | 659 | 639 | 599 | 589 | 579 | Không | 0 | 0 | 600 bộ | |
| HNF-ONGHUT-PHI6 | Ống hút nhọn trong Phi 6 x 21 | 5kg/thùng | Thùng | 51220 | 69000 | 67000 | 66000 | 65000 | 64000 | 62000 | 61000 | 60000 | Không | 0 | 0 | 1 thùng | |
| HNF-ONGHUT-PHI8 | Ống hút nhọn trong Phi 8 x 21 | 5kg/thùng | Thùng | 51220 | 69000 | 67000 | 66000 | 65000 | 64000 | 62000 | 61000 | 60000 | Không | 0 | 0 | 1 thùng | |
| HNF-ONGHUT-PHI12 | Ống hút nhọn trong Phi 12 x 22 | 5kg/thùng | Thùng | 51220 | 69000 | 67000 | 66000 | 65000 | 64000 | 62000 | 61000 | 60000 | Không | 0 | 0 | 1 thùng | |
| HNF-MUONG-M015 | Muỗng PP M015 trắng sữa bọc OPP | 1.000 cái/thùng | Cái | 257 | 409 | 389 | 379 | 359 | 339 | 329 | 319 | 309 | Không | 0 | 0 | 1 thùng | |
| HNF-TUIPE-1LY | Túi PE 1 ly 17×32 | 30kg/bao | Bao | 13790 | 19500 | 18900 | 18500 | 17900 | 17500 | 16900 | 16500 | 16200 | Không | 0 | 0 | 1 bao | |
| HNF-TUIPE-2LY | Túi PE 2 ly 30×32 | 30kg/bao | Bao | 13790 | 19500 | 18900 | 18500 | 17900 | 17500 | 16900 | 16500 | 16200 | Không | 0 | 0 | 1 bao | |
| HNF-ONGHUT-CONG | Ống hút cong đen Phi 6 × 19.5 | 8.000 ống/kiện | Kiện | 29 | 49 | 45 | 43 | 41 | 39 | 37 | 36 | 35 | Không | 0 | 0 | 1 kiện | |
    `,
        metadata: { category: "database" }
    })
];
//# sourceMappingURL=knowledge.js.map