

import { X, CheckCircle, Home, Zap, Car, User as UserIcon, Calendar } from 'lucide-react';
import { RecordType } from '../types';

interface PaymentConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: RecordType | null;
}

export default function PaymentConfirmationModal({ isOpen, onClose, record }: PaymentConfirmationModalProps) {
  if (!isOpen || !record) return null;

  const total = record.rent + record.electricity + record.parking;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden animate-in fade-in-0 zoom-in-95">
        <div className="p-6 relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600" aria-label="Close modal">
            <X className="w-6 h-6" />
          </button>

          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Payment Confirmed</h2>
            <p className="text-slate-500">A receipt for the payment of ${total}.</p>
          </div>

          <div className="mt-6 border-t border-dashed pt-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 text-sm flex items-center gap-2"><UserIcon className="w-4 h-4" /> Tenant</span>
              <span className="font-semibold text-slate-800">{record.tenant.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 text-sm flex items-center gap-2"><Calendar className="w-4 h-4" /> Period</span>
              <span className="font-semibold text-slate-800">{record.month} {record.year}</span>
            </div>
          </div>

          <div className="mt-4 border-t border-dashed pt-4 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600 flex items-center gap-2"><Home className="w-4 h-4" /> Rent</span>
              <span className="font-mono text-slate-700">${record.rent.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600 flex items-center gap-2"><Zap className="w-4 h-4" /> Electricity</span>
              <span className="font-mono text-slate-700">${record.electricity.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600 flex items-center gap-2"><Car className="w-4 h-4" /> Parking</span>
              <span className="font-mono text-slate-700">${record.parking.toFixed(2)}</span>
            </div>
          </div>

          <div className="mt-4 border-t-2 border-slate-800 pt-4">
            <div className="flex justify-between items-center font-bold text-lg">
              <span className="text-slate-800">Total Paid</span>
              <span className="text-green-600">${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
        <div className="p-4 bg-slate-50">
          <button onClick={onClose} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition-colors">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
