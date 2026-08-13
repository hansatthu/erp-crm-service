"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var prisma = new client_1.PrismaClient();
var rawProducts = [
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
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var _i, rawProducts_1, product;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('Seeding products...');
                    _i = 0, rawProducts_1 = rawProducts;
                    _a.label = 1;
                case 1:
                    if (!(_i < rawProducts_1.length)) return [3 /*break*/, 4];
                    product = rawProducts_1[_i];
                    return [4 /*yield*/, prisma.product.upsert({
                            where: { sku: product.sku },
                            update: product,
                            create: product,
                        })];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4:
                    console.log('Products seeded successfully.');
                    return [2 /*return*/];
            }
        });
    });
}
main()
    .catch(function (e) {
    console.error(e);
    process.exit(1);
})
    .finally(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
