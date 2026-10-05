"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSocket = initSocket;
exports.getSocketIO = getSocketIO;
exports.emitIncomingMessage = emitIncomingMessage;
exports.emitMessageStatus = emitMessageStatus;
exports.emitConversationUpdate = emitConversationUpdate;
exports.emitBroadcastUpdate = emitBroadcastUpdate;
const socket_io_1 = require("socket.io");
let io = null;
function initSocket(server) {
    io = new socket_io_1.Server(server, {
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
function getSocketIO() {
    return io;
}
function emitIncomingMessage(payload) {
    if (io) {
        io.emit('whatsapp:incoming_message', payload);
        io.to(`conversation:${payload.conversationId}`).emit('whatsapp:conversation_message', payload);
    }
}
function emitMessageStatus(payload) {
    if (io) {
        io.emit('whatsapp:message_status', payload);
    }
}
function emitConversationUpdate(payload) {
    if (io) {
        io.emit('whatsapp:conversation_update', payload);
    }
}
function emitBroadcastUpdate(payload) {
    if (io) {
        io.emit('whatsapp:broadcast_update', payload);
    }
}
