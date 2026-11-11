import prisma from '../db/prisma';
import { config } from '../config';
import { AppError } from '../middleware/errorHandler';

export class CallService {
  /**
   * Initiate a call session between customer & vendor or vendor & admin
   */
  static async initiateCall(callerId: string, receiverId: string, subject?: string) {
    if (callerId === receiverId) {
      throw new AppError('Cannot call yourself.', 400);
    }

    const [caller, receiver] = await Promise.all([
      prisma.user.findUnique({ where: { id: callerId } }),
      prisma.user.findUnique({ where: { id: receiverId } })
    ]);

    if (!caller || !receiver) {
      throw new AppError('Participants not found.', 404);
    }

    const isConfigured = config.voice.provider === 'twilio' 
      ? !!(config.voice.twilioAccountSid && config.voice.twilioAuthToken)
      : true; // Mock provider is always available

    const sessionSid = `call_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

    const callSession = await prisma.callSession.create({
      data: {
        callerId,
        receiverId,
        subject: subject || 'KrishiConnect Agricultural Consultation',
        status: 'INITIATED',
        sessionSid,
      },
      include: {
        caller: { select: { id: true, fullName: true, phone: true } },
        receiver: { select: { id: true, fullName: true, phone: true } }
      }
    });

    return {
      callSession,
      provider: config.voice.provider,
      isConfigured,
      token: `token_${sessionSid}`,
      message: config.voice.provider === 'mock' 
        ? 'Voice session initiated via KrishiConnect Telephony Adapter (Development Sandbox).'
        : 'Connecting telephony carrier network.'
    };
  }

  static async updateCallStatus(sessionSid: string, status: any, durationSec = 0) {
    const call = await prisma.callSession.findFirst({
      where: { sessionSid }
    });

    if (!call) {
      throw new AppError('Call session not found.', 404);
    }

    return prisma.callSession.update({
      where: { id: call.id },
      data: {
        status,
        durationSec,
        endedAt: ['COMPLETED', 'FAILED', 'MISSED'].includes(status) ? new Date() : undefined,
      }
    });
  }

  static async getCallHistory(userId: string) {
    return prisma.callSession.findMany({
      where: {
        OR: [{ callerId: userId }, { receiverId: userId }]
      },
      include: {
        caller: { select: { id: true, fullName: true } },
        receiver: { select: { id: true, fullName: true } }
      },
      orderBy: { startedAt: 'desc' },
      take: 20
    });
  }
}

