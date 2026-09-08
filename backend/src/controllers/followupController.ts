import { Request, Response } from 'express';
import { prisma } from '../db';
import { calculateLeadPriority } from '../services/priorityService';

async function refreshLeadPriorityLocal(leadId: string) {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        followups: { orderBy: { followupDate: 'desc' } },
        communications: { orderBy: { communicationDate: 'desc' } }
      }
    });
    if (!lead) return;

    const { score, level, reasons } = calculateLeadPriority({
      status: lead.status,
      trainingRequirement: lead.trainingRequirement,
      leadSource: lead.leadSource,
      campaign: lead.campaign || lead.leadCampaign,
      nextFollowUpAt: lead.nextFollowUpAt,
      expectedJoiningDate: lead.expectedJoiningDate,
      expectedJoinDate: lead.expectedJoinDate,
      lastCommunicationAt: lead.lastCommunicationAt,
      notes: lead.notes,
      followups: lead.followups,
      communications: lead.communications
    });

    await prisma.lead.update({
      where: { id: leadId },
      data: {
        priority: level,
        priorityScore: score,
        priorityLevel: level,
        priorityReasons: JSON.stringify(reasons),
        priorityUpdatedAt: new Date()
      }
    });
  } catch (e) {
    console.error('Failed to refresh priority:', e);
  }
}

export const getFollowups = async (req: Request, res: Response) => {
  try {
    const { status, type, leadId } = req.query;
    const where: any = {};
    if (status && status !== 'ALL') where.status = status;
    if (type && type !== 'ALL') where.activityType = type;
    if (leadId) where.leadId = String(leadId);

    const followups = await prisma.leadFollowup.findMany({
      where,
      include: {
        lead: true,
        user: { select: { id: true, name: true } },
      },
      orderBy: { followupDate: 'asc' },
    });

    return res.json({ success: true, data: followups });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createFollowup = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const followup = await prisma.leadFollowup.create({
      data: {
        leadId: data.leadId,
        userId: data.userId || null,
        activityType: data.activityType || 'CALL',
        followupDate: new Date(data.followupDate),
        time: data.time || '11:00 AM',
        notes: data.notes,
        outcome: data.outcome || null,
        nextFollowupDate: data.nextFollowupDate ? new Date(data.nextFollowupDate) : null,
        status: data.status || 'SCHEDULED',
      }
    });

    await prisma.leadActivity.create({
      data: {
        leadId: data.leadId,
        actionType: 'FOLLOWUP_SCHEDULED',
        description: `Follow-up ${data.activityType} scheduled for ${new Date(data.followupDate).toLocaleDateString()}`,
        actorName: 'Staff',
      }
    });

    // Update lead next follow up and refresh priority
    await prisma.lead.update({
      where: { id: data.leadId },
      data: { nextFollowUpAt: new Date(data.followupDate) }
    });

    await refreshLeadPriorityLocal(data.leadId);

    return res.status(201).json({ success: true, data: followup });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateFollowup = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const updated = await prisma.leadFollowup.update({
      where: { id },
      data: {
        ...data,
        followupDate: data.followupDate ? new Date(data.followupDate) : undefined,
        nextFollowupDate: data.nextFollowupDate ? new Date(data.nextFollowupDate) : undefined,
      }
    });

    if (updated.leadId) {
      await refreshLeadPriorityLocal(updated.leadId);
    }

    return res.json({ success: true, data: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};