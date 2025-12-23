
import { Link, Navigate } from 'react-router-dom';

interface PublicHomeProps {
    user?: any;
}

export default function PublicHome({ user }: PublicHomeProps) {
    if (user) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col">
            <nav className="bg-white shadow-sm p-4">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-600 text-white p-2 rounded-lg">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                        </div>
                        <span className="text-xl font-bold text-slate-800">Tenancy Tracker</span>
                    </div>
                    <div>
                        {user ? (
                            <Link to="/dashboard" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                                Go to Dashboard
                            </Link>
                        ) : (
                            <Link to="/login" className="text-blue-600 font-medium hover:text-blue-800 transition">
                                Sign In
                            </Link>
                        )}
                    </div>
                </div>
            </nav>

            <main className="flex-grow flex items-center justify-center p-4">
                <div className="max-w-3xl text-center">
                    <h1 className="text-5xl font-bold text-slate-900 mb-6">
                        Simplifying Rental Management
                    </h1>
                    <p className="text-xl text-slate-600 mb-8">
                        Manage tenants, track payments, and organize your rental properties securely and efficiently.
                    </p>
                    <div className="flex justify-center gap-4">
                        {!user && (
                            <Link to="/login" className="bg-blue-600 text-white px-8 py-3 rounded-xl text-lg font-semibold hover:bg-blue-700 transition shadow-lg hover:shadow-xl">
                                Get Started
                            </Link>
                        )}
                    </div>
                </div>
            </main>

            <footer className="bg-white border-t border-slate-200 py-8">
                <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center text-slate-500 text-sm">
                    <div className="mb-4 md:mb-0">
                        &copy; {new Date().getFullYear()} Tenancy Tracker. All rights reserved by SAHIL.
                    </div>
                    <div className="flex gap-6">
                        <Link to="/privacy" className="hover:text-blue-600 transition">Privacy Policy</Link>
                        <Link to="/terms" className="hover:text-blue-600 transition">Terms of Service</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
