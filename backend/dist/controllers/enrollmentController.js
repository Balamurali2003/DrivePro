"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEnrollment = exports.getEnrollments = void 0;
const db_1 = require("../db");
const getEnrollments = async (req, res) => {
    try {
        const enrollments = await db_1.prisma.enrollment.findMany({
            include: {
                student: true,
                course: true,
                package: true,
                payments: true,
                installments: true,
            },
            orderBy: { enrollmentDate: 'desc' }
        });
        return res.json({ success: true, data: enrollments });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getEnrollments = getEnrollments;
const createEnrollment = async (req, res) => {
    try {
        const { studentId, courseId, packageId, discount, paidAmount, paymentMode } = req.body;
        const course = await db_1.prisma.course.findUnique({ where: { id: courseId } });
        if (!course)
            return res.status(404).json({ success: false, message: 'Course not found' });
        const count = await db_1.prisma.enrollment.count();
        const enrollmentCode = `ENR-${5000 + count + 1}`;
        const disc = discount ? parseFloat(discount) : 0;
        const finalFee = course.totalFee - disc;
        const paid = paidAmount ? parseFloat(paidAmount) : 0;
        const pending = Math.max(0, finalFee - paid);
        const enrollment = await db_1.prisma.enrollment.create({
            data: {
                enrollmentCode,
                studentId,
                courseId,
                packageId: packageId || null,
                totalFee: course.totalFee,
                discount: disc,
                taxAmount: course.totalFee * 0.18 / 1.18,
                finalFee,
                paidAmount: paid,
                pendingAmount: pending,
                totalLessons: course.numberOfLessons,
                remainingLessons: course.numberOfLessons,
                status: 'ACTIVE',
            }
        });
        // Create installment schedule if pending > 0
        if (pending > 0) {
            await db_1.prisma.paymentInstallment.create({
                data: {
                    enrollmentId: enrollment.id,
                    installmentNumber: 1,
                    dueDate: new Date(Date.now() + 86400000 * 15),
                    amount: pending,
                    balanceAmount: pending,
                    status: 'PENDING',
                }
            });
        }
        if (paid > 0) {
            const payCount = await db_1.prisma.payment.count();
            await db_1.prisma.payment.create({
                data: {
                    paymentCode: `PAY-${7000 + payCount + 1}`,
                    studentId,
                    enrollmentId: enrollment.id,
                    amount: paid,
                    paymentMode: paymentMode || 'UPI',
                    paymentStatus: 'PAID',
                    transactionId: `TXN${Date.now()}`,
                    notes: 'Course Enrollment Initial Deposit',
                }
            });
        }
        return res.status(201).json({ success: true, data: enrollment });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.createEnrollment = createEnrollment;
