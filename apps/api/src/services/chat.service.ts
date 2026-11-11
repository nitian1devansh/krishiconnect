import prisma from '../db/prisma';
import { AppError } from '../middleware/errorHandler';

export class ChatService {
  static async getOrCreateConversation(userId: string, recipientId: string, productId?: string) {
    if (userId === recipientId) {
      throw new AppError('Cannot start a conversation with yourself.', 400);
    }

    // Look for existing conversation with these two participants
    const existing = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId } } },
          { participants: { some: { userId: recipientId } } },
          ...(productId ? [{ productId }] : [])
        ]
      },
      include: {
        participants: {
          include: {
            user: { select: { id: true, fullName: true, avatarUrl: true, role: true } }
          }
        },
        product: { select: { id: true, title: true, slug: true, images: { take: 1 } } }
      }
    });

    if (existing) {
      return existing;
    }

    // Create new conversation
    return prisma.conversation.create({
      data: {
        productId,
        participants: {
          create: [
            { userId },
            { userId: recipientId }
          ]
        }
      },
      include: {
        participants: {
          include: {
            user: { select: { id: true, fullName: true, avatarUrl: true, role: true } }
          }
        },
        product: { select: { id: true, title: true, slug: true, images: { take: 1 } } }
      }
    });
  }

  static async getUserConversations(userId: string) {
    return prisma.conversation.findMany({
      where: {
        participants: { some: { userId } }
      },
      include: {
        participants: {
          include: {
            user: { select: { id: true, fullName: true, avatarUrl: true, role: true } }
          }
        },
        product: { select: { id: true, title: true, slug: true, images: { take: 1 } } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { updatedAt: 'desc' }
    });
  }

  static async getMessages(conversationId: string, userId: string, limit = 50) {
    // Check membership
    const membership = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: { conversationId, userId }
      }
    });

    if (!membership) {
      throw new AppError('Access denied: You are not a participant in this conversation.', 403);
    }

    const messages = await prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: {
          select: { id: true, fullName: true, avatarUrl: true }
        }
      },
      orderBy: { createdAt: 'asc' },
      take: limit
    });

    // Mark as read
    await prisma.conversationParticipant.update({
      where: { id: membership.id },
      data: { lastReadAt: new Date() }
    });

    return messages;
  }

  static async sendMessage(conversationId: string, senderId: string, content: string, attachmentUrl?: string) {
    const membership = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: { conversationId, userId: senderId }
      }
    });

    if (!membership) {
      throw new AppError('Access denied: You are not a participant in this conversation.', 403);
    }

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId,
        content,
        attachmentUrl,
      },
      include: {
        sender: {
          select: { id: true, fullName: true, avatarUrl: true }
        }
      }
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    });

    return message;
  }
}

