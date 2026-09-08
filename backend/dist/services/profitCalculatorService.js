"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfitCalculatorService = void 0;
class ProfitCalculatorService {
    static calculateUsedCarProfit(params) {
        const discount = params.discount || 0;
        const netSalePrice = params.salePrice - discount;
        let totalRepairs = 0;
        let otherExpenses = 0;
        if (params.expenses && params.expenses.length > 0) {
            for (const exp of params.expenses) {
                if (['REPAIR', 'MAINTENANCE'].includes(exp.category)) {
                    totalRepairs += exp.amount;
                }
                else {
                    otherExpenses += exp.amount;
                }
            }
        }
        const totalCost = params.purchasePrice + totalRepairs + otherExpenses;
        const grossProfit = netSalePrice - totalCost;
        const profitMarginPct = totalCost > 0 ? (grossProfit / totalCost) * 100 : 0;
        return {
            purchasePrice: params.purchasePrice,
            netSalePrice,
            totalRepairs,
            otherExpenses,
            totalCost,
            grossProfit,
            profitMarginPct: Math.round(profitMarginPct * 10) / 10,
            isProfitable: grossProfit > 0,
        };
    }
    static calculateVehicleCostPerKm(params) {
        const distanceKm = Math.max(1, params.currentKm - params.lastServiceKm);
        const totalExpenses = params.totalFuelCost + params.totalMaintenanceCost + params.totalOtherExpenses;
        const costPerKm = totalExpenses / distanceKm;
        return {
            distanceTrackedKm: distanceKm,
            totalExpenses,
            costPerKm: Math.round(costPerKm * 100) / 100,
        };
    }
}
exports.ProfitCalculatorService = ProfitCalculatorService;
