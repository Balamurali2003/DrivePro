import { Request, Response } from 'express';
import { prisma } from '../db';

export const getEnrollments = async (req: Request, res: Response) => {
  try {
    const enrollments = await prisma.enrollment.findMany({
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
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createEnrollment = async (req: Request, res: Response) => {
  try {
    const { studentId, courseId, packageId, discount, paidAmount, paymentMode } = req.body;
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    const count = await prisma.enrollment.count();
    const enrollmentCode = `ENR-${5000 + count + 1}`;

    const disc = discount ? parseFloat(discount) : 0;
    const finalFee = course.totalFee - disc;
    const paid = paidAmount ? parseFloat(paidAmount) : 0;
    const pending = Math.max(0, finalFee - paid);

    const enrollment = await prisma.enrollment.create({
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
      await prisma.paymentInstallment.create({
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
      const payCount = await prisma.payment.count();
      await prisma.payment.create({
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
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};