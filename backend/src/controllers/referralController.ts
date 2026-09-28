import { Request, Response } from 'express';
import { prisma } from '../db';
import { ReferralMetricsService } from '../services/referralMetricsService';
import { buildDateFilter } from '../services/dateFilterHelper';

export const getReferrals = async (req: Request, res: Response) => {
  try {
    const { range, startDate, endDate, status, rewardStatus, search } = req.query as any;
    const dateFilter = buildDateFilter({ range, startDate, endDate });

    const where: any = {};
    if (dateFilter) where.referralDate = dateFilter;
    if (status && status !== 'ALL') where.status = status;
    if (rewardStatus && rewardStatus !== 'ALL') where.rewardStatus = rewardStatus;

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { referrerName: { contains: q } },
        { referrerPhone: { contains: q } },
        { referredName: { contains: q } },
        { referredPhone: { contains: q } }
      ];
    }

    const referrals = await prisma.referral.findMany({
      where,
      include: {
        referrerStudent: { select: { id: true, studentCode: true, fullName: true, phone: true } },
        referrerLead: { select: { id: true, leadCode: true, fullName: true, phone: true } },
        referredLead: { select: { id: true, leadCode: true, fullName: true, phone: true, status: true } },
        referredStudent: { select: { id: true, studentCode: true, fullName: true, phone: true } },
        rewards: { orderBy: { createdAt: 'desc' } }
      },
      orderBy: { referralDate: 'desc' }
    });

    return res.json({ success: true, count: referrals.length, data: referrals });
  } catch (error: any) {
    console.error('Error fetching referrals:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createReferral = async (req: Request, res: Response) => {
  try {
    const {
      referrerId,
      referrerType, // 'STUDENT' | 'LEAD' | 'OTHER'
      referrerStudentId,
      referrerLeadId,
      referrerName,
      referrerPhone,
      referredName,
      referredPhone,
      referredEmail,
      referralSource,
      rewardRule,
      rewardAmount,
      rewardValue,
      preferredCourse,
      notes
    } = req.body;

    if (!referredName || !referredPhone) {
      return res.status(400).json({ success: false, message: 'Referred customer name and phone are required.' });
    }

    const cleanReferredPhone = referredPhone.replace(/\D/g, '').slice(-10);

    // Validate duplicate referral
    const existing = await prisma.referral.findFirst({
      where: {
        referredPhone: { contains: cleanReferredPhone },
        status: { notIn: ['REJECTED', 'CANCELLED'] }
      }
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: `A referral for ${referredName} (Phone: ${referredPhone}) already exists and is currently active.`
      });
    }

    // Auto-link with CRM
    // Check if referred person is already a Lead
    const matchedLead = await prisma.lead.findFirst({
      where: { phone: { contains: cleanReferredPhone } }
    });

    // Check if referred person is already a Student
    const matchedStudent = await prisma.student.findFirst({
      where: { phone: { contains: cleanReferredPhone } }
    });

    // Check referrer entity if selected
    let refStudentId: string | null = referrerStudentId || null;
    let refLeadId: string | null = referrerLeadId || null;
    let finalReferrerName = referrerName;
    let finalReferrerPhone = referrerPhone;

    const actualRefId = referrerId || referrerStudentId || referrerLeadId;
    if (referrerType === 'STUDENT' && actualRefId) {
      const student = await prisma.student.findUnique({ where: { id: actualRefId } });
      if (student) {
        refStudentId = student.id;
        finalReferrerName = student.fullName;
        finalReferrerPhone = student.phone;
      }
    } else if (referrerType === 'LEAD' && actualRefId) {
      const lead = await prisma.lead.findUnique({ where: { id: actualRefId } });
      if (lead) {
        refLeadId = lead.id;
        finalReferrerName = lead.fullName;
        finalReferrerPhone = lead.phone;
      }
    }

    const rawAmt = rewardAmount !== undefined ? rewardAmount : rewardValue;
    const amount = rawAmt ? parseFloat(String(rawAmt)) : 1000;

    const combinedNotes = preferredCourse
      ? `[Preferred Course: ${preferredCourse}]${notes ? ' ' + notes : ''}`
      : (notes || null);

    const referral = await prisma.referral.create({
      data: {
        referrerStudentId: refStudentId,
        referrerLeadId: refLeadId,
        referrerName: finalReferrerName || 'Anonymous Referrer',
        referrerPhone: finalReferrerPhone || 'N/A',
        referredName,
        referredPhone,
        referredEmail: referredEmail || null,
        referredLeadId: matchedLead ? matchedLead.id : null,
        referredStudentId: matchedStudent ? matchedStudent.id : null,
        referralSource: referralSource || 'STUDENT_REFERRAL',
        rewardRule: rewardRule || 'STANDARD_500',
        rewardAmount: amount,
        rewardStatus: 'PENDING',
        status: matchedStudent ? 'CONVERTED' : (matchedLead ? 'CONTACTED' : 'PENDING'),
        notes: combinedNotes,
        rewards: {
          create: {
            amount,
            status: 'PENDING',
            ruleName: rewardRule || 'Standard Referral Reward',
            notes: 'Initial reward record queued upon referral creation.'
          }
        }
      },
      include: {
        referrerStudent: true,
        referrerLead: true,
        referredLead: true,
        referredStudent: true,
        rewards: true
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Referral successfully recorded.',
      data: referral
    });
  } catch (error: any) {
    console.error('Error creating referral:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateReferral = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, rewardStatus, rewardAmount, notes, referredLeadId, referredStudentId } = req.body;

    const existing = await prisma.referral.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Referral not found.' });

    const updateData: any = {};
    if (status) updateData.status = status;
    if (rewardStatus) updateData.rewardStatus = rewardStatus;
    if (rewardAmount !== undefined) updateData.rewardAmount = parseFloat(String(rewardAmount));
    if (notes !== undefined) updateData.notes = notes;
    if (referredLeadId) updateData.referredLeadId = referredLeadId;
    if (referredStudentId) updateData.referredStudentId = referredStudentId;

    const updated = await prisma.referral.update({
      where: { id },
      data: updateData
    });

    return res.json({ success: true, message: 'Referral updated.', data: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const approveReward = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    const staffName = user ? (user.name || 'Owner / Management') : 'Owner / Management';

    const referral = await prisma.referral.findUnique({ where: { id } });
    if (!referral) return res.status(404).json({ success: false, message: 'Referral not found.' });

    const now = new Date();
    const updated = await prisma.referral.update({
      where: { id },
      data: {
        rewardStatus: 'APPROVED',
        rewardApprovedDate: now
      }
    });

    // Update or create ReferralReward
    await prisma.referralReward.create({
      data: {
        referralId: referral.id,
        amount: referral.rewardAmount,
        status: 'APPROVED',
        approvedAt: now,
        paidBy: staffName,
        notes: `Reward approved by ${staffName}.`
      }
    });

    return res.json({ success: true, message: 'Referral reward approved.', data: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const markRewardPaid = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { paymentMethod = 'UPI', transactionRef, notes } = req.body;
    const user = (req as any).user;
    const staffName = user ? (user.name || 'Staff') : 'Staff';

    const referral = await prisma.referral.findUnique({ where: { id } });
    if (!referral) return res.status(404).json({ success: false, message: 'Referral not found.' });

    const now = new Date();
    const updated = await prisma.referral.update({
      where: { id },
      data: {
        rewardStatus: 'PAID',
        rewardPaidDate: now
      }
    });

    await prisma.referralReward.create({
      data: {
        referralId: referral.id,
        amount: referral.rewardAmount,
        status: 'PAID',
        paidAt: now,
        paidBy: staffName,
        paymentMethod,
        transactionRef: transactionRef || `REF-PAY-${Date.now()}`,
        notes: notes || `Reward payout confirmed via ${paymentMethod}.`
      }
    });

    return res.json({ success: true, message: 'Referral reward marked as paid.', data: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const cancelReferral = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updated = await prisma.referral.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        rewardStatus: 'CANCELLED'
      }
    });
    return res.json({ success: true, message: 'Referral cancelled.', data: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getReferralMetrics = async (req: Request, res: Response) => {
  try {
    const { range, startDate, endDate } = req.query as any;
    const metrics = await ReferralMetricsService.getMetrics({ range, startDate, endDate });
    return res.json({ success: true, data: metrics });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
