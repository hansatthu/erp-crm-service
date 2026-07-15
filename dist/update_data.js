"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const partnerCode = 'meta_36933425479637264';
    const updatedPartner = await prisma.partner.update({
        where: { code: partnerCode },
        data: {
            fullName: 'Hân',
            phone: '0915525715',
        }
    });
    console.log('Partner updated:', updatedPartner);
    const salesOrder = await prisma.salesOrder.findFirst({
        where: { customerId: updatedPartner.id },
        orderBy: { createdAt: 'desc' }
    });
    if (salesOrder) {
        const updatedSalesOrder = await prisma.salesOrder.update({
            where: { id: salesOrder.id },
            data: {
                deliveryAddress: `Địa chỉ: 3 781 Dương Minh Châu, Tây Ninh | Mua: Ly nhựa PP 500ml (SL: 3000)`
            }
        });
        console.log('SalesOrder updated:', updatedSalesOrder);
    }
    else {
        console.log('No SalesOrder found for this partner.');
    }
}
main()
    .catch(e => console.error(e))
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=update_data.js.map