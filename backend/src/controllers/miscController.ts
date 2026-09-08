import { Request, Response } from 'express';
import { prisma } from '../db';

export const getExpenses = async (req: Request, res: Response) => {
  try {
    const expenses = await prisma.expense.findMany({ orderBy: { expenseDate: 'desc' } });
    return res.json({ success: true, data: expenses });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createExpense = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const count = await prisma.expense.count();
    const expenseCode = `EXP-${1000 + count + 1}`;

    const expense = await prisma.expense.create({
      data: {
        expenseCode,
        category: data.category || 'MISCELLANEOUS',
        amount: parseFloat(data.amount),
        department: data.department || 'OFFICE',
        vendorName: data.vendorName || null,
        paymentMode: data.paymentMode || 'BANK_TRANSFER',
        description: data.description,
      }
    });
    return res.status(201).json({ success: true, data: expense });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getEmployees = async (req: Request, res: Response) => {
  try {
    const employees = await prisma.employee.findMany({
      include: { attendances: { take: 5, orderBy: { date: 'desc' } }, commissions: true },
      orderBy: { joiningDate: 'desc' }
    });
    return res.json({ success: true, data: employees });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getCommissions = async (req: Request, res: Response) => {
  try {
    const commissions = await prisma.commission.findMany({
      include: { instructor: true, employee: true },
      orderBy: { createdAt: 'desc' }
    });
    return res.json({ success: true, data: commissions });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getCampaigns = async (req: Request, res: Response) => {
  try {
    const campaigns = await prisma.campaign.findMany({ orderBy: { startDate: 'desc' } });
    return res.json({ success: true, data: campaigns });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getReferrals = async (req: Request, res: Response) => {
  try {
    const referrals = await prisma.referral.findMany({
      include: { referrerStudent: true, referrerLead: true },
      orderBy: { referralDate: 'desc' }
    });
    return res.json({ success: true, data: referrals });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getRenewals = async (req: Request, res: Response) => {
  try {
    const renewals = await prisma.renewal.findMany({
      include: { student: true },
      orderBy: { dueDate: 'asc' }
    });
    return res.json({ success: true, data: renewals });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return res.json({ success: true, data: notifications });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const markNotificationRead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });
    return res.json({ success: true, message: 'Notification marked read' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 100,
    });
    return res.json({ success: true, data: logs });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getSettings = async (req: Request, res: Response) => {
  try {
    const settings = await prisma.setting.findMany();
    return res.json({ success: true, data: settings });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSetting = async (req: Request, res: Response) => {
  try {
    const { key, value } = req.body;
    const setting = await prisma.setting.upsert({
      where: { key },
      create: { key, value: String(value) },
      update: { value: String(value) }
    });
    return res.json({ success: true, data: setting });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};