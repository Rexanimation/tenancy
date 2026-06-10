import mongoose from 'mongoose';

const receiptSchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  record: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Record',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  paymentMethod: {
    type: String,
    required: true,
  },
  transactionId: {
    type: String,
    default: '',
  },
  pdfUrl: {
    type: String,
    default: '',
  },
  paidDate: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true,
});

// Indexing for faster lookups
receiptSchema.index({ tenant: 1, createdAt: -1 });
receiptSchema.index({ record: 1 });

const Receipt = mongoose.model('Receipt', receiptSchema);

export default Receipt;
