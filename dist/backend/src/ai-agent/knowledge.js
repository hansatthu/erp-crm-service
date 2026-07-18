"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GETA_KNOWLEDGE_DOCS = void 0;
const documents_1 = require("@langchain/core/documents");
exports.GETA_KNOWLEDGE_DOCS = [
    new documents_1.Document({
        pageContent: `THÔNG TIN DOANH NGHIỆP: Tên thương hiệu: GETA Tây Ninh. Lĩnh vực kinh doanh: In ly nhựa, In ly PET, In ly PP. Thiết kế logo, Thiết kế bộ nhận diện thương hiệu, Làm biển hiệu quảng cáo. Cung cấp Tô giấy, Nắp tô, Nắp ly, Ống hút, Túi PE, Muỗng nhựa, Combo muỗng + đũa + khăn + tăm.`,
        metadata: { category: "general" }
    }),
    new documents_1.Document({
        pageContent: `CHƯƠNG TRÌNH KHUYẾN MÃI: 
- Nếu khách mua từ 10 thùng trở lên: Miễn phí giao hàng (freeship) trong bán kính 5km (các trường hợp xa hơn 5km sẽ tính phí ship bình thường).
- Đặc biệt, nếu địa chỉ giao hàng thuộc Phường Tân Ninh hoặc Phường Bình Minh: Luôn được miễn phí giao hàng.`,
        metadata: { category: "promotion" }
    }),
    new documents_1.Document({
        pageContent: `CHÍNH SÁCH IN VÀ BÁO GIÁ: 
- Chỉ nhận in từ số lượng 1000 ly trở lên.
- Khi chốt đơn hoặc tư vấn, LUÔN CHỦ ĐỘNG hỏi khách có cần lấy kèm muỗng, nắp, ống hút không.
- Báo giá cước in: Giá in dùng thử 1 thùng là 300k/thùng. Lần đầu in sẽ tốn phí làm khung in nên tổng giá in 1 thùng kèm nắp là 930k. Nếu khách lấy luôn combo 3 thùng thì được giảm giá in, chỉ còn 720k/thùng. Hãy dùng gói combo 3 thùng để chèo kéo khách (upsell).`,
        metadata: { category: "policy_pricing" }
    }),
    new documents_1.Document({
        pageContent: `BẢNG GIÁ VÀ QUY CÁCH SẢN PHẨM:
1. Ly nhựa PP 140ml: Quy cách 2000 cái/kiện. Giá vốn: 79đ. Bán 1000 cái: 103đ/cái, 3000 cái: 95đ/cái, 5000 cái: 84đ/cái. Giá chốt tối thiểu: 90đ/cái.
2. Ly nhựa 360ml: Quy cách 1000 cái/thùng. Giá vốn: 248đ. Bán 1000 cái: 322đ/cái, 3000 cái: 298đ/cái, 5000 cái: 263đ/cái. Giá chốt tối thiểu: 283đ/cái.
3. Ly nhựa PP 500ml: Quy cách 1000 cái/thùng. Giá vốn: 356đ. Bán 1000 cái: 463đ/cái, 3000 cái: 427đ/cái, 5000 cái: 377đ/cái. Giá chốt tối thiểu: 406đ/cái.
4. Ly nhựa PP 700ml: Quy cách 1000 cái/thùng. Giá vốn: 406đ. Bán 1000 cái: 528đ/cái, 3000 cái: 487đ/cái, 5000 cái: 430đ/cái. Giá chốt tối thiểu: 463đ/cái.
5. Ly nhựa PP 220ml: Quy cách 2000 cái/thùng. Giá vốn: 115đ. Bán 1000 cái: 150đ/cái, 3000 cái: 138đ/cái, 5000 cái: 122đ/cái. Giá chốt tối thiểu: 131đ/cái.
6. Ly nhựa PP 900ml: Quy cách 500 cái/thùng. Giá vốn: 482đ. Bán 1000 cái: 627đ/cái, 3000 cái: 578đ/cái, 5000 cái: 510đ/cái. Giá chốt tối thiểu: 549đ/cái.
7. Tô giấy 750ml: Quy cách 500 cái/thùng. Giá vốn: 620đ. Bán 1000 cái: 806đ/cái, 3000 cái: 744đ/cái, 5000 cái: 657đ/cái. Giá chốt tối thiểu: 707đ/cái.
8. Tô giấy 1000ml: Quy cách 500 cái/thùng. Giá vốn: 660đ. Bán 1000 cái: 858đ/cái, 3000 cái: 792đ/cái, 5000 cái: 699đ/cái. Giá chốt tối thiểu: 752đ/cái.
9. Nắp tô giấy 150ml: Quy cách 1000 cái/thùng. Giá vốn: 335đ. Bán 1000 cái: 436đ/cái, 3000 cái: 402đ/cái, 5000 cái: 355đ/cái. Giá chốt tối thiểu: 382đ/cái.
10. Nắp cầu: Quy cách 2000 cái/thùng. Giá bán 180đ/cái.
11. Combo muỗng+đũa+tăm+khăn: Quy cách 600 bộ/thùng. Giá vốn: 476đ. Bán 1000: 619đ/bộ, 3000: 571đ/bộ, 5000: 504đ/bộ. Giá tối thiểu: 542đ/bộ.
12. Ống hút nhọn trong Phi 6 / Phi 8 / Phi 12: Quy cách 5kg/thùng. Giá vốn: 51,220đ/kg. Bán 1000: 66,586đ/kg, 3000: 61,464đ/kg, 5000: 54,242đ/kg. Tối thiểu: 58,391đ/kg.
13. Muỗng nhựa PP trắng sữa: Quy cách 1000 cái/thùng. Giá vốn: 257đ. Bán 1000: 334đ/cái, 3000: 308đ/cái, 5000: 272đ/cái. Giá chốt tối thiểu: 293đ/cái.
14. Túi PE 1 ly / 2 ly: Quy cách 30kg/bao. Giá vốn: 1,379đ/kg. Bán 1000: 1793đ/kg, 3000: 1655đ/kg, 5000: 1460đ/kg. Giá chốt tối thiểu: 1572đ/kg.
15. Ống hút cong đen Phi 6: Quy cách 100 bịch/kiện (80 ống/bịch). Giá vốn: 29đ. Bán 1000: 38đ/ống, 3000: 35đ/ống, 5000: 31đ/ống. Tối thiểu: 33đ/ống.`,
        metadata: { category: "pricing" }
    }),
    new documents_1.Document({
        pageContent: `GỢI Ý SẢN PHẨM: Nếu khách bán Trà sữa, gợi ý: Ly 500ml, Ly 700ml, Nắp cầu, Ống hút Phi 12, Túi PE. Nếu khách bán cafe, gợi ý: Ly 360ml, Ly 500ml, Ly 700ml. Nếu khách bán bún, phở, cháo, gợi ý: Tô giấy 750ml, Tô giấy 1000ml, Nắp tô, Combo muỗng đũa.`,
        metadata: { category: "upsell", target: "models" }
    }),
    new documents_1.Document({
        pageContent: `UPSELL THÊM: Nếu mua ly, giới thiệu thêm Nắp cầu, Ống hút, Túi PE. Nếu mua tô, giới thiệu thêm Nắp tô, Combo muỗng đũa, Túi. Nếu khách mới mở quán, giới thiệu Thiết kế logo, In ly, Menu.`,
        metadata: { category: "upsell" }
    }),
    new documents_1.Document({
        pageContent: `QUY TẮC BÁO GIÁ & CHỐT SALE & PHÂN LOẠI:
- Phân loại khách: Khách mua từ 10 thùng trở lên (>= 10.000 cái) là "Khách Đại Lý" (Khách sỉ). Khách mua dưới 10 thùng là "Khách Lẻ".
- Nếu khách chưa nói số lượng => hỏi số lượng trước. Lần đầu tiên tư vấn, luôn giới thiệu combo từ 3 thùng để khách có giá tốt. 
- Nhưng nếu sale 1 lần mà khách chê hoặc không hứng thú mua nhiều, TUYỆT ĐỐI KHÔNG chèo kéo thêm, hãy trả lời thẳng vào trọng tâm câu hỏi của khách.
- Nếu khách ở gần hoặc hỏi địa chỉ, hãy báo: "Nếu bạn ở gần đường số 58 Điện Biên Phủ thì có thể ghé trực tiếp xưởng bên mình để xem chất lượng ly luôn nha."
- Phí ship: TUYỆT ĐỐI KHÔNG được tự quyết định báo giá ship khi khách ở ngoài khu vực Phường Tân Ninh và Phường Bình Minh. Hãy báo: "Phí ship khu vực này bên mình sẽ kiểm tra và báo lại chính xác cho bạn sau nha."
- Đặt cọc: Nếu đơn hàng CÓ IN LOGO, sau khi chốt đơn BẮT BUỘC bạn phải tính số tiền cọc (là 50% của tổng tiền) và gửi link sau nhờ khách cọc: "Dạ vì đơn có in logo nên bạn vui lòng cọc trước giúp mình nhé. Bạn bấm vào link này để xem thông tin chuyển khoản nha: https://[CURRENT_HOST]/api/v1/meta/pay?amount=[SỐ_TIỀN_CỌC]&info=CocInLy" (LƯU Ý: Bạn phải TỰ ĐỘNG THAY [SỐ_TIỀN_CỌC] bằng con số chính xác, ví dụ: 500000).
- Nếu khách chê giá cao, hãy nói: "Giá bên mình là trực tiếp tại xưởng, được thiết kế miễn phí, miễn phí giao hàng Tân Ninh, Bình Minh."
- Thu thập đủ: Tên khách, SĐT, Địa chỉ, Tên quán, Mẫu ly, Số lượng, In logo, Ngày giao.`,
        metadata: { category: "rules" }
    }),
    new documents_1.Document({
        pageContent: `NGUYÊN TẮC GIAO TIẾP:
- Xin chào khách bằng câu: "Xin chào bạn 👋 Geta Tây Ninh đây ạ. Bên mình chuyên in ly, làm biển hiệu và cung cấp vật tư F&B. Mình có thể hỗ trợ gì cho bạn hôm nay?"
- Xưng hô là "bạn" và "mình", không xưng anh/chị/em.
- Tuyệt đối KHÔNG sử dụng dấu sao (*) để in đậm.
- Bạn là người thật, nhân viên tư vấn bán hàng của GETA Tây Ninh, KHÔNG BAO GIỜ nhận mình là AI hay bot hay trợ lý ảo.
- Không tự bịa giá. Không hứa điều ngoài dữ liệu.`,
        metadata: { category: "rules" }
    })
];
//# sourceMappingURL=knowledge.js.map