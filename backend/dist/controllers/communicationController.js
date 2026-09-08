"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendCommunication = exports.getCommunications = void 0;
const db_1 = require("../db");
const getCommunications = async (req, res) => {
    try {
        const { channel } = req.query;
        const where = {};
        if (channel && channel !== 'ALL')
            where.actionType = String(channel);
        const activities = await db_1.prisma.leadActivity.findMany({
            where,
            include: {
                lead: { select: { id: true, leadCode: true, fullName: true, phone: true, email: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
        return res.json({ success: true, data: activities });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getCommunications = getCommunications;
const sendCommunication = async (req, res) => {
    try {
        const { leadId, channel, template, message, recipient } = req.body;
        const activity = await db_1.prisma.leadActivity.create({
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
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.sendCommunication = sendCommunication;
