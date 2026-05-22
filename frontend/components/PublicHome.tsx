
import { Link } from 'react-router-dom';

export default function PublicHome() {
    return (
        <div className="min-h-screen bg-white flex flex-col">
            {/* Navigation Bar */}
            <nav className="bg-white shadow-sm p-4 border-b border-slate-200">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-600 text-white p-1.5 rounded-md">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                        </div>
                        <span className="text-lg font-bold text-slate-800">Tenancy Tracker</span>
                    </div>
                    <div className="flex items-center gap-6">
                        <Link to="/login" className="text-blue-600 font-medium hover:text-blue-800 transition px-4 py-2 border border-blue-600 rounded-lg">
                            Sign In
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="flex-grow">
                <div className="max-w-7xl mx-auto px-4 py-16 md:py-20">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        {/* Left Content */}
                        <div>
                            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 leading-tight">
                                Effortless Rental<br />Property Management
                            </h1>
                            <p className="text-lg text-slate-700 mb-8">
                                Streamline your portfolio, track rent, and manage leases with our comprehensive platform for landlords and property managers.
                            </p>
                            <Link to="/login" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg text-base font-semibold hover:bg-blue-700 transition">
                                Get Started
                            </Link>
                        </div>

                        {/* Right Illustration */}
                        <div className="flex justify-center">
                            <img 
                                src="/homepage2.png" 
                                alt="Property Management" 
                                className="max-w-full h-auto max-h-[400px]"
                            />
                        </div>
                    </div>

                    {/* Features Section */}
                    <div className="mt-20 md:mt-28">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Feature 1: Rent Tracking */}
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-lg">
                                <div className="mb-4">
                                    <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold text-slate-900 mb-2">Rent Tracking</h3>
                                <p className="text-slate-600 text-sm">
                                    Rent Tracking and graph stacks, money, and comprehensive platform for tenants and property managers.
                                </p>
                            </div>

                            {/* Feature 2: Lease Management */}
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-lg">
                                <div className="mb-4">
                                    <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold text-slate-900 mb-2">Lease Management</h3>
                                <p className="text-slate-600 text-sm">
                                    Contract enables, leases tries with our management platform for landlords and property managers.
                                </p>
                            </div>

                            {/* Feature 3: Property Insights */}
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-lg">
                                <div className="mb-4">
                                    <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold text-slate-900 mb-2">Property Insights</h3>
                                <p className="text-slate-600 text-sm">
                                    Property Insights oven anaiiks, and analytics to omags for landlords and property managers.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

