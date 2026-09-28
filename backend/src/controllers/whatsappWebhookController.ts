import { Request, Response } from 'express';
import { prisma } from '../db';
import { WhatsAppService } from '../services/whatsappService';
import {
  emitIncomingMessage,
  emitMessageStatus,
  emitConversationUpdate,
  emitBroadcastUpdate
} from '../services/socketService';

export class WhatsAppWebhookController {
  /**
   * GET /api/whatsapp/webhook
   * Meta Cloud API Webhook Verification Challenge
   */
  public static async verifyWebhook(req: Request, res: Response) {
    try {
      const mode = req.query['hub.mode'];
      const token = req.query['hub.verify_token'];
      const challenge = req.query['hub.challenge'];
      const configuredVerifyToken = (process.env.WHATSAPP_VERIFY_TOKEN || 'drivepro_crm_webhook_token').trim();

      if (mode && token) {
        if (mode === 'subscribe' && token === configuredVerifyToken) {
          console.log('[WhatsApp Webhook] Verification successful. Challenge echoed.');
          return res.status(200).send(challenge);
        } else {
          console.warn('[WhatsApp Webhook] Verification token mismatch. Expected:', configuredVerifyToken, 'Got:', token);
          return res.status(403).json({ error: 'Verification token mismatch' });
        }
      }
      return res.status(400).json({ error: 'Missing hub.mode or hub.verify_token' });
    } catch (err: any) {
      console.error('[WhatsApp Webhook] Error in verifyWebhook:', err);
      return res.status(500).json({ error: 'Internal server error during webhook verification' });
    }
  }

