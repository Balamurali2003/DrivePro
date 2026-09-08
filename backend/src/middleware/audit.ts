import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { prisma } from '../db';

export const logAudit = (action: string, moduleName: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const recordId = req.params.id || body?.data?.id || body?.id || null;
        const recordCode = body?.data?.code || body?.data?.leadCode || body?.data?.studentCode || body?.data?.invoiceNumber || null;
        
        prisma.auditLog.create({
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
