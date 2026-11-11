import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (token?: string): Socket => {
  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';

  if (!socket) {
    socket = io(socketUrl, {
      auth: { token: token || (typeof window !== 'undefined' ? localStorage.getItem('krishi_token') : '') },
      autoConnect: true,
      reconnectionAttempts: 5,
    });
  }

  return socket;
};

