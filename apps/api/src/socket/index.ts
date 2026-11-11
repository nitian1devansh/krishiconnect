import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { ChatService } from '../services/chat.service';

export const setupSocketIO = (io: Server) => {
  // Authentication middleware for Socket.IO
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    if (!token) {
      return next(new Error('Authentication error: Token required'));
    }

    try {
      const decoded = jwt.verify(token, config.jwtSecret) as { userId: string };
      socket.data.userId = decoded.userId;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = socket.data.userId;
    console.log(`[Socket] User connected: ${userId} (${socket.id})`);

    // Join user's private notification and call channel
    socket.join(`user:${userId}`);

    // Join a conversation room
    socket.on('join_conversation', ({ conversationId }) => {
      socket.join(`conversation:${conversationId}`);
      console.log(`[Socket] User ${userId} joined room conversation:${conversationId}`);
    });

    socket.on('leave_conversation', ({ conversationId }) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // Handle incoming chat message
    socket.on('send_message', async ({ conversationId, content, attachmentUrl }, callback) => {
      try {
        const message = await ChatService.sendMessage(conversationId, userId, content, attachmentUrl);
        
        // Broadcast to everyone in conversation room
        io.to(`conversation:${conversationId}`).emit('new_message', message);

        if (callback) callback({ success: true, data: message });
      } catch (error: any) {
        if (callback) callback({ success: false, error: error.message });
      }
    });

    // Typing indicators
    socket.on('typing_start', ({ conversationId, userName }) => {
      socket.to(`conversation:${conversationId}`).emit('user_typing', { conversationId, userName });
    });

    socket.on('typing_stop', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('user_stopped_typing', { conversationId });
    });

    // Real-time call signaling
    socket.on('call_invite', ({ recipientId, sessionSid, callerName, subject }) => {
      io.to(`user:${recipientId}`).emit('incoming_call', {
        callerId: userId,
        callerName,
        sessionSid,
        subject,
      });
    });

    socket.on('call_answered', ({ callerId, sessionSid }) => {
      io.to(`user:${callerId}`).emit('call_accepted', { sessionSid });
    });

    socket.on('call_rejected', ({ callerId, sessionSid }) => {
      io.to(`user:${callerId}`).emit('call_declined', { sessionSid });
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] User disconnected: ${userId}`);
    });
  });
};

