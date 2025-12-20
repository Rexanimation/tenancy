import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
    record: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Record',
        required: true,
    },
    tenant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    paymentMethod: {
        type: String,
        enum: ['upi', 'cash', 'bank_transfer', 'phonepe'],
        required: true,
    },
    transactionId: {
        type: String,
        default: '',
    },
    phonePeMerchantTransactionId: {
        type: String,
        default: '',
    },
    phonePeTransactionId: {
        type: String,
        default: '',
    },
    status: {
        type: String,
        enum: ['pending', 'verified', 'failed'],
        default: 'pending',
    },
    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    verifiedAt: {
        type: Date,
    },
    notes: {
        type: String,
        default: '',
    },
}, {
    timestamps: true,
});

// Index for querying
transactionSchema.index({ tenant: 1, createdAt: -1 });
transactionSchema.index({ status: 1 });

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;
