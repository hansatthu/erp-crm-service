import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const rawProducts = [
  { sku: "HNF-LYNHUAPP-140ML", name: "Ly nhựa PP 140ml - 65 HP140", specs: "Thùng 2.000 cái", unit: "Cái", costPrice: 79, listedPrice: 139, retailPrice1: 129, retailPrice3: 124, retailPrice5: 119, retailPrice10: 115, agentPrice10: 109, agentPrice30: 105, agentPrice50: 99, isPrintable: true, setupFee: 300000, printFeePerItem: 25, minPrintQty: 2000, note: "In logo" },
  { sku: "HNF-LYNHUA-360ML", name: "Ly nhựa 360ml - 95 HP35", specs: "Thùng 1.000 cái", unit: "Cái", costPrice: 248, listedPrice: 389, retailPrice1: 369, retailPrice3: 359, retailPrice5: 349, retailPrice10: 339, agentPrice10: 319, agentPrice30: 309, agentPrice50: 299, isPrintable: true, setupFee: 300000, printFeePerItem: 25, minPrintQty: 1000, note: "In logo" },
  { sku: "HNF-LYNHUAPP-500ML", name: "Ly nhựa PP 500ml - 95 HP57", specs: "Thùng 1.000 cái", unit: "Cái", costPrice: 356, listedPrice: 569, retailPrice1: 549, retailPrice3: 529, retailPrice5: 509, retailPrice10: 489, agentPrice10: 459, agentPrice30: 449, agentPrice50: 439, isPrintable: true, setupFee: 300000, printFeePerItem: 25, minPrintQty: 1000, note: "In logo" },
  { sku: "HNF-LYNHUAPP-700ML", name: "Ly nhựa PP 700ml - 95 HP708HF", specs: "Thùng 1.000 cái", unit: "Cái", costPrice: 406, listedPrice: 639, retailPrice1: 619, retailPrice3: 599, retailPrice5: 579, retailPrice10: 559, agentPrice10: 519, agentPrice30: 509, agentPrice50: 499, isPrintable: true, setupFee: 300000, printFeePerItem: 25, minPrintQty: 1000, note: "In logo" },
  { sku: "HNF-LYNHUAPP-220ML", name: "Ly nhựa PP 220ml - 75 HP220", specs: "Thùng 2.000 cái", unit: "Cái", costPrice: 115, listedPrice: 189, retailPrice1: 179, retailPrice3: 169, retailPrice5: 159, retailPrice10: 149, agentPrice10: 139, agentPrice30: 135, agentPrice50: 129, isPrintable: true, setupFee: 300000, printFeePerItem: 25, minPrintQty: 2000, note: "In logo" },
  { sku: "HNF-LYNHUAPP-900ML", name: "Ly nhựa PP 900ml - 117 HP910", specs: "Thùng 500 cái", unit: "Cái", costPrice: 482, listedPrice: 759, retailPrice1: 719, retailPrice3: 699, retailPrice5: 679, retailPrice10: 659, agentPrice10: 619, agentPrice30: 609, agentPrice50: 599, isPrintable: true, setupFee: 300000, printFeePerItem: 25, minPrintQty: 500, note: "In logo" },
  { sku: "UKP-LYNHUAPP-500ML", name: "Ly nhựa UKP 500ml thường", specs: "Thùng 1.000 cái", unit: "Cái", costPrice: 365, listedPrice: 589, retailPrice1: 569, retailPrice3: 549, retailPrice5: 529, retailPrice10: 509, agentPrice10: 479, agentPrice30: 469, agentPrice50: 459, isPrintable: true, setupFee: 300000, printFeePerItem: 25, minPrintQty: 1000, note: "In logo" },
  { sku: "UKP-LYNHUAPP-700ML", name: "Ly nhựa UKP 700ml thường", specs: "Thùng 1.000 cái", unit: "Cái", costPrice: 463, listedPrice: 729, retailPrice1: 699, retailPrice3: 679, retailPrice5: 659, retailPrice10: 639, agentPrice10: 599, agentPrice30: 589, agentPrice50: 579, isPrintable: true, setupFee: 300000, printFeePerItem: 25, minPrintQty: 1000, note: "In logo" },
  { sku: "FRP-TOGIAY-750ML", name: "Tô giấy 750ml", specs: "Thùng 500 cái", unit: "Cái", costPrice: 620, listedPrice: 939, retailPrice1: 899, retailPrice3: 879, retailPrice5: 859, retailPrice10: 839, agentPrice10: 799, agentPrice30: 789, agentPrice50: 779, isPrintable: false, setupFee: null, printFeePerItem: null, minPrintQty: 500, note: "Không in" },
  { sku: "FRP-TOGIAY-1000ML", name: "Tô giấy 1000ml", specs: "Thùng 500 cái", unit: "Cái", costPrice: 660, listedPrice: 999, retailPrice1: 959, retailPrice3: 939, retailPrice5: 919, retailPrice10: 899, agentPrice10: 859, agentPrice30: 849, agentPrice50: 839, isPrintable: false, setupFee: null, printFeePerItem: null, minPrintQty: 500, note: "Không in" },
  { sku: "FRP-NAPTOGIAY-150", name: "Nắp tô giấy", specs: "Thùng 1.000 cái", unit: "Cái", costPrice: 335, listedPrice: 509, retailPrice1: 489, retailPrice3: 479, retailPrice5: 459, retailPrice10: 439, agentPrice10: 429, agentPrice30: 419, agentPrice50: 409, isPrintable: false, setupFee: null, printFeePerItem: null, minPrintQty: 1000, note: "" },
  { sku: "HNF-NAP-CAU", name: "Nắp cầu", specs: "Thùng 2.000 cái", unit: "Cái", costPrice: 174, listedPrice: 269, retailPrice1: 259, retailPrice3: 249, retailPrice5: 239, retailPrice10: 229, agentPrice10: 219, agentPrice30: 209, agentPrice50: 199, isPrintable: false, setupFee: null, printFeePerItem: null, minPrintQty: 2000, note: "" },
  { sku: "HNF-COMBO-600", name: "Combo muỗng + đũa + tăm + khăn giấy", specs: "600 bộ/thùng", unit: "Bộ", costPrice: 476, listedPrice: 729, retailPrice1: 699, retailPrice3: 679, retailPrice5: 659, retailPrice10: 639, agentPrice10: 599, agentPrice30: 589, agentPrice50: 579, isPrintable: false, setupFee: null, printFeePerItem: null, minPrintQty: 600, note: "" },
  { sku: "HNF-ONGHUT-PHI6", name: "Ống hút nhọn trong Phi 6 x 21", specs: "5kg/thùng", unit: "Thùng", costPrice: 51220, listedPrice: 69000, retailPrice1: 67000, retailPrice3: 66000, retailPrice5: 65000, retailPrice10: 64000, agentPrice10: 62000, agentPrice30: 61000, agentPrice50: 60000, isPrintable: false, setupFee: null, printFeePerItem: null, minPrintQty: 1, note: "Giá/thùng" },
  { sku: "HNF-ONGHUT-PHI8", name: "Ống hút nhọn trong Phi 8 x 21", specs: "5kg/thùng", unit: "Thùng", costPrice: 51220, listedPrice: 69000, retailPrice1: 67000, retailPrice3: 66000, retailPrice5: 65000, retailPrice10: 64000, agentPrice10: 62000, agentPrice30: 61000, agentPrice50: 60000, isPrintable: false, setupFee: null, printFeePerItem: null, minPrintQty: 1, note: "Giá/thùng" },
  { sku: "HNF-ONGHUT-PHI12", name: "Ống hút nhọn trong Phi 12 x 22", specs: "5kg/thùng", unit: "Thùng", costPrice: 51220, listedPrice: 69000, retailPrice1: 67000, retailPrice3: 66000, retailPrice5: 65000, retailPrice10: 64000, agentPrice10: 62000, agentPrice30: 61000, agentPrice50: 60000, isPrintable: false, setupFee: null, printFeePerItem: null, minPrintQty: 1, note: "Giá/thùng" },
  { sku: "HNF-MUONG-M015", name: "Muỗng PP M015 trắng sữa bọc OPP", specs: "Thùng 1.000 cái", unit: "Cái", costPrice: 257, listedPrice: 409, retailPrice1: 389, retailPrice3: 379, retailPrice5: 359, retailPrice10: 339, agentPrice10: 329, agentPrice30: 319, agentPrice50: 309, isPrintable: false, setupFee: null, printFeePerItem: null, minPrintQty: 1000, note: "" },
  { sku: "HNF-TUIPE-1LY", name: "Túi PE 1 ly 17×32", specs: "30kg/bao", unit: "Bao", costPrice: 1379000, listedPrice: 1950000, retailPrice1: 1890000, retailPrice3: 1850000, retailPrice5: 1790000, retailPrice10: 1750000, agentPrice10: 1690000, agentPrice30: 1650000, agentPrice50: 1620000, isPrintable: false, setupFee: null, printFeePerItem: null, minPrintQty: 1, note: "Giá/bao" },
  { sku: "HNF-TUIPE-2LY", name: "Túi PE 2 ly 30×32", specs: "30kg/bao", unit: "Bao", costPrice: 1379000, listedPrice: 1950000, retailPrice1: 1890000, retailPrice3: 1850000, retailPrice5: 1790000, retailPrice10: 1750000, agentPrice10: 1690000, agentPrice30: 1650000, agentPrice50: 1620000, isPrintable: false, setupFee: null, printFeePerItem: null, minPrintQty: 1, note: "Giá/bao" },
  { sku: "HNF-ONGHUT-CONG", name: "Ống hút cong đen Phi 6 × 19.5", specs: "Kiện 8.000 cái", unit: "Cái", costPrice: 29, listedPrice: 49, retailPrice1: 45, retailPrice3: 43, retailPrice5: 41, retailPrice10: 39, agentPrice10: 37, agentPrice30: 36, agentPrice50: 35, isPrintable: false, setupFee: null, printFeePerItem: null, minPrintQty: 8000, note: "" }
];

async function main() {
  console.log('Seeding products...');
  for (const product of rawProducts) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: product,
      create: product,
    });
  }
  console.log('Products seeded successfully.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
