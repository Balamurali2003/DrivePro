"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLeadLocations = exports.getLeadCampaigns = exports.getLeadTerritories = exports.getLeadSources = exports.getLeadsMap = exports.updateLeadStatus = exports.importLeads = exports.resetLeadsData = exports.getLeadImportHistory = exports.getLeadImportTemplate = exports.deleteLeadCommunication = exports.updateLeadCommunication = exports.createLeadCommunication = exports.getLeadCommunications = exports.convertLeadToStudent = exports.deleteLead = exports.updateLead = exports.createLead = exports.getLeadById = exports.getLeads = void 0;
exports.refreshLeadPriority = refreshLeadPriority;
const XLSX = __importStar(require("xlsx"));
const db_1 = require("../db");
const aiAnalyticsService_1 = require("../services/aiAnalyticsService");
const geocodingService_1 = require("../services/geocodingService");
const priorityService_1 = require("../services/priorityService");
/**
 * Recomputes and updates the automatic priority score for a lead based on real metrics
 */
async function refreshLeadPriority(leadId) {
    try {
        const lead = await db_1.prisma.lead.findUnique({
            where: { id: leadId },
            include: {
                followups: { orderBy: { followupDate: 'desc' } },
                communications: { orderBy: { communicationDate: 'desc' } }
            }
        });
        if (!lead)
            return null;
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
        return await db_1.prisma.lead.update({
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
    catch (err) {
        console.error('Failed to refresh lead priority:', err);
        return null;
    }
}
const getLeads = async (req, res) => {
    try {
        const { status, source, priority, trainingRequirement, classPreference, assignedTo, search, page = '1', limit = '500', sortBy = 'leadSequence', sortOrder = 'asc' } = req.query;
        const where = {};
        if (status && status !== 'ALL')
            where.status = status;
        if (source && source !== 'ALL')
            where.leadSource = source;
        if (priority && priority !== 'ALL') {
            where.OR = [
                { priority: priority },
                { priorityLevel: priority }
            ];
        }
        if (trainingRequirement && trainingRequirement !== 'ALL')
            where.trainingRequirement = String(trainingRequirement);
        if (classPreference && classPreference !== 'ALL')
            where.classPreference = String(classPreference);
        if (assignedTo && assignedTo !== 'ALL') {
            if (assignedTo === 'UNASSIGNED') {
                where.assignedToId = null;
            }
            else {
                where.assignedToId = String(assignedTo);
            }
        }
        if (search) {
            where.OR = [
                { fullName: { contains: String(search) } },
                { phone: { contains: String(search) } },
                { email: { contains: String(search) } },
                { leadCode: { contains: String(search) } },
                { area: { contains: String(search) } },
                { location: { contains: String(search) } },
                { originalLocation: { contains: String(search) } },
                { normalizedLocation: { contains: String(search) } },
                { currentLocation: { contains: String(search) } },
            ];
        }
        // Dynamic numeric and continuous sorting
        let orderBy = { leadSequence: 'asc' };
        const orderDirection = String(sortOrder).toLowerCase() === 'desc' ? 'desc' : 'asc';
        if (sortBy === 'leadId' || sortBy === 'leadSequence' || sortBy === 'leadCode') {
            orderBy = { leadSequence: orderDirection };
        }
        else if (sortBy === 'createdAt') {
            orderBy = { createdAt: orderDirection };
        }
        else if (sortBy === 'fullName' || sortBy === 'name') {
            orderBy = { fullName: orderDirection };
        }
        else if (sortBy === 'priority') {
            orderBy = { priorityScore: orderDirection };
        }
        else if (sortBy === 'status') {
            orderBy = { status: orderDirection };
        }
        let leads = await db_1.prisma.lead.findMany({
            where,
            include: {
                assignedTo: { select: { id: true, name: true, email: true, role: true } },
                followups: { orderBy: { followupDate: 'desc' }, take: 1 },
                communications: { orderBy: { communicationDate: 'desc' }, take: 1 },
                locationHistory: { orderBy: { changedAt: 'desc' }, take: 5 },
                _count: { select: { communications: true, followups: true } }
            },
            orderBy,
            take: parseInt(String(limit)) || 500,
        });
        // Multi-tier priority sorting: HIGH -> MEDIUM -> LOW, then follow-up due, expected joining, priorityScore
        if (sortBy === 'priority') {
            const priorityWeight = { HIGH: 3, MEDIUM: 2, LOW: 1 };
            leads.sort((a, b) => {
                const pA = priorityWeight[a.priorityLevel || a.priority] || 1;
                const pB = priorityWeight[b.priorityLevel || b.priority] || 1;
                if (orderDirection === 'desc') {
                    // HIGH -> MEDIUM -> LOW
                    if (pA !== pB)
                        return pB - pA;
                }
                else {
                    // LOW -> MEDIUM -> HIGH
                    if (pA !== pB)
                        return pA - pB;
                }
                // 1. Follow-up due date (earliest due or overdue first)
                const fA = a.nextFollowUpAt ? new Date(a.nextFollowUpAt).getTime() : Infinity;
                const fB = b.nextFollowUpAt ? new Date(b.nextFollowUpAt).getTime() : Infinity;
                if (fA !== fB)
                    return fA - fB;
                // 2. Expected joining date (earliest first)
                const jA = (a.expectedJoiningDate || a.expectedJoinDate) ? new Date(a.expectedJoiningDate || a.expectedJoinDate).getTime() : Infinity;
                const jB = (b.expectedJoiningDate || b.expectedJoinDate) ? new Date(b.expectedJoiningDate || b.expectedJoinDate).getTime() : Infinity;
                if (jA !== jB)
                    return jA - jB;
                // 3. Priority score (highest first)
                const sA = a.priorityScore || 0;
                const sB = b.priorityScore || 0;
                return sB - sA;
            });
        }
        const total = await db_1.prisma.lead.count({ where });
        return res.json({ success: true, data: leads, total });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getLeads = getLeads;
const getLeadById = async (req, res) => {
    try {
        const { id } = req.params;
        const lead = await db_1.prisma.lead.findFirst({
            where: { OR: [{ id }, { leadCode: id }] },
            include: {
                assignedTo: true,
                communications: { orderBy: { communicationDate: 'desc' } },
                followups: { orderBy: { followupDate: 'desc' } },
                activities: { orderBy: { createdAt: 'desc' } },
                statusHistory: { orderBy: { createdAt: 'desc' } },
                locationHistory: { orderBy: { changedAt: 'desc' } },
                convertedStudent: true,
            }
        });
        if (!lead)
            return res.status(404).json({ success: false, message: 'Lead not found' });
        return res.json({ success: true, data: lead });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getLeadById = getLeadById;
const createLead = async (req, res) => {
    try {
        const data = req.body;
        // Continuous sequential Lead ID generation
        const lastLead = await db_1.prisma.lead.findFirst({
            orderBy: { leadSequence: 'desc' },
            select: { leadSequence: true }
        });
        const nextSeq = (lastLead?.leadSequence || 0) + 1;
        const leadCode = `LEAD-${String(nextSeq).padStart(4, '0')}`;
        // Geocode and normalize location
        const rawLoc = data.location || data.area || data.address || '';
        const geo = geocodingService_1.GeocodingService.geocode(rawLoc);
        const { score, recommendation } = aiAnalyticsService_1.AiAnalyticsService.calculateLeadScore(data);
        const { score: prioScore, level: prioLevel, reasons: prioReasons } = (0, priorityService_1.calculateLeadPriority)({
            status: data.status || 'NEW',
            trainingRequirement: data.trainingRequirement || 'Both Licence + Driving',
            leadSource: data.leadSource || 'Direct Enquiry',
            campaign: data.campaign || null,
            nextFollowUpAt: data.nextFollowUpAt ? new Date(data.nextFollowUpAt) : null,
            expectedJoiningDate: data.expectedJoiningDate ? new Date(data.expectedJoiningDate) : null,
            notes: data.notes || null
        });
        const lead = await db_1.prisma.lead.create({
            data: {
                leadSequence: nextSeq,
                leadCode,
                fullName: data.fullName,
                phone: data.phone,
                whatsappNumber: data.whatsappNumber || data.phone,
                email: data.email || null,
                gender: data.gender || 'Male',
                age: data.age ? parseInt(data.age) : null,
                address: data.address || null,
                area: geo.territory || data.area || 'Tirunelveli',
                location: data.location || geo.originalLocation || geo.territory,
                originalLocation: geo.originalLocation || data.location || null,
                normalizedLocation: geo.normalizedLocation || null,
                currentLocation: geo.normalizedLocation || data.location || geo.territory,
                city: data.city || 'Tirunelveli',
                district: data.district || 'Tirunelveli',
                state: data.state || 'Tamil Nadu',
                pincode: data.pincode || null,
                latitude: geo.latitude,
                longitude: geo.longitude,
                preferredLanguage: data.preferredLanguage || 'English',
                licenceType: data.licenceType || 'LMV (Car)',
                courseInterested: data.courseInterested || 'Beginner 4-Wheeler Driving Course',
                packageInterested: data.packageInterested || 'Standard Practical (15 Lessons)',
                trainingRequirement: data.trainingRequirement || 'Both Licence + Driving',
                classPreference: data.classPreference || 'Weekend Class',
                transmission: data.transmission || 'MANUAL',
                preferredTiming: data.preferredTiming || 'Morning 7-9AM',
                preferredInstructorGender: data.preferredInstructorGender || 'Any',
                preferredLocation: data.preferredLocation || null,
                budget: data.budget ? parseFloat(data.budget) : 8500,
                expectedJoiningDate: data.expectedJoiningDate ? new Date(data.expectedJoiningDate) : new Date(Date.now() + 86400000 * 3),
                leadSource: data.leadSource || 'Direct Enquiry',
                campaign: data.campaign || null,
                leadCampaign: data.campaign || null,
                priority: prioLevel,
                priorityScore: prioScore,
                priorityLevel: prioLevel,
                priorityReasons: JSON.stringify(prioReasons),
                priorityUpdatedAt: new Date(),
                status: data.status || 'NEW',
                assignedToId: (data.assignedToId && data.assignedToId !== 'UNASSIGNED') ? data.assignedToId : (data.assignedToUserId && data.assignedToUserId !== 'UNASSIGNED') ? data.assignedToUserId : null,
                aiScore: score,
                aiRecommendation: recommendation,
                notes: data.notes || null,
            },
            include: {
                assignedTo: { select: { id: true, name: true, email: true, role: true } }
            }
        });
        await db_1.prisma.leadActivity.create({
            data: {
                leadId: lead.id,
                actionType: 'CREATED',
                description: `Lead ${lead.leadCode} created from ${lead.leadSource} by staff (${lead.trainingRequirement}, ${lead.classPreference})${lead.assignedTo ? ` - Assigned to ${lead.assignedTo.name}` : ''}`,
                actorName: 'Staff Executive',
            }
        });
        return res.status(201).json({ success: true, data: lead });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.createLead = createLead;
const updateLead = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const oldLead = await db_1.prisma.lead.findUnique({ where: { id } });
        if (!oldLead)
            return res.status(404).json({ success: false, message: 'Lead not found' });
        if (data.status && data.status !== oldLead.status) {
            await db_1.prisma.leadStatusHistory.create({
                data: {
                    leadId: id,
                    fromStatus: oldLead.status,
                    toStatus: data.status,
                    changedBy: 'Staff',
                    reason: data.statusChangeReason || 'Status update',
                }
            });
            await db_1.prisma.leadActivity.create({
                data: {
                    leadId: id,
                    actionType: 'STATUS_CHANGE',
                    description: `Status transitioned from ${oldLead.status} to ${data.status}`,
                    actorName: 'Staff',
                }
            });
        }
        const { id: _id, leadCode: _leadCode, leadSequence: _leadSequence, createdAt: _createdAt, updatedAt: _updatedAt, assignedTo: _assignedTo, followups: _followups, communications: _communications, locationHistory: _locationHistory, _count: __count, statusChangeReason, ...leadFields } = data;
        // Handle staff assignment change
        let targetAssignedId = oldLead.assignedToId;
        if (data.assignedToUserId !== undefined) {
            targetAssignedId = (!data.assignedToUserId || data.assignedToUserId === 'UNASSIGNED') ? null : String(data.assignedToUserId);
            leadFields.assignedToId = targetAssignedId;
        }
        else if (data.assignedToId !== undefined) {
            targetAssignedId = (!data.assignedToId || data.assignedToId === 'UNASSIGNED') ? null : String(data.assignedToId);
            leadFields.assignedToId = targetAssignedId;
        }
        if (targetAssignedId !== oldLead.assignedToId) {
            let assigneeName = 'Unassigned';
            if (targetAssignedId) {
                const u = await db_1.prisma.user.findUnique({ where: { id: targetAssignedId } });
                assigneeName = u?.name || 'Staff';
            }
            await db_1.prisma.leadActivity.create({
                data: {
                    leadId: id,
                    actionType: 'ASSIGNMENT_CHANGE',
                    description: `Lead assigned to ${assigneeName}`,
                    actorName: 'Staff',
                }
            });
        }
        const { score, recommendation } = aiAnalyticsService_1.AiAnalyticsService.calculateLeadScore({ ...oldLead, ...leadFields });
        // Handle location update and history
        let geoUpdate = {};
        const newLocCandidate = leadFields.currentLocation || leadFields.location || leadFields.area || leadFields.address;
        const oldLoc = oldLead.currentLocation || oldLead.normalizedLocation || oldLead.location;
        if (newLocCandidate !== undefined && newLocCandidate !== null && String(newLocCandidate).trim() !== '') {
            const geo = geocodingService_1.GeocodingService.geocode(String(newLocCandidate).trim());
            const newLocNormalized = geo.normalizedLocation || String(newLocCandidate).trim();
            geoUpdate = {
                currentLocation: newLocNormalized,
                normalizedLocation: geo.normalizedLocation || oldLead.normalizedLocation,
                latitude: geo.hasLocation ? geo.latitude : oldLead.latitude,
                longitude: geo.hasLocation ? geo.longitude : oldLead.longitude,
                area: geo.territory !== 'Unspecified' ? geo.territory : (leadFields.area || oldLead.area),
                city: leadFields.city || oldLead.city || 'Tirunelveli',
                district: leadFields.district || oldLead.district || 'Tirunelveli',
                state: leadFields.state || oldLead.state || 'Tamil Nadu',
                pincode: leadFields.pincode !== undefined ? leadFields.pincode : oldLead.pincode,
                // PRESERVE originalLocation
                originalLocation: oldLead.originalLocation || oldLead.location
            };
            // Record location history if location or coordinates actually changed
            const locationChanged = oldLoc !== newLocNormalized || (geo.hasLocation && (oldLead.latitude !== geo.latitude || oldLead.longitude !== geo.longitude));
            if (locationChanged) {
                await db_1.prisma.leadLocationHistory.create({
                    data: {
                        leadId: id,
                        oldLocation: oldLoc || 'Tirunelveli',
                        newLocation: newLocNormalized,
                        oldLatitude: oldLead.latitude,
                        oldLongitude: oldLead.longitude,
                        newLatitude: geo.latitude,
                        newLongitude: geo.longitude,
                        changedBy: req.body.changedBy || 'Staff'
                    }
                });
            }
        }
        // Auto calculate priority based on real metrics
        const { score: prioScore, level: prioLevel, reasons: prioReasons } = (0, priorityService_1.calculateLeadPriority)({
            status: leadFields.status || oldLead.status,
            trainingRequirement: leadFields.trainingRequirement || oldLead.trainingRequirement,
            leadSource: leadFields.leadSource || oldLead.leadSource,
            campaign: leadFields.campaign || oldLead.campaign,
            nextFollowUpAt: leadFields.nextFollowUpAt ? new Date(leadFields.nextFollowUpAt) : oldLead.nextFollowUpAt,
            expectedJoiningDate: leadFields.expectedJoiningDate ? new Date(leadFields.expectedJoiningDate) : oldLead.expectedJoiningDate,
            expectedJoinDate: leadFields.expectedJoinDate ? new Date(leadFields.expectedJoinDate) : oldLead.expectedJoinDate,
            lastCommunicationAt: oldLead.lastCommunicationAt,
            notes: leadFields.notes !== undefined ? leadFields.notes : oldLead.notes
        });
        const updated = await db_1.prisma.lead.update({
            where: { id },
            data: {
                ...leadFields,
                ...geoUpdate,
                budget: leadFields.budget !== undefined && leadFields.budget !== '' && !isNaN(Number(leadFields.budget)) ? parseFloat(String(leadFields.budget)) : undefined,
                age: leadFields.age !== undefined && leadFields.age !== '' && !isNaN(Number(leadFields.age)) ? parseInt(String(leadFields.age)) : undefined,
                aiScore: score,
                aiRecommendation: recommendation,
                priority: prioLevel,
                priorityScore: prioScore,
                priorityLevel: prioLevel,
                priorityReasons: JSON.stringify(prioReasons),
                priorityUpdatedAt: new Date(),
            },
            include: {
                assignedTo: { select: { id: true, name: true, email: true, role: true } },
                locationHistory: { orderBy: { changedAt: 'desc' }, take: 5 }
            }
        });
        return res.json({ success: true, data: updated });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.updateLead = updateLead;
const deleteLead = async (req, res) => {
    try {
        const { id } = req.params;
        await db_1.prisma.leadCommunication.deleteMany({ where: { leadId: id } });
        await db_1.prisma.leadFollowup.deleteMany({ where: { leadId: id } });
        await db_1.prisma.leadActivity.deleteMany({ where: { leadId: id } });
        await db_1.prisma.leadStatusHistory.deleteMany({ where: { leadId: id } });
        await db_1.prisma.lead.delete({ where: { id } });
        return res.json({ success: true, message: 'Lead deleted successfully' });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.deleteLead = deleteLead;
const convertLeadToStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const { courseId, totalFee, paidAmount, paymentMode, assignedInstructorId, assignedVehicleId } = req.body;
        const lead = await db_1.prisma.lead.findUnique({ where: { id } });
        if (!lead)
            return res.status(404).json({ success: false, message: 'Lead not found' });
        const studentCount = await db_1.prisma.student.count();
        const studentCode = `STU-${2000 + studentCount + 1}`;
        const student = await db_1.prisma.student.create({
            data: {
                studentCode,
                leadId: lead.id,
                fullName: lead.fullName,
                phone: lead.phone,
                whatsappNumber: lead.whatsappNumber || lead.phone,
                email: lead.email,
                gender: lead.gender || 'Male',
                area: lead.area,
                address: lead.address,
                assignedInstructorId: assignedInstructorId || null,
                assignedVehicleId: assignedVehicleId || null,
                status: 'ACTIVE',
                totalLessons: 15,
                completedLessons: 0,
                remainingLessons: 15,
            }
        });
        const enrCount = await db_1.prisma.enrollment.count();
        const fee = totalFee ? parseFloat(totalFee) : 9500;
        const paid = paidAmount ? parseFloat(paidAmount) : 5000;
        const enrollment = await db_1.prisma.enrollment.create({
            data: {
                enrollmentCode: `ENR-${5000 + enrCount + 1}`,
                studentId: student.id,
                courseId: courseId || (await db_1.prisma.course.findFirst())?.id || '',
                totalFee: fee,
                finalFee: fee,
                paidAmount: paid,
                pendingAmount: fee - paid,
                totalLessons: 15,
                remainingLessons: 15,
                status: 'ACTIVE',
            }
        });
        if (paid > 0) {
            const payCount = await db_1.prisma.payment.count();
            await db_1.prisma.payment.create({
                data: {
                    paymentCode: `PAY-${7000 + payCount + 1}`,
                    studentId: student.id,
                    enrollmentId: enrollment.id,
                    amount: paid,
                    paymentMode: paymentMode || 'UPI',
                    paymentStatus: 'PAID',
                    transactionId: `UPI${Date.now()}`,
                    notes: 'Registration Advance Payment',
                }
            });
        }
        await db_1.prisma.lead.update({
            where: { id },
            data: { status: 'CONVERTED' }
        });
        await refreshLeadPriority(id);
        await db_1.prisma.leadActivity.create({
            data: {
                leadId: id,
                actionType: 'CONVERTED',
                description: `Lead converted to Student [${student.studentCode}] with Enrollment [${enrollment.enrollmentCode}]`,
                actorName: 'Admissions Office',
            }
        });
        return res.json({ success: true, data: { student, enrollment } });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.convertLeadToStudent = convertLeadToStudent;
// Communications CRUD
const getLeadCommunications = async (req, res) => {
    try {
        const { id } = req.params;
        const { speakingWithType, communicationType, direction, staffMember, startDate, endDate } = req.query;
        const where = { leadId: id };
        if (speakingWithType && speakingWithType !== 'ALL') {
            where.speakingWithType = String(speakingWithType);
        }
        if (communicationType && communicationType !== 'ALL') {
            where.communicationType = String(communicationType);
        }
        if (direction && direction !== 'ALL') {
            where.direction = String(direction);
        }
        if (staffMember && staffMember !== 'ALL') {
            where.staffMember = String(staffMember);
        }
        if (startDate || endDate) {
            where.communicationDate = {};
            if (startDate) {
                where.communicationDate.gte = new Date(String(startDate));
            }
            if (endDate) {
                const end = new Date(String(endDate));
                end.setHours(23, 59, 59, 999);
                where.communicationDate.lte = end;
            }
        }
        const communications = await db_1.prisma.leadCommunication.findMany({
            where,
            orderBy: { communicationDate: 'desc' }
        });
        // Ensure fallback for speakingWithType/speakingWithName
        const lead = await db_1.prisma.lead.findUnique({
            where: { id },
            select: { fullName: true }
        });
        const formatted = communications.map(c => ({
            ...c,
            speakingWithType: c.speakingWithType || 'Client / Lead',
            speakingWithName: c.speakingWithName || lead?.fullName || 'Client'
        }));
        return res.json({ success: true, data: formatted });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getLeadCommunications = getLeadCommunications;
const createLeadCommunication = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const lead = await db_1.prisma.lead.findUnique({ where: { id } });
        if (!lead)
            return res.status(404).json({ success: false, message: 'Lead not found' });
        const commCount = await db_1.prisma.leadCommunication.count();
        const communicationCode = `COM-${1000 + commCount + 1}`;
        const commDate = data.communicationDate ? new Date(data.communicationDate) : new Date();
        const commTime = data.communicationTime || commDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const speakingWithType = data.speakingWithType || 'Client / Lead';
        const speakingWithName = data.speakingWithName?.trim() || (speakingWithType === 'Client / Lead' ? lead.fullName : speakingWithType);
        const communication = await db_1.prisma.leadCommunication.create({
            data: {
                communicationCode,
                leadId: id,
                communicationType: data.communicationType || 'Phone Call',
                direction: data.direction || 'Outgoing',
                speakingWithType,
                speakingWithName,
                subject: data.subject || `${data.communicationType || 'Call'} regarding training`,
                notes: data.notes || 'No notes provided',
                communicationDate: commDate,
                communicationTime: commTime,
                nextFollowupDate: data.nextFollowupDate ? new Date(data.nextFollowupDate) : null,
                nextFollowupTime: data.nextFollowupTime || null,
                staffMember: data.staffMember || req.user?.name || 'Front Desk Staff',
                createdBy: data.createdBy || req.user?.name || data.staffMember || 'Staff',
            }
        });
        // Activity log
        await db_1.prisma.leadActivity.create({
            data: {
                leadId: id,
                actionType: 'COMMUNICATION',
                description: `[${data.communicationType || 'Phone Call'} - ${data.direction || 'Outgoing'} | Speaking With: ${speakingWithType} (${speakingWithName})]: ${data.notes?.substring(0, 120) || ''}`,
                actorName: data.staffMember || req.user?.name || 'Staff',
            }
        });
        // Update or schedule next follow-up if date provided
        if (data.nextFollowupDate) {
            await db_1.prisma.leadFollowup.create({
                data: {
                    leadId: id,
                    activityType: data.communicationType === 'WhatsApp Message' ? 'WHATSAPP' : data.communicationType === 'Email' ? 'EMAIL' : 'CALL',
                    followupDate: new Date(data.nextFollowupDate),
                    time: data.nextFollowupTime || '11:00 AM',
                    notes: `Follow-up after ${data.communicationType} (Spoke with ${speakingWithName}): ${data.notes?.substring(0, 100) || ''}`,
                    outcome: 'SCHEDULED',
                    status: 'SCHEDULED',
                }
            });
            await db_1.prisma.lead.update({
                where: { id },
                data: {
                    nextFollowUpAt: new Date(data.nextFollowupDate),
                    lastCommunicationAt: commDate
                }
            });
        }
        else {
            await db_1.prisma.lead.update({
                where: { id },
                data: {
                    lastCommunicationAt: commDate
                }
            });
        }
        // Refresh automatic lead priority
        await refreshLeadPriority(id);
        return res.status(201).json({ success: true, data: communication });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.createLeadCommunication = createLeadCommunication;
const updateLeadCommunication = async (req, res) => {
    try {
        const { id, communicationId } = req.params;
        const data = req.body;
        const existing = await db_1.prisma.leadCommunication.findFirst({
            where: { id: communicationId, leadId: id }
        });
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Communication record not found' });
        }
        const commDate = data.communicationDate ? new Date(data.communicationDate) : existing.communicationDate;
        const nextFollowup = data.nextFollowupDate !== undefined
            ? (data.nextFollowupDate ? new Date(data.nextFollowupDate) : null)
            : existing.nextFollowupDate;
        const updated = await db_1.prisma.leadCommunication.update({
            where: { id: communicationId },
            data: {
                communicationType: data.communicationType !== undefined ? data.communicationType : existing.communicationType,
                direction: data.direction !== undefined ? data.direction : existing.direction,
                speakingWithType: data.speakingWithType !== undefined ? data.speakingWithType : existing.speakingWithType,
                speakingWithName: data.speakingWithName !== undefined ? data.speakingWithName : existing.speakingWithName,
                subject: data.subject !== undefined ? data.subject : existing.subject,
                notes: data.notes !== undefined ? data.notes : existing.notes,
                communicationDate: commDate,
                communicationTime: data.communicationTime !== undefined ? data.communicationTime : existing.communicationTime,
                nextFollowupDate: nextFollowup,
                nextFollowupTime: data.nextFollowupTime !== undefined ? data.nextFollowupTime : existing.nextFollowupTime,
                staffMember: data.staffMember !== undefined ? data.staffMember : existing.staffMember,
            }
        });
        // Log activity
        await db_1.prisma.leadActivity.create({
            data: {
                leadId: id,
                actionType: 'UPDATE',
                description: `Updated communication record [${existing.communicationCode}] (Spoke with: ${updated.speakingWithType} - ${updated.speakingWithName})`,
                actorName: data.staffMember || req.user?.name || 'Staff',
            }
        });
        return res.json({ success: true, data: updated });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.updateLeadCommunication = updateLeadCommunication;
const deleteLeadCommunication = async (req, res) => {
    try {
        const { id, communicationId } = req.params;
        const existing = await db_1.prisma.leadCommunication.findFirst({
            where: { id: communicationId, leadId: id }
        });
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Communication record not found' });
        }
        await db_1.prisma.leadCommunication.delete({
            where: { id: communicationId }
        });
        await db_1.prisma.leadActivity.create({
            data: {
                leadId: id,
                actionType: 'DELETE',
                description: `Deleted communication record [${existing.communicationCode}] with ${existing.speakingWithType} (${existing.speakingWithName})`,
                actorName: req.user?.name || 'Staff',
            }
        });
        return res.json({ success: true, message: 'Communication record deleted successfully' });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.deleteLeadCommunication = deleteLeadCommunication;
const getLeadImportTemplate = async (req, res) => {
    try {
        // Fetch real active staff from CRM database (excluding passwords)
        const staffList = await db_1.prisma.user.findMany({
            where: { status: 'ACTIVE' },
            select: {
                id: true,
                name: true,
                role: true,
                email: true
            },
            orderBy: { name: 'asc' }
        });
        const sampleStaffName = staffList[0]?.name || 'Rahul Sharma (Sales Lead)';
        const sampleData = [
            {
                "Lead ID": "LEAD-0001",
                "Name": "Rohan Deshmukh",
                "Phone": "+91 98450 12345",
                "Email": "rohan.d@example.com",
                "Address": "Palayamkottai, Tirunelveli",
                "Location": "Palayamkottai",
                "Lead Source": "WhatsApp",
                "Campaign": "Free Trial",
                "Training Requirement": "Both Licence + Driving",
                "Class Preference": "Weekend Class",
                "Status": "NEW",
                "Priority": "HIGH",
                "Assigned To": sampleStaffName,
                "Expected Joining Date": "2026-09-15",
                "Follow-up Date": "2026-09-10",
                "Notes": "Interested in morning 8 AM batch"
            },
            {
                "Lead ID": "LEAD-0002",
                "Name": "Sneha Patil",
                "Phone": "+91 97412 67890",
                "Email": "sneha.p@example.com",
                "Address": "Melapalayam, Tirunelveli",
                "Location": "Melapalayam",
                "Lead Source": "Facebook",
                "Campaign": "SMK Driving School",
                "Training Requirement": "Driving Only",
                "Class Preference": "Weekdays Class",
                "Status": "NEW",
                "Priority": "MEDIUM",
                "Assigned To": "Unassigned",
                "Expected Joining Date": "2026-09-20",
                "Follow-up Date": "2026-09-12",
                "Notes": "Wants automatic car training"
            }
        ];
        const wb = XLSX.utils.book_new();
        // Sheet 1: LeadsTemplate
        const wsLeads = XLSX.utils.json_to_sheet(sampleData);
        XLSX.utils.book_append_sheet(wb, wsLeads, "LeadsTemplate");
        // Sheet 2: Staff List (Reference for Assigned To)
        const staffData = staffList.map(s => ({
            "Staff ID": s.id,
            "Staff Name": s.name,
            "Role": s.role,
            "Email": s.email
        }));
        const wsStaff = XLSX.utils.json_to_sheet(staffData);
        XLSX.utils.book_append_sheet(wb, wsStaff, "Staff List");
        const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        res.setHeader('Content-Disposition', 'attachment; filename="DrivePro_Leads_Import_Template.xlsx"');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        return res.send(buf);
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getLeadImportTemplate = getLeadImportTemplate;
const getLeadImportHistory = async (req, res) => {
    try {
        const history = await db_1.prisma.leadImportHistory.findMany({
            orderBy: { importedAt: 'desc' },
            take: 50
        });
        return res.json({ success: true, data: history });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getLeadImportHistory = getLeadImportHistory;
const resetLeadsData = async (req, res) => {
    try {
        const result = await db_1.prisma.$transaction(async (tx) => {
            // 1. Safely unlink any student that references a lead to protect all student records
            const unlinkedStudents = await tx.student.updateMany({
                where: { leadId: { not: null } },
                data: { leadId: null }
            });
            // 2. Safely unlink referrals linked to leads
            const unlinkedReferrals = await tx.referral.updateMany({
                where: { referrerLeadId: { not: null } },
                data: { referrerLeadId: null }
            });
            // 3. Delete all lead child/table records
            const deletedCommunications = await tx.leadCommunication.deleteMany({});
            const deletedFollowups = await tx.leadFollowup.deleteMany({});
            const deletedActivities = await tx.leadActivity.deleteMany({});
            const deletedStatusHistory = await tx.leadStatusHistory.deleteMany({});
            const deletedLocationHistory = await tx.leadLocationHistory.deleteMany({});
            const deletedImportHistory = await tx.leadImportHistory.deleteMany({});
            // 4. Delete all leads
            const deletedLeads = await tx.lead.deleteMany({});
            return {
                leads: deletedLeads.count,
                unlinkedStudents: unlinkedStudents.count,
                unlinkedReferrals: unlinkedReferrals.count,
                communications: deletedCommunications.count,
                followups: deletedFollowups.count,
                activities: deletedActivities.count,
                statusHistory: deletedStatusHistory.count,
                locationHistory: deletedLocationHistory.count,
                importHistory: deletedImportHistory.count
            };
        });
        return res.json({
            success: true,
            message: 'All existing lead data has been removed successfully.',
            data: result
        });
    }
    catch (error) {
        console.error('Failed to reset lead data:', error);
        return res.status(500).json({ success: false, message: error.message || 'Failed to reset lead data' });
    }
};
exports.resetLeadsData = resetLeadsData;
function parseFlexibleDate(val) {
    if (!val)
        return null;
    if (val instanceof Date && !isNaN(val.getTime()))
        return val;
    const s = String(val).trim();
    if (!s)
        return null;
    // If DD/MM/YYYY or DD-MM-YYYY
    const ddmmyyyy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (ddmmyyyy) {
        const d = new Date(Number(ddmmyyyy[3]), Number(ddmmyyyy[2]) - 1, Number(ddmmyyyy[1]));
        if (!isNaN(d.getTime()))
            return d;
    }
    const d = new Date(s);
    return !isNaN(d.getTime()) ? d : null;
}
const importLeads = async (req, res) => {
    try {
        const { leads = [], fileName = 'leads_import.xlsx', mode = 'import_valid', importedBy = 'Staff', staffMappings = {} } = req.body;
        if (!Array.isArray(leads) || leads.length === 0) {
            return res.status(400).json({ success: false, message: 'No leads provided for import' });
        }
        const totalRecords = leads.length;
        let successfulRecords = 0;
        let failedRecords = 0;
        let duplicateRecords = 0;
        let unknownStaffCount = 0;
        const unknownStaffNames = new Set();
        // Fetch active staff for matching
        const activeStaff = await db_1.prisma.user.findMany({
            where: { status: 'ACTIVE' },
            select: { id: true, name: true, email: true, role: true }
        });
        const staffById = new Map();
        const staffByExactName = new Map();
        const staffByNormName = new Map();
        for (const s of activeStaff) {
            staffById.set(s.id, s.id);
            staffByExactName.set(s.name.trim(), s.id);
            staffByNormName.set(s.name.trim().toLowerCase(), s.id);
            // Strip parenthetical roles like "Rahul Sharma (Sales Lead)" -> "rahul sharma"
            const cleanName = s.name.replace(/\s*\(.*?\)\s*/g, '').trim().toLowerCase();
            if (cleanName) {
                staffByNormName.set(cleanName, s.id);
            }
        }
        // Fetch existing phone numbers to check duplicates
        const existingLeads = await db_1.prisma.lead.findMany({
            select: { id: true, phone: true }
        });
        // Normalize phone numbers (last 10 digits)
        const existingPhoneMap = new Map();
        for (const el of existingLeads) {
            const clean = el.phone.replace(/\D/g, '').slice(-10);
            if (clean)
                existingPhoneMap.set(clean, el.id);
        }
        const seenPhonesInFile = new Set();
        const lastLead = await db_1.prisma.lead.findFirst({
            orderBy: { leadSequence: 'desc' },
            select: { leadSequence: true }
        });
        let currentCodeSeq = lastLead?.leadSequence || 0;
        for (let index = 0; index < leads.length; index++) {
            const row = leads[index];
            const name = String(row.Name || row.fullName || row.name || row['Full Name'] || row['Lead Name'] || '').trim();
            const rawPhone = String(row.Phone || row.phone || row['Mobile'] || row['Contact'] || row['Mobile Number'] || row['Phone Number'] || '').trim();
            const cleanPhone = rawPhone.replace(/\D/g, '').slice(-10);
            // Validation 1: Name and Phone required
            if (!name || !cleanPhone || cleanPhone.length < 8) {
                failedRecords++;
                continue;
            }
            // Resolve Assigned To
            const rawAssigned = String(row['Assigned To'] || row.assignedTo || row.AssignedTo || row.assignedToUserId || '').trim();
            let resolvedAssignedId = null;
            if (rawAssigned && rawAssigned.toLowerCase() !== 'unassigned' && rawAssigned !== '-') {
                // Check staffMappings from request body first
                if (staffMappings && staffMappings[rawAssigned] !== undefined) {
                    const mapping = staffMappings[rawAssigned];
                    if (mapping === 'SKIP') {
                        continue; // Skip this row per user selection
                    }
                    else if (mapping === 'UNASSIGNED' || !mapping) {
                        resolvedAssignedId = null;
                    }
                    else {
                        resolvedAssignedId = mapping;
                    }
                }
                else if (staffById.has(rawAssigned)) {
                    resolvedAssignedId = staffById.get(rawAssigned);
                }
                else if (staffByExactName.has(rawAssigned)) {
                    resolvedAssignedId = staffByExactName.get(rawAssigned);
                }
                else if (staffByNormName.has(rawAssigned.toLowerCase())) {
                    resolvedAssignedId = staffByNormName.get(rawAssigned.toLowerCase());
                }
                else {
                    // Unknown staff member
                    unknownStaffCount++;
                    unknownStaffNames.add(rawAssigned);
                    resolvedAssignedId = null; // Do NOT create fake user
                }
            }
            // Check duplicates
            const isDuplicateInDb = existingPhoneMap.has(cleanPhone);
            const isDuplicateInFile = seenPhonesInFile.has(cleanPhone);
            seenPhonesInFile.add(cleanPhone);
            const rawLoc = String(row.Location || row.location || row.Address || row.address || row.Area || row.area || row['City'] || '').trim();
            const geo = geocodingService_1.GeocodingService.geocode(rawLoc);
            const leadSrc = row['Lead Source'] || row.leadSource || row.Source || row.source || 'Direct Enquiry';
            const leadCmp = row.Campaign || row.campaign || row.leadCampaign || row['Campaign Name'] || null;
            const trainingReq = row['Training Requirement'] || row.trainingRequirement || row['Course'] || 'Both Licence + Driving';
            const classPref = row['Class Preference'] || row.classPreference || row['Batch'] || 'Weekend Class';
            const interestedVeh = row['Interested Vehicle'] || row.interestedVehicle || row.Vehicle || row.vehicle || row.Car || null;
            const expectedJoining = parseFlexibleDate(row['Expected Joining Date'] || row.expectedJoiningDate || row.expectedJoinDate || row['Joining Date']);
            const nextFollowUp = parseFlexibleDate(row['Next Follow-up Date'] || row.nextFollowUpAt || row['Follow-up Date'] || row.followupDate);
            const emailVal = row.Email || row.email || row['Email ID'] || row['Email Address'] || null;
            const notesVal = row.Notes || row.notes || row.Remarks || row.remarks || null;
            const statusVal = row.Status || row.status || 'NEW';
            const priorityVal = row.Priority || row.priority || 'MEDIUM';
            if (isDuplicateInDb || isDuplicateInFile) {
                duplicateRecords++;
                if (mode === 'update_duplicates' && isDuplicateInDb) {
                    // Update existing duplicate lead
                    const existingId = existingPhoneMap.get(cleanPhone);
                    await db_1.prisma.lead.update({
                        where: { id: existingId },
                        data: {
                            fullName: name,
                            email: emailVal || undefined,
                            address: row.Address || row.address || undefined,
                            area: geo.territory !== 'Unspecified' ? geo.territory : undefined,
                            location: rawLoc || undefined,
                            originalLocation: geo.originalLocation || undefined,
                            normalizedLocation: geo.hasLocation ? geo.normalizedLocation : undefined,
                            latitude: geo.hasLocation ? geo.latitude : undefined,
                            longitude: geo.hasLocation ? geo.longitude : undefined,
                            leadSource: leadSrc,
                            campaign: leadCmp,
                            leadCampaign: leadCmp,
                            trainingRequirement: trainingReq,
                            classPreference: classPref,
                            interestedVehicle: interestedVeh || undefined,
                            expectedJoiningDate: expectedJoining || undefined,
                            expectedJoinDate: expectedJoining || undefined,
                            nextFollowUpAt: nextFollowUp || undefined,
                            priority: priorityVal,
                            status: statusVal,
                            assignedToId: resolvedAssignedId !== undefined ? resolvedAssignedId : undefined,
                            notes: notesVal || undefined,
                            updatedAt: new Date(),
                        }
                    });
                    await refreshLeadPriority(existingId);
                    successfulRecords++;
                }
                continue;
            }
            // Valid new lead with sequential continuous ID
            currentCodeSeq++;
            const leadCode = `LEAD-${String(currentCodeSeq).padStart(4, '0')}`;
            const aiAnalysis = aiAnalyticsService_1.AiAnalyticsService.calculateLeadScore({
                leadSource: leadSrc,
                priority: priorityVal,
                status: statusVal,
                budget: row.Budget || row.budget || 8500,
                trainingRequirement: trainingReq,
            });
            const newLead = await db_1.prisma.lead.create({
                data: {
                    leadSequence: currentCodeSeq,
                    leadCode,
                    fullName: name,
                    phone: rawPhone,
                    email: emailVal,
                    address: row.Address || row.address || null,
                    area: geo.territory !== 'Unspecified' ? geo.territory : (row.Area || row.area || 'Tirunelveli'),
                    location: rawLoc || geo.originalLocation || null,
                    originalLocation: geo.originalLocation || rawLoc || null,
                    normalizedLocation: geo.hasLocation ? geo.normalizedLocation : null,
                    latitude: geo.latitude,
                    longitude: geo.longitude,
                    leadSource: leadSrc,
                    campaign: leadCmp,
                    leadCampaign: leadCmp,
                    trainingRequirement: trainingReq,
                    classPreference: classPref,
                    interestedVehicle: interestedVeh,
                    expectedJoiningDate: expectedJoining,
                    expectedJoinDate: expectedJoining,
                    nextFollowUpAt: nextFollowUp,
                    status: statusVal,
                    priority: priorityVal,
                    assignedToId: resolvedAssignedId,
                    notes: notesVal,
                    aiScore: aiAnalysis.score,
                    aiRecommendation: aiAnalysis.recommendation,
                }
            });
            // Automatically recalculate and set priority score, level, and reasons
            await refreshLeadPriority(newLead.id);
            existingPhoneMap.set(cleanPhone, newLead.id);
            successfulRecords++;
        }
        // Save history record
        const historyRecord = await db_1.prisma.leadImportHistory.create({
            data: {
                fileName,
                totalRecords,
                successfulRecords,
                failedRecords,
                duplicateRecords,
                importedBy,
            }
        });
        return res.json({
            success: true,
            summary: {
                totalRecords,
                successfulRecords,
                failedRecords,
                duplicateRecords,
                unknownAssignedStaff: unknownStaffCount,
                unknownStaffList: Array.from(unknownStaffNames)
            },
            history: historyRecord
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.importLeads = importLeads;
const updateLeadStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, communicationType = 'Phone Call', notes, nextFollowUpDate, nextFollowUpTime, notInterestedReason, expectedJoinDate, staffMember = 'Counselor' } = req.body;
        const lead = await db_1.prisma.lead.findUnique({ where: { id } });
        if (!lead)
            return res.status(404).json({ success: false, message: 'Lead not found' });
        const defaultMessages = {
            'Call - Not Attended': `Hello ${lead.fullName}, we tried to contact you regarding your driving school inquiry, but we could not reach you. Please let us know a convenient time to call you back.`,
            'Contacted - Not Interested': `Hello ${lead.fullName}, thank you for your interest in our driving school. We understand that you are not interested at the moment. Please feel free to contact us in the future whenever you require driving lessons or licence assistance.${notInterestedReason ? ` [Reason: ${notInterestedReason}]` : ''}`,
            'Contacted - Interested (Need Time)': `Hello ${lead.fullName}, thank you for showing interest in our driving school services. We understand that you need some time to decide. We will follow up with you at a convenient time. Please feel free to contact us if you have any questions.`,
            'Today Come to Join': `Hello ${lead.fullName}, thank you for your interest in joining our driving school. We are happy to welcome you today. Please visit our driving school to complete your registration and enrollment process.`,
            'Expected Today': `Hello ${lead.fullName}, thank you for your interest in joining our driving school. We are happy to welcome you today. Please visit our driving school to complete your registration and enrollment process.`
        };
        const finalNotes = notes?.trim() || defaultMessages[status] || `Status changed to ${status}`;
        const updatePayload = {
            status,
            lastCommunicationAt: new Date(),
            updatedAt: new Date(),
        };
        if (notInterestedReason) {
            updatePayload.notInterestedReason = notInterestedReason;
        }
        if (nextFollowUpDate) {
            updatePayload.nextFollowUpAt = new Date(nextFollowUpDate);
        }
        if (status === 'Today Come to Join' || status === 'Expected Today') {
            updatePayload.expectedJoinDate = new Date();
        }
        else if (expectedJoinDate) {
            updatePayload.expectedJoinDate = new Date(expectedJoinDate);
        }
        const updatedLead = await db_1.prisma.lead.update({
            where: { id },
            data: updatePayload
        });
        // Automatically create communication history
        const commCount = await db_1.prisma.leadCommunication.count();
        const communication = await db_1.prisma.leadCommunication.create({
            data: {
                communicationCode: `COM-${1000 + commCount + 1}`,
                leadId: id,
                communicationType,
                direction: 'Outgoing',
                subject: `Status: ${status}`,
                notes: finalNotes,
                communicationDate: new Date(),
                communicationTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                nextFollowupDate: nextFollowUpDate ? new Date(nextFollowUpDate) : null,
                nextFollowupTime: nextFollowUpTime || null,
                staffMember,
                createdBy: staffMember,
            }
        });
        // Automatically create lead activity
        await db_1.prisma.leadActivity.create({
            data: {
                leadId: id,
                actionType: 'STATUS_CHANGE',
                description: `Status changed to "${status}": ${finalNotes.slice(0, 100)}`,
                actorName: staffMember,
            }
        });
        // If next follow-up date provided, create follow-up
        if (nextFollowUpDate) {
            await db_1.prisma.leadFollowup.create({
                data: {
                    leadId: id,
                    activityType: communicationType === 'WhatsApp Message' ? 'WHATSAPP' : communicationType === 'Email' ? 'EMAIL' : 'CALL',
                    followupDate: new Date(nextFollowUpDate),
                    time: nextFollowUpTime || '11:00 AM',
                    notes: `Follow-up for ${status}: ${finalNotes.slice(0, 100)}`,
                    outcome: 'SCHEDULED',
                    status: 'SCHEDULED',
                }
            });
        }
        const finalLead = await refreshLeadPriority(id);
        return res.json({
            success: true,
            data: finalLead || updatedLead,
            communication,
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.updateLeadStatus = updateLeadStatus;
// ============================================================================
// TERRITORY LIVE MAP & DYNAMIC FILTERS APIS
// ============================================================================
const getLeadsMap = async (req, res) => {
    try {
        const { source, campaign, status, priority, territory } = req.query;
        const where = {};
        if (source && source !== 'ALL')
            where.leadSource = String(source);
        if (campaign && campaign !== 'ALL') {
            where.OR = [
                { campaign: String(campaign) },
                { leadCampaign: String(campaign) }
            ];
        }
        if (status && status !== 'ALL')
            where.status = String(status);
        if (priority && priority !== 'ALL')
            where.priority = String(priority);
        if (territory && territory !== 'ALL') {
            where.OR = [
                { area: String(territory) },
                { location: String(territory) },
                { originalLocation: String(territory) }
            ];
        }
        const allLeads = await db_1.prisma.lead.findMany({
            where,
            select: {
                id: true,
                leadCode: true,
                leadSequence: true,
                fullName: true,
                phone: true,
                email: true,
                location: true,
                originalLocation: true,
                normalizedLocation: true,
                latitude: true,
                longitude: true,
                area: true,
                leadSource: true,
                campaign: true,
                leadCampaign: true,
                status: true,
                priority: true,
                trainingRequirement: true,
                classPreference: true,
                nextFollowUpAt: true,
                createdAt: true,
                followups: {
                    orderBy: { followupDate: 'asc' },
                    take: 1,
                    select: { followupDate: true }
                }
            },
            orderBy: { leadSequence: 'asc' }
        });
        const totalLeads = allLeads.length;
        let locatedLeads = 0;
        let locationMissing = 0;
        const territoryCounts = {};
        const sourceCounts = {};
        const mappedLeads = [];
        const unlocatedLeads = [];
        allLeads.forEach((lead, idx) => {
            const src = lead.leadSource || 'Other';
            sourceCounts[src] = (sourceCounts[src] || 0) + 1;
            const terr = lead.area || lead.originalLocation || 'Unspecified';
            if (terr && terr !== 'Unspecified' && terr !== 'Location unavailable') {
                territoryCounts[terr] = (territoryCounts[terr] || 0) + 1;
            }
            const followupDate = lead.nextFollowUpAt || (lead.followups && lead.followups[0]?.followupDate) || null;
            if (lead.latitude !== null && lead.longitude !== null) {
                locatedLeads++;
                const dispersed = geocodingService_1.GeocodingService.applyDispersion(lead.latitude, lead.longitude, idx % 30);
                mappedLeads.push({
                    id: lead.id,
                    leadId: lead.leadCode,
                    leadSequence: lead.leadSequence,
                    name: lead.fullName,
                    phone: lead.phone,
                    email: lead.email,
                    location: lead.normalizedLocation || lead.originalLocation || lead.location,
                    originalLocation: lead.originalLocation || lead.location,
                    normalizedLocation: lead.normalizedLocation,
                    latitude: dispersed.lat,
                    longitude: dispersed.lng,
                    territory: lead.area || lead.originalLocation || 'Tirunelveli',
                    area: lead.area || lead.originalLocation || 'Tirunelveli',
                    source: lead.leadSource,
                    campaign: lead.campaign || lead.leadCampaign || '',
                    status: lead.status,
                    priority: lead.priority,
                    trainingRequirement: lead.trainingRequirement,
                    classPreference: lead.classPreference,
                    followupDate
                });
            }
            else {
                locationMissing++;
                unlocatedLeads.push({
                    id: lead.id,
                    leadId: lead.leadCode,
                    leadSequence: lead.leadSequence,
                    name: lead.fullName,
                    phone: lead.phone,
                    location: lead.originalLocation || lead.location || 'Location unavailable',
                    source: lead.leadSource,
                    campaign: lead.campaign || lead.leadCampaign || '',
                    status: lead.status,
                    priority: lead.priority,
                    followupDate
                });
            }
        });
        const topTerritoryEntry = Object.entries(territoryCounts).sort((a, b) => b[1] - a[1])[0];
        const topSourceEntry = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1])[0];
        return res.json({
            success: true,
            data: {
                leads: mappedLeads,
                unlocatedLeads,
                summary: {
                    totalLeads,
                    locatedLeads,
                    locationMissing,
                    topTerritory: topTerritoryEntry ? topTerritoryEntry[0] : 'Tirunelveli',
                    topLeadSource: topSourceEntry ? topSourceEntry[0] : 'Facebook'
                }
            }
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getLeadsMap = getLeadsMap;
const getLeadSources = async (req, res) => {
    try {
        const raw = await db_1.prisma.lead.findMany({
            select: { leadSource: true },
            distinct: ['leadSource']
        });
        const sources = raw.map(r => r.leadSource).filter(Boolean).sort();
        return res.json({ success: true, data: sources });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getLeadSources = getLeadSources;
const getLeadTerritories = async (req, res) => {
    try {
        const raw = await db_1.prisma.lead.findMany({
            where: { area: { not: null } },
            select: { area: true },
            distinct: ['area']
        });
        const territories = raw.map(r => r.area).filter(Boolean).sort();
        return res.json({ success: true, data: territories });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getLeadTerritories = getLeadTerritories;
const getLeadCampaigns = async (req, res) => {
    try {
        const raw = await db_1.prisma.lead.findMany({
            select: { campaign: true, leadCampaign: true }
        });
        const set = new Set();
        raw.forEach(r => {
            if (r.campaign)
                set.add(r.campaign);
            if (r.leadCampaign)
                set.add(r.leadCampaign);
        });
        const campaigns = Array.from(set).filter(Boolean).sort();
        return res.json({ success: true, data: campaigns });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getLeadCampaigns = getLeadCampaigns;
const getLeadLocations = async (req, res) => {
    try {
        const leads = await db_1.prisma.lead.findMany({
            select: {
                area: true,
                location: true,
                currentLocation: true,
                originalLocation: true,
                normalizedLocation: true,
                city: true,
                district: true
            }
        });
        const set = new Set();
        for (const l of leads) {
            if (l.currentLocation)
                set.add(l.currentLocation);
            if (l.normalizedLocation)
                set.add(l.normalizedLocation);
            if (l.area)
                set.add(l.area);
            if (l.originalLocation && l.originalLocation !== 'Balance' && l.originalLocation !== 'Location unavailable') {
                set.add(l.originalLocation);
            }
        }
        const dictionaryLocalities = [
            'Tirunelveli Central, Tamil Nadu',
            'Palayamkottai, Tirunelveli, Tamil Nadu',
            'Melapalayam, Tirunelveli, Tamil Nadu',
            'Pettai, Tirunelveli, Tamil Nadu',
            'Shanthi Nagar, Palayamkottai, Tamil Nadu',
            'KTC Nagar, Palayamkottai, Tamil Nadu',
            'Sankar Nagar, Tirunelveli, Tamil Nadu',
            'Junction, Tirunelveli, Tamil Nadu',
            'Town, Tirunelveli, Tamil Nadu',
            'Aruvankulam, Tirunelveli, Tamil Nadu',
            'Perumalpuram, Tirunelveli, Tamil Nadu',
            'Vannarpettai, Tirunelveli, Tamil Nadu',
            'Gangaikondan, Tirunelveli, Tamil Nadu',
            'Munnirpallam, Tirunelveli, Tamil Nadu'
        ];
        for (const d of dictionaryLocalities)
            set.add(d);
        const locations = Array.from(set).filter(Boolean).sort();
        return res.json({
            success: true,
            data: {
                locations,
                count: locations.length
            },
            locations
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getLeadLocations = getLeadLocations;
