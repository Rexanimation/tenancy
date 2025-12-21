import { useState, useEffect } from 'react';
import { X, Download, Printer, CheckCircle } from 'lucide-react';
import { Transaction, RecordType, User } from '../types';
import { paymentAPI } from '../utils/api';
import { formatINR } from '../utils/currency';

interface PaymentReceiptProps {
    transactionId: string;
    onClose: () => void;
}

export default function PaymentReceipt({ transactionId, onClose }: PaymentReceiptProps) {
    const [transaction, setTransaction] = useState<Transaction | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReceipt = async () => {
            try {
                const data = await paymentAPI.getReceipt(transactionId);
                setTransaction(data);
            } catch (error) {
                console.error('Error fetching receipt:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchReceipt();
    }, [transactionId]);

    const handlePrint = () => {
        window.print();
    };

    const handleDownload = () => {
        // In a real app, you'd generate a PDF here
        alert('PDF download feature coming soon!');
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl p-8 max-w-2xl w-full text-center">
                    <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="mt-4 text-slate-600">Loading receipt...</p>
                </div>
            </div>
        );
    }

    if (!transaction) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl p-8 max-w-2xl w-full text-center">
                    <p className="text-red-600">Receipt not found</p>
                    <button
                        onClick={onClose}
                        className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                    >
                        Close
                    </button>
                </div>
            </div>
        );
    }

    // Type guards/assertions to handle populated fields
    const record = transaction.record as unknown as RecordType;
    const tenant = transaction.tenant as unknown as User;

    // Safety check in case population failed
    if (!record || !tenant || typeof record === 'string' || typeof tenant === 'string') {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl p-8 max-w-2xl w-full text-center">
                    <p className="text-red-600">Error: Could not load full receipt details</p>
                    <button onClick={onClose} className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">Close</button>
                </div>
            </div>
        );
    }

    const totalAmount = record.rent + record.electricity + record.parking;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
                {/* Header with close and actions */}
                <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex items-center justify-between print:hidden">
                    <h2 className="text-xl font-bold text-slate-800">Payment Receipt</h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePrint}
                            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Print"
                        >
                            <Printer className="w-5 h-5" />
                        </button>
                        <button
                            onClick={handleDownload}
                            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Download PDF"
                        >
                            <Download className="w-5 h-5" />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Receipt Content */}
                <div className="p-8">
                    {/* Success Badge */}
                    <div className="flex items-center justify-center mb-6">
                        <div className="bg-green-100 rounded-full p-3">
                            <CheckCircle className="w-12 h-12 text-green-600" />
                        </div>
                    </div>

                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-slate-800 mb-2">Payment Receipt</h1>
                        <p className="text-slate-600">Transaction ID: {transaction._id}</p>
                    </div>

                    {/* Payment Status */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-center">
                        <p className="text-green-800 font-semibold">
                            {transaction.status === 'verified' ? '✓ Payment Verified' : 'Payment Pending Verification'}
                        </p>
                        {transaction.verifiedAt && (
                            <p className="text-sm text-green-700 mt-1">
                                Verified on {new Date(transaction.verifiedAt).toLocaleDateString('en-IN')}
                            </p>
                        )}
                    </div>

                    {/* Tenant Details */}
                    <div className="mb-6">
                        <h3 className="text-sm font-semibold text-slate-500 uppercase mb-3">Tenant Details</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-slate-600">Name</p>
                                <p className="font-semibold text-slate-800">{tenant.name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-600">Email</p>
                                <p className="font-semibold text-slate-800">{tenant.email}</p>
                            </div>
                            {tenant.unit && (
                                <div>
                                    <p className="text-sm text-slate-600">Unit</p>
                                    <p className="font-semibold text-slate-800">Unit {tenant.unit}</p>
                                </div>
                            )}
                            <div>
                                <p className="text-sm text-slate-600">Payment Date</p>
                                <p className="font-semibold text-slate-800">
                                    {new Date(transaction.createdAt).toLocaleDateString('en-IN')}
                                </p>
                            </div>
                        </div>
                    </div>

                    <hr className="my-6" />

                    {/* Billing Period */}
                    <div className="mb-6">
                        <h3 className="text-sm font-semibold text-slate-500 uppercase mb-3">Billing Period</h3>
                        <p className="text-lg font-semibold text-slate-800">
                            {record.month} {record.year}
                        </p>
                    </div>

                    {/* Amount Breakdown */}
                    <div className="mb-6">
                        <h3 className="text-sm font-semibold text-slate-500 uppercase mb-3">Amount Breakdown</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center py-2">
                                <span className="text-slate-700">Rent</span>
                                <span className="font-semibold text-slate-800">{formatINR(record.rent)}</span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                                <span className="text-slate-700">Electricity</span>
                                <span className="font-semibold text-slate-800">{formatINR(record.electricity)}</span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                                <span className="text-slate-700">Parking</span>
                                <span className="font-semibold text-slate-800">{formatINR(record.parking)}</span>
                            </div>
                            <hr />
                            <div className="flex justify-between items-center py-3 bg-indigo-50 px-4 rounded-lg">
                                <span className="text-lg font-bold text-slate-800">Total Amount</span>
                                <span className="text-2xl font-bold text-indigo-600">{formatINR(totalAmount)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Payment Details */}
                    <div className="mb-6">
                        <h3 className="text-sm font-semibold text-slate-500 uppercase mb-3">Payment Details</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-slate-600">Payment Method</span>
                                <span className="font-semibold text-slate-800 uppercase">{transaction.paymentMethod}</span>
                            </div>
                            {transaction.transactionId && (
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Transaction Reference</span>
                                    <span className="font-mono text-sm font-semibold text-slate-800">
                                        {transaction.transactionId}
                                    </span>
                                </div>
                            )}
                            {transaction.notes && (
                                <div className="mt-3">
                                    <p className="text-sm text-slate-600 mb-1">Notes:</p>
                                    <p className="text-sm text-slate-800">{transaction.notes}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="border-t pt-6 text-center">
                        <p className="text-sm text-slate-500">
                            This is a computer-generated receipt and does not require a signature.
                        </p>
                        <p className="text-xs text-slate-400 mt-2">
                            Generated on {new Date().toLocaleDateString('en-IN')} at {new Date().toLocaleTimeString('en-IN')}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
