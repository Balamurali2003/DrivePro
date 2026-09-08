import React, { useState, useEffect } from 'react';
import { History, Shield, Search } from 'lucide-react';
import { api } from '../services/api';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([
    { id: '1', action: 'CREATE', module: 'STUDENTS', userName: 'Vikramaditya Roy (Owner)', userRole: 'OWNER', recordCode: 'STU-1040', createdAt: new Date().toISOString() },
    { id: '2', action: 'SCHEDULE', module: 'LESSONS', userName: 'Pooja Hegde (Operations)', userRole: 'MANAGER', recordCode: 'LSN-1150', createdAt: new Date().toISOString() },
    { id: '3', action: 'CREATE', module: 'PAYMENTS', userName: 'Suresh Menon (Accountant)', userRole: 'ACCOUNTANT', recordCode: 'REC-1038', createdAt: new Date().toISOString() },
    { id: '4', action: 'CONVERT_TO_STUDENT', module: 'LEADS', userName: 'Rahul Sharma (Sales)', userRole: 'SALES_EXECUTIVE', recordCode: 'LEAD-1099', createdAt: new Date().toISOString() },
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <History className="w-6 h-6 text-brand-600" />
          Enterprise Audit Trail & Security Log
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">Immutable record of all modifications, scheduling changes, and payment entries</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Module</th>
                <th className="py-3 px-4">Record Identifier</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4 text-right">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80">
                  <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">{new Date(log.createdAt).toLocaleString()}</td>
                  <td className="py-3.5 px-4 font-bold text-brand-700">{log.action}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-700">{log.module}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{log.recordCode || '-'}</td>
                  <td className="py-3.5 px-4 font-medium text-slate-900">{log.userName}</td>
                  <td className="py-3.5 px-4 text-right font-bold text-slate-600">{log.userRole}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
