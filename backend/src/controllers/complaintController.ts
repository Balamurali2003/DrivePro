import { Request, Response } from 'express';
import { prisma } from '../db';
import { AiAnalyticsService } from '../services/aiAnalyticsService';

export const getComplaints = async (req: Request, res: Response) => {
  try {
    const { status, category, priority } = req.query;
    const where: any = {};
    if (status && status !== 'ALL') where.status = status;
    if (category && category !== 'ALL') where.category = category;
    if (priority && priority !== 'ALL') where.priority = priority;

    const complaints = await prisma.complaint.findMany({
      where,
      include: {
        student: { select: { id: true, studentCode: true, fullName: true, phone: true } },
        assignedTo: { select: { id: true, name: true, role: true } },
        comments: true,
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.json({ success: true, data: complaints });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createComplaint = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const count = await prisma.complaint.count();
    const ticketCode = `TKT-${600 + count + 1}`;

    const classification = AiAnalyticsService.classifyComplaint(data.description || data.title);

    const complaint = await prisma.complaint.create({
      data: {
        ticketCode,
        studentId: data.studentId,
        category: data.category || classification.category,
        priority: data.priority || classification.priority,
        title: data.title,
        description: data.description,
        assignedToId: data.assignedToId || null,
        dueDate: data.dueDate ? new Date(data.dueDate) : new Date(Date.now() + 86400000 * 2),
        status: 'OPEN',
      }
    });

    // Auto-add initial triage comment with AI advice
    await prisma.complaintComment.create({
      data: {
        complaintId: complaint.id,
        authorName: 'AI Support Assistant',
        authorRole: 'SYSTEM',
        comment: `Automated triage advice: ${classification.autoResolutionIdea}`,
        isInternal: true,
      }
    });

    return res.status(201).json({ success: true, data: complaint });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateComplaint = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const updated = await prisma.complaint.update({
      where: { id },
      data: {
        ...data,
        resolvedAt: data.status === 'RESOLVED' ? new Date() : undefined,
      }
    });

    return res.json({ success: true, data: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const addComplaintComment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { comment, authorName, authorRole, isInternal } = req.body;

    const newComment = await prisma.complaintComment.create({
      data: {
        complaintId: id,
        authorName: authorName || 'Support Executive',
        authorRole: authorRole || 'STAFF',
        comment,
        isInternal: Boolean(isInternal),
      }
    });

    return res.status(201).json({ success: true, data: newComment });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getFeedbacks = async (req: Request, res: Response) => {
  try {
    const feedbacks = await prisma.feedback.findMany({
      include: {
        student: { select: { id: true, studentCode: true, fullName: true } },
        instructor: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.json({ success: true, data: feedbacks });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};