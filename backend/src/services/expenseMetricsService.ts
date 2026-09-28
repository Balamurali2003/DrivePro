import { prisma } from '../db';
import { buildDateFilter, DateFilterOptions } from './dateFilterHelper';

export class ExpenseMetricsService {
  public static async getMetrics(options: DateFilterOptions = {}) {
    const dateFilter = buildDateFilter(options);
    const where: any = dateFilter ? { expenseDate: dateFilter } : {};

    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    const [
      totalExpenseCount,
      totalAmountAggregate,
      thisMonthAggregate,
      todayAggregate,
      pendingAggregate,
      paidAggregate,
      allExpenses
    ] = await Promise.all([
      prisma.expense.count({ where }),
      prisma.expense.aggregate({
        where,
        _sum: { amount: true }
      }),
      prisma.expense.aggregate({
        where: {
          expenseDate: { gte: startOfCurrentMonth, lte: endOfCurrentMonth }
        },
        _sum: { amount: true }
      }),
      prisma.expense.aggregate({
        where: {
          expenseDate: { gte: startOfToday, lte: endOfToday }
        },
        _sum: { amount: true }
      }),
      prisma.expense.aggregate({
        where: {
          ...where,
          status: 'PENDING'
        },
        _sum: { amount: true }
      }),
      prisma.expense.aggregate({
        where: {
          ...where,
          status: 'PAID'
        },
        _sum: { amount: true }
      }),
      prisma.expense.findMany({
        where,
        select: {
          category: true,
          amount: true,
          expenseDate: true
        }
      })
    ]);

    const totalExpenses = totalAmountAggregate._sum.amount || 0;
    const thisMonthExpenses = thisMonthAggregate._sum.amount || 0;
    const todayExpenses = todayAggregate._sum.amount || 0;
    const pendingExpenses = pendingAggregate._sum.amount || 0;
    const paidExpenses = paidAggregate._sum.amount || 0;

    // Highest Expense Category & Category breakdown
    const categoryTotals: Record<string, { total: number; count: number }> = {};
    const monthTotals: Record<string, number> = {};

    for (const exp of allExpenses) {
      const cat = exp.category || 'Other';
      if (!categoryTotals[cat]) categoryTotals[cat] = { total: 0, count: 0 };
      categoryTotals[cat].total += exp.amount;
      categoryTotals[cat].count += 1;

      const mKey = exp.expenseDate ? new Date(exp.expenseDate).toISOString().slice(0, 7) : 'Unknown';
      monthTotals[mKey] = (monthTotals[mKey] || 0) + exp.amount;
    }

    let highestExpenseCategory = 'None';
    let maxCategoryAmount = 0;
    for (const [cat, data] of Object.entries(categoryTotals)) {
      if (data.total > maxCategoryAmount) {
        maxCategoryAmount = data.total;
        highestExpenseCategory = cat;
      }
    }

    const monthCount = Object.keys(monthTotals).length || 1;
    const averageMonthlyExpense = Math.round(totalExpenses / monthCount);

    const expenseByCategory = Object.entries(categoryTotals).map(([category, data]) => ({
      category,
      total: Math.round(data.total),
      count: data.count
    })).sort((a, b) => b.total - a.total);

    const monthlyTrend = Object.entries(monthTotals).map(([month, total]) => ({
      month,
      total: Math.round(total)
    })).sort((a, b) => a.month.localeCompare(b.month));

    const categoryBreakdown = expenseByCategory.map(c => ({
      category: c.category,
      amount: c.total,
      count: c.count
    }));

    let fuelFleetExpenses = 0;
    let staffSalariesExpenses = 0;
    let marketingExpenses = 0;
    let rentUtilitiesExpenses = 0;
    let otherExpenses = 0;

    for (const c of categoryBreakdown) {
      const cat = c.category.toUpperCase();
      if (cat.includes('FUEL') || cat.includes('MAINTENANCE')) {
        fuelFleetExpenses += c.amount;
      } else if (cat.includes('SALARY') || cat.includes('COMMISSION')) {
        staffSalariesExpenses += c.amount;
      } else if (cat.includes('MARKETING') || cat.includes('AD')) {
        marketingExpenses += c.amount;
      } else if (cat.includes('RENT') || cat.includes('UTILIT')) {
        rentUtilitiesExpenses += c.amount;
      } else {
        otherExpenses += c.amount;
      }
    }

    return {
      totalExpenses,
      totalExpenseCount,
      thisMonthExpenses,
      todayExpenses,
      pendingExpenses,
      paidExpenses,
      fuelFleetExpenses,
      staffSalariesExpenses,
      marketingExpenses,
      rentUtilitiesExpenses,
      otherExpenses,
      highestExpenseCategory,
      averageMonthlyExpense,
      categoryBreakdown,
      expenseByCategory,
      monthlyTrend
    };
  }
}
