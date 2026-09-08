"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRefund = exports.getRefunds = exports.createInvoice = exports.getInvoices = exports.recordPayment = exports.getPayments = void 0;
const db_1 = require("../db");
const getPayments = async (req, res) => {
    try {
        const { status, mode, studentId } = req.query;
        const where = {};
        if (status && status !== 'ALL')
            where.paymentStatus = status;
        if (mode && mode !== 'ALL')
            where.paymentMode = mode;
        if (studentId)
            where.studentId = String(studentId);
        const payments = await db_1.prisma.payment.findMany({
            where,
            include: {
                student: { select: { id: true, studentCode: true, fullName: true, phone: true } },
                enrollment: { include: { course: true } },
                invoice: true,
            },
            orderBy: { paymentDate: 'desc' },
            take: 150,
        });
        const totalCollected = await db_1.prisma.payment.aggregate({
            where: { paymentStatus: 'PAID' },
            _sum: { amount: true },
        });
        return res.json({ success: true, data: payments, totalCollected: totalCollected._sum.amount || 0 });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getPayments = getPayments;
const recordPayment = async (req, res) => {
    try {
        const data = req.body;
        const count = await db_1.prisma.payment.count();
        const paymentCode = `PAY-${7000 + count + 1}`;
        const amount = parseFloat(data.amount);
        const payment = await db_1.prisma.payment.create({
            data: {
                paymentCode,
                studentId: data.studentId,
                enrollmentId: data.enrollmentId || null,
                amount,
                paymentDate: new Date(data.paymentDate || Date.now()),
                dueDate: data.dueDate ? new Date(data.dueDate) : null,
                paymentMode: data.paymentMode || 'UPI',
                transactionId: data.transactionId || `UPI${Date.now()}`,
                paymentStatus: 'PAID',
                receiptNumber: `REC-2026-${100 + count + 1}`,
                notes: data.notes || null,
            },
            include: { student: true, enrollment: true }
        });
        // Update enrollment paid & pending amount
        if (data.enrollmentId) {
            const enrollment = await db_1.prisma.enrollment.findUnique({ where: { id: data.enrollmentId } });
            if (enrollment) {
                const newPaid = enrollment.paidAmount + amount;
                const newPending = Math.max(0, enrollment.finalFee - newPaid);
                await db_1.prisma.enrollment.update({
                    where: { id: data.enrollmentId },
                    data: {
                        paidAmount: newPaid,
                        pendingAmount: newPending,
                    }
                });
            }
        }
        return res.status(201).json({ success: true, data: payment });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.recordPayment = recordPayment;
const getInvoices = async (req, res) => {
    try {
        const invoices = await db_1.prisma.invoice.findMany({
            include: {
                student: true,
                enrollment: { include: { course: true } },
                payments: true,
            },
            orderBy: { invoiceDate: 'desc' },
            take: 100,
        });
        return res.json({ success: true, data: invoices });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getInvoices = getInvoices;
const createInvoice = async (req, res) => {
    try {
        const data = req.body;
        const count = await db_1.prisma.invoice.count();
        const invoiceNumber = `INV-2026-${String(100 + count + 1).padStart(3, '0')}`;
        const subtotal = parseFloat(data.subtotal);
        const discount = parseFloat(data.discount) || 0;
        const taxAmount = (subtotal - discount) * 0.18;
        const totalAmount = subtotal - discount + taxAmount;
        const invoice = await db_1.prisma.invoice.create({
            data: {
                invoiceNumber,
                studentId: data.studentId,
                enrollmentId: data.enrollmentId || null,
                type: data.type || 'INVOICE',
                subtotal,
                discount,
                taxRate: 18,
                taxAmount,
                totalAmount,
                paidAmount: data.paidAmount ? parseFloat(data.paidAmount) : totalAmount,
                balanceAmount: data.paidAmount ? Math.max(0, totalAmount - parseFloat(data.paidAmount)) : 0,
                status: data.status || 'PAID',
                items: typeof data.items === 'string' ? data.items : JSON.stringify(data.items || [
                    { description: 'Comprehensive Practical 4-Wheeler Driving Course', qty: 1, rate: subtotal, tax: taxAmount, amount: totalAmount }
                ]),
                notes: data.notes || 'Thank you for choosing DrivePro Driving School!',
                terms: 'Fees paid are non-transferable. Valid for 90 days from registration date.',
            }
        });
        return res.status(201).json({ success: true, data: invoice });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.createInvoice = createInvoice;
const getRefunds = async (req, res) => {
    try {
        const refunds = await db_1.prisma.refund.findMany({
            include: { student: true, payment: true },
            orderBy: { refundDate: 'desc' }
        });
        return res.json({ success: true, data: refunds });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getRefunds = getRefunds;
const createRefund = async (req, res) => {
    try {
        const data = req.body;
        const count = await db_1.prisma.refund.count();
        const refundCode = `REF-${8000 + count + 1}`;
        const refund = await db_1.prisma.refund.create({
            data: {
                refundCode,
                studentId: data.studentId,
                paymentId: data.paymentId || null,
                refundReason: data.refundReason || 'Student relocation',
                requestedAmount: parseFloat(data.requestedAmount),
                approvedAmount: parseFloat(data.approvedAmount || data.requestedAmount),
                approvedBy: data.approvedBy || 'Owner / Management',
                refundMethod: data.refundMethod || 'UPI',
                status: data.status || 'COMPLETED',
                transactionRef: `REF_UPI${Date.now()}`,
                notes: data.notes || null,
            }
        });
        return res.status(201).json({ success: true, data: refund });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.createRefund = createRefund;
