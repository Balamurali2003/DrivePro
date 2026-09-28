import { Request, Response } from 'express';
import { prisma } from '../db';
import { ExpenseMetricsService } from '../services/expenseMetricsService';
import { buildDateFilter } from '../services/dateFilterHelper';

export const getExpenses = async (req: Request, res: Response) => {
  try {
    const { range, startDate, endDate, category, status, paymentMode, search } = req.query as any;
    const dateFilter = buildDateFilter({ range, startDate, endDate });

    const where: any = {};
    if (dateFilter) where.expenseDate = dateFilter;
    if (category && category !== 'ALL') where.category = category;
    if (status && status !== 'ALL') where.status = status;
    if (paymentMode && paymentMode !== 'ALL') where.paymentMode = paymentMode;

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { expenseCode: { contains: q } },
        { description: { contains: q } },
        { vendorName: { contains: q } }
      ];
    }

    const expenses = await prisma.expense.findMany({
      where,
      include: {
        createdBy: { select: { id: true, name: true, email: true } }
      },
      orderBy: { expenseDate: 'desc' }
    });

    return res.json({ success: true, count: expenses.length, data: expenses });
  } catch (error: any) {
    console.error('Error fetching expenses:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createExpense = async (req: Request, res: Response) => {
  try {
    const {
      expenseDate,
      category,
      description,
      vendorName,
      amount,
      paymentMode,
      status,
      receiptUrl,
      department
    } = req.body;

    const user = (req as any).user;

    if (!category || !description || amount === undefined) {
      return res.status(400).json({ success: false, message: 'Category, description, and amount are required.' });
    }

    const parsedAmount = parseFloat(String(amount));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be greater than 0.' });
    }

    let parsedDate = new Date();
    if (expenseDate) {
      const d = new Date(expenseDate);
      if (!isNaN(d.getTime())) parsedDate = d;
    }

    const count = await prisma.expense.count();
    const expenseCode = `EXP-${String(1000 + count + 1).padStart(4, '0')}`;

    const expense = await prisma.expense.create({
      data: {
        expenseCode,
        category,
        description,
        vendorName: vendorName || null,
        amount: parsedAmount,
        paymentMode: paymentMode || 'CASH',
        status: status || 'PAID',
        expenseDate: parsedDate,
        receiptUrl: receiptUrl || null,
        department: department || 'ACADEMY',
        createdById: user?.id || null
      },
      include: {
        createdBy: { select: { id: true, name: true } }
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Operating expense recorded successfully.',
      data: expense
    });
  } catch (error: any) {
    console.error('Error creating expense:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateExpense = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { expenseDate, category, description, vendorName, amount, paymentMode, status, receiptUrl } = req.body;

    const updateData: any = {};
    if (category) updateData.category = category;
    if (description) updateData.description = description;
    if (vendorName !== undefined) updateData.vendorName = vendorName;
    if (paymentMode) updateData.paymentMode = paymentMode;
    if (status) updateData.status = status;
    if (receiptUrl !== undefined) updateData.receiptUrl = receiptUrl;

    if (amount !== undefined) {
      const val = parseFloat(String(amount));
      if (val <= 0) return res.status(400).json({ success: false, message: 'Amount must be greater than 0.' });
      updateData.amount = val;
    }

    if (expenseDate) {
      const d = new Date(expenseDate);
      if (!isNaN(d.getTime())) updateData.expenseDate = d;
    }

    const updated = await prisma.expense.update({
      where: { id },
      data: updateData,
      include: { createdBy: { select: { id: true, name: true } } }
    });

    return res.json({ success: true, message: 'Expense updated.', data: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteExpense = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.expense.delete({ where: { id } });
    return res.json({ success: true, message: 'Expense deleted.' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getExpenseMetrics = async (req: Request, res: Response) => {
  try {
    const { range, startDate, endDate } = req.query as any;
    const metrics = await ExpenseMetricsService.getMetrics({ range, startDate, endDate });
    return res.json({ success: true, data: metrics });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
