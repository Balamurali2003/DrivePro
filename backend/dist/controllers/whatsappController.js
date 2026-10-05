"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppController = void 0;
const db_1 = require("../db");
const whatsappService_1 = require("../services/whatsappService");
const socketService_1 = require("../services/socketService");
class WhatsAppController {
    /**
     * GET /api/whatsapp/config
     * Returns WhatsApp API connection and configuration status
     */
    static async getConfigStatus(req, res) {
        try {
            const config = whatsappService_1.WhatsAppService.getConfigStatus();
            return res.json({ success: true, data: config });
        }
        catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }
    /**
     * GET /api/whatsapp/conversations
     * Returns list of conversations filtered by search, customerType, status, or unread
     */
    static async getConversations(req, res) {
        try {
            const { filter, search, date } = req.query;
            const where = {};
            if (search && search.trim()) {
                const query = search.trim();
                where.OR = [
                    { contactName: { contains: query } },
                    { phoneNumber: { contains: query } },
                    { lastMessagePreview: { contains: query } }
                ];
            }
            if (filter) {
                switch (filter.toLowerCase()) {
                    case 'unread':
                        where.unreadCount = { gt: 0 };
                        break;
                    case 'read':
                        where.unreadCount = 0;
                        break;
                    case 'waiting':
                        where.status = 'WAITING_FOR_REPLY';
                        break;
                    case 'replied':
                        where.status = 'OPEN';
                        break;
                    case 'leads':
                        where.customerType = 'LEAD';
                        break;
                    case 'students':
                        where.customerType = 'STUDENT';
                        break;
                    case 'customers':
                        where.customerType = { in: ['CUSTOMER', 'STUDENT'] };
                        break;
                    case 'resolved':
                        where.status = 'RESOLVED';
                        break;
                }
            }
            if (date) {
                const start = new Date(date);
                start.setHours(0, 0, 0, 0);
                const end = new Date(date);
                end.setHours(23, 59, 59, 999);
                where.lastMessageAt = { gte: start, lte: end };
            }
            const conversations = await db_1.prisma.whatsAppConversation.findMany({
                where,
                orderBy: { lastMessageAt: 'desc' },
                include: {
                    lead: {
                        select: {
                            id: true,
                            fullName: true,
                            phone: true,
                            email: true,
                            status: true,
                            priorityLevel: true,
                            leadSource: true,
                            assignedTo: {
                                select: { id: true, name: true, email: true }
                            },
                            lastCommunicationAt: true,
                            nextFollowUpAt: true
                        }
                    },
                    student: {
                        select: {
                            id: true,
                            fullName: true,
                            phone: true,
                            studentCode: true,
                            assignedInstructor: {
                                select: { id: true, user: { select: { name: true } } }
                            },
                            enrollments: {
                                take: 1,
                                orderBy: { enrollmentDate: 'desc' },
                                include: {
                                    course: { select: { name: true } }
                                }
                            }
                        }
                    }
                }
            });
            return res.json({ success: true, count: conversations.length, data: conversations });
        }
        catch (err) {
            console.error('[WhatsApp] getConversations error:', err);
            return res.status(500).json({ success: false, message: err.message });
        }
    }
    /**
     * GET /api/whatsapp/conversations/:id
     * Returns conversation by ID with detailed CRM Profile
     */
    static async getConversationById(req, res) {
        try {
            const { id } = req.params;
            const conversation = await db_1.prisma.whatsAppConversation.findUnique({
                where: { id },
                include: {
                    lead: {
                        include: {
                            assignedTo: { select: { id: true, name: true, email: true } },
                            communications: {
                                take: 5,
                                orderBy: { communicationDate: 'desc' }
                            }
                        }
                    },
                    student: {
                        include: {
                            assignedInstructor: { select: { id: true, user: { select: { name: true } } } },
                            assignedVehicle: { select: { id: true, registrationNumber: true, model: true } },
                            enrollments: {
                                include: {
                                    course: true,
                                    package: true
                                }
                            },
                            payments: {
                                take: 5,
                                orderBy: { paymentDate: 'desc' }
                            }
                        }
                    }
                }
            });
            if (!conversation) {
                return res.status(404).json({ success: false, message: 'Conversation not found' });
            }
            return res.json({ success: true, data: conversation });
        }
        catch (err) {
            console.error('[WhatsApp] getConversationById error:', err);
            return res.status(500).json({ success: false, message: err.message });
        }
    }
    /**
     * GET /api/whatsapp/conversations/:id/messages
     * Returns messages for a specific conversation
     */
    static async getConversationMessages(req, res) {
        try {
            const { id } = req.params;
            const messages = await db_1.prisma.whatsAppMessage.findMany({
                where: { conversationId: id },
                orderBy: { sentAt: 'asc' }
            });
            return res.json({ success: true, count: messages.length, data: messages });
        }
        catch (err) {
            console.error('[WhatsApp] getConversationMessages error:', err);
            return res.status(500).json({ success: false, message: err.message });
        }
    }
    /**
     * POST /api/whatsapp/conversations/:id/messages
     * Staff sends an outbound message to customer
     */
    static async sendMessage(req, res) {
        try {
            const { id } = req.params;
            const { messageText, templateName, mediaUrl, mediaType, caption, filename } = req.body;
            const conversation = await db_1.prisma.whatsAppConversation.findUnique({
                where: { id }
            });
            if (!conversation) {
                return res.status(404).json({ success: false, message: 'Conversation not found' });
            }
            const isConfigured = whatsappService_1.WhatsAppService.isConfigured();
            let metaResponse = null;
            let status = 'SENT';
            let errorMessage = null;
            let wamid = null;
            // Identify staff sender
            const user = req.user;
            const staffName = user ? (user.name || 'Staff') : 'Staff';
            if (!isConfigured) {
                return res.status(400).json({
                    success: false,
                    message: 'WhatsApp API is not configured. Set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID in backend/.env to send real WhatsApp messages.'
                });
            }
            try {
                if (mediaUrl && mediaType) {
                    metaResponse = await whatsappService_1.WhatsAppService.sendWhatsAppMedia({
                        to: conversation.phoneNumber,
                        mediaType: mediaType,
                        mediaUrl,
                        caption,
                        filename
                    });
                    wamid = metaResponse.messageId;
                }
                else if (templateName) {
                    metaResponse = await whatsappService_1.WhatsAppService.sendWhatsAppTemplate({
                        to: conversation.phoneNumber,
                        templateName
                    });
                    wamid = metaResponse.messageId;
                }
                else {
                    metaResponse = await whatsappService_1.WhatsAppService.sendWhatsAppMessage({
                        to: conversation.phoneNumber,
                        messageText: messageText || ''
                    });
                    wamid = metaResponse.messageId;
                }
            }
            catch (apiErr) {
                console.error('[WhatsApp] Meta API call failed:', apiErr);
                status = 'FAILED';
                errorMessage = apiErr.message || 'WhatsApp Cloud API call failed';
            }
            const now = new Date();
            const textToSave = messageText || caption || (templateName ? `[Template: ${templateName}]` : `[${mediaType}]`);
            // Store in WhatsAppMessage
            const message = await db_1.prisma.whatsAppMessage.create({
                data: {
                    conversationId: conversation.id,
                    whatsappMessageId: wamid,
                    direction: 'OUTGOING',
                    messageType: mediaType || (templateName ? 'template' : 'text'),
                    messageText: textToSave,
                    mediaUrl: mediaUrl || null,
                    mediaType: mediaType || null,
                    templateName: templateName || null,
                    status,
                    sentAt: now,
                    errorMessage,
                    senderName: staffName
                }
            });
            // Update conversation
            await db_1.prisma.whatsAppConversation.update({
                where: { id: conversation.id },
                data: {
                    status: 'WAITING_FOR_REPLY',
                    lastMessagePreview: textToSave.slice(0, 150),
                    lastMessageAt: now
                }
            });
            // Also record in LeadCommunication if lead
            if (conversation.leadId) {
                try {
                    await db_1.prisma.leadCommunication.create({
                        data: {
                            leadId: conversation.leadId,
                            communicationType: 'WhatsApp Message',
                            direction: 'Outgoing',
                            speakingWithType: 'Client / Lead',
                            speakingWithName: conversation.contactName,
                            subject: 'Staff WhatsApp Reply',
                            notes: textToSave,
                            communicationDate: now,
                            staffMember: staffName
                        }
                    });
                    await db_1.prisma.lead.update({
                        where: { id: conversation.leadId },
                        data: { lastCommunicationAt: now }
                    });
                }
                catch (e) {
                    console.warn('[WhatsApp] Note: LeadCommunication update skipped:', e.message);
                }
            }
            // Emit Socket.IO event for live update
            const io = (0, socketService_1.getSocketIO)();
            if (io) {
                io.to(`conversation:${conversation.id}`).emit('whatsapp:conversation_message', message);
                io.emit('whatsapp:conversation_update', {
                    conversationId: conversation.id,
                    status: 'WAITING_FOR_REPLY',
                    unreadCount: conversation.unreadCount,
                    lastMessagePreview: textToSave.slice(0, 150),
                    lastMessageAt: now
                });
            }
            if (status === 'FAILED') {
                return res.status(502).json({
                    success: false,
                    message: errorMessage || 'Failed to send WhatsApp message via Meta Cloud API',
                    data: message
                });
            }
            return res.status(201).json({
                success: true,
                message: 'WhatsApp message sent successfully',
                data: message
            });
        }
        catch (err) {
            console.error('[WhatsApp] sendMessage error:', err);
            return res.status(500).json({ success: false, message: err.message });
        }
    }
    /**
     * PATCH /api/whatsapp/conversations/:id/read
     * Clears unread badge for conversation
     */
    static async markConversationRead(req, res) {
        try {
            const { id } = req.params;
            const conversation = await db_1.prisma.whatsAppConversation.update({
                where: { id },
                data: { unreadCount: 0 }
            });
            (0, socketService_1.emitConversationUpdate)({
                conversationId: conversation.id,
                status: conversation.status,
                unreadCount: 0,
                lastMessagePreview: conversation.lastMessagePreview || '',
                lastMessageAt: conversation.lastMessageAt || new Date()
            });
            return res.json({ success: true, message: 'Conversation marked as read' });
        }
        catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }
    /**
     * PATCH /api/whatsapp/conversations/:id/resolve
     * Marks conversation as RESOLVED
     */
    static async resolveConversation(req, res) {
        try {
            const { id } = req.params;
            const conversation = await db_1.prisma.whatsAppConversation.update({
                where: { id },
                data: { status: 'RESOLVED' }
            });
            (0, socketService_1.emitConversationUpdate)({
                conversationId: conversation.id,
                status: 'RESOLVED',
                unreadCount: conversation.unreadCount,
                lastMessagePreview: conversation.lastMessagePreview || '',
                lastMessageAt: conversation.lastMessageAt || new Date()
            });
            return res.json({ success: true, message: 'Conversation resolved', data: conversation });
        }
        catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }
    /**
     * POST /api/whatsapp/bulk-send
     * Broadcast message to selected Leads / Students / Customers
     */
    static async sendBulkMessages(req, res) {
        try {
            const { name, recipients, messageTemplate, templateName, variables } = req.body;
            if (!recipients || !recipients.length) {
                return res.status(400).json({ success: false, message: 'No recipients provided' });
            }
            if (!messageTemplate && !templateName) {
                return res.status(400).json({ success: false, message: 'Message template or template name is required' });
            }
            const isConfigured = whatsappService_1.WhatsAppService.isConfigured();
            const user = req.user;
            const staffName = user ? (user.name || 'Staff') : 'Staff';
            // 1. Create WhatsAppBroadcast record
            const broadcast = await db_1.prisma.whatsAppBroadcast.create({
                data: {
                    name: name || `Broadcast ${new Date().toLocaleDateString()}`,
                    message: messageTemplate || `Template: ${templateName}`,
                    templateName: templateName || null,
                    templateParams: variables ? JSON.stringify(variables) : null,
                    totalRecipients: recipients.length,
                    queued: recipients.length,
                    createdBy: user?.id || null
                }
            });
            let sentCount = 0;
            let failedCount = 0;
            const now = new Date();
            // 2. Iterate through each recipient and process delivery
            for (const rec of recipients) {
                const normalizedPhone = whatsappService_1.WhatsAppService.normalizePhoneNumber(rec.phone);
                const isValid = whatsappService_1.WhatsAppService.isValidPhoneNumber(rec.phone);
                // Interpolate message variables
                let interpolatedMsg = messageTemplate || '';
                interpolatedMsg = interpolatedMsg.replace(/{{\s*name\s*}}/gi, rec.name || 'Valued Customer');
                interpolatedMsg = interpolatedMsg.replace(/{{\s*phone\s*}}/gi, rec.phone || '');
                interpolatedMsg = interpolatedMsg.replace(/{{\s*course\s*}}/gi, rec.course || 'Driving Course');
                interpolatedMsg = interpolatedMsg.replace(/{{\s*batch\s*}}/gi, rec.batch || 'Upcoming Batch');
                interpolatedMsg = interpolatedMsg.replace(/{{\s*date\s*}}/gi, new Date().toLocaleDateString());
                interpolatedMsg = interpolatedMsg.replace(/{{\s*staff_name\s*}}/gi, staffName);
                if (variables) {
                    for (const [key, val] of Object.entries(variables)) {
                        const re = new RegExp(`{{\\\\s*${key}\\\\s*}}`, 'gi');
                        interpolatedMsg = interpolatedMsg.replace(re, val);
                    }
                }
                let wamid = null;
                let recipientStatus = 'QUEUED';
                let errorMsg = null;
                if (!isValid) {
                    recipientStatus = 'FAILED';
                    errorMsg = 'Invalid phone number format';
                    failedCount++;
                }
                else if (!isConfigured) {
                    recipientStatus = 'FAILED';
                    errorMsg = 'WhatsApp API is not configured';
                    failedCount++;
                }
                else {
                    try {
                        if (templateName) {
                            const res = await whatsappService_1.WhatsAppService.sendWhatsAppTemplate({
                                to: normalizedPhone,
                                templateName
                            });
                            wamid = res.messageId;
                            recipientStatus = 'SENT';
                            sentCount++;
                        }
                        else {
                            const res = await whatsappService_1.WhatsAppService.sendWhatsAppMessage({
                                to: normalizedPhone,
                                messageText: interpolatedMsg
                            });
                            wamid = res.messageId;
                            recipientStatus = 'SENT';
                            sentCount++;
                        }
                    }
                    catch (sendErr) {
                        recipientStatus = 'FAILED';
                        errorMsg = sendErr.message || 'Meta API error';
                        failedCount++;
                    }
                }
                // Create broadcast recipient record
                await db_1.prisma.whatsAppBroadcastRecipient.create({
                    data: {
                        broadcastId: broadcast.id,
                        leadId: rec.type === 'LEAD' ? rec.id : null,
                        studentId: rec.type === 'STUDENT' ? rec.id : null,
                        recipientName: rec.name,
                        phoneNumber: normalizedPhone || rec.phone,
                        whatsappMessageId: wamid,
                        status: recipientStatus,
                        errorMessage: errorMsg,
                        sentAt: recipientStatus === 'SENT' ? now : null
                    }
                });
                // Also ensure a Conversation and Message exist so it appears in chat thread
                if (normalizedPhone) {
                    try {
                        let conv = await db_1.prisma.whatsAppConversation.findFirst({
                            where: { phoneNumber: normalizedPhone }
                        });
                        if (!conv) {
                            conv = await db_1.prisma.whatsAppConversation.create({
                                data: {
                                    phoneNumber: normalizedPhone,
                                    contactName: rec.name || `+${normalizedPhone}`,
                                    customerType: rec.type || 'CUSTOMER',
                                    leadId: rec.type === 'LEAD' ? rec.id : null,
                                    studentId: rec.type === 'STUDENT' ? rec.id : null,
                                    status: 'WAITING_FOR_REPLY',
                                    unreadCount: 0,
                                    lastMessagePreview: interpolatedMsg.slice(0, 150),
                                    lastMessageAt: now
                                }
                            });
                        }
                        else {
                            await db_1.prisma.whatsAppConversation.update({
                                where: { id: conv.id },
                                data: {
                                    status: 'WAITING_FOR_REPLY',
                                    lastMessagePreview: interpolatedMsg.slice(0, 150),
                                    lastMessageAt: now
                                }
                            });
                        }
                        await db_1.prisma.whatsAppMessage.create({
                            data: {
                                conversationId: conv.id,
                                whatsappMessageId: wamid,
                                direction: 'OUTGOING',
                                messageType: templateName ? 'template' : 'text',
                                messageText: interpolatedMsg,
                                templateName: templateName || null,
                                status: recipientStatus === 'SENT' ? 'SENT' : 'FAILED',
                                errorMessage: errorMsg,
                                sentAt: now,
                                senderName: staffName
                            }
                        });
                    }
                    catch (threadErr) {
                        console.warn('[WhatsApp Bulk] Thread sync error:', threadErr.message);
                    }
                }
            }
            // 3. Update broadcast record summary
            const updatedBroadcast = await db_1.prisma.whatsAppBroadcast.update({
                where: { id: broadcast.id },
                data: {
                    queued: 0,
                    sent: sentCount,
                    failed: failedCount
                }
            });
            (0, socketService_1.emitBroadcastUpdate)({
                broadcastId: broadcast.id,
                sent: sentCount,
                delivered: 0,
                read: 0,
                failed: failedCount,
                status: 'COMPLETED'
            });
            return res.status(201).json({
                success: true,
                message: isConfigured
                    ? `Broadcast processed: ${sentCount} sent, ${failedCount} failed`
                    : 'WhatsApp API is not configured in backend/.env. Broadcast logged with status FAILED.',
                data: {
                    broadcastId: broadcast.id,
                    total: recipients.length,
                    sent: sentCount,
                    failed: failedCount,
                    broadcast: updatedBroadcast
                }
            });
        }
        catch (err) {
            console.error('[WhatsApp] sendBulkMessages error:', err);
            return res.status(500).json({ success: false, message: err.message });
        }
    }
    /**
     * GET /api/whatsapp/broadcasts
     * Returns list of past broadcasts with stats
     */
    static async getBroadcasts(req, res) {
        try {
            const broadcasts = await db_1.prisma.whatsAppBroadcast.findMany({
                orderBy: { createdAt: 'desc' },
                include: {
                    _count: {
                        select: { recipients: true }
                    }
                }
            });
            return res.json({ success: true, count: broadcasts.length, data: broadcasts });
        }
        catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }
    /**
     * GET /api/whatsapp/broadcasts/:id
     * Returns single broadcast details and recipient list
     */
    static async getBroadcastById(req, res) {
        try {
            const { id } = req.params;
            const broadcast = await db_1.prisma.whatsAppBroadcast.findUnique({
                where: { id },
                include: {
                    recipients: {
                        orderBy: { createdAt: 'asc' },
                        include: {
                            lead: { select: { id: true, fullName: true, phone: true } },
                            student: { select: { id: true, fullName: true, phone: true } }
                        }
                    }
                }
            });
            if (!broadcast) {
                return res.status(404).json({ success: false, message: 'Broadcast not found' });
            }
            return res.json({ success: true, data: broadcast });
        }
        catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }
}
exports.WhatsAppController = WhatsAppController;
