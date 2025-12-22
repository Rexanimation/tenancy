

export default function Terms() {
    return (
        <div className="min-h-screen bg-white p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
            <div className="prose">
                <p className="mb-4">Last updated: {new Date().toLocaleDateString()}</p>

                <h2 className="text-xl font-semibold mb-2">1. Acceptance of Terms</h2>
                <p className="mb-4">
                    By accessing and using Tenancy Tracker, you agree to be bound by these Terms of Service.
                </p>

                <h2 className="text-xl font-semibold mb-2">2. Usage</h2>
                <p className="mb-4">
                    This application is intended for managing rental properties, tenants, and payments.
                    Users must provide accurate information and use the platform responsibly.
                </p>

                <h2 className="text-xl font-semibold mb-2">3. Account Responsibilities</h2>
                <p className="mb-4">
                    You are responsible for maintaining the confidentiality of your account and for all activities that occur under your account.
                </p>

                <h2 className="text-xl font-semibold mb-2">4. Payments</h2>
                <p className="mb-4">
                    Payments processed through this platform are subject to the terms of our payment partners (Razorpay).
                    We are not responsible for errors in payment processing caused by third-party services.
                </p>

                <h2 className="text-xl font-semibold mb-2">5. Termination</h2>
                <p className="mb-4">
                    We reserve the right to terminate or suspend access to our service immediately, without prior notice, for any reason whatsoever.
                </p>
            </div>
        </div>
    );
}
