"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAudit = void 0;
const db_1 = require("../db");
const logAudit = (action, moduleName) => {
    return async (req, res, next) => {
        const originalJson = res.json.bind(res);
        res.json = (body) => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                const recordId = req.params.id || body?.data?.id || body?.id || null;
                const recordCode = body?.data?.code || body?.data?.leadCode || body?.data?.studentCode || body?.data?.invoiceNumber || null;
                db_1.prisma.auditLog.create({
                    data: {
                        userId: req.user?.id || null,
                        userName: req.user?.name || 'System User',
                        userRole: req.user?.role || 'STAFF',
                        action,
                        module: moduleName,
                        recordId: recordId ? String(recordId) : null,
                        recordCode: recordCode ? String(recordCode) : null,
                        newValue: req.body ? JSON.stringify(req.body).slice(0, 1000) : null,
                        ipAddress: req.ip || '127.0.0.1',
                    }
                }).catch(err => console.error('Audit Log Error:', err));
            }
            return originalJson(body);
        };
        next();
    };
};
exports.logAudit = logAudit;
