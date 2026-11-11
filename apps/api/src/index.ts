import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createApp } from './app';
import { config, validateEnv } from './config';
import { setupSocketIO } from './socket';

validateEnv();

const app = createApp();
const server = http.createServer(app);

// Attach Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: [config.corsOrigin, 'http://localhost:3000', 'http://127.0.0.1:3000'],
    methods: ['GET', 'POST'],
    credentials: true,
  }
});

setupSocketIO(io);

server.listen(config.port, () => {
  console.log(`=======================================================`);
  console.log(`🌾 KrishiConnect API running on port ${config.port}`);
  console.log(`🌍 Environment: ${config.nodeEnv}`);
  console.log(`💬 Socket.IO real-time engine ready`);
  console.log(`💳 Payment mode: ${config.payment.sandboxMode ? 'Sandbox Simulator' : 'Production Razorpay'}`);
  console.log(`📞 Voice provider: ${config.voice.provider}`);
  console.log(`=======================================================`);
});

