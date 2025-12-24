
import { useState, useMemo, useEffect } from 'react';
import { Users, LayoutDashboard, Zap, Car, Home, LogOut, FileText, DollarSign, CheckCircle, XCircle, Bell, UserCheck, UserX, Settings, Trash2, Menu, X } from 'lucide-react';
import { User, RecordType, NewRecordData, Notification, PaymentSettings } from '../types';
import AddRecordModal from './AddRecordModal';
import PaymentConfirmationModal from './PaymentConfirmationModal';
import NotificationsPanel from './NotificationsPanel';
import AdminPaymentSettings from './AdminPaymentSettings';
import TenantBillingPage from './TenantBillingPage';
import { formatINR } from '../utils/currency';
import { paymentAPI } from '../utils/api';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const YEARS = Array.from({ length: new Date().getFullYear() - 2020 + 3 }, (_, i) => (2020 + i).toString());

interface AdminDashboardProps {
  user: User;
  tenants: User[];
  records: RecordType[];
  onAddRecord: (record: NewRecordData) => Promise<any>;
  onLogout: () => void;
  approveTenant: (tenantId: string) => Promise<void>;
  rejectTenant: (tenantId: string) => Promise<void>;
  deleteTenant: (tenantId: string) => Promise<void>;
  updateRecordStatus: (recordId: string, paid: boolean) => Promise<RecordType | null>;
  updateTenants: (tenants: User[]) => void;
  notifications: Notification[];
  refreshRecords: () => Promise<void>;
}

