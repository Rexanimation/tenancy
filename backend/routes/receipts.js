import express from 'express';
import { protect, approvedOnly } from '../middleware/auth.js';
import Receipt from '../models/Receipt.js';
import Record from '../models/Record.js';
import User from '../models/User.js';
import path from 'path';
import { createReceipt } from '../utils/receiptManager.js';

const router = express.Router();

// @route   GET /api/receipts
// @desc    Get all receipts (Admin sees all, renter sees own)
// @access  Private
router.get('/', protect, approvedOnly, async (req, res) => {
    try {
        let query = {};
        if (req.user.role === 'renter') {
            query.tenant = req.user._id;
        }
        const receipts = await Receipt.find(query)
            .populate('tenant', 'name email unit')
            .populate('record')
            .sort({ createdAt: -1 });
        res.json(receipts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/receipts/record/:recordId/download
// @desc    Download receipt PDF by record ID (generates on-the-fly if missing)
// @access  Private
router.get('/record/:recordId/download', protect, approvedOnly, async (req, res) => {
    try {
        let receipt = await Receipt.findOne({ record: req.params.recordId }).populate('record');
        
        if (!receipt) {
            // Generate on-the-fly if the record is paid but receipt doesn't exist
            const record = await Record.findById(req.params.recordId);
            if (record && record.paid) {
                const tenant = await User.findById(record.tenant);
                if (tenant) {
                    const billTotal = record.rent + record.electricity + record.parking + (record.municipalFee || 0) + (record.penalties || 0) + (record.dues || 0) - (record.advanceCredit || 0);
                    const amount = record.paidAmount || (billTotal > 0 ? billTotal : 0);
                    const socketIo = req.app.get('socketio');
                    receipt = await createReceipt(record, tenant, amount, record.paymentMethod || 'cash', record.transactionId, socketIo);
                }
            }
        }

        if (!receipt) {
            return res.status(404).json({ message: 'Receipt not found' });
        }

        // Check ownership
        if (req.user.role === 'renter' && receipt.tenant.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const filepath = path.join(process.cwd(), receipt.pdfUrl);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Rent_Receipt_${receipt.record.month}_${receipt.record.year}.pdf`);
        res.sendFile(filepath);
    } catch (error) {
        console.error('Error serving receipt PDF by record:', error);
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/receipts/:id/download
// @desc    Download receipt PDF by receipt ID
// @access  Private
router.get('/:id/download', protect, approvedOnly, async (req, res) => {
    try {
        const receipt = await Receipt.findById(req.params.id).populate('record');
        if (!receipt) {
            return res.status(404).json({ message: 'Receipt not found' });
        }

        // Check ownership
        if (req.user.role === 'renter' && receipt.tenant.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const filepath = path.join(process.cwd(), receipt.pdfUrl);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Rent_Receipt_${receipt.record.month}_${receipt.record.year}.pdf`);
        res.sendFile(filepath);
    } catch (error) {
        console.error('Error serving receipt PDF by ID:', error);
        res.status(500).json({ message: error.message });
    }
});

export default router;
