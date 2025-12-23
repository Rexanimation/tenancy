
import useTenancy from '../hooks/useTenancy';

export default function PendingApproval() {
    const { currentUser, logout } = useTenancy();

    if (!currentUser) return null;

    const isRejected = currentUser.status === 'rejected';

    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
                {isRejected ? (
                    <>
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-4">Account Rejected</h2>
                        <p className="text-slate-600 mb-6">Your registration request has been rejected by the administrator. If you believe this is a mistake, please contact the admin.</p>
                    </>
                ) : (
                    <>
                        <h2 className="text-2xl font-bold text-slate-800 mb-4">Account Pending Approval</h2>
                        <p className="text-slate-600 mb-6">Your account is pending administrator approval. Please wait for an admin to approve your registration.</p>
                    </>
                )}
                <button onClick={logout} className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors">Sign Out</button>
            </div>
        </div>
    );
}
