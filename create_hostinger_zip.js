const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = __dirname;
const stagingDir = path.join(rootDir, '_hostinger_staging');
const zipFile1 = path.join(rootDir, 'nellaimuniskanna.com.zip');
const zipFile2 = path.join(rootDir, 'drivepro_hostinger_live.zip');

console.log('🚀 Preparing Hostinger Live Deployment Bundle...');

// 1. Clean previous staging
if (fs.existsSync(stagingDir)) {
  fs.rmSync(stagingDir, { recursive: true, force: true });
}
fs.mkdirSync(stagingDir, { recursive: true });

// Helper to copy files/directories
function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const child of fs.readdirSync(src)) {
      copyRecursive(path.join(src, child), path.join(dest, child));
    }
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

// 2. Root files
const rootFiles = [
  'server.js',
  'package.json',
  'package-lock.json',
  '.env.example',
  'HOSTINGER_DEPLOYMENT_GUIDE.md',
  'README.md'
];

for (const file of rootFiles) {
  const p = path.join(rootDir, file);
  if (fs.existsSync(p)) {
    fs.copyFileSync(p, path.join(stagingDir, file));
    console.log(`  + Root file: ${file}`);
  }
}

// Include configured production .env
if (fs.existsSync(path.join(rootDir, '.env.production'))) {
  fs.copyFileSync(path.join(rootDir, '.env.production'), path.join(stagingDir, '.env'));
  console.log(`  + Configured live .env included`);
}

// 3. Database files
console.log('  + Copying database schemas...');
copyRecursive(path.join(rootDir, 'database'), path.join(stagingDir, 'database'));

// 4. Backend files
console.log('  + Copying backend compiled dist, public assets, uploads & prisma...');
const backendTarget = path.join(stagingDir, 'backend');
copyRecursive(path.join(rootDir, 'backend/dist'), path.join(backendTarget, 'dist'));
copyRecursive(path.join(rootDir, 'backend/public'), path.join(backendTarget, 'public'));
copyRecursive(path.join(rootDir, 'backend/uploads'), path.join(backendTarget, 'uploads'));
copyRecursive(path.join(rootDir, 'backend/src'), path.join(backendTarget, 'src'));

// Prisma
const prismaTarget = path.join(backendTarget, 'prisma');
fs.mkdirSync(prismaTarget, { recursive: true });
fs.copyFileSync(path.join(rootDir, 'backend/prisma/schema.prisma'), path.join(prismaTarget, 'schema.prisma'));
if (fs.existsSync(path.join(rootDir, 'backend/prisma/seed.ts'))) {
  fs.copyFileSync(path.join(rootDir, 'backend/prisma/seed.ts'), path.join(prismaTarget, 'seed.ts'));
}

// Backend package & tsconfig
fs.copyFileSync(path.join(rootDir, 'backend/package.json'), path.join(backendTarget, 'package.json'));
if (fs.existsSync(path.join(rootDir, 'backend/tsconfig.json'))) {
  fs.copyFileSync(path.join(rootDir, 'backend/tsconfig.json'), path.join(backendTarget, 'tsconfig.json'));
}

// 5. Frontend files
console.log('  + Copying frontend compiled dist & configs...');
const frontendTarget = path.join(stagingDir, 'frontend');
copyRecursive(path.join(rootDir, 'frontend/dist'), path.join(frontendTarget, 'dist'));
copyRecursive(path.join(rootDir, 'frontend/src'), path.join(frontendTarget, 'src'));
copyRecursive(path.join(rootDir, 'frontend/public'), path.join(frontendTarget, 'public'));
fs.copyFileSync(path.join(rootDir, 'frontend/package.json'), path.join(frontendTarget, 'package.json'));
fs.copyFileSync(path.join(rootDir, 'frontend/index.html'), path.join(frontendTarget, 'index.html'));
fs.copyFileSync(path.join(rootDir, 'frontend/vite.config.ts'), path.join(frontendTarget, 'vite.config.ts'));
if (fs.existsSync(path.join(rootDir, 'frontend/tsconfig.json'))) {
  fs.copyFileSync(path.join(rootDir, 'frontend/tsconfig.json'), path.join(frontendTarget, 'tsconfig.json'));
}
if (fs.existsSync(path.join(rootDir, 'frontend/tailwind.config.js'))) {
  fs.copyFileSync(path.join(rootDir, 'frontend/tailwind.config.js'), path.join(frontendTarget, 'tailwind.config.js'));
}
if (fs.existsSync(path.join(rootDir, 'frontend/postcss.config.js'))) {
  fs.copyFileSync(path.join(rootDir, 'frontend/postcss.config.js'), path.join(frontendTarget, 'postcss.config.js'));
}

// 6. Backup existing zip if any
if (fs.existsSync(zipFile1)) {
  const bakFile = path.join(rootDir, 'nellaimuniskanna.com.zip.bak');
  if (!fs.existsSync(bakFile)) {
    fs.copyFileSync(zipFile1, bakFile);
    console.log(`  * Backed up old zip to nellaimuniskanna.com.zip.bak`);
  }
}

// 7. Compress staging directory into zip
console.log('📦 Compressing into production zip archive...');
// Use Windows built-in tar or PowerShell Compress-Archive
try {
  // tar -a -cf nellaimuniskanna.com.zip * from inside staging directory
  execSync(`tar -a -cf "${zipFile1}" *`, { cwd: stagingDir, stdio: 'inherit' });
  console.log(`✅ Created: ${zipFile1}`);

  // Also create drivepro_hostinger_live.zip for convenience
  fs.copyFileSync(zipFile1, zipFile2);
  console.log(`✅ Created: ${zipFile2}`);
} catch (err) {
  console.error('Tar compression failed, trying PowerShell Compress-Archive...', err);
  execSync(`powershell -Command "Compress-Archive -Path '${stagingDir}\\*' -DestinationPath '${zipFile1}' -Force"`, { stdio: 'inherit' });
  fs.copyFileSync(zipFile1, zipFile2);
}

// 8. Clean up staging directory
fs.rmSync(stagingDir, { recursive: true, force: true });

// 9. Verify size
const stat1 = fs.statSync(zipFile1);
console.log(`🎉 SUCCESS! Deployment zip ready: ${(stat1.size / (1024 * 1024)).toFixed(2)} MB`);