  /**
   * POST /api/whatsapp/webhook
   * Processes incoming Meta WhatsApp events (messages and statuses)
   * Implements strict idempotency via WhatsAppWebhookEvent table
   */
  public static async handleWebhook(req: Request, res: Response) {
    // Acknowledge Meta immediately with 200 OK
    res.status(200).json({ status: 'EVENT_RECEIVED' });

    try {
      const body = req.body;
      if (!body) return;

      // Check if entry changes exist
      const entries = Array.isArray(body.entry) ? body.entry : [{ changes: [{ value: body }] }];

      for (const entry of entries) {
        const changes = entry.changes || [];
        for (const change of changes) {
          const value = change.value || change;
          if (!value) continue;

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
    } catch (err: any) {
      console.error('[WhatsApp Webhook] Background processing error:', err);
    }
  }

  /**
   * Processes delivery status updates with idempotency and updates messages & broadcasts
   */
  private static async processStatusUpdate(statusObj: any) {
    const wamid = statusObj.id;
    const rawStatus = (statusObj.status || '').toLowerCase();
    if (!wamid || !rawStatus) return;

    const eventId = `status_${wamid}_${rawStatus}`;

    // 1. Idempotency Check
    const existingEvent = await prisma.whatsAppWebhookEvent.findUnique({
      where: { eventId }
    });
    if (existingEvent) {
      console.log(`[WhatsApp Webhook] Duplicate status event skipped: ${eventId}`);
      return;
    }

    // Save event for deduplication
    await prisma.whatsAppWebhookEvent.create({
      data: {
        eventId,
        eventType: 'status',
        payload: JSON.stringify(statusObj),
        processed: true,
        processedAt: new Date()
      }
    });

    const mappedStatus =
      rawStatus === 'delivered' ? 'DELIVERED' :
      rawStatus === 'read' ? 'READ' :
      rawStatus === 'failed' ? 'FAILED' : 'SENT';

    const timestamp = statusObj.timestamp
      ? new Date(parseInt(statusObj.timestamp) * 1000)
      : new Date();

    const updateFields: any = { status: mappedStatus };
    if (mappedStatus === 'DELIVERED') updateFields.deliveredAt = timestamp;
    if (mappedStatus === 'READ') updateFields.readAt = timestamp;
    if (mappedStatus === 'FAILED') {
      updateFields.failedAt = timestamp;
      updateFields.errorMessage = JSON.stringify(statusObj.errors || 'Delivery failed');
    }

    // 2. Update WhatsAppMessage if exists
    try {
      const message = await prisma.whatsAppMessage.findFirst({
        where: { whatsappMessageId: wamid }
      });

      if (message) {
        await prisma.whatsAppMessage.update({
          where: { id: message.id },
          data: updateFields
        });

        emitMessageStatus({
          whatsappMessageId: wamid,
          status: mappedStatus,
          timestamp,
          errors: statusObj.errors
        });
      }
    } catch (e: any) {
      console.error('[WhatsApp Webhook] Error updating WhatsAppMessage:', e.message);
    }

    // 3. Update WhatsAppBroadcastRecipient if part of a broadcast
    try {
      const recipient = await prisma.whatsAppBroadcastRecipient.findFirst({
        where: { whatsappMessageId: wamid }
      });

      if (recipient) {
        await prisma.whatsAppBroadcastRecipient.update({
          where: { id: recipient.id },
          data: updateFields
        });

        // Recalculate parent broadcast counts
        const broadcast = await prisma.whatsAppBroadcast.findUnique({
          where: { id: recipient.broadcastId },
          include: { recipients: true }
        });

        if (broadcast) {
          const sent = broadcast.recipients.filter((r: any) => ['SENT', 'DELIVERED', 'READ'].includes(r.status)).length;
          const delivered = broadcast.recipients.filter((r: any) => ['DELIVERED', 'READ'].includes(r.status)).length;
          const read = broadcast.recipients.filter((r: any) => r.status === 'READ').length;
          const failed = broadcast.recipients.filter((r: any) => r.status === 'FAILED').length;

          await prisma.whatsAppBroadcast.update({
            where: { id: broadcast.id },
            data: { sent, delivered, read, failed }
          });

          emitBroadcastUpdate({
            broadcastId: broadcast.id,
            sent,
            delivered,
            read,
            failed,
            status: failed + read + delivered >= broadcast.totalRecipients ? 'COMPLETED' : 'IN_PROGRESS'
          });
        }
      }
    } catch (e: any) {
      console.error('[WhatsApp Webhook] Error updating WhatsAppBroadcastRecipient:', e.message);
    }
  }

  /**
   * Processes incoming messages, matches customer, updates conversation, and creates message
   */
  private static async processIncomingMessage(messageObj: any, contacts: any[] = []) {
    const wamid = messageObj.id;
    const rawFrom = messageObj.from;
    if (!wamid || !rawFrom) return;

    const eventId = `msg_${wamid}`;

    // 1. Idempotency Check
    const existingEvent = await prisma.whatsAppWebhookEvent.findUnique({
      where: { eventId }
    });
    if (existingEvent) {
      console.log(`[WhatsApp Webhook] Duplicate message event skipped: ${eventId}`);
      return;
    }

    // Save event for deduplication
    await prisma.whatsAppWebhookEvent.create({
      data: {
        eventId,
        eventType: 'message',
        payload: JSON.stringify(messageObj),
        processed: true,
        processedAt: new Date()
      }
    });

    const normalizedPhone = WhatsAppService.normalizePhoneNumber(rawFrom);
    const last10 = normalizedPhone.slice(-10);

    // Profile name from WhatsApp contacts array
    const contactProfile = contacts.find((c: any) => c.wa_id === rawFrom || c.wa_id === normalizedPhone);
    const profileName = contactProfile?.profile?.name || '';

    // Extract message content
    const msgType = (messageObj.type || 'text').toLowerCase();
    let messageText = '';
    let mediaUrl: string | null = null;
    let mediaType: string | null = null;

    if (msgType === 'text') {
      messageText = messageObj.text?.body || '';
    } else if (['image', 'document', 'video', 'audio'].includes(msgType)) {
      mediaType = msgType;
      messageText = messageObj[msgType]?.caption || messageObj[msgType]?.filename || `[${msgType.toUpperCase()}]`;
      mediaUrl = messageObj[msgType]?.link || null;
    } else if (msgType === 'location') {
      const loc = messageObj.location;
      messageText = `Location: ${loc?.name || 'Shared Location'} (${loc?.latitude}, ${loc?.longitude})`;
    } else if (msgType === 'button') {
      messageText = messageObj.button?.text || 'Button Click';
    } else if (msgType === 'interactive') {
      messageText = messageObj.interactive?.button_reply?.title || messageObj.interactive?.list_reply?.title || 'Interactive Response';
    } else {
      messageText = `[${msgType}]`;
    }

    const timestamp = messageObj.timestamp
      ? new Date(parseInt(messageObj.timestamp) * 1000)
      : new Date();

    // 2. Customer Matching: Student -> Lead -> Unknown
    let customerType = 'UNKNOWN';
    let leadId: string | null = null;
    let studentId: string | null = null;
    let contactName = profileName || `+${normalizedPhone}`;

    // A. Check Student
    const student = await prisma.student.findFirst({
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
    } else {
      // B. Check Lead
      const lead = await prisma.lead.findFirst({
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
    let conversation = await prisma.whatsAppConversation.findFirst({
      where: {
        OR: [
          { phoneNumber: normalizedPhone },
          ...(leadId ? [{ leadId }] : []),
          ...(studentId ? [{ studentId }] : [])
        ]
      }
    });

    if (!conversation) {
      conversation = await prisma.whatsAppConversation.create({
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
    } else {
      const updateData: any = {
        unreadCount: { increment: 1 },
        status: 'OPEN',
        lastMessagePreview: messageText.slice(0, 150),
        lastMessageAt: timestamp
      };

      if (!conversation.leadId && leadId) {
        updateData.leadId = leadId;
        updateData.customerType = 'LEAD';
        updateData.contactName = contactName;
      } else if (!conversation.studentId && studentId) {
        updateData.studentId = studentId;
        updateData.customerType = 'STUDENT';
        updateData.contactName = contactName;
      }

      conversation = await prisma.whatsAppConversation.update({
        where: { id: conversation.id },
        data: updateData
      });
    }

    // 4. Create WhatsAppMessage
    const createdMessage = await prisma.whatsAppMessage.create({
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
        await prisma.leadCommunication.create({
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

        await prisma.lead.update({
          where: { id: conversation.leadId },
          data: { lastCommunicationAt: timestamp }
        });
      } catch (commErr: any) {
        console.warn('[WhatsApp Webhook] Note: LeadCommunication record skipped:', commErr.message);
      }
    }

    // 6. Emit real-time Socket.IO events
    emitIncomingMessage({
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

    emitConversationUpdate({
      conversationId: conversation.id,
      status: conversation.status,
      unreadCount: conversation.unreadCount,
      lastMessagePreview: conversation.lastMessagePreview || messageText,
      lastMessageAt: timestamp
    });
  }
}
