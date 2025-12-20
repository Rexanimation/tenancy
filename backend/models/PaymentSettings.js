import mongoose from 'mongoose';

const paymentSettingsSchema = new mongoose.Schema({
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },
    upiId: {
        type: String,
        default: '',
    },
    qrCodePath: {
        type: String,
        default: '',
    },
}, {
    timestamps: true,
});

const PaymentSettings = mongoose.model('PaymentSettings', paymentSettingsSchema);

export default PaymentSettings;
