"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppWebhookController = void 0;
const db_1 = require("../db");
const whatsappService_1 = require("../services/whatsappService");
const socketService_1 = require("../services/socketService");
class WhatsAppWebhookController {
    /**
     * GET /api/whatsapp/webhook
     * Meta Cloud API Webhook Verification Challenge
     */
    static async verifyWebhook(req, res) {
        try {
            const mode = req.query['hub.mode'];
            const token = req.query['hub.verify_token'];
            const challenge = req.query['hub.challenge'];
            const configuredVerifyToken = (process.env.WHATSAPP_VERIFY_TOKEN || 'drivepro_crm_webhook_token').trim();
            if (mode && token) {
                if (mode === 'subscribe' && token === configuredVerifyToken) {
                    console.log('[WhatsApp Webhook] Verification successful. Challenge echoed.');
                    return res.status(200).send(challenge);
                }
                else {
                    console.warn('[WhatsApp Webhook] Verification token mismatch. Expected:', configuredVerifyToken, 'Got:', token);
                    return res.status(403).json({ error: 'Verification token mismatch' });
                }
            }
            return res.status(400).json({ error: 'Missing hub.mode or hub.verify_token' });
        }
        catch (err) {
            console.error('[WhatsApp Webhook] Error in verifyWebhook:', err);
            return res.status(500).json({ error: 'Internal server error during webhook verification' });
        }
    }
    /**
     * POST /api/whatsapp/webhook
     * Processes incoming Meta WhatsApp events (messages and statuses)
     * Implements strict idempotency via WhatsAppWebhookEvent table
     */
    static async handleWebhook(req, res) {
        // Acknowledge Meta immediately with 200 OK
        res.status(200).json({ status: 'EVENT_RECEIVED' });
        try {
            const body = req.body;
            if (!body)
                return;
            // Check if entry changes exist
            const entries = Array.isArray(body.entry) ? body.entry : [{ changes: [{ value: body }] }];
            for (const entry of entries) {
                const changes = entry.changes || [];
                for (const change of changes) {
                    const value = change.value || change;
                    if (!value)
                        continue;
                    // Process delivery status updates
                    if (value.statuses && Array.isArray(value.statuses)) {
                        for (const statusObj of value.statuses) {
                            await WhatsAppWebhookController.processStatusUpdate(statusObj);
                        }
                    }
                    // Process incoming messages
                    if (value.messages && Array.isArray(value.messages)) {
                        const contacts = value.contacts || [];
                        for (const messageObj of value.messages) {
                            await WhatsAppWebhookController.processIncomingMessage(messageObj, contacts);
                        }
                    }
                }
            }
        }
        catch (err) {
            console.error('[WhatsApp Webhook] Background processing error:', err);
        }
    }
    /**
     * Processes delivery status updates with idempotency and updates messages & broadcasts
     */
    static async processStatusUpdate(statusObj) {
        const wamid = statusObj.id;
        const rawStatus = (statusObj.status || '').toLowerCase();
        if (!wamid || !rawStatus)
            return;
        const eventId = `status_${wamid}_${rawStatus}`;
        // 1. Idempotency Check
        const existingEvent = await db_1.prisma.whatsAppWebhookEvent.findUnique({
            where: { eventId }
        });
        if (existingEvent) {
            console.log(`[WhatsApp Webhook] Duplicate status event skipped: ${eventId}`);
            return;
        }
        // Save event for deduplication
        await db_1.prisma.whatsAppWebhookEvent.create({
            data: {
                eventId,
                eventType: 'status',
                payload: JSON.stringify(statusObj),
                processed: true,
                processedAt: new Date()
            }
        });
        const mappedStatus = rawStatus === 'delivered' ? 'DELIVERED' :
            rawStatus === 'read' ? 'READ' :
                rawStatus === 'failed' ? 'FAILED' : 'SENT';
        const timestamp = statusObj.timestamp
            ? new Date(parseInt(statusObj.timestamp) * 1000)
            : new Date();
        const updateFields = { status: mappedStatus };
        if (mappedStatus === 'DELIVERED')
            updateFields.deliveredAt = timestamp;
        if (mappedStatus === 'READ')
            updateFields.readAt = timestamp;
        if (mappedStatus === 'FAILED') {
            updateFields.failedAt = timestamp;
            updateFields.errorMessage = JSON.stringify(statusObj.errors || 'Delivery failed');
        }
        // 2. Update WhatsAppMessage if exists
        try {
            const message = await db_1.prisma.whatsAppMessage.findFirst({
                where: { whatsappMessageId: wamid }
            });
            if (message) {
                await db_1.prisma.whatsAppMessage.update({
                    where: { id: message.id },
                    data: updateFields
                });
                (0, socketService_1.emitMessageStatus)({
                    whatsappMessageId: wamid,
                    status: mappedStatus,
                    timestamp,
                    errors: statusObj.errors
                });
            }
        }
        catch (e) {
            console.error('[WhatsApp Webhook] Error updating WhatsAppMessage:', e.message);
        }
        // 3. Update WhatsAppBroadcastRecipient if part of a broadcast
        try {
            const recipient = await db_1.prisma.whatsAppBroadcastRecipient.findFirst({
                where: { whatsappMessageId: wamid }
            });
            if (recipient) {
                await db_1.prisma.whatsAppBroadcastRecipient.update({
                    where: { id: recipient.id },
                    data: updateFields
                });
                // Recalculate parent broadcast counts
                const broadcast = await db_1.prisma.whatsAppBroadcast.findUnique({
                    where: { id: recipient.broadcastId },
                    include: { recipients: true }
                });
                if (broadcast) {
                    const sent = broadcast.recipients.filter((r) => ['SENT', 'DELIVERED', 'READ'].includes(r.status)).length;
                    const delivered = broadcast.recipients.filter((r) => ['DELIVERED', 'READ'].includes(r.status)).length;
                    const read = broadcast.recipients.filter((r) => r.status === 'READ').length;
                    const failed = broadcast.recipients.filter((r) => r.status === 'FAILED').length;
                    await db_1.prisma.whatsAppBroadcast.update({
                        where: { id: broadcast.id },
                        data: { sent, delivered, read, failed }
                    });
                    (0, socketService_1.emitBroadcastUpdate)({
                        broadcastId: broadcast.id,
                        sent,
                        delivered,
                        read,
                        failed,
                        status: failed + read + delivered >= broadcast.totalRecipients ? 'COMPLETED' : 'IN_PROGRESS'
                    });
                }
            }
        }
        catch (e) {
            console.error('[WhatsApp Webhook] Error updating WhatsAppBroadcastRecipient:', e.message);
        }
    }
    /**
     * Processes incoming messages, matches customer, updates conversation, and creates message
     */
    static async processIncomingMessage(messageObj, contacts = []) {
        const wamid = messageObj.id;
        const rawFrom = messageObj.from;
        if (!wamid || !rawFrom)
            return;
        const eventId = `msg_${wamid}`;
        // 1. Idempotency Check
        const existingEvent = await db_1.prisma.whatsAppWebhookEvent.findUnique({
            where: { eventId }
        });
        if (existingEvent) {
            console.log(`[WhatsApp Webhook] Duplicate message event skipped: ${eventId}`);
            return;
        }
        // Save event for deduplication
        await db_1.prisma.whatsAppWebhookEvent.create({
            data: {
                eventId,
                eventType: 'message',
                payload: JSON.stringify(messageObj),
                processed: true,
                processedAt: new Date()
            }
        });
        const normalizedPhone = whatsappService_1.WhatsAppService.normalizePhoneNumber(rawFrom);
        const last10 = normalizedPhone.slice(-10);
        // Profile name from WhatsApp contacts array
        const contactProfile = contacts.find((c) => c.wa_id === rawFrom || c.wa_id === normalizedPhone);
        const profileName = contactProfile?.profile?.name || '';
        // Extract message content
        const msgType = (messageObj.type || 'text').toLowerCase();
        let messageText = '';
        let mediaUrl = null;
        let mediaType = null;
        if (msgType === 'text') {
            messageText = messageObj.text?.body || '';
        }
        else if (['image', 'document', 'video', 'audio'].includes(msgType)) {
            mediaType = msgType;
            messageText = messageObj[msgType]?.caption || messageObj[msgType]?.filename || `[${msgType.toUpperCase()}]`;
            mediaUrl = messageObj[msgType]?.link || null;
        }
        else if (msgType === 'location') {
            const loc = messageObj.location;
            messageText = `Location: ${loc?.name || 'Shared Location'} (${loc?.latitude}, ${loc?.longitude})`;
        }
        else if (msgType === 'button') {
            messageText = messageObj.button?.text || 'Button Click';
        }
        else if (msgType === 'interactive') {
            messageText = messageObj.interactive?.button_reply?.title || messageObj.interactive?.list_reply?.title || 'Interactive Response';
        }
        else {
            messageText = `[${msgType}]`;
        }
        const timestamp = messageObj.timestamp
            ? new Date(parseInt(messageObj.timestamp) * 1000)
            : new Date();
        // 2. Customer Matching: Student -> Lead -> Unknown
        let customerType = 'UNKNOWN';
        let leadId = null;
        let studentId = null;
        let contactName = profileName || `+${normalizedPhone}`;
        // A. Check Student
        const student = await db_1.prisma.student.findFirst({
            where: {
                OR: [
                    { phone: { contains: last10 } },
                    { whatsappNumber: { contains: last10 } },
                    { emergencyContactPhone: { contains: last10 } }
                ]
            }
        });
        if (student) {
            customerType = 'STUDENT';
            studentId = student.id;
            contactName = student.fullName || profileName || contactName;
        }
        else {
            // B. Check Lead
            const lead = await db_1.prisma.lead.findFirst({
                where: {
                    OR: [
                        { phone: { contains: last10 } },
                        { whatsappNumber: { contains: last10 } }
                    ]
                }
            });
            if (lead) {
                customerType = 'LEAD';
                leadId = lead.id;
                contactName = lead.fullName || profileName || contactName;
            }
        }
        // 3. Find or Create WhatsAppConversation
        let conversation = await db_1.prisma.whatsAppConversation.findFirst({
            where: {
                OR: [
                    { phoneNumber: normalizedPhone },
                    ...(leadId ? [{ leadId }] : []),
                    ...(studentId ? [{ studentId }] : [])
                ]
            }
        });
        if (!conversation) {
            conversation = await db_1.prisma.whatsAppConversation.create({
                data: {
                    phoneNumber: normalizedPhone,
                    contactName,
                    customerType,
                    leadId,
                    studentId,
                    status: 'OPEN',
                    unreadCount: 1,
                    lastMessagePreview: messageText.slice(0, 150),
                    lastMessageAt: timestamp
                }
            });
        }
        else {
            const updateData = {
                unreadCount: { increment: 1 },
                status: 'OPEN',
                lastMessagePreview: messageText.slice(0, 150),
                lastMessageAt: timestamp
            };
            if (!conversation.leadId && leadId) {
                updateData.leadId = leadId;
                updateData.customerType = 'LEAD';
                updateData.contactName = contactName;
            }
            else if (!conversation.studentId && studentId) {
                updateData.studentId = studentId;
                updateData.customerType = 'STUDENT';
                updateData.contactName = contactName;
            }
            conversation = await db_1.prisma.whatsAppConversation.update({
                where: { id: conversation.id },
                data: updateData
            });
        }
        // 4. Create WhatsAppMessage
        const createdMessage = await db_1.prisma.whatsAppMessage.create({
            data: {
                conversationId: conversation.id,
                whatsappMessageId: wamid,
                direction: 'INCOMING',
                messageType: msgType,
                messageText,
                mediaUrl,
                mediaType,
                status: 'DELIVERED',
                sentAt: timestamp,
                deliveredAt: timestamp,
                senderName: contactName
            }
        });
        // 5. Append to LeadCommunication timeline if linked to Lead
        if (conversation.leadId) {
            try {
                await db_1.prisma.leadCommunication.create({
                    data: {
                        leadId: conversation.leadId,
                        communicationType: 'WhatsApp Message',
                        direction: 'Incoming',
                        speakingWithType: 'Client / Lead',
                        speakingWithName: contactName,
                        subject: 'WhatsApp Reply',
                        notes: messageText,
                        communicationDate: timestamp,
                        staffMember: 'WhatsApp Business API'
                    }
                });
                await db_1.prisma.lead.update({
                    where: { id: conversation.leadId },
                    data: { lastCommunicationAt: timestamp }
                });
            }
            catch (commErr) {
                console.warn('[WhatsApp Webhook] Note: LeadCommunication record skipped:', commErr.message);
            }
        }
        // 6. Emit real-time Socket.IO events
        (0, socketService_1.emitIncomingMessage)({
            conversationId: conversation.id,
            messageId: createdMessage.id,
            whatsappMessageId: wamid,
            customerId: conversation.leadId || conversation.studentId || null,
            contactName: conversation.contactName,
            customerType: conversation.customerType,
            phone: conversation.phoneNumber,
            message: messageText,
            messageType: msgType,
            mediaUrl,
            timestamp,
            unreadCount: conversation.unreadCount
        });
        (0, socketService_1.emitConversationUpdate)({
            conversationId: conversation.id,
            status: conversation.status,
            unreadCount: conversation.unreadCount,
            lastMessagePreview: conversation.lastMessagePreview || messageText,
            lastMessageAt: timestamp
        });
    }
}
exports.WhatsAppWebhookController = WhatsAppWebhookController;
