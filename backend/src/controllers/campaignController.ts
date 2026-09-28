import { Request, Response } from 'express';
import { prisma } from '../db';
import { CampaignMetricsService } from '../services/campaignMetricsService';
import { buildDateFilter } from '../services/dateFilterHelper';

export const getCampaigns = async (req: Request, res: Response) => {
  try {
    const { range, startDate, endDate, type, status, search } = req.query as any;
    const dateFilter = buildDateFilter({ range, startDate, endDate });

    const where: any = {};
    if (dateFilter) where.startDate = dateFilter;
    if (type && type !== 'ALL') where.type = type;
    if (status && status !== 'ALL') where.status = status;
    if (search && search.trim()) {
      where.name = { contains: search.trim() };
    }

    const campaigns = await prisma.campaign.findMany({
      where,
      include: {
        leads: {
          include: {
            convertedStudent: {
              include: { payments: true }
            }
          }
        }
      },
      orderBy: { startDate: 'desc' }
    });

    // Also fetch unlinked leads to match by campaign name string
    const unlinkedLeads = await prisma.lead.findMany({
      where: {
        campaignId: null,
        OR: [
          { campaign: { not: null } },
          { leadCampaign: { not: null } }
        ]
      },
      include: {
        convertedStudent: {
          include: { payments: true }
        }
      }
    });

    const enriched = campaigns.map(c => {
      const directLeads = c.leads || [];
      const matchingStringLeads = unlinkedLeads.filter(l => {
        const cName = (l.campaign || l.leadCampaign || '').trim().toLowerCase();
        return cName === c.name.trim().toLowerCase();
      });

      const allLeads = [...directLeads, ...matchingStringLeads];
      const leadsGenerated = allLeads.length;
      const interestedLeads = allLeads.filter(l => ['INTERESTED', 'TRIAL_SCHEDULED', 'CONTACTED'].includes(l.status)).length;
      const convertedLeads = allLeads.filter(l => l.status === 'CONVERTED' || l.convertedStudent).length;

      let revenue = 0;
      for (const l of allLeads) {
        if (l.convertedStudent?.payments) {
          for (const p of l.convertedStudent.payments) {
            revenue += p.amount || 0;
          }
        }
      }

      const conversionRate = leadsGenerated > 0
        ? Math.round((convertedLeads / leadsGenerated) * 1000) / 10
        : 0;

      const spent = c.spent || 0;
      const roi = spent > 0
        ? Math.round(((revenue - spent) / spent) * 1000) / 10
        : null;

      return {
        id: c.id,
        name: c.name,
        channel: c.channel,
        type: c.type || c.channel || 'Other',
        source: c.source || 'Marketing',
        startDate: c.startDate,
        endDate: c.endDate,
        budget: c.budget,
        spent: c.spent,
        leadsGenerated,
        interestedLeads,
        convertedLeads,
        revenue,
        conversionRate,
        roi,
        status: c.status,
        targetAudience: c.targetAudience,
        notes: c.notes,
        createdAt: c.createdAt
      };
    });

    return res.json({ success: true, count: enriched.length, data: enriched });
  } catch (error: any) {
    console.error('Error fetching campaigns:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getCampaignById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        leads: {
          include: {
            convertedStudent: { include: { payments: true } }
          }
        }
      }
    });

    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found.' });

    // Also find leads that matched by string name
    const unlinkedLeads = await prisma.lead.findMany({
      where: {
        campaignId: null,
        OR: [
          { campaign: { not: null } },
          { leadCampaign: { not: null } }
        ]
      },
      include: {
        convertedStudent: { include: { payments: true } }
      }
    });

    const directLeads = campaign.leads || [];
    const matchingStringLeads = unlinkedLeads.filter(l => {
      const cName = (l.campaign || l.leadCampaign || '').trim().toLowerCase();
      return cName === campaign.name.trim().toLowerCase();
    });

    const allLeads = [...directLeads, ...matchingStringLeads];
    const leadsCount = allLeads.length;
    const convertedCount = allLeads.filter(l => l.status === 'CONVERTED' || l.convertedStudent).length;

    let revenue = 0;
    for (const l of allLeads) {
      if (l.convertedStudent?.payments) {
        for (const p of l.convertedStudent.payments) {
          revenue += p.amount || 0;
        }
      }
    }

    const spent = campaign.spent || 0;
    const cpl = leadsCount > 0 ? Math.round((spent / leadsCount) * 100) / 100 : 0;
    const cpa = convertedCount > 0 ? Math.round((spent / convertedCount) * 100) / 100 : 0;
    const roi = spent > 0 ? Math.round(((revenue - spent) / spent) * 1000) / 10 : null;

    const enriched = {
      ...campaign,
      leads: allLeads,
      metrics: {
        leadsCount,
        convertedCount,
        revenue,
        cpl,
        cpa,
        roi
      }
    };

    return res.json({ success: true, data: enriched });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createCampaign = async (req: Request, res: Response) => {
  try {
    const {
      name,
      channel,
      type,
      source,
      startDate,
      endDate,
      budget,
      spent,
      targetAudience,
      notes,
      status
    } = req.body;

    if (!name || !startDate || budget === undefined) {
      return res.status(400).json({ success: false, message: 'Campaign name, start date, and budget are required.' });
    }

    const campaignType = type || channel || 'Facebook';

    const campaign = await prisma.campaign.create({
      data: {
        name: name.trim(),
        channel: channel || campaignType,
        type: campaignType,
        source: source || 'Marketing Team',
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        budget: parseFloat(String(budget)),
        spent: spent ? parseFloat(String(spent)) : 0,
        status: status || 'ACTIVE',
        targetAudience: targetAudience || null,
        notes: notes || null
      }
    });

    // Automatically link any existing leads that have this campaign name in lead.campaign or lead.leadCampaign
    await prisma.lead.updateMany({
      where: {
        OR: [
          { campaign: { equals: campaign.name } },
          { leadCampaign: { equals: campaign.name } }
        ]
      },
      data: { campaignId: campaign.id }
    });

    return res.status(201).json({ success: true, message: 'Campaign created successfully.', data: campaign });
  } catch (error: any) {
    console.error('Error creating campaign:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCampaign = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, channel, type, source, startDate, endDate, budget, spent, status, targetAudience, notes } = req.body;

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (channel) updateData.channel = channel;
    if (type) updateData.type = type;
    if (source !== undefined) updateData.source = source;
    if (startDate) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
    if (budget !== undefined) updateData.budget = parseFloat(String(budget));
    if (spent !== undefined) updateData.spent = parseFloat(String(spent));
    if (status) updateData.status = status;
    if (targetAudience !== undefined) updateData.targetAudience = targetAudience;
    if (notes !== undefined) updateData.notes = notes;

    const campaign = await prisma.campaign.update({
      where: { id },
      data: updateData
    });

    return res.json({ success: true, message: 'Campaign updated successfully.', data: campaign });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteCampaign = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.campaign.delete({ where: { id } });
    return res.json({ success: true, message: 'Campaign deleted.' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getCampaignMetrics = async (req: Request, res: Response) => {
  try {
    const { range, startDate, endDate } = req.query as any;
    const metrics = await CampaignMetricsService.getMetrics({ range, startDate, endDate });
    return res.json({ success: true, data: metrics });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
