import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRouter from './routes/api';

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

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` DrivePro CRM & ERP Backend API Server running on port ${PORT}`);
  console.log(` Ready to serve all 48 modules & integrations`);
  console.log(`====================================================`);
});