import React, { useState, useEffect } from 'react';
import { X, Bell, CheckCheck, AlertCircle, Calendar, ShieldAlert } from 'lucide-react';
import { api } from '../../services/api';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      api.getNotifications().then(res => setNotifications(res.data || [])).catch(console.error);
    }
  }, [isOpen]);

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end">
      <div className="bg-white w-full max-w-md h-full shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-200">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-brand-600" />
            <h3 className="font-extrabold text-sm text-slate-900">Notification Center</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkAllRead}
              className="text-[11px] font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all read
            </button>
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {notifications.map((n, i) => (
            <div
              key={n.id || i}
              className={`p-3.5 rounded-xl border text-xs transition-all ${
                n.isRead ? 'bg-slate-50/60 border-slate-200 opacity-75' : 'bg-white border-brand-200 shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  {n.severity === 'WARNING' ? (
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                  ) : n.severity === 'DANGER' ? (
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                  ) : (
                    <Calendar className="w-3.5 h-3.5 text-blue-500" />
                  )}
                  <span>{n.title}</span>
                </div>
                {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-brand-600" />}
              </div>
              <p className="text-slate-600 mt-1">{n.message}</p>
              <div className="mt-2 text-[10px] text-slate-400 font-mono flex items-center justify-between">
                <span>{n.type}</span>
                <span>Just now</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
