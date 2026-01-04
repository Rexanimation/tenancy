
import { useState, useMemo, useEffect } from 'react';
import { Calendar, Car, Home, LogOut, Zap, CheckCircle, XCircle, Bell, Receipt, Camera, Edit2, Check, X } from 'lucide-react';
import { User, RecordType, Notification } from '../types';
import NotificationsPanel from './NotificationsPanel';
import PaymentPage from './PaymentPage';
import PaymentReceipt from './PaymentReceipt';
import ProfilePictureUpload from './ProfilePictureUpload';
import { formatINR } from '../utils/currency';
import { getProfileImageUrl } from '../utils/images';
import { userAPI } from '../utils/api';

interface RenterDashboardProps {
  user: User;
  records: RecordType[];
  onLogout: () => void;
  notifications: Notification[];
  onUpdateUser?: (user: User) => void;
  onRefreshRecords?: () => void;
}

export default function RenterDashboard({ user, records, onLogout, notifications, onUpdateUser, onRefreshRecords }: RenterDashboardProps) {
  const [isNotifPanelOpen, setIsNotifPanelOpen] = useState(false);
  const [paymentRecord, setPaymentRecord] = useState<RecordType | null>(null);
  const [receiptTransactionId, setReceiptTransactionId] = useState<string | null>(null);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);

  // Name edit state
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(user.name);
  const [isSavingName, setIsSavingName] = useState(false);

  const latestRecord = records[0];
  const totalDue = records
    .filter((r) => !r.paid)
    .reduce((acc, curr) => acc + curr.rent + curr.electricity + curr.parking + (curr.municipalFee || 0) + (curr.penalties || 0) + (curr.dues || 0), 0);

  const renterNotifications = useMemo(() => notifications.filter(n => n.userId === user._id), [notifications, user._id]);
  const unreadCount = useMemo(() => renterNotifications.filter(n => !n.read).length, [renterNotifications]);

  const handleProfilePhotoUpdate = (newPictureUrl: string) => {
    // If we have a refresh function, use it to get fresh user data from server
    if (onRefreshRecords) {
      onRefreshRecords();
    }

    // Optimistic update if needed, but refresh is better
    if (onUpdateUser) {
      onUpdateUser({ ...user, profilePicture: newPictureUrl });
    }
    setIsPhotoModalOpen(false);
  };

  const handleNameSave = async () => {
    if (!newName.trim() || newName === user.name) {
      setIsEditingName(false);
      setNewName(user.name);
      return;
    }

    setIsSavingName(true);
    try {
      const response = await userAPI.updateProfile(user._id, { name: newName });
      if (onUpdateUser) {
        onUpdateUser(response.user);
      }
      setIsEditingName(false);
    } catch (error) {
      console.error('Failed to update name:', error);
      alert('Failed to update name. Please try again.');
    } finally {
      setIsSavingName(false);
    }
  };

  // Auto-open upload modal if picture is missing (onboarding)
  useEffect(() => {
    if (!user.profilePicture) {
      setIsPhotoModalOpen(true);
    }
  }, [user.profilePicture]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            {/* Profile Picture or Upload Button */}
            <button onClick={() => setIsPhotoModalOpen(true)} className="relative group">


              {user.profilePicture ? (
                <img src={getProfileImageUrl(user.profilePicture)} alt={user.name} className="w-12 h-12 rounded-full object-cover border-2 border-indigo-200 group-hover:border-indigo-400 transition-colors" />
              ) : (
                <div className="bg-indigo-100 p-2 rounded-full group-hover:bg-indigo-200 transition-colors">
                  <Home className="text-indigo-600 w-6 h-6" />
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 bg-indigo-600 rounded-full p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-3 h-3" />
              </div>
            </button>
            <div>
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="border border-slate-300 rounded px-2 py-1 text-sm font-bold text-slate-800 focus:outline-none focus:border-indigo-500 w-40"
                    autoFocus
                  />
                  <button onClick={handleNameSave} disabled={isSavingName} className="p-1 text-green-600 hover:bg-green-50 rounded">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => { setIsEditingName(false); setNewName(user.name); }} className="p-1 text-red-600 hover:bg-red-50 rounded">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  Welcome, {user.name}
                  <button onClick={() => setIsEditingName(true)} className="text-slate-400 hover:text-indigo-600 transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                </h1>
              )}
              <p className="text-xs text-indigo-600 cursor-pointer hover:underline" onClick={() => setIsPhotoModalOpen(true)}>Update Photo</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <button onClick={() => setIsNotifPanelOpen(prev => !prev)} className="relative text-slate-500 hover:text-slate-800 transition-colors">
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white animate-pulse">{unreadCount}</span>}
              </button>
              <NotificationsPanel isOpen={isNotifPanelOpen} notifications={renterNotifications} onClose={() => setIsNotifPanelOpen(false)} />
            </div>
            <button onClick={onLogout} className="text-sm text-slate-500 hover:text-slate-800 flex items-center gap-2"><LogOut className="w-4 h-4" /> Sign Out</button>
          </div>
        </div>
      </header>

      {/* Profile Picture Upload Modal */}
      {isPhotoModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <ProfilePictureUpload
            currentPicture={user.profilePicture}
            onUploadSuccess={handleProfilePhotoUpdate}
            onClose={() => setIsPhotoModalOpen(false)}
          />
        </div>
      )}

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-indigo-600 rounded-xl p-6 text-white shadow-lg shadow-indigo-200 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <p className="text-indigo-200 text-sm font-medium mb-1">Total Outstanding Due</p>
                <h2 className="text-4xl font-bold">{formatINR(totalDue)}</h2>
              </div>

              {/* Global Dues/Advance Display */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-indigo-500">
                <div>
                  <p className="text-indigo-200 text-xs font-medium mb-1">Passbook Dues</p>
                  <p className="text-lg font-bold">{formatINR(user.dues || 0)}</p>
                </div>
                <div>
                  <p className="text-indigo-200 text-xs font-medium mb-1">Advance Credit</p>
                  <p className="text-lg font-bold text-green-300">{formatINR(user.advancePaid || 0)}</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                const unpaidRecord = records.find(r => !r.paid);
                if (unpaidRecord) setPaymentRecord(unpaidRecord);
              }}
              disabled={totalDue === 0}
              className="mt-6 bg-white text-indigo-600 px-4 py-2 rounded-lg text-sm font-bold w-full md:w-auto self-start hover:bg-indigo-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Pay Now
            </button>
          </div>

          {latestRecord && (
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
              <p className="text-slate-500 text-sm font-medium mb-3">Latest Bill ({latestRecord.month} {latestRecord.year})</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm"><span className="text-slate-600 flex items-center gap-2"><Home className="w-4 h-4" /> Rent</span><span className="font-semibold">{formatINR(latestRecord.rent)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-600 flex items-center gap-2"><Zap className="w-4 h-4" /> Electricity</span><span className="font-semibold">{formatINR(latestRecord.electricity)}</span></div>
                {(latestRecord.municipalFee || 0) > 0 && (
                  <div className="flex justify-between text-sm"><span className="text-slate-600 flex items-center gap-2">🏛️ Municipal Fee</span><span className="font-semibold">{formatINR(latestRecord.municipalFee || 0)}</span></div>
                )}
                <div className="flex justify-between text-sm"><span className="text-slate-600 flex items-center gap-2"><Car className="w-4 h-4" /> Parking</span><span className="font-semibold">{formatINR(latestRecord.parking)}</span></div>
                {(latestRecord.penalties || 0) > 0 && (
                  <div className="flex justify-between text-sm"><span className="text-red-600 flex items-center gap-2">⚠️ Penalties</span><span className="font-semibold text-red-600">{formatINR(latestRecord.penalties || 0)}</span></div>
                )}
                {(latestRecord.dues || 0) > 0 && (
                  <div className="flex justify-between text-sm"><span className="text-orange-600 flex items-center gap-2">₹ Dues</span><span className="font-semibold text-orange-600">{formatINR(latestRecord.dues || 0)}</span></div>
                )}
                <div className="border-t pt-3 mt-2 flex justify-between font-bold text-slate-800">
                  <span>Total</span>
                  <span>{formatINR(latestRecord.rent + latestRecord.electricity + latestRecord.parking + (latestRecord.municipalFee || 0) + (latestRecord.penalties || 0) + (latestRecord.dues || 0))}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div>
          <h3 className="text-lg font-bold text-slate-800 mb-4">Billing History</h3>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {records.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {records.map((record) => (
                  <div key={record._id} className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="bg-slate-100 p-3 rounded-lg text-slate-500"><Calendar className="w-5 h-5" /></div>
                      <div>
                        <p className="font-bold text-slate-800">{record.month} {record.year}</p>
                        <p className="text-xs text-slate-500">Due: {record.date}</p>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <div className="flex flex-col items-end">
                        {record.paid ? (
                          <>
                            <p className="font-bold text-green-600 text-lg">{formatINR(record.paidAmount || (record.rent + record.electricity + record.parking + (record.municipalFee || 0) + (record.penalties || 0) + (record.dues || 0)))}</p>
                            {(record.paidAmount !== undefined && record.paidAmount < (record.rent + record.electricity + record.parking + (record.municipalFee || 0) + (record.penalties || 0) + (record.dues || 0))) && (
                              <p className="text-xs text-slate-400">Bill: <span className="line-through">{formatINR(record.rent + record.electricity + record.parking + (record.municipalFee || 0) + (record.penalties || 0) + (record.dues || 0))}</span></p>
                            )}
                          </>
                        ) : (
                          <p className="font-bold text-slate-800 text-lg">{formatINR(record.rent + record.electricity + record.parking + (record.municipalFee || 0) + (record.penalties || 0) + (record.dues || 0))}</p>
                        )}
                      </div>
                      {record.paid ? (
                        <>
                          <span className="inline-flex items-center gap-1.5 text-green-600 bg-green-50 px-2.5 py-1 rounded-full text-xs font-medium border border-green-100"><CheckCircle className="w-3.5 h-3.5" /> Paid</span>
                          {record.transactionId && (
                            <button
                              onClick={() => setReceiptTransactionId(record.transactionId!)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="View Receipt"
                            >
                              <Receipt className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-red-600 bg-red-50 px-2.5 py-1 rounded-full text-xs font-medium border border-red-100"><XCircle className="w-3.5 h-3.5" /> Pending</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500">No records found.</div>
            )}
          </div>
        </div>
      </main>

      {/* Payment Modal */}
      {paymentRecord && (
        <PaymentPage
          record={paymentRecord}
          onClose={() => setPaymentRecord(null)}
          onPaymentComplete={() => {
            // Refresh data or show success message
            setPaymentRecord(null);
            window.location.reload();
          }}
        />
      )}

      {/* Receipt Modal */}
      {receiptTransactionId && (
        <PaymentReceipt
          transactionId={receiptTransactionId}
          onClose={() => setReceiptTransactionId(null)}
        />
      )}
    </div>
  );
}
