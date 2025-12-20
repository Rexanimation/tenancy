import express from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import QRCode from 'qrcode';
import axios from 'axios';
import { protect, adminOnly, approvedOnly } from '../middleware/auth.js';
import PaymentSettings from '../models/PaymentSettings.js';
import Transaction from '../models/Transaction.js';
import Record from '../models/Record.js';

const router = express.Router();

// PhonePe API configuration
const getPhonePeConfig = () => ({
    merchantId: process.env.PHONEPE_MERCHANT_ID || '',
    saltKey: process.env.PHONEPE_SALT_KEY || '',
    saltIndex: process.env.PHONEPE_SALT_INDEX || '1',
    baseUrl: process.env.PHONEPE_ENVIRONMENT === 'production'
        ? 'https://api.phonepe.com/apis/hermes'
        : 'https://api-preprod.phonepe.com/apis/pg-sandbox',
});

// Generate PhonePe checksum
const generatePhonePeChecksum = (base64Payload, endpoint, saltKey, saltIndex) => {
    const string = base64Payload + endpoint + saltKey;
    const sha256 = crypto.createHash('sha256').update(string).digest('hex');
    return sha256 + '###' + saltIndex;
};

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
// @desc    Get payment settings (UPI, QR code)
// @access  Private
router.get('/settings', protect, approvedOnly, async (req, res) => {
    try {
        // Find admin user's payment settings
        const User = (await import('../models/User.js')).default;
        const admin = await User.findOne({ role: 'admin' });

        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        let settings = await PaymentSettings.findOne({ adminId: admin._id });

        if (!settings) {
            // Create default settings if not exists
            settings = await PaymentSettings.create({ adminId: admin._id });
        }

        res.json({
            upiId: settings.upiId,
            qrCodePath: settings.qrCodePath,
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

        if (req.file) {
            settings.qrCodePath = `/uploads/qr/${req.file.filename}`;
        }

        await settings.save();

        res.json({ message: 'Payment settings updated successfully', settings });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/payments/initiate
// @desc    Initiate payment for a record
// @access  Private
router.post('/initiate', protect, approvedOnly, async (req, res) => {
    try {
        const { recordId, paymentMethod } = req.body;

        const record = await Record.findById(recordId).populate('tenant');

        if (!record) {
            return res.status(404).json({ message: 'Record not found' });
        }

        // Check if user is the tenant for this record
        if (req.user.role === 'renter' && record.tenant._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const amount = record.rent + record.electricity + record.parking;

        // Create transaction
        const transaction = await Transaction.create({
            record: recordId,
            tenant: record.tenant._id,
            amount,
            paymentMethod,
            status: 'pending',
        });

        res.json({
            message: 'Payment initiated',
            transaction,
            amount
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/payments/verify
// @desc    Manually verify payment (by admin or tenant confirmation)
// @access  Private
router.post('/verify', protect, approvedOnly, async (req, res) => {
    try {
        const { transactionId, transactionRef, notes } = req.body;

        const transaction = await Transaction.findById(transactionId);

        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        // If tenant is confirming payment
        if (req.user.role === 'renter') {
            if (transaction.tenant.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: 'Access denied' });
            }
            transaction.transactionId = transactionRef || '';
            transaction.notes = notes || 'Payment confirmed by tenant';
            transaction.status = 'pending'; // Still needs admin verification
        }

        // If admin is verifying payment
        if (req.user.role === 'admin') {
            transaction.status = 'verified';
            transaction.verifiedBy = req.user._id;
            transaction.verifiedAt = new Date();
            if (notes) transaction.notes = notes;

            // Update record as paid
            const record = await Record.findById(transaction.record);
            if (record) {
                record.paid = true;
                record.paidDate = new Date();
                record.transactionId = transaction.transactionId;
                record.paymentMethod = transaction.paymentMethod;
                await record.save();
            }
        }

        await transaction.save();

        const populatedTransaction = await Transaction.findById(transaction._id)
            .populate('tenant', 'name email unit')
            .populate('record');

        res.json({
            message: req.user.role === 'admin' ? 'Payment verified successfully' : 'Payment confirmation submitted',
            transaction: populatedTransaction
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/payments/receipt/:id
// @desc    Get payment receipt for a transaction
// @access  Private
router.get('/receipt/:id', protect, approvedOnly, async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id)
            .populate('tenant', 'name email unit')
            .populate('record');

        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        // Check access rights
        if (req.user.role === 'renter' && transaction.tenant._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.json(transaction);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/payments/transactions
// @desc    Get payment transactions history
// @access  Private
router.get('/transactions', protect, approvedOnly, async (req, res) => {
    try {
        let query = {};

        // If renter, only show their transactions
        if (req.user.role === 'renter') {
            query.tenant = req.user._id;
        }

        // Apply filters
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

// ============================================
// PHONEPE INTEGRATION ROUTES
// ============================================

// @route   POST /api/payments/phonepe/initiate
// @desc    Initiate PhonePe payment
// @access  Private
router.post('/phonepe/initiate', protect, approvedOnly, async (req, res) => {
    try {
        const { recordId } = req.body;
        const config = getPhonePeConfig();

        if (!config.merchantId || !config.saltKey) {
            return res.status(500).json({ message: 'PhonePe credentials not configured' });
        }

        const record = await Record.findById(recordId).populate('tenant');

        if (!record) {
            return res.status(404).json({ message: 'Record not found' });
        }

        // Check if user is the tenant for this record
        if (req.user.role === 'renter' && record.tenant._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Check if already paid
        if (record.paid) {
            return res.status(400).json({ message: 'Record already paid' });
        }

        const amount = record.rent + record.electricity + record.parking +
            (record.penalties || 0) + (record.dues || 0) +
            (record.municipalFee || 0);

        // Generate unique merchant transaction ID
        const merchantTransactionId = `MT_${Date.now()}_${record._id.toString().slice(-6)}`;

        // Create pending transaction in database
        const transaction = await Transaction.create({
            record: recordId,
            tenant: record.tenant._id,
            amount,
            paymentMethod: 'phonepe',
            phonePeMerchantTransactionId: merchantTransactionId,
            status: 'pending',
        });

        // PhonePe payment request payload
        const payload = {
            merchantId: config.merchantId,
            merchantTransactionId: merchantTransactionId,
            merchantUserId: record.tenant._id.toString(),
            amount: amount * 100, // Amount in paisa
            redirectUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-callback?transactionId=${transaction._id}`,
            redirectMode: 'REDIRECT',
            callbackUrl: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/payments/phonepe/webhook`,
            paymentInstrument: {
                type: 'PAY_PAGE'
            }
        };

        // Encode payload to base64
        const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');

        // Generate checksum
        const checksum = generatePhonePeChecksum(
            base64Payload,
            '/pg/v1/pay',
            config.saltKey,
            config.saltIndex
        );

        // Make PhonePe API request
        const response = await axios.post(
            `${config.baseUrl}/pg/v1/pay`,
            { request: base64Payload },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'X-VERIFY': checksum,
                },
            }
        );

        if (response.data.success && response.data.data?.instrumentResponse?.redirectInfo?.url) {
            res.json({
                success: true,
                transactionId: transaction._id,
                merchantTransactionId: merchantTransactionId,
                redirectUrl: response.data.data.instrumentResponse.redirectInfo.url,
                amount,
            });
        } else {
            // If PhonePe request fails, mark transaction as failed
            transaction.status = 'failed';
            transaction.notes = response.data.message || 'Failed to initiate payment';
            await transaction.save();

            throw new Error(response.data.message || 'Failed to initiate PhonePe payment');
        }
    } catch (error) {
        console.error('PhonePe initiate error:', error.response?.data || error.message);
        res.status(500).json({
            message: error.response?.data?.message || error.message || 'Failed to initiate payment'
        });
    }
});

// @route   GET /api/payments/phonepe/status/:transactionId
// @desc    Check PhonePe payment status
// @access  Private
router.get('/phonepe/status/:transactionId', protect, approvedOnly, async (req, res) => {
    try {
        const { transactionId } = req.params;
        const config = getPhonePeConfig();

        if (!config.merchantId || !config.saltKey) {
            return res.status(500).json({ message: 'PhonePe credentials not configured' });
        }

        // Find the transaction
        const transaction = await Transaction.findById(transactionId);

        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        // If already verified, return success
        if (transaction.status === 'verified') {
            return res.json({
                success: true,
                status: 'verified',
                message: 'Payment already verified',
                transaction,
            });
        }

        // Check status with PhonePe
        const merchantTransactionId = transaction.phonePeMerchantTransactionId;
        const endpoint = `/pg/v1/status/${config.merchantId}/${merchantTransactionId}`;

        const checksum = generatePhonePeChecksum(
            '',
            endpoint,
            config.saltKey,
            config.saltIndex
        );

        const response = await axios.get(
            `${config.baseUrl}${endpoint}`,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'X-VERIFY': checksum,
                    'X-MERCHANT-ID': config.merchantId,
                },
            }
        );

        if (response.data.success && response.data.code === 'PAYMENT_SUCCESS') {
            // Update transaction
            transaction.status = 'verified';
            transaction.phonePeTransactionId = response.data.data?.transactionId || '';
            transaction.transactionId = response.data.data?.transactionId || '';
            transaction.verifiedAt = new Date();
            transaction.notes = 'Payment verified automatically via PhonePe';
            await transaction.save();

            // Update record as paid
            const record = await Record.findById(transaction.record);
            if (record) {
                record.paid = true;
                record.paidDate = new Date();
                record.transactionId = response.data.data?.transactionId || '';
                record.paymentMethod = 'phonepe';
                await record.save();
            }

            const populatedTransaction = await Transaction.findById(transaction._id)
                .populate('tenant', 'name email unit')
                .populate('record');

            res.json({
                success: true,
                status: 'verified',
                message: 'Payment verified successfully',
                transaction: populatedTransaction,
            });
        } else if (response.data.code === 'PAYMENT_PENDING') {
            res.json({
                success: false,
                status: 'pending',
                message: 'Payment is still pending',
            });
        } else {
            transaction.status = 'failed';
            transaction.notes = `Payment failed: ${response.data.message || 'Unknown error'}`;
            await transaction.save();

            res.status(400).json({
                success: false,
                status: 'failed',
                message: response.data.message || 'Payment failed',
            });
        }
    } catch (error) {
        console.error('PhonePe status check error:', error.response?.data || error.message);
        res.status(500).json({
            message: error.response?.data?.message || error.message || 'Failed to check payment status'
        });
    }
});

// @route   POST /api/payments/phonepe/webhook
// @desc    Handle PhonePe payment webhooks
// @access  Public (webhook)
router.post('/phonepe/webhook', express.json(), async (req, res) => {
    try {
        const { response: encodedResponse } = req.body;

        console.log('PhonePe webhook received');

        if (!encodedResponse) {
            return res.status(400).json({ message: 'Invalid webhook payload' });
        }

        // Decode the response
        const decodedResponse = JSON.parse(
            Buffer.from(encodedResponse, 'base64').toString('utf8')
        );

        console.log('PhonePe webhook decoded:', JSON.stringify(decodedResponse, null, 2));

        const merchantTransactionId = decodedResponse.data?.merchantTransactionId;

        if (merchantTransactionId) {
            // Find and update transaction
            const transaction = await Transaction.findOne({
                phonePeMerchantTransactionId: merchantTransactionId
            });

            if (transaction && transaction.status === 'pending') {
                if (decodedResponse.code === 'PAYMENT_SUCCESS') {
                    transaction.status = 'verified';
                    transaction.phonePeTransactionId = decodedResponse.data?.transactionId || '';
                    transaction.transactionId = decodedResponse.data?.transactionId || '';
                    transaction.verifiedAt = new Date();
                    transaction.notes = 'Payment verified via webhook';
                    await transaction.save();

                    // Update record
                    const record = await Record.findById(transaction.record);
                    if (record) {
                        record.paid = true;
                        record.paidDate = new Date();
                        record.paymentMethod = 'phonepe';
                        record.transactionId = decodedResponse.data?.transactionId || '';
                        await record.save();
                    }
                } else if (decodedResponse.code === 'PAYMENT_ERROR' || decodedResponse.code === 'PAYMENT_DECLINED') {
                    transaction.status = 'failed';
                    transaction.notes = `Payment failed: ${decodedResponse.message || 'Unknown error'}`;
                    await transaction.save();
                }
            }
        }

        res.status(200).json({ received: true });
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ message: error.message });
    }
});

export default router;
