"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFeedbacks = exports.addComplaintComment = exports.updateComplaint = exports.createComplaint = exports.getComplaints = void 0;
const db_1 = require("../db");
const aiAnalyticsService_1 = require("../services/aiAnalyticsService");
const getComplaints = async (req, res) => {
    try {
        const { status, category, priority } = req.query;
        const where = {};
        if (status && status !== 'ALL')
            where.status = status;
        if (category && category !== 'ALL')
            where.category = category;
        if (priority && priority !== 'ALL')
            where.priority = priority;
        const complaints = await db_1.prisma.complaint.findMany({
            where,
            include: {
                student: { select: { id: true, studentCode: true, fullName: true, phone: true } },
                assignedTo: { select: { id: true, name: true, role: true } },
                comments: true,
            },
            orderBy: { createdAt: 'desc' }
        });
        return res.json({ success: true, data: complaints });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getComplaints = getComplaints;
const createComplaint = async (req, res) => {
    try {
        const data = req.body;
        const count = await db_1.prisma.complaint.count();
        const ticketCode = `TKT-${600 + count + 1}`;
        const classification = aiAnalyticsService_1.AiAnalyticsService.classifyComplaint(data.description || data.title);
        const complaint = await db_1.prisma.complaint.create({
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
        await db_1.prisma.complaintComment.create({
            data: {
                complaintId: complaint.id,
                authorName: 'AI Support Assistant',
                authorRole: 'SYSTEM',
                comment: `Automated triage advice: ${classification.autoResolutionIdea}`,
                isInternal: true,
            }
        });
        return res.status(201).json({ success: true, data: complaint });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.createComplaint = createComplaint;
const updateComplaint = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const updated = await db_1.prisma.complaint.update({
            where: { id },
            data: {
                ...data,
                resolvedAt: data.status === 'RESOLVED' ? new Date() : undefined,
            }
        });
        return res.json({ success: true, data: updated });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.updateComplaint = updateComplaint;
const addComplaintComment = async (req, res) => {
    try {
        const { id } = req.params;
        const { comment, authorName, authorRole, isInternal } = req.body;
        const newComment = await db_1.prisma.complaintComment.create({
            data: {
                complaintId: id,
                authorName: authorName || 'Support Executive',
                authorRole: authorRole || 'STAFF',
                comment,
                isInternal: Boolean(isInternal),
            }
        });
        return res.status(201).json({ success: true, data: newComment });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.addComplaintComment = addComplaintComment;
const getFeedbacks = async (req, res) => {
    try {
        const feedbacks = await db_1.prisma.feedback.findMany({
            include: {
                student: { select: { id: true, studentCode: true, fullName: true } },
                instructor: { select: { id: true, fullName: true } },
            },
            orderBy: { createdAt: 'desc' }
        });
        return res.json({ success: true, data: feedbacks });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getFeedbacks = getFeedbacks;
