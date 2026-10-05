import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import apiRouter from './routes/api';
import { publicRouter } from './routes/publicRoutes';
import { initSocket } from './services/socketService';

// Load environment variables from potential root or backend paths
const potentialEnvPaths = [
  path.join(process.cwd(), '.env'),
  path.join(process.cwd(), 'backend/.env'),
  path.join(__dirname, '../.env'),
  path.join(__dirname, '../../.env')
];
for (const envPath of potentialEnvPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Trust reverse proxy headers (cPanel / Nginx / Passenger / Cloudflare)
app.set('trust proxy', 1);

// Resolve helper for multiple potential file locations
const findExistingPath = (paths: string[]): string => {
  for (const p of paths) {
    if (fs.existsSync(p)) return p;
  }
  return paths[0];
};

// Ensure uploads directory exists
const uploadsDir = findExistingPath([
  path.join(__dirname, '../uploads'),
  path.join(process.cwd(), 'uploads'),
  path.join(process.cwd(), 'backend/uploads')
]);
const carUploadsDir = path.join(uploadsDir, 'cars');
if (!fs.existsSync(carUploadsDir)) {
  fs.mkdirSync(carUploadsDir, { recursive: true });
}

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static(uploadsDir));

app.use('/api', apiRouter);

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'DrivePro CRM & ERP Backend API',
    nodeEnv: process.env.NODE_ENV || 'production',
    timestamp: new Date()
  });
});

// Static assets for landing page and uploads
const publicDir = findExistingPath([
  path.join(__dirname, '../public'),
  path.join(process.cwd(), 'public'),
  path.join(process.cwd(), 'backend/public')
]);
if (fs.existsSync(publicDir)) {
  app.use('/assets', express.static(path.join(publicDir, 'assets')));
  app.use(express.static(publicDir));
}

// Serve the built CRM frontend under /admin
const frontendDistDir = findExistingPath([
  path.join(__dirname, '../../frontend/dist'),
  path.join(__dirname, '../frontend/dist'),
  path.join(process.cwd(), 'frontend/dist'),
  path.join(process.cwd(), 'dist/frontend')
]);

if (fs.existsSync(path.join(frontendDistDir, 'index.html'))) {
  app.use('/admin', express.static(frontendDistDir));
  app.get(/^\/admin(\/[^.]*)?$/, (req, res) => {
    res.sendFile(path.join(frontendDistDir, 'index.html'));
  });
}

// Public website routes (Landing page, Car Rentals, Courses, About, Blog, Contact, Enquiry)
app.use('/', publicRouter);

// Create HTTP server and attach Socket.IO for real-time WhatsApp & CRM events
const server = http.createServer(app);
initSocket(server);

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` DrivePro CRM & ERP Backend running in ${process.env.NODE_ENV || 'production'} mode on port ${PORT}`);
  console.log(` Public Website: http://localhost:${PORT}/`);
  console.log(` Admin Portal: http://localhost:${PORT}/admin/`);
  console.log(` Static Assets: ${publicDir}`);
  console.log(` Frontend Dist: ${frontendDistDir}`);
  console.log(`====================================================`);
});
