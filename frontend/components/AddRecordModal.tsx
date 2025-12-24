
import React, { useState, useEffect } from 'react';
import { XCircle } from 'lucide-react';
import { User, NewRecordData } from '../types';
import { getProfileImageUrl } from '../utils/images';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const YEARS = Array.from({ length: new Date().getFullYear() - 2020 + 3 }, (_, i) => (2020 + i).toString());

interface AddRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddRecord: (record: NewRecordData) => Promise<any>;
  tenants: User[];
}

export default function AddRecordModal({ isOpen, onClose, onAddRecord, tenants, record }: AddRecordModalProps & { record?: NewRecordData & { _id?: string } }) {
  const [newRecord, setNewRecord] = useState<NewRecordData>({
    tenantId: tenants[0]?._id || '',
    month: MONTHS[new Date().getMonth()],
    year: new Date().getFullYear().toString(),
    rent: tenants[0]?.rentAmount || 0,
    electricity: 0,
    parking: 0,
    paid: false,
    electricityUnits: 0,
    electricityRate: 0,
    municipalFee: 0,
    penalties: 0,
    dues: 0,
    advanceCredit: 0
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (record) {
      // Edit mode: populate with existing record data
      setNewRecord({
        tenantId: record.tenantId,
        month: record.month,
        year: record.year,
        rent: record.rent,
        electricity: record.electricity,
        electricityUnits: record.electricityUnits || 0,
        electricityRate: record.electricityRate || 0,
        municipalFee: record.municipalFee || 0,
        parking: record.parking,
        penalties: record.penalties || 0,
        dues: record.dues || 0,
        advanceCredit: record.advanceCredit || 0,
        paid: record.paid,
        _id: record._id // Keep track of ID for update
      });
    } else if (tenants.length > 0 && !newRecord.tenantId) {
      // Only default if not editing and no tenant selected yet
      const defaultTenant = tenants[0];
      setNewRecord(prev => ({
        ...prev,
        tenantId: defaultTenant._id,
        rent: defaultTenant.rentAmount || 0,
      }));
    }
  }, [tenants, record, isOpen]);

  const handleTenantChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tenantId = e.target.value;
    const selectedTenant = tenants.find(t => t._id === tenantId);
    setNewRecord({
      ...newRecord,
      tenantId,
      rent: selectedTenant?.rentAmount || 0,
      // If switching tenant, reset some fields? user preference. Let's keep manual entries but update base rent.
    });
  };

  const selectedTenantProfile = tenants.find(t => t._id === newRecord.tenantId);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    // Handle checkbox and select booleans
    let finalValue: any = value;
    if (type === 'checkbox') {
      finalValue = (e.target as HTMLInputElement).checked;
    } else if (name === 'paid') {
      finalValue = value === 'true';
    } else if (type === 'number') {
      finalValue = Number(value);
    }

    setNewRecord({
      ...newRecord,
      [name]: finalValue,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onAddRecord(newRecord);
    setLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in-0 zoom-in-95 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
          <h3 className="text-lg font-bold text-slate-800">{record ? 'Edit Monthly Record' : 'Add Monthly Record'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Close modal">
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {/* Tenant Selection & Profile */}
          <div className="flex gap-4 items-start">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="tenantId">Tenant</label>
              <select
                id="tenantId"
                name="tenantId"
                className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                value={newRecord.tenantId}
                onChange={handleTenantChange}
                disabled={!!record} // Disable tenant change in edit mode to avoid confusion or complexity
              >
                {tenants.map((t) => (
                  <option key={t._id} value={t._id}>{t.name} (Unit {t.unit})</option>
                ))}
              </select>
            </div>
            {/* Profile Picture Display */}
            <div className="flex flex-col items-center justify-center pt-6">
              {selectedTenantProfile?.profilePicture ? (
                <img
                  src={getProfileImageUrl(selectedTenantProfile.profilePicture)}
                  alt="Profile"
                  className="w-12 h-12 rounded-full object-cover border-2 border-slate-200"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center border-2 border-slate-300 text-slate-400 font-bold">
                  {selectedTenantProfile?.name?.[0] || '?'}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="status">Status</label>
              <select id="paid" name="paid" className="w-full p-2 border border-slate-200 rounded-lg text-sm" value={newRecord.paid.toString()} onChange={handleInputChange}>
                <option value="false">Pending</option>
                <option value="true">Paid</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="month">Month</label>
              <select id="month" name="month" className="w-full p-2 border border-slate-200 rounded-lg text-sm" value={newRecord.month} onChange={handleInputChange}>
                {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="year">Year</label>
              <select id="year" name="year" className="w-full p-2 border border-slate-200 rounded-lg text-sm" value={newRecord.year} onChange={handleInputChange}>
                {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1" htmlFor="rent">Rent</label>
                <input id="rent" name="rent" type="number" className="w-full p-2 border border-slate-200 rounded-lg text-sm" value={newRecord.rent} onChange={handleInputChange} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1" htmlFor="electricity">Elec. Cost</label>
                <input id="electricity" name="electricity" type="number" className="w-full p-2 border border-slate-200 rounded-lg text-sm" value={newRecord.electricity} onChange={handleInputChange} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1" htmlFor="parking">Parking</label>
                <input id="parking" name="parking" type="number" className="w-full p-2 border border-slate-200 rounded-lg text-sm" value={newRecord.parking} onChange={handleInputChange} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1" htmlFor="municipalFee">Muni. Fee</label>
                <input id="municipalFee" name="municipalFee" type="number" className="w-full p-2 border border-slate-200 rounded-lg text-sm" value={newRecord.municipalFee} onChange={handleInputChange} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1" htmlFor="penalties">Penalties</label>
                <input id="penalties" name="penalties" type="number" className="w-full p-2 border border-slate-200 rounded-lg text-sm" value={newRecord.penalties} onChange={handleInputChange} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1" htmlFor="dues">Dues</label>
                <input id="dues" name="dues" type="number" className="w-full p-2 border border-slate-200 rounded-lg text-sm" value={newRecord.dues} onChange={handleInputChange} />
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg mt-4 transition-colors disabled:bg-blue-400">
            {loading ? 'Saving...' : (record ? 'Update Record' : 'Save Record')}
          </button>
        </form>
      </div>
    </div>
  );
}
