import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import { paymentAPI } from '../utils/api';

interface PaymentCallbackProps {
    onComplete: () => void;
}

export default function PaymentCallback({ }: PaymentCallbackProps) {
    const [status, setStatus] = useState<'loading' | 'success' | 'failed' | 'pending'>('loading');
    const [message, setMessage] = useState('Verifying your payment...');

    useEffect(() => {
        const verifyPayment = async () => {
            try {
                // Get transaction ID from URL or localStorage
                const urlParams = new URLSearchParams(window.location.search);
                let transactionId = urlParams.get('transactionId');

                if (!transactionId) {
                    transactionId = localStorage.getItem('pendingPhonePeTransaction');
                }

                if (!transactionId) {
                    setStatus('failed');
                    setMessage('Transaction not found. Please try again.');
                    return;
                }

                // Check payment status with backend
                const result = await paymentAPI.checkPhonePeStatus(transactionId);

                if (result.success && result.status === 'verified') {
                    setStatus('success');
                    setMessage('Payment successful! Your record has been updated.');
                    localStorage.removeItem('pendingPhonePeTransaction');

                    // Redirect to dashboard after 3 seconds
                    setTimeout(() => {
                        window.location.href = '/';
                    }, 3000);
                } else if (result.status === 'pending') {
                    setStatus('pending');
                    setMessage('Payment is still being processed. Please wait...');

                    // Retry after 3 seconds
                    setTimeout(verifyPayment, 3000);
                } else {
                    setStatus('failed');
                    setMessage(result.message || 'Payment verification failed.');
                    localStorage.removeItem('pendingPhonePeTransaction');
                }
            } catch (error: any) {
                setStatus('failed');
                setMessage(error.response?.data?.message || 'Failed to verify payment. Please contact support.');
                localStorage.removeItem('pendingPhonePeTransaction');
            }
        };

        verifyPayment();
    }, []);

    const getStatusIcon = () => {
        switch (status) {
            case 'loading':
            case 'pending':
                return <Loader className="w-16 h-16 text-blue-500 animate-spin" />;
            case 'success':
                return <CheckCircle className="w-16 h-16 text-green-500" />;
            case 'failed':
                return <XCircle className="w-16 h-16 text-red-500" />;
        }
    };

    const getStatusColor = () => {
        switch (status) {
            case 'loading':
            case 'pending':
                return 'bg-blue-50 border-blue-200';
            case 'success':
                return 'bg-green-50 border-green-200';
            case 'failed':
                return 'bg-red-50 border-red-200';
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-8 text-center">
                <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${getStatusColor()}`}>
                    {getStatusIcon()}
                </div>

                <h2 className="text-2xl font-bold text-slate-800 mb-4">
                    {status === 'loading' && 'Processing Payment'}
                    {status === 'pending' && 'Payment Pending'}
                    {status === 'success' && 'Payment Successful!'}
                    {status === 'failed' && 'Payment Failed'}
                </h2>

                <p className="text-slate-600 mb-6">{message}</p>

                {status === 'success' && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                        <p className="text-sm text-green-800">
                            ✓ Your payment has been verified and your record has been updated.
                        </p>
                    </div>
                )}

                {status === 'failed' && (
                    <button
                        onClick={() => window.location.href = '/'}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                    >
                        Back to Dashboard
                    </button>
                )}

                {(status === 'loading' || status === 'pending') && (
                    <p className="text-xs text-slate-400">Please do not close this page...</p>
                )}
            </div>
        </div>
    );
}
