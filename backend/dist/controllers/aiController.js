"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAiInsights = void 0;
const db_1 = require("../db");
const aiAnalyticsService_1 = require("../services/aiAnalyticsService");
const getAiInsights = async (req, res) => {
    try {
        const leads = await db_1.prisma.lead.findMany({ take: 20, orderBy: { createdAt: 'desc' } });
        const prioritizedFollowups = leads.map(l => ({
            leadId: l.id,
            leadCode: l.leadCode,
            name: l.fullName,
            score: l.aiScore,
            recommendation: l.aiRecommendation,
            priority: l.priority,
            status: l.status,
        })).sort((a, b) => b.score - a.score);
        const forecast = aiAnalyticsService_1.AiAnalyticsService.forecastDemandAndRevenue([], []);
        return res.json({
            success: true,
            data: {
                aiScoredLeads: prioritizedFollowups,
                forecast,
                smartRoutingSummary: {
                    availableInstructorsMatched: 8,
                    optimalFleetAllocationPct: 91,
                    fuelSavingsIndexPct: 14.2,
                }
            }
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getAiInsights = getAiInsights;
