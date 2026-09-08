export class ProfitCalculatorService {
  static calculateUsedCarProfit(params: {
    purchasePrice: number;
    salePrice: number;
    discount?: number;
    expenses?: Array<{ amount: number; category: string }>;
  }) {
    const discount = params.discount || 0;
    const netSalePrice = params.salePrice - discount;
    
    let totalRepairs = 0;
    let otherExpenses = 0;

    if (params.expenses && params.expenses.length > 0) {
      for (const exp of params.expenses) {
        if (['REPAIR', 'MAINTENANCE'].includes(exp.category)) {
          totalRepairs += exp.amount;
        } else {
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

  static calculateVehicleCostPerKm(params: {
    currentKm: number;
    lastServiceKm: number;
    totalFuelCost: number;
    totalMaintenanceCost: number;
    totalOtherExpenses: number;
  }) {
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
