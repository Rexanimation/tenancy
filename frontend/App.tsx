import React from 'react';
import useTenancy from './hooks/useTenancy';
import LoginScreen from './components/LoginScreen';
import AdminDashboard from './components/AdminDashboard';
import RenterDashboard from './components/RenterDashboard';
import ProtectedRoute from './components/ProtectedRoute'; // Import ProtectedRoute
import PendingApproval from './components/PendingApproval'; // Import PendingApproval
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Privacy from './components/Privacy';
import Terms from './components/Terms';
import PublicHome from './components/PublicHome';

// Loading component defined above
const LoadingSpinner: React.FC = () => (
  <div className="min-h-screen bg-slate-100 flex items-center justify-center">
    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

function DashboardSwitcher() {
  const {
    currentUser,
    tenants,
    records,
    logout,
    addRecord,
    approveTenant,
    rejectTenant,
    deleteTenant,
    updateRecordStatus,
    updateTenants,
    notifications,
    refreshRecords,
  } = useTenancy();

  // Pending/Rejected checks are now handled in ProtectedRoute, which redirects to /pending-approval

  if (!currentUser) return null; // Should be caught by ProtectedRoute

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

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Unknown Role</h2>
        <p className="text-slate-600 mb-6">Your account has a role ({currentUser.role}) that is not recognized.</p>
        <button onClick={logout} className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors">Sign Out</button>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { currentUser, loading, googleSignIn, error, message } = useTenancy();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Routes>
      <Route path="/" element={<PublicHome user={currentUser} />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/pending-approval" element={<PendingApproval />} />
      <Route path="/login" element={
        currentUser ? <Navigate to="/dashboard" /> : <LoginScreen onGoogleSignIn={googleSignIn} apiError={error} apiMessage={message} />
      } />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardSwitcher />
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
