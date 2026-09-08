"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSetting = exports.getSettings = exports.getAuditLogs = exports.markNotificationRead = exports.getNotifications = exports.getRenewals = exports.getReferrals = exports.getCampaigns = exports.getCommissions = exports.getEmployees = exports.createExpense = exports.getExpenses = void 0;
const db_1 = require("../db");
const getExpenses = async (req, res) => {
    try {
        const expenses = await db_1.prisma.expense.findMany({ orderBy: { expenseDate: 'desc' } });
        return res.json({ success: true, data: expenses });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getExpenses = getExpenses;
const createExpense = async (req, res) => {
    try {
        const data = req.body;
        const count = await db_1.prisma.expense.count();
        const expenseCode = `EXP-${1000 + count + 1}`;
        const expense = await db_1.prisma.expense.create({
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
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.createExpense = createExpense;
const getEmployees = async (req, res) => {
    try {
        const employees = await db_1.prisma.employee.findMany({
            include: { attendances: { take: 5, orderBy: { date: 'desc' } }, commissions: true },
            orderBy: { joiningDate: 'desc' }
        });
        return res.json({ success: true, data: employees });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getEmployees = getEmployees;
const getCommissions = async (req, res) => {
    try {
        const commissions = await db_1.prisma.commission.findMany({
            include: { instructor: true, employee: true },
            orderBy: { createdAt: 'desc' }
        });
        return res.json({ success: true, data: commissions });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getCommissions = getCommissions;
const getCampaigns = async (req, res) => {
    try {
        const campaigns = await db_1.prisma.campaign.findMany({ orderBy: { startDate: 'desc' } });
        return res.json({ success: true, data: campaigns });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getCampaigns = getCampaigns;
const getReferrals = async (req, res) => {
    try {
        const referrals = await db_1.prisma.referral.findMany({
            include: { referrerStudent: true, referrerLead: true },
            orderBy: { referralDate: 'desc' }
        });
        return res.json({ success: true, data: referrals });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getReferrals = getReferrals;
const getRenewals = async (req, res) => {
    try {
        const renewals = await db_1.prisma.renewal.findMany({
            include: { student: true },
            orderBy: { dueDate: 'asc' }
        });
        return res.json({ success: true, data: renewals });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getRenewals = getRenewals;
const getNotifications = async (req, res) => {
    try {
        const notifications = await db_1.prisma.notification.findMany({
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
        return res.json({ success: true, data: notifications });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getNotifications = getNotifications;
const markNotificationRead = async (req, res) => {
    try {
        const { id } = req.params;
        await db_1.prisma.notification.update({
            where: { id },
            data: { isRead: true }
        });
        return res.json({ success: true, message: 'Notification marked read' });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.markNotificationRead = markNotificationRead;
const getAuditLogs = async (req, res) => {
    try {
        const logs = await db_1.prisma.auditLog.findMany({
            orderBy: { timestamp: 'desc' },
            take: 100,
        });
        return res.json({ success: true, data: logs });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getAuditLogs = getAuditLogs;
const getSettings = async (req, res) => {
    try {
        const settings = await db_1.prisma.setting.findMany();
        return res.json({ success: true, data: settings });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getSettings = getSettings;
const updateSetting = async (req, res) => {
    try {
        const { key, value } = req.body;
        const setting = await db_1.prisma.setting.upsert({
            where: { key },
            create: { key, value: String(value) },
            update: { value: String(value) }
        });
        return res.json({ success: true, data: setting });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.updateSetting = updateSetting;
