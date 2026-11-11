import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';

// Route imports
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import catalogRoutes from './routes/catalog.routes';
import cartRoutes from './routes/cart.routes';
import orderRoutes from './routes/order.routes';
import paymentRoutes from './routes/payment.routes';
import vendorRoutes from './routes/vendor.routes';
import adminRoutes from './routes/admin.routes';
import chatRoutes from './routes/chat.routes';
import callRoutes from './routes/call.routes';
import quotationRoutes from './routes/quotation.routes';
import uploadRoutes from './routes/upload.routes';
import soilRoutes from './routes/soil.routes';

export const createApp = () => {
  const app = express();

  // Basic Security & Parsing
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  }));
  app.use(cors({
    origin: [config.corsOrigin, 'http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
  }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  if (config.nodeEnv !== 'test') {
    app.use(morgan('dev'));
  }

  // Static uploads directory
  const uploadsPath = path.resolve(process.cwd(), 'uploads');
  app.use('/uploads', express.static(uploadsPath));

  // Health check
  app.get('/api/v1/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'KrishiConnect Agricultural Marketplace API',
      version: '1.0.0',
    });
  });

  // API v1 Endpoints
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/users', userRoutes);
  app.use('/api/v1/catalog', catalogRoutes);
  app.use('/api/v1/cart', cartRoutes);
  app.use('/api/v1/orders', orderRoutes);
  app.use('/api/v1/payments', paymentRoutes);
  app.use('/api/v1/vendor', vendorRoutes);
  app.use('/api/v1/admin', adminRoutes);
  app.use('/api/v1/chat', chatRoutes);
  app.use('/api/v1/calls', callRoutes);
  app.use('/api/v1/quotations', quotationRoutes);
  app.use('/api/v1/upload', uploadRoutes);
  app.use('/api/v1/soil-tests', soilRoutes);

  // Centralized Error Handling
  app.use(errorHandler);

  return app;
};

