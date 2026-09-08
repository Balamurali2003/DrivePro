import { Request, Response } from 'express';
import { prisma } from '../db';

export const getCommunications = async (req: Request, res: Response) => {
  try {
    const { channel } = req.query;
    const where: any = {};
    if (channel && channel !== 'ALL') where.actionType = String(channel);

    const activities = await prisma.leadActivity.findMany({
      where,
      include: {
        lead: { select: { id: true, leadCode: true, fullName: true, phone: true, email: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return res.json({ success: true, data: activities });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const sendCommunication = async (req: Request, res: Response) => {
  try {
    const { leadId, channel, template, message, recipient } = req.body;

    const activity = await prisma.leadActivity.create({
      data: {
        leadId,
        actionType: channel || 'WHATSAPP',
        description: `Sent ${channel} template: "${template || 'Custom'}" -> ${message?.slice(0, 100)}...`,
        actorName: 'Communication Engine',
        metadata: JSON.stringify({ template, recipient, timestamp: new Date() }),
      }
    });

    return res.json({
      success: true,
      message: `${channel} message sent successfully to ${recipient}`,
      data: activity,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};