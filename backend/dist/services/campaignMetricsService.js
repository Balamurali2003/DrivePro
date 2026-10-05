"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CampaignMetricsService = void 0;
const db_1 = require("../db");
const dateFilterHelper_1 = require("./dateFilterHelper");
class CampaignMetricsService {
    static async getMetrics(options = {}) {
        const dateFilter = (0, dateFilterHelper_1.buildDateFilter)(options);
        const where = dateFilter ? { startDate: dateFilter } : {};
        const [totalCampaigns, activeCampaigns, completedCampaigns, campaignsList] = await Promise.all([
            db_1.prisma.campaign.count({ where }),
            db_1.prisma.campaign.count({ where: { ...where, status: 'ACTIVE' } }),
            db_1.prisma.campaign.count({ where: { ...where, status: 'COMPLETED' } }),
            db_1.prisma.campaign.findMany({
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
        const unlinkedLeads = await db_1.prisma.lead.findMany({
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
exports.CampaignMetricsService = CampaignMetricsService;
