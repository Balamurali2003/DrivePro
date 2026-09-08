"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateFollowup = exports.createFollowup = exports.getFollowups = void 0;
const db_1 = require("../db");
const priorityService_1 = require("../services/priorityService");
async function refreshLeadPriorityLocal(leadId) {
    try {
        const lead = await db_1.prisma.lead.findUnique({
            where: { id: leadId },
            include: {
                followups: { orderBy: { followupDate: 'desc' } },
                communications: { orderBy: { communicationDate: 'desc' } }
            }
        });
        if (!lead)
            return;
        const { score, level, reasons } = (0, priorityService_1.calculateLeadPriority)({
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
        await db_1.prisma.lead.update({
            where: { id: leadId },
            data: {
                priority: level,
                priorityScore: score,
                priorityLevel: level,
                priorityReasons: JSON.stringify(reasons),
                priorityUpdatedAt: new Date()
            }
        });
    }
    catch (e) {
        console.error('Failed to refresh priority:', e);
    }
}
const getFollowups = async (req, res) => {
    try {
        const { status, type, leadId } = req.query;
        const where = {};
        if (status && status !== 'ALL')
            where.status = status;
        if (type && type !== 'ALL')
            where.activityType = type;
        if (leadId)
            where.leadId = String(leadId);
        const followups = await db_1.prisma.leadFollowup.findMany({
            where,
            include: {
                lead: true,
                user: { select: { id: true, name: true } },
            },
            orderBy: { followupDate: 'asc' },
        });
        return res.json({ success: true, data: followups });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getFollowups = getFollowups;
const createFollowup = async (req, res) => {
    try {
        const data = req.body;
        const followup = await db_1.prisma.leadFollowup.create({
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
        await db_1.prisma.leadActivity.create({
            data: {
                leadId: data.leadId,
                actionType: 'FOLLOWUP_SCHEDULED',
                description: `Follow-up ${data.activityType} scheduled for ${new Date(data.followupDate).toLocaleDateString()}`,
                actorName: 'Staff',
            }
        });
        // Update lead next follow up and refresh priority
        await db_1.prisma.lead.update({
            where: { id: data.leadId },
            data: { nextFollowUpAt: new Date(data.followupDate) }
        });
        await refreshLeadPriorityLocal(data.leadId);
        return res.status(201).json({ success: true, data: followup });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.createFollowup = createFollowup;
const updateFollowup = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const updated = await db_1.prisma.leadFollowup.update({
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
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.updateFollowup = updateFollowup;
