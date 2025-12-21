import mongoose from 'mongoose';

const recordSchema = new mongoose.Schema({
    tenant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    month: {
        type: String,
        required: true,
    },
    year: {
        type: String,
        required: true,
    },
    rent: {
        type: Number,
        required: true,
        default: 0,
    },
    electricity: {
        type: Number,
        default: 0,
    },
    electricityUnits: {
        type: Number,
        default: 0,
    },
    electricityRate: {
        type: Number,
        default: 0,
    },
    municipalFee: {
        type: Number,
        default: 0,
    },
    parking: {
        type: Number,
        default: 0,
    },
    penalties: {
        type: Number,
        default: 0,
    },
    dues: {
        type: Number,
        default: 0,
    },
    advanceCredit: {
        type: Number,
        default: 0,
    },
    paid: {
        type: Boolean,
        default: false,
    },
    date: {
        type: String, // Store as 'YYYY-MM-DD' format
        required: true,
    },
    paidDate: {
        type: Date,
    },
    transactionId: {
        type: String,
        default: '',
    },
    paymentMethod: {
        type: String,
        enum: ['', 'upi', 'cash', 'bank_transfer', 'razorpay'],
        default: '',
    },
}, {
    timestamps: true,
});

// Index for efficient querying
recordSchema.index({ tenant: 1, year: 1, month: 1 });
recordSchema.index({ paid: 1 });

const Record = mongoose.model('Record', recordSchema);

export default Record;
