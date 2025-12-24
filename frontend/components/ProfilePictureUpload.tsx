import React, { useState, useRef } from 'react';
import { Camera, Upload, X, User } from 'lucide-react';
import { userAPI } from '../utils/api';
import { getProfileImageUrl } from '../utils/images';

interface ProfilePictureUploadProps {
    currentPicture?: string;
    onUploadSuccess: (newPictureUrl: string) => void;
    onClose?: () => void;
}

export default function ProfilePictureUpload({
    currentPicture,
    onUploadSuccess,
    onClose,
}: ProfilePictureUploadProps) {
    const [preview, setPreview] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Please select an image file');
            return;
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            setError('Image size should be less than 5MB');
            return;
        }

        setError(null);
        setSelectedFile(file);

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        try {
            setUploading(true);
            setError(null);

            const result = await userAPI.uploadProfilePicture(selectedFile);
            onUploadSuccess(result.profilePicture);

            // Reset state
            setPreview(null);
            setSelectedFile(null);

            if (onClose) {
                setTimeout(onClose, 500);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to upload image');
        } finally {
            setUploading(false);
        }
    };

    const handleRemoveSelection = () => {
        setPreview(null);
        setSelectedFile(null);
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="bg-white rounded-xl p-6 max-w-md w-full">
            {onClose && (
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-slate-800">Upload Profile Picture</h3>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>
            )}

            {/* Current/Preview Picture */}
            <div className="mb-6 text-center">
                <div className="relative inline-block">
                    {preview || currentPicture ? (
                        <img
                            src={preview || getProfileImageUrl(currentPicture)}
                            alt="Profile"
                            className="w-32 h-32 rounded-full object-cover border-4 border-slate-200"
                        />
                    ) : (
                        <div className="w-32 h-32 rounded-full bg-slate-200 flex items-center justify-center border-4 border-slate-300">
                            <User className="w-16 h-16 text-slate-400" />
                        </div>
                    )}
                    {preview && (
                        <button
                            onClick={handleRemoveSelection}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            )}

            {/* File Input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
            />

            {!preview ? (
                <div className="space-y-3">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                    >
                        <Upload className="w-5 h-5" />
                        Choose Image
                    </button>
                    <button
                        onClick={() => {
                            // In a real app, you'd open camera
                            fileInputRef.current?.click();
                        }}
                        className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                    >
                        <Camera className="w-5 h-5" />
                        Take Photo
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    <button
                        onClick={handleUpload}
                        disabled={uploading}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {uploading ? 'Uploading...' : 'Upload Picture'}
                    </button>
                    <button
                        onClick={handleRemoveSelection}
                        disabled={uploading}
                        className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                </div>
            )}

            <p className="text-xs text-slate-500 text-center mt-4">
                Accepted formats: JPG, PNG, GIF. Max size: 5MB
            </p>
        </div>
    );
}
