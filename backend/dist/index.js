"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const api_1 = __importDefault(require("./routes/api"));
const publicRoutes_1 = require("./routes/publicRoutes");
const socketService_1 = require("./services/socketService");
// Load environment variables from potential root or backend paths
const potentialEnvPaths = [
    path_1.default.join(process.cwd(), '.env'),
    path_1.default.join(process.cwd(), 'backend/.env'),
    path_1.default.join(__dirname, '../.env'),
    path_1.default.join(__dirname, '../../.env')
];
for (const envPath of potentialEnvPaths) {
    if (fs_1.default.existsSync(envPath)) {
        dotenv_1.default.config({ path: envPath });
    }
}
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Trust reverse proxy headers (cPanel / Nginx / Passenger / Cloudflare)
app.set('trust proxy', 1);
// Resolve helper for multiple potential file locations
const findExistingPath = (paths) => {
    for (const p of paths) {
        if (fs_1.default.existsSync(p))
            return p;
    }
    return paths[0];
};
// Ensure uploads directory exists
const uploadsDir = findExistingPath([
    path_1.default.join(__dirname, '../uploads'),
    path_1.default.join(process.cwd(), 'uploads'),
    path_1.default.join(process.cwd(), 'backend/uploads')
]);
const carUploadsDir = path_1.default.join(uploadsDir, 'cars');
if (!fs_1.default.existsSync(carUploadsDir)) {
    fs_1.default.mkdirSync(carUploadsDir, { recursive: true });
}
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express_1.default.static(uploadsDir));
app.use('/api', api_1.default);
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
    path_1.default.join(__dirname, '../public'),
    path_1.default.join(process.cwd(), 'public'),
    path_1.default.join(process.cwd(), 'backend/public')
]);
if (fs_1.default.existsSync(publicDir)) {
    app.use('/assets', express_1.default.static(path_1.default.join(publicDir, 'assets')));
    app.use(express_1.default.static(publicDir));
}
// Serve the built CRM frontend under /admin
const frontendDistDir = findExistingPath([
    path_1.default.join(__dirname, '../../frontend/dist'),
    path_1.default.join(__dirname, '../frontend/dist'),
    path_1.default.join(process.cwd(), 'frontend/dist'),
    path_1.default.join(process.cwd(), 'dist/frontend')
]);
if (fs_1.default.existsSync(path_1.default.join(frontendDistDir, 'index.html'))) {
    app.use('/admin', express_1.default.static(frontendDistDir));
    app.get(/^\/admin(\/[^.]*)?$/, (req, res) => {
        res.sendFile(path_1.default.join(frontendDistDir, 'index.html'));
    });
}
// Public website routes (Landing page, Car Rentals, Courses, About, Blog, Contact, Enquiry)
app.use('/', publicRoutes_1.publicRouter);
// Create HTTP server and attach Socket.IO for real-time WhatsApp & CRM events
const server = http_1.default.createServer(app);
(0, socketService_1.initSocket)(server);
server.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(` DrivePro CRM & ERP Backend running in ${process.env.NODE_ENV || 'production'} mode on port ${PORT}`);
    console.log(` Public Website: http://localhost:${PORT}/`);
    console.log(` Admin Portal: http://localhost:${PORT}/admin/`);
    console.log(` Static Assets: ${publicDir}`);
    console.log(` Frontend Dist: ${frontendDistDir}`);
    console.log(`====================================================`);
});
