

import { Info, AlertTriangle, X } from 'lucide-react';
import { Notification } from '../types';

interface NotificationsPanelProps {
  isOpen: boolean;
  notifications: Notification[];
  onClose: () => void;
}

const iconMap = {
  info: <Info className="w-5 h-5 text-blue-500" />,
  warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
  success: <Info className="w-5 h-5 text-green-500" />,
};

export default function NotificationsPanel({ isOpen, notifications, onClose }: NotificationsPanelProps) {
  if (!isOpen) return null;

  return (
    <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-2xl border border-slate-200 z-30 animate-in fade-in-0 zoom-in-95">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center">
        <h4 className="font-bold text-slate-800">Notifications</h4>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Close notifications">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {notifications.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {notifications.map(notif => (
              <li key={notif.id} className="p-4 flex items-start gap-4 hover:bg-slate-50">
                <div className="flex-shrink-0 mt-1">{iconMap[notif.type]}</div>
                <div>
                  <p className="text-sm text-slate-700">{notif.message}</p>
                  <p className="text-xs text-slate-400 mt-1">{new Date(notif.createdAt).toLocaleString()}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-8 text-center text-slate-500 text-sm">
            You have no new notifications.
          </div>
        )}
      </div>
    </div>
  );
}
