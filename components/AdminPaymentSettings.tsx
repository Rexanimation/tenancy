import React, { useState, useRef } from 'react';
import { Settings, Upload, Save, X } from 'lucide-react';
import { paymentAPI } from '../utils/api';
import { PaymentSettings } from '../types';

interface AdminPaymentSettingsProps {
    isOpen: boolean;
    onClose: () => void;
    currentSettings: PaymentSettings | null;
    onUpdate: () => void;
}

export default function AdminPaymentSettings({
    isOpen,
    onClose,
    currentSettings,
    onUpdate,
}: AdminPaymentSettingsProps) {
    const [upiId, setUpiId] = useState(currentSettings?.upiId || '');
    const [qrCodeFile, setQrCodeFile] = useState<File | null>(null);
    const [qrPreview, setQrPreview] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleQrSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setError('Please select an image file');
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            setError('Image size should be less than 2MB');
            return;
        }

        setError(null);
        setQrCodeFile(file);

        const reader = new FileReader();
        reader.onloadend = () => {
            setQrPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleSave = async () => {
        if (!upiId.trim()) {
            setError('Please enter UPI ID');
            return;
        }

        try {
            setSaving(true);
            setError(null);

            const formData = new FormData();
            formData.append('upiId', upiId);
            if (qrCodeFile) {
                formData.append('qrCode', qrCodeFile);
            }

            await paymentAPI.updateSettings(formData);
            onUpdate();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update settings');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                            <Settings className="w-6 h-6 text-blue-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800">Payment Settings</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {error && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    {/* UPI ID */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            UPI ID *
                        </label>
                        <input
                            type="text"
                            value={upiId}
                            onChange={(e) => setUpiId(e.target.value)}
                            placeholder="yourname@upi"
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            Your UPI ID for receiving payments
                        </p>
                    </div>

                    {/* QR Code Upload */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Payment QR Code
                        </label>

                        {(qrPreview || currentSettings?.qrCodePath) && (
                            <div className="mb-4 text-center">
                                <img
                                    src={qrPreview || currentSettings?.qrCodePath}
                                    alt="QR Code"
                                    className="mx-auto max-w-[200px] rounded-lg border-2 border-slate-200"
                                />
                                {!qrPreview && currentSettings?.qrCodePath && (
                                    <p className="text-xs text-slate-500 mt-2">Current QR Code</p>
                                )}
                            </div>
                        )}

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleQrSelect}
                            className="hidden"
                        />

                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                        >
                            <Upload className="w-5 h-5" />
                            {qrPreview || currentSettings?.qrCodePath ? 'Change QR Code' : 'Upload QR Code'}
                        </button>
                        <p className="text-xs text-slate-500 mt-1">
                            Upload a QR code image for UPI payments (PNG, JPG - Max 2MB)
                        </p>
                    </div>

                    {/* Info Box */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-800">
                            <strong>How it works:</strong> Tenants will see this QR code when making payments.
                            They can scan it with any UPI app to pay directly to your UPI ID.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <button
                            onClick={onClose}
                            className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-3 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save className="w-5 h-5" />
                            {saving ? 'Saving...' : 'Save Settings'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
