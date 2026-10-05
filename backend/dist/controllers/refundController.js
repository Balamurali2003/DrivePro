"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRefundMetrics = exports.updateRefundStatus = exports.createRefund = exports.getRefunds = void 0;
const db_1 = require("../db");
const refundMetricsService_1 = require("../services/refundMetricsService");
const dateFilterHelper_1 = require("../services/dateFilterHelper");
const getRefunds = async (req, res) => {
    try {
        const { range, startDate, endDate, status, search } = req.query;
        const dateFilter = (0, dateFilterHelper_1.buildDateFilter)({ range, startDate, endDate });
        const where = {};
        if (dateFilter)
            where.requestedAt = dateFilter;
        if (status && status !== 'ALL')
            where.status = status;
        if (search && search.trim()) {
            const q = search.trim();
            where.OR = [
                { refundCode: { contains: q } },
                { refundReason: { contains: q } },
                { student: { fullName: { contains: q } } }
            ];
        }
        const refunds = await db_1.prisma.refund.findMany({
            where,
            include: {
                student: {
                    select: {
                        id: true,
                        studentCode: true,
                        fullName: true,
                        phone: true,
                        enrollments: {
                            include: { course: true },
                            take: 1,
                            orderBy: { enrollmentDate: 'desc' }
                        }
                    }
                },
                payment: true
            },
            orderBy: { requestedAt: 'desc' }
        });
        return res.json({ success: true, count: refunds.length, data: refunds });
    }
    catch (error) {
        console.error('Error fetching refunds:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getRefunds = getRefunds;
const createRefund = async (req, res) => {
    try {
        const { studentId, paymentId, requestedAmount, refundReason, notes } = req.body;
        if (!studentId || !paymentId || !requestedAmount || !refundReason) {
            return res.status(400).json({
                success: false,
                message: 'Student ID, Payment ID, requested amount, and refund reason are required.'
            });
        }
        const parsedRequested = parseFloat(String(requestedAmount));
        if (isNaN(parsedRequested) || parsedRequested <= 0) {
            return res.status(400).json({ success: false, message: 'Requested amount must be greater than 0.' });
        }
        // Connect refund request to existing Payment records & validate
        const payment = await db_1.prisma.payment.findUnique({
            where: { id: paymentId },
            include: { refunds: true }
        });
        if (!payment) {
            return res.status(404).json({ success: false, message: 'Specified payment record not found.' });
        }
        // Calculate total already approved/completed refunds on this payment
        const totalExistingRefunds = payment.refunds
            .filter(r => r.status !== 'REJECTED' && r.status !== 'CANCELLED')
            .reduce((sum, r) => sum + (r.approvedAmount || r.requestedAmount), 0);
        const eligibleRefundable = Math.max(0, payment.amount - totalExistingRefunds);
        if (parsedRequested > eligibleRefundable) {
            return res.status(400).json({
                success: false,
                message: `Refund request of ₹${parsedRequested} exceeds eligible refundable balance. Eligible balance: ₹${eligibleRefundable} (Payment Total: ₹${payment.amount}, Prior Refunds: ₹${totalExistingRefunds}).`
            });
        }
        const count = await db_1.prisma.refund.count();
        const refundCode = `REF-${String(1000 + count + 1).padStart(4, '0')}`;
        const refund = await db_1.prisma.refund.create({
            data: {
                refundCode,
                studentId,
                paymentId,
                refundReason,
                requestedAmount: parsedRequested,
                approvedAmount: 0,
                refundedAmount: 0,
                status: 'PENDING',
                notes: notes || null
            },
            include: {
                student: true,
                payment: true
            }
        });
        return res.status(201).json({
            success: true,
            message: 'Refund request submitted successfully and queued for staff review.',
            data: refund
        });
    }
    catch (error) {
        console.error('Error creating refund:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.createRefund = createRefund;
const updateRefundStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, // 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED'
        approvedAmount, refundedAmount, refundMethod, transactionRef, notes } = req.body;
        const user = req.user;
        const staffName = user ? (user.name || 'Management') : 'Management';
        const existing = await db_1.prisma.refund.findUnique({
            where: { id },
            include: { payment: true }
        });
        if (!existing)
            return res.status(404).json({ success: false, message: 'Refund request not found.' });
        const updateData = {};
        const now = new Date();
        if (status) {
            updateData.status = status;
            if (status === 'UNDER_REVIEW') {
                updateData.notes = notes || existing.notes;
            }
            else if (status === 'APPROVED') {
                const approvedVal = approvedAmount !== undefined ? parseFloat(String(approvedAmount)) : existing.requestedAmount;
                if (existing.payment && approvedVal > existing.payment.amount) {
                    return res.status(400).json({
                        success: false,
                        message: `Approved amount (₹${approvedVal}) cannot exceed original payment amount (₹${existing.payment.amount}).`
                    });
                }
                updateData.approvedAmount = approvedVal;
                updateData.approvedAt = now;
                updateData.approvedBy = staffName;
            }
            else if (status === 'REJECTED') {
                updateData.approvedBy = staffName;
                updateData.notes = notes || 'Refund request rejected by staff.';
            }
            else if (status === 'PROCESSING') {
                updateData.approvedBy = staffName;
            }
            else if (status === 'COMPLETED') {
                // Approved amount and refunded amount must be separate
                const refundVal = refundedAmount !== undefined
                    ? parseFloat(String(refundedAmount))
                    : (existing.approvedAmount > 0 ? existing.approvedAmount : existing.requestedAmount);
                updateData.refundedAmount = refundVal;
                updateData.processedAt = now;
                updateData.processedBy = staffName;
                updateData.refundDate = now;
                updateData.refundMethod = refundMethod || existing.refundMethod || 'UPI';
                updateData.transactionRef = transactionRef || `TXN-REF-${Date.now()}`;
            }
        }
        if (notes !== undefined)
            updateData.notes = notes;
        const updated = await db_1.prisma.refund.update({
            where: { id },
            data: updateData,
            include: { student: true, payment: true }
        });
        return res.json({
            success: true,
            message: `Refund request transitioned to ${updated.status}.`,
            data: updated
        });
    }
    catch (error) {
        console.error('Error updating refund:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.updateRefundStatus = updateRefundStatus;
const getRefundMetrics = async (req, res) => {
    try {
        const { range, startDate, endDate } = req.query;
        const metrics = await refundMetricsService_1.RefundMetricsService.getMetrics({ range, startDate, endDate });
        return res.json({ success: true, data: metrics });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getRefundMetrics = getRefundMetrics;
