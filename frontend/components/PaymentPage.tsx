import { useState, useEffect } from 'react';
import { X, QrCode, CheckCircle, Loader, CreditCard } from 'lucide-react';
import { RecordType, PaymentSettings } from '../types';
import { paymentAPI } from '../utils/api';
import { formatINR } from '../utils/currency';

interface PaymentPageProps {
    record: RecordType;
    onClose: () => void;
    onPaymentComplete: () => void;
}

// Add Razorpay type
declare global {
    interface Window {
        Razorpay: any;
    }
}

export default function PaymentPage({ record, onClose, onPaymentComplete }: PaymentPageProps) {
    const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [transactionRef, setTransactionRef] = useState('');
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [step, setStep] = useState<'payment' | 'confirm' | 'success'>('payment');
    const [transactionId, setTransactionId] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<'upi' | 'razorpay'>('razorpay');

    const totalAmount = record.rent + record.electricity + record.parking +
        (record.penalties || 0) + (record.dues || 0) +
        (record.municipalFee || 0);

    useEffect(() => {
        const fetchPaymentSettings = async () => {
            try {
                const settings = await paymentAPI.getSettings();
                setPaymentSettings(settings);
            } catch (error) {
                console.error('Error fetching payment settings:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPaymentSettings();
    }, []);

    const handleRazorpayPayment = async () => {
        try {
            setSubmitting(true);

            // 1. Create order on backend
            const orderResponse = await paymentAPI.initiateRazorpayPayment(record._id);

            if (!orderResponse.success) {
                alert(orderResponse.message || 'Failed to initiate payment');
                setSubmitting(false);
                return;
            }

            // 2. Open Razorpay Checkout
            const options = {
                key: orderResponse.key,
                amount: orderResponse.order.amount,
                currency: orderResponse.order.currency,
                name: "Tenancy Tracker",
                description: "Rent Payment",
                // image: "https://example.com/your_logo", // Optional
                order_id: orderResponse.order.id,
                handler: async function (response: any) {
                    // 3. Verify payment on backend
                    try {
                        const verifyResponse = await paymentAPI.verifyRazorpayPayment({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            transactionObjectId: orderResponse.transactionId
                        });

                        if (verifyResponse.success) {
                            setStep('success');
                            setTimeout(() => {
                                onPaymentComplete();
                                onClose();
                            }, 2000);
                        } else {
                            alert('Payment verification failed');
                        }
                    } catch (error) {
                        console.error('Verification error:', error);
                        alert('Payment verification failed');
                    }
                },
                prefill: {
                    name: record.tenant.name,
                    email: record.tenant.email,
                    contact: "" // Can be added if available in tenant record
                },
                notes: {
                    record_id: record._id
                },
                theme: {
                    color: "#4F46E5"
                }
            };

            const rzp1 = new window.Razorpay(options);
            rzp1.on('payment.failed', function (response: any) {
                alert(response.error.description);
                setSubmitting(false);
            });
            rzp1.open();
            setSubmitting(false); // Reset submitting state as the modal handles it now

        } catch (error: any) {
            console.error('Razorpay init error:', error);
            alert(error.response?.data?.message || 'Failed to initiate payment');
            setSubmitting(false);
        }
    };


    const handleInitiatePayment = async () => {
        try {
            setSubmitting(true);
            const result = await paymentAPI.initiatePayment({
                recordId: record._id,
                paymentMethod: 'upi',
            });
            setTransactionId(result.transaction._id);
            setStep('confirm');
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to initiate payment');
        } finally {
            setSubmitting(false);
        }
    };

    const handleConfirmPayment = async () => {
        if (!transactionRef.trim()) {
            alert('Please enter the transaction reference number');
            return;
        }

        try {
            setSubmitting(true);
            await paymentAPI.verifyPayment({
                transactionId,
                transactionRef,
                notes: notes || 'Payment completed via UPI',
            });
            setStep('success');
            setTimeout(() => {
                onPaymentComplete();
                onClose();
            }, 2000);
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to confirm payment');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl p-8 max-w-md w-full text-center">
                    <Loader className="w-8 h-8 animate-spin mx-auto text-blue-600" />
                    <p className="mt-4 text-slate-600">Loading payment details...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full relative max-h-[90vh] overflow-y-auto">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors z-10"
                >
                    <X className="w-6 h-6" />
                </button>

                {step === 'payment' && (
                    <div className="p-8">
                        <h2 className="text-2xl font-bold text-slate-800 mb-6">Make Payment</h2>

                        {/* Amount Summary */}
                        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl p-6 text-white mb-6">
                            <p className="text-indigo-100 text-sm mb-2">Total Amount</p>
                            <h3 className="text-4xl font-bold">{formatINR(totalAmount)}</h3>
                            <div className="mt-4 space-y-1 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-indigo-100">Rent:</span>
                                    <span>{formatINR(record.rent)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-indigo-100">Electricity:</span>
                                    <span>{formatINR(record.electricity)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-indigo-100">Parking:</span>
                                    <span>{formatINR(record.parking)}</span>
                                </div>
                                {(record.penalties || 0) > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-indigo-100">Penalties:</span>
                                        <span>{formatINR(record.penalties || 0)}</span>
                                    </div>
                                )}
                                {(record.dues || 0) > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-indigo-100">Dues:</span>
                                        <span>{formatINR(record.dues || 0)}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Payment Method Selection */}
                        <div className="mb-6">
                            <h4 className="font-semibold text-slate-800 mb-3">Choose Payment Method:</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setPaymentMethod('razorpay')}
                                    className={`p-4 rounded-lg border-2 transition-all ${paymentMethod === 'razorpay'
                                        ? 'border-indigo-500 bg-indigo-50'
                                        : 'border-slate-200 hover:border-slate-300'
                                        }`}
                                >
                                    <CreditCard className={`w-8 h-8 mx-auto mb-2 ${paymentMethod === 'razorpay' ? 'text-indigo-600' : 'text-slate-400'
                                        }`} />
                                    <p className={`text-sm font-medium ${paymentMethod === 'razorpay' ? 'text-indigo-600' : 'text-slate-600'
                                        }`}>
                                        Razorpay
                                    </p>
                                    <p className="text-xs text-slate-400 mt-1">Card, UPI, Wallet</p>
                                </button>
                                <button
                                    onClick={() => setPaymentMethod('upi')}
                                    className={`p-4 rounded-lg border-2 transition-all ${paymentMethod === 'upi'
                                        ? 'border-indigo-500 bg-indigo-50'
                                        : 'border-slate-200 hover:border-slate-300'
                                        }`}
                                >
                                    <QrCode className={`w-8 h-8 mx-auto mb-2 ${paymentMethod === 'upi' ? 'text-indigo-600' : 'text-slate-400'
                                        }`} />
                                    <p className={`text-sm font-medium ${paymentMethod === 'upi' ? 'text-indigo-600' : 'text-slate-600'
                                        }`}>
                                        UPI QR Code
                                    </p>
                                    <p className="text-xs text-slate-400 mt-1">Manual Payment</p>
                                </button>
                            </div>
                        </div>

                        {/* Razorpay Payment */}
                        {paymentMethod === 'razorpay' && (
                            <div className="space-y-4">
                                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                                    <p className="text-sm text-indigo-800">
                                        <strong>Secure Payment:</strong> Pay instantly using Credit/Debit Card, UPI, NetBanking, or Wallets through Razorpay.
                                    </p>
                                </div>
                                <button
                                    onClick={handleRazorpayPayment}
                                    disabled={submitting}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    <CreditCard className="w-5 h-5" />
                                    {submitting ? 'Processing...' : 'Pay with Razorpay'}
                                </button>
                            </div>
                        )}

                        {/* UPI QR Payment */}
                        {paymentMethod === 'upi' && (
                            <>
                                {/* Payment Instructions */}
                                <div className="mb-4">
                                    <h4 className="font-semibold text-slate-800 mb-3">Payment Instructions:</h4>
                                    <ol className="list-decimal list-inside space-y-2 text-sm text-slate-600">
                                        <li>Scan the QR code below or use the UPI ID</li>
                                        <li>Make payment of {formatINR(totalAmount)}</li>
                                        <li>Note the transaction reference number</li>
                                        <li>Click "I've Paid" and enter the reference</li>
                                    </ol>
                                </div>

                                {/* QR Code Display */}
                                {paymentSettings?.qrCodePath ? (
                                    <div className="bg-slate-50 rounded-lg p-6 text-center mb-4">
                                        <QrCode className="w-8 h-8 mx-auto text-slate-400 mb-3" />
                                        <img
                                            src={paymentSettings.qrCodePath}
                                            alt="UPI QR Code"
                                            className="mx-auto max-w-[200px] rounded-lg border border-slate-200"
                                        />
                                        {paymentSettings.upiId && (
                                            <div className="mt-4">
                                                <p className="text-xs text-slate-500 mb-1">UPI ID:</p>
                                                <p className="font-mono text-sm font-semibold text-slate-800 bg-white px-3 py-2 rounded border border-slate-200">
                                                    {paymentSettings.upiId}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                                        <p className="text-sm text-amber-800">
                                            Payment QR code not configured. Please use online payment or contact admin.
                                        </p>
                                    </div>
                                )}

                                <button
                                    onClick={handleInitiatePayment}
                                    disabled={submitting || !paymentSettings?.qrCodePath}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitting ? 'Processing...' : "I've Paid"}
                                </button>
                            </>
                        )}
                    </div>
                )}

                {step === 'confirm' && (
                    <div className="p-8">
                        <h2 className="text-2xl font-bold text-slate-800 mb-6">Confirm Payment</h2>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Transaction Reference Number *
                            </label>
                            <input
                                type="text"
                                value={transactionRef}
                                onChange={(e) => setTransactionRef(e.target.value)}
                                placeholder="Enter UPI transaction ID"
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            <p className="text-xs text-slate-500 mt-1">
                                Found in your UPI app's transaction history
                            </p>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Notes (Optional)
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Any additional notes..."
                                rows={3}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setStep('payment')}
                                className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-3 rounded-lg transition-colors"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleConfirmPayment}
                                disabled={submitting}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
                            >
                                {submitting ? 'Submitting...' : 'Confirm Payment'}
                            </button>
                        </div>
                    </div>
                )}

                {step === 'success' && (
                    <div className="p-8 text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-10 h-10 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Payment Successful!</h2>
                        <p className="text-slate-600 mb-6">
                            Your payment has been processed successfully. Your record has been updated.
                        </p>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <p className="text-sm text-green-800">
                                ✓ Payment verified and recorded automatically.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
