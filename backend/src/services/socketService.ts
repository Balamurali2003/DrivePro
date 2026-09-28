import { Server as SocketIOServer } from 'socket.io';
import http from 'http';

let io: SocketIOServer | null = null;

export function initSocket(server: http.Server): SocketIOServer {
  io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']
    }
  });

  io.on('connection', (socket) => {
    // Client joins communication hub
    socket.on('join_conversation', (conversationId) => {
      socket.join(`conversation:${conversationId}`);
    });

    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
    });
  });

  return io;
}

export function getSocketIO(): SocketIOServer | null {
  return io;
}

export function emitIncomingMessage(payload: {
  conversationId: string;
  messageId: string;
  whatsappMessageId?: string;
  customerId?: string | null;
  contactName: string;
  customerType: string;
  phone: string;
  message: string;
  messageType: string;
  mediaUrl?: string | null;
  timestamp: Date;
  unreadCount: number;
}) {
  if (io) {
    io.emit('whatsapp:incoming_message', payload);
    io.to(`conversation:${payload.conversationId}`).emit('whatsapp:conversation_message', payload);
  }
}

export function emitMessageStatus(payload: {
  whatsappMessageId: string;
  status: string;
  timestamp?: Date;
  errors?: any;
}) {
  if (io) {
    io.emit('whatsapp:message_status', payload);
  }
}

export function emitConversationUpdate(payload: {
  conversationId: string;
  status: string;
  unreadCount: number;
  lastMessagePreview?: string;
  lastMessageAt?: Date;
}) {
  if (io) {
    io.emit('whatsapp:conversation_update', payload);
  }
}

export function emitBroadcastUpdate(payload: {
  broadcastId: string;
  sent: number;
  delivered: number;
  read: number;
  failed: number;
  status: string;
}) {
  if (io) {
    io.emit('whatsapp:broadcast_update', payload);
  }
}
