
import { Link } from 'react-router-dom';

interface PublicHomeProps {
    user?: any;
}

export default function PublicHome({ user }: PublicHomeProps) {
    return (
        &lt;div className="min-h-screen bg-white flex flex-col"&gt;
            {/* Navigation Bar */}
            &lt;nav className="bg-white shadow-sm p-4 border-b border-slate-200"&gt;
                &lt;div className="max-w-7xl mx-auto flex justify-between items-center"&gt;
                    &lt;div className="flex items-center gap-2"&gt;
                        &lt;div className="bg-blue-600 text-white p-1.5 rounded-md"&gt;
                            &lt;svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"&gt;
                                &lt;path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /&gt;
                            &lt;/svg&gt;
                        &lt;/div&gt;
                        &lt;span className="text-lg font-bold text-slate-800"&gt;Tenancy Tracker&lt;/span&gt;
                    &lt;/div&gt;
                    &lt;div className="flex items-center gap-6"&gt;
                        &lt;Link to="/" className="text-slate-800 font-medium hover:text-blue-600 transition"&gt;
                            Dashboard
                        &lt;/Link&gt;
                        &lt;Link to="/" className="text-slate-800 font-medium hover:text-blue-600 transition"&gt;
                            Properties
                        &lt;/Link&gt;
                        &lt;Link to="/" className="text-slate-800 font-medium hover:text-blue-600 transition"&gt;
                            Tenants
                        &lt;/Link&gt;
                        &lt;Link to="/" className="text-slate-800 font-medium hover:text-blue-600 transition"&gt;
                            Reports
                        &lt;/Link&gt;
                        &lt;Link to="/login" className="text-blue-600 font-medium hover:text-blue-800 transition px-4 py-2 border border-blue-600 rounded-lg"&gt;
                            Sign In
                        &lt;/Link&gt;
                    &lt;/div&gt;
                &lt;/div&gt;
            &lt;/nav&gt;

            {/* Hero Section */}
            &lt;main className="flex-grow"&gt;
                &lt;div className="max-w-7xl mx-auto px-4 py-16 md:py-20"&gt;
                    &lt;div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center"&gt;
                        {/* Left Content */}
                        &lt;div&gt;
                            &lt;h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 leading-tight"&gt;
                                Effortless Rental&lt;br /&gt;Property Management
                            &lt;/h1&gt;
                            &lt;p className="text-lg text-slate-700 mb-8"&gt;
                                Streamline your portfolio, track rent, and manage leases with our comprehensive platform for landlords and property managers.
                            &lt;/p&gt;
                            &lt;Link to="/login" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg text-base font-semibold hover:bg-blue-700 transition"&gt;
                                Get Started
                            &lt;/Link&gt;
                        &lt;/div&gt;

                        {/* Right Illustration */}
                        &lt;div className="flex justify-center"&gt;
                            &lt;img 
                                src="https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=professional%20illustration%20of%20a%20confident%20landlord%20in%20business%20attire%20holding%20a%20digital%20clipboard%20with%20rental%20property%20house%20in%20background%2C%20clean%20modern%20style%2C%20blue%20color%20scheme&amp;image_size=landscape_16_9" 
                                alt="Property Management" 
                                className="max-w-full h-auto max-h-[400px]"
                            /&gt;
                        &lt;/div&gt;
                    &lt;/div&gt;

                    {/* Features Section */}
                    &lt;div className="mt-20 md:mt-28"&gt;
                        &lt;div className="grid grid-cols-1 md:grid-cols-3 gap-6"&gt;
                            {/* Feature 1: Rent Tracking */}
                            &lt;div className="bg-white p-6 rounded-xl border border-slate-200 shadow-lg"&gt;
                                &lt;div className="mb-4"&gt;
                                    &lt;svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"&gt;
                                        &lt;path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /&gt;
                                    &lt;/svg&gt;
                                &lt;/div&gt;
                                &lt;h3 className="text-xl font-semibold text-slate-900 mb-2"&gt;Rent Tracking&lt;/h3&gt;
                                &lt;p className="text-slate-600 text-sm"&gt;
                                    Rent Tracking and graph stacks, money, and comprehensive platform for tenants and property managers.
                                &lt;/p&gt;
                            &lt;/div&gt;

                            {/* Feature 2: Lease Management */}
                            &lt;div className="bg-white p-6 rounded-xl border border-slate-200 shadow-lg"&gt;
                                &lt;div className="mb-4"&gt;
                                    &lt;svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"&gt;
                                        &lt;path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /&gt;
                                    &lt;/svg&gt;
                                &lt;/div&gt;
                                &lt;h3 className="text-xl font-semibold text-slate-900 mb-2"&gt;Lease Management&lt;/h3&gt;
                                &lt;p className="text-slate-600 text-sm"&gt;
                                    Contract enables, leases tries with our management platform for landlords and property managers.
                                &lt;/p&gt;
                            &lt;/div&gt;

                            {/* Feature 3: Property Insights */}
                            &lt;div className="bg-white p-6 rounded-xl border border-slate-200 shadow-lg"&gt;
                                &lt;div className="mb-4"&gt;
                                    &lt;svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"&gt;
                                        &lt;path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /&gt;
                                    &lt;/svg&gt;
                                &lt;/div&gt;
                                &lt;h3 className="text-xl font-semibold text-slate-900 mb-2"&gt;Property Insights&lt;/h3&gt;
                                &lt;p className="text-slate-600 text-sm"&gt;
                                    Property Insights oven anaiiks, and analytics to omags for landlords and property managers.
                                &lt;/p&gt;
                            &lt;/div&gt;
                        &lt;/div&gt;
                    &lt;/div&gt;
                &lt;/div&gt;
            &lt;/main&gt;
        &lt;/div&gt;
    );
}

