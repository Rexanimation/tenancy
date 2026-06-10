import express from 'express';
import LocalityRate from '../models/LocalityRate.js';
import { protect, approvedOnly } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/locality-rates
// @desc    Get all configured locality rates
// @access  Private
router.get('/', protect, approvedOnly, async (req, res) => {
    try {
        const rates = await LocalityRate.find({}).sort({ town: 1, city: 1, locality: 1 });
        res.json(rates);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
