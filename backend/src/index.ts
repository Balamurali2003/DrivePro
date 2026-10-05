import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRouter from './routes/api';
import { publicRouter } from './routes/publicRoutes';
import { initSocket } from './services/socketService';

import path from 'path';
import fs from 'fs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads/cars');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api', apiRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'DrivePro CRM & ERP Backend API', timestamp: new Date() });
});

// Static assets for landing page and uploads
const publicDir = path.join(__dirname, '../public');
if (fs.existsSync(publicDir)) {
  app.use('/assets', express.static(path.join(publicDir, 'assets')));
  app.use(express.static(publicDir));
}

// Serve the built CRM frontend under /admin
const frontendDir = path.join(__dirname, '../../frontend/dist');
if (fs.existsSync(path.join(frontendDir, 'index.html'))) {
  app.use('/admin', express.static(frontendDir));
  app.get(/^\/admin(\/[^.]*)?$/, (req, res) => {
    res.sendFile(path.join(frontendDir, 'index.html'));
  });
}

// Public website routes (Landing page, Car Rentals, Courses, About, Blog, Contact, Enquiry)
app.use('/', publicRouter);

// Create HTTP server and attach Socket.IO for real-time WhatsApp & CRM events
const server = http.createServer(app);
initSocket(server);

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` DrivePro CRM & ERP Backend API Server running on port ${PORT}`);
  console.log(` Socket.IO initialized for real-time WhatsApp integration`);
  console.log(` Ready to serve all 48 modules & integrations`);
  console.log(`====================================================`);
});