export default function AdminDashboard({ user, tenants, records, onAddRecord, onLogout, approveTenant, rejectTenant, deleteTenant, updateRecordStatus, updateTenants, notifications, refreshRecords }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isNotifPanelOpen, setIsNotifPanelOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<RecordType | null>(null);
  const [selectedTenant, setSelectedTenant] = useState<User | null>(null);

  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
  const [filterMonth, setFilterMonth] = useState('All');
  const [filterTenant, setFilterTenant] = useState('All');

  const [showRoleAlert, setShowRoleAlert] = useState(false);

  useEffect(() => {
    const loginIntent = localStorage.getItem('login_intent_role');
    if (loginIntent === 'tenants') {
      setShowRoleAlert(true);
      // Clear it so it doesn't show again on refresh
      localStorage.removeItem('login_intent_role');

      // Auto-dismiss after 5 seconds
      setTimeout(() => setShowRoleAlert(false), 5000);
    } else {
      // Clear it anyway
      localStorage.removeItem('login_intent_role');
    }
  }, []);

  // Separate revenue filters
  const [revenueYear, setRevenueYear] = useState(new Date().getFullYear().toString());
  const [revenueMonth, setRevenueMonth] = useState('All');

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchYear = r.year === filterYear;
      const matchMonth = filterMonth === 'All' || r.month === filterMonth;
      const matchTenant = filterTenant === 'All' || r.tenant?._id === filterTenant;
      // Only show records for active tenants
      const tenantExists = tenants.some(t => t._id === r.tenant?._id);
      return matchYear && matchMonth && matchTenant && tenantExists;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [records, filterYear, filterMonth, filterTenant]);

  // Revenue calculation based on separate revenue filters
  const revenueFilteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchYear = r.year === revenueYear;
      const matchMonth = revenueMonth === 'All' || r.month === revenueMonth;
      // Only count revenue from active tenants to avoid phantom numbers
      const tenantExists = tenants.some(t => t._id === r.tenant?._id);
      return matchYear && matchMonth && r.paid && tenantExists;
    });
  }, [records, revenueYear, revenueMonth]);

  const totalRevenue = revenueFilteredRecords.reduce((acc, curr) =>
    acc + curr.rent + curr.electricity + curr.parking + (curr.municipalFee || 0) + (curr.penalties || 0) + (curr.dues || 0), 0);
  const pendingCount = filteredRecords.filter((r) => !r.paid).length;

  const adminNotifications = useMemo(() => notifications.filter(n => n.userId === user._id), [notifications, user._id]);
  const unreadCount = useMemo(() => adminNotifications.filter(n => !n.read).length, [adminNotifications]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await paymentAPI.getSettings();
        setPaymentSettings(settings);
      } catch (error) {
        console.error('Error fetching payment settings:', error);
      }
    };
    fetchSettings();
  }, []);

  // Auto-refresh records every 30 seconds to catch tenant payments
  useEffect(() => {
    const interval = setInterval(() => {
      refreshRecords();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [refreshRecords]);

  const refreshSettings = async () => {
    try {
      const settings = await paymentAPI.getSettings();
      setPaymentSettings(settings);
    } catch (error) {
      console.error('Error refreshing payment settings:', error);
    }
  };

  const handleMarkAsPaid = async (record: RecordType) => {
    const updatedRecord = await updateRecordStatus(record._id, true);
    if (updatedRecord) {
      setSelectedRecord(updatedRecord);
      setIsConfirmModalOpen(true);
    }
  };

  const handleTenantClick = (tenant: User) => {
    if (tenant.status === 'approved') {
      setSelectedTenant(tenant);
    }
  };

  const handleUpdateTenant = (updatedTenant: User) => {
    const newTenants = tenants.map(t => t._id === updatedTenant._id ? updatedTenant : t);
    updateTenants(newTenants);
    setSelectedTenant(updatedTenant);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'records': return <RecordsTable filteredRecords={filteredRecords} onMarkAsPaid={handleMarkAsPaid} onTenantClick={handleTenantClick} tenants={tenants} />;
      case 'tenants': return <TenantsTable tenants={tenants} onApprove={approveTenant} onReject={rejectTenant} onDelete={deleteTenant} onTenantClick={handleTenantClick} />;
      case 'overview':
      default:
        return <RecordsTable filteredRecords={filteredRecords} onMarkAsPaid={handleMarkAsPaid} onTenantClick={handleTenantClick} tenants={tenants} />;
    }
  };

  // Show TenantBillingPage if a tenant is selected
  if (selectedTenant) {
    return (
      <TenantBillingPage
        tenant={selectedTenant}
        onBack={() => setSelectedTenant(null)}
        onAddRecord={onAddRecord}
        onUpdateTenant={handleUpdateTenant}
      />
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans relative">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="absolute inset-0 z-50 bg-slate-900 bg-opacity-95 md:hidden flex flex-col p-6">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold text-white flex items-center gap-2"><Home className="text-blue-500" /> AdminPortal</h2>
            <button onClick={() => setIsMobileMenuOpen(false)} className="text-white hover:text-blue-400">
              <X className="w-8 h-8" />
            </button>
          </div>
          <nav className="flex-1 space-y-4">
            {['overview', 'records', 'tenants'].map(tab => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl text-lg font-medium transition-colors ${activeTab === tab ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
              >
                {tab === 'overview' && <LayoutDashboard className="w-6 h-6" />}
                {tab === 'records' && <FileText className="w-6 h-6" />}
                {tab === 'tenants' && <Users className="w-6 h-6" />}
                <span className="capitalize">{tab}</span>
              </button>
            ))}
          </nav>
          <div className="pt-8 border-t border-slate-800">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xl">{user?.name?.[0] || 'A'}</div>
              <div>
                <p className="text-white font-medium text-lg">{user?.name || 'Admin'}</p>
                <p className="text-sm text-slate-500">{user?.email}</p>
              </div>
            </div>
            <button onClick={onLogout} className="w-full flex items-center justify-center gap-3 text-slate-300 hover:text-white bg-slate-800 py-4 rounded-xl text-lg font-medium transition-colors">
              <LogOut className="w-6 h-6" /> Sign Out
            </button>
          </div>
        </div>
      )}

      <aside className="w-64 bg-slate-900 text-slate-300 flex-shrink-0 hidden md:flex flex-col">
        <div className="p-6"><h2 className="text-xl font-bold text-white flex items-center gap-2"><Home className="text-blue-500" /> AdminPortal</h2></div>
        <nav className="flex-1 px-4 space-y-2">
          {['overview', 'records', 'tenants'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${activeTab === tab ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'}`}>
              {tab === 'overview' && <LayoutDashboard className="w-5 h-5" />}
              {tab === 'records' && <FileText className="w-5 h-5" />}
              {tab === 'tenants' && <Users className="w-5 h-5" />}
              <span className="capitalize">{tab}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg">{user?.name?.[0] || 'A'}</div>
            <div>
              <p className="text-sm text-white font-medium">{user?.name || 'Admin'}</p>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
          </div>
          <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 text-slate-400 hover:text-white text-sm bg-slate-800 py-2 rounded-lg"><LogOut className="w-4 h-4" /> Sign Out</button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 p-4 md:p-6 flex justify-between items-center sticky top-0 z-20 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden text-slate-600 hover:text-slate-900">
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl md:text-2xl font-bold text-slate-800 capitalize">{activeTab}</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              title="Payment Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
            <div className="relative">
              <button onClick={() => setIsNotifPanelOpen(prev => !prev)} className="relative text-slate-500 hover:text-slate-800 transition-colors">
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white animate-pulse">{unreadCount}</span>}
              </button>
              <NotificationsPanel isOpen={isNotifPanelOpen} notifications={adminNotifications} onClose={() => setIsNotifPanelOpen(false)} />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {showRoleAlert && (
            <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded shadow-md relative animate-bounce" role="alert">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold">Admin Access Detected</p>
                  <p>You are an admin user. We have switched you to the Admin Panel automatically.</p>
                </div>
                <button onClick={() => setShowRoleAlert(false)} className="text-blue-500 hover:text-blue-800">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Enhanced Revenue Card with Filters */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-slate-500 text-sm font-medium">Total Revenue</p>
                  <h3 className="text-3xl font-bold text-slate-800 mt-2">{formatINR(totalRevenue)}</h3>
                </div>
                <div className="p-3 bg-green-100 text-green-600 rounded-lg">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>
              <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                <select
                  value={revenueYear}
                  onChange={(e) => setRevenueYear(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-green-500 outline-none"
                >
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <select
                  value={revenueMonth}
                  onChange={(e) => setRevenueMonth(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-green-500 outline-none"
                >
                  <option value="All">All Months</option>
                  {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <StatCard title="Active Tenants" value={tenants.filter(t => t.status === 'approved').length} icon={Users} color="blue" />
            <StatCard title="Pending Payments" value={pendingCount} icon={XCircle} color="red" />
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center">
            <FilterSelect label="Year" value={filterYear} onChange={setFilterYear} options={YEARS.map(y => ({ value: y, label: y }))} />
            <FilterSelect label="Month" value={filterMonth} onChange={setFilterMonth} options={[{ value: 'All', label: 'All Months' }, ...MONTHS.map(m => ({ value: m, label: m }))]} />
            <FilterSelect label="Tenant" value={filterTenant} onChange={setFilterTenant} options={[{ value: 'All', label: 'All Tenants' }, ...tenants.filter(t => t.status === 'approved').map(t => ({ value: t._id, label: t.name }))]} />
          </div>
          {renderContent()}
        </main>
      </div>

      <AddRecordModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAddRecord={onAddRecord} tenants={tenants.filter(t => t.status === 'approved')} />
      <PaymentConfirmationModal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)} record={selectedRecord} />
      <AdminPaymentSettings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentSettings={paymentSettings}
        onUpdate={refreshSettings}
      />
    </div>
  );
}

const StatCard = ({ title, value, icon: Icon, color }: any) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200"><div className="flex justify-between items-start">
    <div><p className="text-slate-500 text-sm font-medium">{title}</p><h3 className={`text-3xl font-bold text-slate-800 mt-2 ${color === 'red' ? 'text-red-600' : ''}`}>{value}</h3></div>
    <div className={`p-3 bg-${color}-100 text-${color}-600 rounded-lg`}><Icon className="w-6 h-6" /></div>
  </div></div>
);

const FilterSelect = ({ label, value, onChange, options }: any) => (
  <div className="flex-1 w-full md:w-auto">
    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">{label}</label>
    <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
      {options.map((opt: any) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
    </select>
  </div>
);

const RecordsTable = ({ filteredRecords, onMarkAsPaid, onTenantClick, tenants }: { filteredRecords: RecordType[], onMarkAsPaid: (record: RecordType) => void, onTenantClick?: (tenant: User) => void, tenants?: User[] }) => (
  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
    <div className="overflow-x-auto"><table className="w-full text-sm text-left">
      <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200"><tr>
        <th className="px-6 py-4">Tenant</th><th className="px-6 py-4">Period</th><th className="px-6 py-4">Breakdown</th><th className="px-6 py-4">Total</th><th className="px-6 py-4 text-center">Status</th>
      </tr></thead>
      <tbody className="divide-y divide-slate-100">
        {filteredRecords.length > 0 ? filteredRecords.map((record) => {
          const fullTenant = tenants?.find(t => t._id === record.tenant?._id);
          return (
            <tr key={record._id} className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4">
                {fullTenant && fullTenant.status === 'approved' && onTenantClick ? (
                  <button onClick={() => onTenantClick(fullTenant)} className="text-left">
                    <div className="font-medium text-blue-600 hover:text-blue-800 hover:underline">{record.tenant?.name}</div>
                    <div className="text-xs text-slate-500">Unit {record.tenant?.unit}</div>
                  </button>
                ) : (
                  <div className="text-slate-400 italic">Unknown Tenant</div>
                )}
              </td>
              <td className="px-6 py-4"><span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-medium">{record.month} {record.year}</span></td>
              <td className="px-6 py-4">
                <div className="text-xs space-y-0.5">
                  <div className="flex items-center gap-1">Rent: {formatINR(record.rent)}</div>
                  <div className="flex items-center gap-1"><Zap className="w-3 h-3 text-yellow-500" />Elec: {formatINR(record.electricity)}</div>
                  {(record.municipalFee || 0) > 0 && <div className="flex items-center gap-1">🏛️ Muni: {formatINR(record.municipalFee || 0)}</div>}
                  <div className="flex items-center gap-1"><Car className="w-3 h-3 text-slate-400" />Park: {formatINR(record.parking)}</div>
                  {(record.penalties || 0) > 0 && <div className="flex items-center gap-1 text-red-600">⚠️ Pen: {formatINR(record.penalties || 0)}</div>}
                  {(record.dues || 0) > 0 && <div className="flex items-center gap-1 text-orange-600">₹ Dues: {formatINR(record.dues || 0)}</div>}
                </div>
              </td>
              <td className="px-6 py-4 font-bold text-slate-800">{formatINR(record.rent + record.electricity + record.parking + (record.municipalFee || 0) + (record.penalties || 0) + (record.dues || 0))}</td>
              <td className="px-6 py-4 text-center">
                {record.paid ? <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-medium border border-green-100"><CheckCircle className="w-3 h-3" /> Paid</span> :
                  <button onClick={() => onMarkAsPaid(record)} className="bg-blue-100 text-blue-700 hover:bg-blue-200 text-xs font-semibold px-3 py-1 rounded-full transition-colors">Mark as Paid</button>}
              </td>
            </tr>
          );
        }) : <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">No records found.</td></tr>}
      </tbody>
    </table></div>
  </div >
);

const TenantsTable = ({ tenants, onApprove, onReject, onDelete, onTenantClick }: { tenants: User[], onApprove: (id: string) => void, onReject: (id: string) => void, onDelete: (id: string) => void, onTenantClick: (tenant: User) => void }) => (
  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
    <div className="overflow-x-auto"><table className="w-full text-sm text-left">
      <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200"><tr>
        <th className="px-6 py-4">Name</th><th className="px-6 py-4">Contact</th><th className="px-6 py-4">Base Rent</th><th className="px-6 py-4 text-center">Status</th><th className="px-6 py-4 text-center">Actions</th>
      </tr></thead>
      <tbody className="divide-y divide-slate-100">
        {tenants.length > 0 ? tenants.map((tenant) => (
          <tr key={tenant._id} className="hover:bg-slate-50 transition-colors">
            <td className="px-6 py-4 font-medium text-slate-900">
              {tenant.status === 'approved' ? (
                <button onClick={() => onTenantClick(tenant)} className="text-blue-600 hover:text-blue-800 hover:underline font-medium">
                  {tenant.name}
                </button>
              ) : (
                // Allow clicking pending/rejected tenants to manage their billing/records too if needed?
                // For now, let's keep it consistent: click name -> billing page
                <button onClick={() => onTenantClick(tenant)} className="text-slate-900 hover:text-blue-600 hover:underline font-medium">
                  {tenant.name}
                </button>
              )}
            </td>
            <td className="px-6 py-4"><div className="text-slate-600">{tenant.email}</div><div className="text-xs text-slate-500">Unit {tenant.unit}</div></td>
            <td className="px-6 py-4 font-semibold text-slate-800">{formatINR(tenant.rentAmount || 0)}</td>
            <td className="px-6 py-4 text-center">
              {tenant.status === 'approved' && <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-medium border border-green-100"><CheckCircle className="w-3 h-3" /> Approved</span>}
              {tenant.status === 'pending' && <span className="inline-flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-1 rounded-full text-xs font-medium border border-amber-100"><XCircle className="w-3 h-3" /> Pending</span>}
              {tenant.status === 'rejected' && <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-full text-xs font-medium border border-red-100"><XCircle className="w-3 h-3" /> Rejected</span>}
            </td>
            <td className="px-6 py-4 text-center">
              <div className="flex items-center justify-center gap-2">
                {tenant.status === 'pending' && (
                  <>
                    <button onClick={() => onApprove(tenant._id)} className="bg-green-100 text-green-700 hover:bg-green-200 text-xs font-semibold px-3 py-1 rounded-full transition-colors flex items-center gap-1"><UserCheck className="w-3 h-3" />Approve</button>
                    <button onClick={() => onReject(tenant._id)} className="bg-red-100 text-red-700 hover:bg-red-200 text-xs font-semibold px-3 py-1 rounded-full transition-colors flex items-center gap-1"><UserX className="w-3 h-3" />Reject</button>
                  </>
                )}
                {(tenant.status === 'approved' || tenant.status === 'rejected') && (
                  <button
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to delete ${tenant.name}? This will also delete all their billing records. This action cannot be undone.`)) {
                        onDelete(tenant._id);
                      }
                    }}
                    className="bg-red-100 text-red-700 hover:bg-red-200 text-xs font-semibold px-3 py-1 rounded-full transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />Delete
                  </button>
                )}
              </div>
            </td>
          </tr>
        )) : <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">No tenants found.</td></tr>}
      </tbody>
    </table></div>
  </div>
);
