import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
dotenv.config();
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { Server } from 'socket.io';
import cron from 'node-cron';
import { startSerialListener } from './services/serialService.js';
import authRoutes from './routes/authRoutes.js';
import deviceRoutes from './routes/deviceRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import supportRoutes from './routes/supportRoutes.js';
import reportRoutes from './routes/report.js';
import { initializeSchedules } from './controllers/report.js';
import iotRoutes from './routes/iotRoutes.js';
import { deviceAuth } from './middlewares/deviceAuth.js';
import { authMiddleware } from './middlewares/authMiddleware.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;


app.use(express.urlencoded({ extended: true }));

// app.use('/api/iot', iotRoutes);


app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(morgan('dev'));
app.use('/iot',deviceAuth, iotRoutes);

app.use('/auth', authRoutes);
app.use('/devices',authMiddleware , deviceRoutes);
app.use('/analytics',authMiddleware , analyticsRoutes);
app.use('/support',authMiddleware , supportRoutes);
app.use('/reports', express.static('reports'));
app.use('/report', authMiddleware, reportRoutes);


app.get('/', (req, res) => {
  res.json({ status: 'OK', message: 'IoT API running successfully' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const server = http.createServer(app);

const io = new Server(server, {
  path: '/socket.io',
  cors: {
    origin: 'https://www.nystai.in',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

io.on('connection', socket => {
  console.log('Socket connected:', socket.id);
});

global.io = io;


server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  // console.log('Initializing Serial Port...');
  // startSerialListener('COM3', 9600);
  console.log('Initializing scheduled reports...');
  initializeSchedules();
});