import express from 'express';
import { protect, adminOnly, approvedOnly } from '../middleware/auth.js';
import Record from '../models/Record.js';
import User from '../models/User.js';

const router = express.Router();

// @route   GET /api/records
// @desc    Get filtered records
// @access  Private
router.get('/', protect, approvedOnly, async (req, res) => {
    try {
        const { year, month, tenantId, paid } = req.query;

        let query = {};

        // If user is renter, only show their records
        if (req.user.role === 'renter') {
            query.tenant = req.user._id;
        }

        // Apply filters
        if (year) query.year = year;
        if (month && month !== 'All') query.month = month;
        if (tenantId && tenantId !== 'All') query.tenant = tenantId;
        if (paid !== undefined) query.paid = paid === 'true';

        const records = await Record.find(query)
            .populate('tenant', 'name email unit rentAmount')
            .sort({ date: -1 });

        res.json(records);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/records/tenant/:id
// @desc    Get records for specific tenant
// @access  Private
router.get('/tenant/:id', protect, approvedOnly, async (req, res) => {
    try {
        // Renters can only view their own records
        if (req.user.role === 'renter' && req.user._id.toString() !== req.params.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const records = await Record.find({ tenant: req.params.id })
            .populate('tenant', 'name email unit rentAmount')
            .sort({ date: -1 });

        res.json(records);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/records
// @desc    Create new record
// @access  Private (Admin)
router.post('/', protect, adminOnly, async (req, res) => {
    try {
        const { tenantId, month, year, rent, electricity, electricityUnits, electricityRate, municipalFee, parking, penalties, dues, advanceCredit, paid } = req.body;

        // Validate tenant exists
        const tenant = await User.findById(tenantId);
        if (!tenant || tenant.role !== 'renter') {
            return res.status(404).json({ message: 'Tenant not found' });
        }

        // Create date (first day of the month)
        const date = `${year}-${String(['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].indexOf(month) + 1).padStart(2, '0')}-01`;

        // Check if record already exists for this tenant/month/year
        const existingRecord = await Record.findOne({
            tenant: tenantId,
            month: month,
            year: year
        });

        let record;
        let wasUpdated = false;

        if (existingRecord) {
            // Update existing record instead of creating new one
            existingRecord.rent = Number(rent);
            existingRecord.electricity = Number(electricity);
            existingRecord.electricityUnits = Number(electricityUnits) || 0;
            existingRecord.electricityRate = Number(electricityRate) || 0;
            existingRecord.municipalFee = Number(municipalFee) || 0;
            existingRecord.parking = Number(parking);
            existingRecord.penalties = Number(penalties) || 0;
            existingRecord.dues = Number(dues) || 0;
            existingRecord.advanceCredit = Number(advanceCredit) || 0;
            existingRecord.date = date;
            // Don't change paid status if already paid
            if (!existingRecord.paid) {
                existingRecord.paid = paid || false;
            }
            await existingRecord.save();
            record = existingRecord;
            wasUpdated = true;
        } else {
            // Create new record
            record = await Record.create({
                tenant: tenantId,
                month,
                year,
                rent: Number(rent),
                electricity: Number(electricity),
                electricityUnits: Number(electricityUnits) || 0,
                electricityRate: Number(electricityRate) || 0,
                municipalFee: Number(municipalFee) || 0,
                parking: Number(parking),
                penalties: Number(penalties) || 0,
                dues: Number(dues) || 0,
                advanceCredit: Number(advanceCredit) || 0,
                paid: paid || false,
                date,
            });
        }

        // Clear tenant's dues and advance after they're used in a bill
        if (Number(dues) > 0 || Number(advanceCredit) > 0) {
            tenant.dues = Math.max(0, (tenant.dues || 0) - Number(dues));
            tenant.advancePaid = Math.max(0, (tenant.advancePaid || 0) - Number(advanceCredit));
            await tenant.save();
        }

        const populatedRecord = await Record.findById(record._id).populate('tenant', 'name email unit rentAmount');

        res.status(wasUpdated ? 200 : 201).json({
            ...populatedRecord.toObject(),
            _wasUpdated: wasUpdated,
            message: wasUpdated ? `Bill for ${month} ${year} was updated (previous bill existed)` : undefined
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/records/:id
// @desc    Update a specific record
// @access  Private (Admin)
router.put('/:id', protect, adminOnly, async (req, res) => {
    try {
        const { rent, electricity, electricityUnits, electricityRate, municipalFee, parking, penalties, dues, advanceCredit, paid, month, year } = req.body;

        const record = await Record.findById(req.params.id);

        if (!record) {
            return res.status(404).json({ message: 'Record not found' });
        }

        // Optional: Check conflicts if month/year changed? 
        // For now, let's assume admin knows what they are doing or we can rely on unique compound index if it existed (it doesn't seem to enforce uniqueness at db level yet strictly aside from logic).
        // Let's just update fields.

        if (month) record.month = month;
        if (year) record.year = year;
        if (rent !== undefined) record.rent = Number(rent);
        if (electricity !== undefined) record.electricity = Number(electricity);
        if (electricityUnits !== undefined) record.electricityUnits = Number(electricityUnits);
        if (electricityRate !== undefined) record.electricityRate = Number(electricityRate);
        if (municipalFee !== undefined) record.municipalFee = Number(municipalFee);
        if (parking !== undefined) record.parking = Number(parking);
        if (penalties !== undefined) record.penalties = Number(penalties);
        if (dues !== undefined) record.dues = Number(dues);
        if (advanceCredit !== undefined) record.advanceCredit = Number(advanceCredit);

        // Update date if month/year changed
        if (month || year) {
            const newMonth = month || record.month;
            const newYear = year || record.year;
            record.date = `${newYear}-${String(['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].indexOf(newMonth) + 1).padStart(2, '0')}-01`;
        }

        if (paid !== undefined) {
            record.paid = paid;
            if (paid && !record.paidDate) {
                record.paidDate = new Date();
            } else if (!paid) {
                record.paidDate = undefined;
                record.transactionId = undefined;
                record.paymentMethod = undefined;
            }
        }

        await record.save();

        const populatedRecord = await Record.findById(record._id).populate('tenant', 'name email unit rentAmount');
        res.json(populatedRecord);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PATCH /api/records/:id/status
// @desc    Update payment status
// @access  Private (Admin)
router.patch('/:id/status', protect, adminOnly, async (req, res) => {
    try {
        const { paid, transactionId, paymentMethod } = req.body;

        const record = await Record.findById(req.params.id);

        if (!record) {
            return res.status(404).json({ message: 'Record not found' });
        }

        record.paid = paid;
        if (paid) {
            record.paidDate = new Date();
            if (transactionId) record.transactionId = transactionId;
            if (paymentMethod) record.paymentMethod = paymentMethod;
        }

        await record.save();

        const populatedRecord = await Record.findById(record._id).populate('tenant', 'name email unit rentAmount');

        res.json(populatedRecord);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   DELETE /api/records/:id
// @desc    Delete a record
// @access  Private (Admin)
router.delete('/:id', protect, adminOnly, async (req, res) => {
    try {
        const record = await Record.findById(req.params.id);

        if (!record) {
            return res.status(404).json({ message: 'Record not found' });
        }

        await record.deleteOne();

        res.json({ message: 'Record deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
