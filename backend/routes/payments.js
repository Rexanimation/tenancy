import express from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { protect, adminOnly, approvedOnly } from '../middleware/auth.js';
import PaymentSettings from '../models/PaymentSettings.js';
import Transaction from '../models/Transaction.js';
import Record from '../models/Record.js';

const router = express.Router();

// Razorpay Instance
let razorpay;
try {
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
        razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });
    } else {
        console.warn('RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is missing. Payment features will be disabled.');
    }
} catch (error) {
    console.warn('Failed to initialize Razorpay:', error.message);
}

// Configure multer for QR code uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/qr/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'qr-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'));
        }
    }
});

// @route   GET /api/payments/settings
// @desc    Get payment settings
// @access  Private
router.get('/settings', protect, approvedOnly, async (req, res) => {
    try {
        const User = (await import('../models/User.js')).default;
        const admin = await User.findOne({ role: 'admin' });

        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        let settings = await PaymentSettings.findOne({ adminId: admin._id });

        if (!settings) {
            settings = await PaymentSettings.create({ adminId: admin._id });
        }

        res.json({
            upiId: settings.upiId,
            qrCodePath: settings.qrCodePath,
            razorpayKeyId: process.env.RAZORPAY_KEY_ID // Send key_id to frontend
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/payments/settings
// @desc    Update payment settings
// @access  Private (Admin)
router.post('/settings', protect, adminOnly, upload.single('qrCode'), async (req, res) => {
    try {
        const { upiId } = req.body;
        let settings = await PaymentSettings.findOne({ adminId: req.user._id });

        if (!settings) {
            settings = await PaymentSettings.create({ adminId: req.user._id });
        }

        if (upiId !== undefined) settings.upiId = upiId;
        if (req.file) settings.qrCodePath = `/uploads/qr/${req.file.filename}`;

        await settings.save();
        res.json({ message: 'Payment settings updated successfully', settings });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/payments/razorpay/order
// @desc    Create Razorpay Order
// @access  Private
router.post('/razorpay/order', protect, approvedOnly, async (req, res) => {
    try {
        if (!razorpay) {
            return res.status(503).json({ message: 'Payment gateway not configured' });
        }

        const { recordId, amount: customAmount } = req.body;
        const record = await Record.findById(recordId).populate('tenant');

        if (!record) return res.status(404).json({ message: 'Record not found' });
        if (record.paid) return res.status(400).json({ message: 'Record already paid' });

        // Check user
        if (req.user.role === 'renter' && record.tenant._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const billTotal = record.rent + record.electricity + record.parking + (record.penalties || 0) + (record.dues || 0) + (record.municipalFee || 0);

        // Use custom amount if provided (in rupees), otherwise use full bill total
        // Ensure amount is valid
        const paymentAmount = customAmount ? Number(customAmount) : billTotal;
        if (paymentAmount <= 0) return res.status(400).json({ message: 'Invalid payment amount' });

        const amountInPaisa = Math.round(paymentAmount * 100);

        const options = {
            amount: amountInPaisa,
            currency: "INR",
            receipt: `receipt_${recordId}`,
            notes: {
                recordId: recordId,
                tenantId: record.tenant._id.toString(),
                originalBillTotal: billTotal // Store original bill amount for verification logic
            }
        };

        const order = await razorpay.orders.create(options);

        // Create a local pending transaction
        const transaction = await Transaction.create({
            record: recordId,
            tenant: record.tenant._id,
            amount: paymentAmount,
            paymentMethod: 'razorpay',
            transactionId: order.id, // Store order ID temporarily
            status: 'pending'
        });

        res.json({
            success: true,
            order,
            key: process.env.RAZORPAY_KEY_ID,
            transactionId: transaction._id
        });

    } catch (error) {
        console.error('Razorpay order error:', error);
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/payments/razorpay/verify
// @desc    Verify Razorpay Payment
// @access  Private
router.post('/razorpay/verify', protect, approvedOnly, async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, transactionObjectId } = req.body;

        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        if (expectedSignature === razorpay_signature) {
            // Payment successful

            // Find transaction by object ID or order ID
            let transaction;
            if (transactionObjectId) {
                transaction = await Transaction.findById(transactionObjectId);
            } else {
                transaction = await Transaction.findOne({ transactionId: razorpay_order_id });
            }

            if (transaction) {
                transaction.status = 'verified';
                transaction.transactionId = razorpay_payment_id; // Update to actual payment ID
                transaction.verifiedAt = new Date();
                transaction.notes = 'Payment verified via Razorpay';
                await transaction.save();

                // Update record and user balance
                const record = await Record.findById(transaction.record);
                if (record) {
                    record.paid = true;
                    record.paidDate = new Date();
                    record.paymentMethod = 'razorpay';
                    record.transactionId = razorpay_payment_id;
                    record.paidAmount = transaction.amount; // Store actual paid amount
                    await record.save();

                    // Calculate difference and update user balance
                    const billTotal = record.rent + record.electricity + record.parking + (record.penalties || 0) + (record.dues || 0) + (record.municipalFee || 0);
                    const paidAmount = transaction.amount;
                    const difference = paidAmount - billTotal;

                    const User = (await import('../models/User.js')).default;
                    const tenant = await User.findById(record.tenant);

                    if (tenant) {
                        if (difference > 0) {
                            // Paid more: Add to advance
                            tenant.advancePaid = (tenant.advancePaid || 0) + difference;
                        } else if (difference < 0) {
                            // Paid less: Add difference (absolute value) to dues
                            tenant.dues = (tenant.dues || 0) + Math.abs(difference);
                        }
                        // If difference is 0, no change to balance
                        await tenant.save();
                    }
                }
            }

            res.json({ success: true, message: 'Payment verified successfully' });
        } else {
            res.status(400).json({ success: false, message: 'Invalid signature' });
        }
    } catch (error) {
        console.error('Razorpay verify error:', error);
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/payments/transactions
// @desc    Get payment transactions history
// @access  Private
router.get('/transactions', protect, approvedOnly, async (req, res) => {
    try {
        let query = {};
        if (req.user.role === 'renter') {
            query.tenant = req.user._id;
        }
        if (req.query.status) {
            query.status = req.query.status;
        }

        const transactions = await Transaction.find(query)
            .populate('tenant', 'name email unit')
            .populate('record')
            .sort({ createdAt: -1 });

        res.json(transactions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
