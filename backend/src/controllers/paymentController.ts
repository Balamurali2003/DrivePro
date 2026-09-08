import { Request, Response } from 'express';
import { prisma } from '../db';

export const getPayments = async (req: Request, res: Response) => {
  try {
    const { status, mode, studentId } = req.query;
    const where: any = {};
    if (status && status !== 'ALL') where.paymentStatus = status;
    if (mode && mode !== 'ALL') where.paymentMode = mode;
    if (studentId) where.studentId = String(studentId);

    const payments = await prisma.payment.findMany({
      where,
      include: {
        student: { select: { id: true, studentCode: true, fullName: true, phone: true } },
        enrollment: { include: { course: true } },
        invoice: true,
      },
      orderBy: { paymentDate: 'desc' },
      take: 150,
    });

    const totalCollected = await prisma.payment.aggregate({
      where: { paymentStatus: 'PAID' },
      _sum: { amount: true },
    });

    return res.json({ success: true, data: payments, totalCollected: totalCollected._sum.amount || 0 });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const recordPayment = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const count = await prisma.payment.count();
    const paymentCode = `PAY-${7000 + count + 1}`;
    const amount = parseFloat(data.amount);

    const payment = await prisma.payment.create({
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
      const enrollment = await prisma.enrollment.findUnique({ where: { id: data.enrollmentId } });
      if (enrollment) {
        const newPaid = enrollment.paidAmount + amount;
        const newPending = Math.max(0, enrollment.finalFee - newPaid);
        await prisma.enrollment.update({
          where: { id: data.enrollmentId },
          data: {
            paidAmount: newPaid,
            pendingAmount: newPending,
          }
        });
      }
    }

    return res.status(201).json({ success: true, data: payment });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getInvoices = async (req: Request, res: Response) => {
  try {
    const invoices = await prisma.invoice.findMany({
      include: {
        student: true,
        enrollment: { include: { course: true } },
        payments: true,
      },
      orderBy: { invoiceDate: 'desc' },
      take: 100,
    });
    return res.json({ success: true, data: invoices });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createInvoice = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const count = await prisma.invoice.count();
    const invoiceNumber = `INV-2026-${String(100 + count + 1).padStart(3, '0')}`;
    const subtotal = parseFloat(data.subtotal);
    const discount = parseFloat(data.discount) || 0;
    const taxAmount = (subtotal - discount) * 0.18;
    const totalAmount = subtotal - discount + taxAmount;

    const invoice = await prisma.invoice.create({
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
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getRefunds = async (req: Request, res: Response) => {
  try {
    const refunds = await prisma.refund.findMany({
      include: { student: true, payment: true },
      orderBy: { refundDate: 'desc' }
    });
    return res.json({ success: true, data: refunds });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createRefund = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const count = await prisma.refund.count();
    const refundCode = `REF-${8000 + count + 1}`;

    const refund = await prisma.refund.create({
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
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};