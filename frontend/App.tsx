
import React from 'react';
import useTenancy from './hooks/useTenancy';
import LoginScreen from './components/LoginScreen';
import AdminDashboard from './components/AdminDashboard';
import RenterDashboard from './components/RenterDashboard';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Privacy from './components/Privacy';
import Terms from './components/Terms';
// Loading component defined above
const LoadingSpinner: React.FC = () => (
  <div className="min-h-screen bg-slate-100 flex items-center justify-center">
    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

function MainApp() {
  const {
    currentUser,
    tenants,
    records,
    googleSignIn,
    logout,
    addRecord,
    loading,
    error,
    message,
    approveTenant,
    rejectTenant,
    deleteTenant,
    updateRecordStatus,
    updateTenants,
    notifications,
    refreshRecords,
  } = useTenancy();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!currentUser) {
    return <LoginScreen onGoogleSignIn={googleSignIn} apiError={error} apiMessage={message} />;
  }

  if (currentUser.status === 'rejected') {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Account Rejected</h2>
          <p className="text-slate-600 mb-6">Your registration request has been rejected by the administrator. If you believe this is a mistake, please contact the admin.</p>
          <button onClick={logout} className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors">Sign Out</button>
        </div>
      </div>
    );
  }

  if (currentUser.status === 'pending') {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Account Pending Approval</h2>
          <p className="text-slate-600 mb-6">Your account is pending administrator approval. Please wait for an admin to approve your registration.</p>
          <button onClick={logout} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">Sign Out</button>
        </div>
      </div>
    );
  }

  if (currentUser.role === 'admin') {
    return (
      <AdminDashboard
        user={currentUser}
        tenants={tenants}
        records={records}
        onAddRecord={addRecord}
        onLogout={logout}
        approveTenant={approveTenant}
        rejectTenant={rejectTenant}
        deleteTenant={deleteTenant}
        updateRecordStatus={updateRecordStatus}
        updateTenants={updateTenants}
        notifications={notifications}
        refreshRecords={refreshRecords}
      />
    );
  }

  if (currentUser.role === 'renter') {
    const renterRecords = records.filter(r => r.tenant._id === currentUser._id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return (
      <RenterDashboard
        user={currentUser}
        records={renterRecords}
        onLogout={logout}
        notifications={notifications}
        onUpdateUser={(_updatedUser) => {
          // Force page reload to refresh user data after photo upload
          window.location.reload();
        }}
      />
    );
  }

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/" element={<MainApp />} />
        {/* Support legacy/callback routes if any, or fallback to MainApp handled by logic */}
        <Route path="*" element={<MainApp />} />
      </Routes>
    </BrowserRouter>
  );
}
