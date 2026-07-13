import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import path from 'path';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import authRoutes from './routes/auth.js';
import studentRoutes from './routes/student.js';
import officerRoutes from './routes/officer.js';
import recruiterRoutes from './routes/recruiter.js';
import adminRoutes from './routes/admin.js';
import aiRoutes from './routes/ai.js';
import notificationRoutes from './routes/notification.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const isLocalhost = (origin: string | undefined): boolean => {
  if (!origin) return true;
  return /^https?:\/\/localhost(:\d+)?$/.test(origin) || origin === CLIENT_URL;
};

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (isLocalhost(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  },
});

// Attach Socket.io to request object if needed
app.use((req: any, res: Response, next: NextFunction) => {
  req.io = io;
  next();
});

// Middlewares
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (isLocalhost(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Rate Limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 10000, // Limit each IP to 100 requests per window
  message: { error: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', globalLimiter);

// Auth Routes
app.use('/api/auth', authRoutes);

// Student Routes
app.use('/api/student', studentRoutes);

// Officer Routes
app.use('/api/officer', officerRoutes);

// Recruiter Routes
app.use('/api/recruiter', recruiterRoutes);

// Admin Routes
app.use('/api/admin', adminRoutes);

// AI Routes
app.use('/api/ai', aiRoutes);

// Notification Routes
app.use('/api/notifications', notificationRoutes);

// Serve static uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Database Connection
connectDB();

// Socket.io connection logic (stub)
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('join_room', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined room ${userId}`);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Health check route
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// Centralized error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

// Start Server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});
