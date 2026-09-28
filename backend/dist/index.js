"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const api_1 = __importDefault(require("./routes/api"));
const socketService_1 = require("./services/socketService");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Ensure uploads directory exists
const uploadsDir = path_1.default.join(__dirname, '../uploads/cars');
if (!fs_1.default.existsSync(uploadsDir)) {
    fs_1.default.mkdirSync(uploadsDir, { recursive: true });
}
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
app.use('/api', api_1.default);
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'DrivePro CRM & ERP Backend API', timestamp: new Date() });
});
// Create HTTP server and attach Socket.IO for real-time WhatsApp & CRM events
const server = http_1.default.createServer(app);
(0, socketService_1.initSocket)(server);
server.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(` DrivePro CRM & ERP Backend API Server running on port ${PORT}`);
    console.log(` Socket.IO initialized for real-time WhatsApp integration`);
    console.log(` Ready to serve all 48 modules & integrations`);
    console.log(`====================================================`);
});
