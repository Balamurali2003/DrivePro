# Hostinger Deployment Guide — DrivePro CRM & Sri Munis Kanna Driving School

This guide explains step-by-step how to deploy this project to **Hostinger** (hPanel Node.js Web Hosting or Hostinger VPS).

---

## 📋 Architecture Overview

- **Public Website & SSR Engine**: Node.js + Express (`/`, `/about`, `/courses`, `/car-rentals`, `/gallery`, `/why-us`, `/blog`, `/contact`, `/book-demo`, `/faq`)
- **Admin CRM & ERP Dashboard**: React 18 + Vite SPA served under `/admin`
- **REST API**: Express JSON endpoints under `/api/*`
- **Real-Time WebSockets**: Socket.IO for live chat & updates
- **Database**: MySQL (managed via Hostinger phpMyAdmin & Prisma ORM)
- **Startup Entrypoint**: `server.js` or `backend/dist/index.js`

---

## 🚀 Option 1: Hostinger Cloud / Web Hosting (Node.js Application Manager)

### Step 1: Create the MySQL Database in Hostinger hPanel
1. Log in to **Hostinger hPanel** &rarr; **Databases** &rarr; **Management**.
2. Click **Create a New MySQL Database and Database User**:
   - **Database Name**: e.g., `u123456789_srimuniskanna`
   - **Database Username**: e.g., `u123456789_drivepro`
   - **Password**: Create a strong password (e.g., `StrongPass#2026!`)
3. Note the connection details:
   - Host: `127.0.0.1` (or `localhost`)
   - Port: `3306`

---

### Step 2: Import Initial Database Schema & Data
1. In hPanel, open **phpMyAdmin** next to your newly created database.
2. Click **Import** tab.
3. Select `smk_cpanel_import.sql` (or `database/schema.sql`) from the project directory.
4. Click **Import / Go**.

---

### Step 3: Set Up the Node.js Application in hPanel
1. Go to **hPanel** &rarr; **Websites** &rarr; **Manage** &rarr; **Node.js**.
2. Click **Create Application** (or **Setup Node.js App**):
   - **Node.js Version**: Select `20.x` or `18.x` LTS.
   - **Application Mode**: `Production`
   - **Application Root**: `/public_html` (or your subdomain folder)
   - **Application Startup File**: `server.js`
3. Click **Create**.

---

### Step 4: Upload Project Files & Build
1. Upload the project files to your application directory (via **File Manager** or **Git / SSH**).
   - Ensure the following structure is present:
     ```
     ├── backend/
     │   ├── dist/
     │   ├── public/
     │   ├── prisma/
     │   └── package.json
     ├── frontend/
     │   ├── dist/
     │   └── package.json
     ├── server.js
     ├── package.json
     └── .env
     ```
2. Create `.env` in the root directory (or in `backend/.env`):
   ```env
   NODE_ENV=production
   PORT=5000
   DATABASE_URL="mysql://u123456789_drivepro:StrongPass#2026!@127.0.0.1:3306/u123456789_srimuniskanna"
   JWT_SECRET="c0e81b6728e75fa9a0e6b6d21469e3a6e921d7"
   SITE_URL="https://nellaimuniskanna.com"
   ```
3. Open SSH terminal (or hPanel Terminal) and run:
   ```bash
   npm install --production=false
   npm run build
   ```
4. Restart the Node.js application from the hPanel interface.

---

## 🖥️ Option 2: Hostinger VPS (Ubuntu 22.04 / 24.04)

If deploying to a Hostinger KVM VPS:

### 1. Install Node.js, PM2 & MySQL
```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs nginx git mysql-server
sudo npm install -g pm2
```

### 2. Clone Repository & Build
```bash
git clone https://github.com/Balamurali2003/DrivePro.git /var/www/drivepro
cd /var/www/drivepro
git checkout feature/landing-car-rentals-admin

npm install
npm run build
```

### 3. Start with PM2
```bash
pm2 start server.js --name "drivepro-crm"
pm2 save
pm2 startup
```

### 4. Configure Nginx Reverse Proxy
```nginx
server {
    server_name nellaimuniskanna.com www.nellaimuniskanna.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
Install SSL via Certbot:
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d nellaimuniskanna.com -d www.nellaimuniskanna.com
```

---

## 🔐 Default Admin Credentials

- **URL**: `https://your-domain.com/admin/login` or click **Admin Portal** on landing page
- **Username**: `admin`
- **Password**: `@dmin#123`

---

## ✅ Deployment Verification Checklist

- [ ] Public landing page loads at `/`
- [ ] Admin Portal modal opens and authenticates with `admin` / `@dmin#123`
- [ ] React SPA loads at `/admin/` and `/admin/dashboard`
- [ ] Car Rentals module loads at `/car-rentals`
- [ ] Database queries respond at `/api/health`
