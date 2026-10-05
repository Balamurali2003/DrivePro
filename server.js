/**
 * DrivePro CRM & Sri Munis Kanna Driving School
 * Hostinger Production Startup File (server.js)
 */

const path = require('path');
const fs = require('fs');

// Attempt to load .env from root or backend directory
const envPaths = [
  path.join(__dirname, '.env'),
  path.join(__dirname, 'backend/.env')
];
for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
  }
}
require('dotenv').config();

// Require compiled backend index
const backendDist = path.join(__dirname, 'backend/dist/index.js');
if (fs.existsSync(backendDist)) {
  require(backendDist);
} else {
  console.error(`\n[CRITICAL ERROR] Compiled backend not found at: ${backendDist}`);
  console.error(`Please run: npm run build\n`);
  process.exit(1);
}
