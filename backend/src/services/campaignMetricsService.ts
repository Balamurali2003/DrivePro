import { prisma } from '../db';
import { buildDateFilter, DateFilterOptions } from './dateFilterHelper';

export class CampaignMetricsService {
  public static async getMetrics(options: DateFilterOptions = {}) {
    const dateFilter = buildDateFilter(options);
    const where: any = dateFilter ? { startDate: dateFilter } : {};

    const [
      totalCampaigns,
      activeCampaigns,
      completedCampaigns,
      campaignsList
    ] = await Promise.all([
      prisma.campaign.count({ where }),
      prisma.campaign.count({ where: { ...where, status: 'ACTIVE' } }),
      prisma.campaign.count({ where: { ...where, status: 'COMPLETED' } }),
      prisma.campaign.findMany({
        where,
        include: {
          leads: {
            include: {
              convertedStudent: {
                include: {
                  payments: true
                }
              }
            }
          }
        }
      })
    ]);

    let totalLeadsGenerated = 0;
    let totalConvertedLeads = 0;
    let totalCost = 0;
    let totalRevenue = 0;

    for (const c of campaignsList) {
      totalCost += c.spent || 0;

      // Real leads connected
      const leads = c.leads || [];
      totalLeadsGenerated += leads.length;

      for (const l of leads) {
        if (l.status === 'CONVERTED' || l.convertedStudent) {
          totalConvertedLeads++;
          if (l.convertedStudent && l.convertedStudent.payments) {
            for (const p of l.convertedStudent.payments) {
              totalRevenue += p.amount || 0;
            }
          }
        }
      }
    }

    // Also check leads with campaign string matches if not linked via foreign key
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

    for (const l of unlinkedLeads) {
      const campName = (l.campaign || l.leadCampaign || '').trim();
      const match = campaignsList.find(c => c.name.trim().toLowerCase() === campName.toLowerCase());
      if (match) {
        totalLeadsGenerated++;
        if (l.status === 'CONVERTED' || l.convertedStudent) {
          totalConvertedLeads++;
          if (l.convertedStudent?.payments) {
            for (const p of l.convertedStudent.payments) {
              totalRevenue += p.amount || 0;
            }
          }
        }
      }
    }

    // Conversion Rate: Converted Leads / Campaign Leads * 100
    const conversionRate = totalLeadsGenerated > 0
      ? Math.round((totalConvertedLeads / totalLeadsGenerated) * 1000) / 10
      : 0;

    // ROI: (Revenue Generated - Campaign Cost) / Campaign Cost * 100
    // If cost = 0, ROI = null (Not Available)
    const roi = totalCost > 0
      ? Math.round(((totalRevenue - totalCost) / totalCost) * 1000) / 10
      : null;

    return {
      totalCampaigns,
      activeCampaigns,
      completedCampaigns,
      totalLeadsGenerated,
      convertedLeads: totalConvertedLeads,
      conversionRate,
      campaignCost: totalCost,
      revenueGenerated: totalRevenue,
      roi
    };
  }
}
