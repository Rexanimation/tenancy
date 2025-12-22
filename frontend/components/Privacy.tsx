

export default function Privacy() {
    return (
        <div className="min-h-screen bg-white p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
            <div className="prose">
                <p className="mb-4">Last updated: {new Date().toLocaleDateString()}</p>

                <h2 className="text-xl font-semibold mb-2">1. Introduction</h2>
                <p className="mb-4">
                    Welcome to Tenancy Tracker. This Privacy Policy explains how we collect, use, and protect your information.
                    We respect your privacy and represent that we use Google OAuth solely for authentication purposes.
                </p>

                <h2 className="text-xl font-semibold mb-2">2. Information We Collect</h2>
                <p className="mb-4">
                    When you sign in with Google, we collect your name, email address, and profile picture to create your account
                    and identify you within the application. We do not access your contacts, drive files, or other private data.
                </p>

                <h2 className="text-xl font-semibold mb-2">3. How We Use Your Information</h2>
                <ul className="list-disc pl-5 mb-4">
                    <li>To authenticate your identity.</li>
                    <li>To manage tenancy records and payments.</li>
                    <li>To communicate important updates regarding your tenancy.</li>
                </ul>

                <h2 className="text-xl font-semibold mb-2">4. Data Security</h2>
                <p className="mb-4">
                    We implement appropriate security measures to protect your personal information.
                    We do not sell your personal data to third parties.
                </p>

                <h2 className="text-xl font-semibold mb-2">5. Contact Us</h2>
                <p>
                    If you have any questions about this Privacy Policy, please contact the administrator.
                </p>
            </div>
        </div>
    );
}
