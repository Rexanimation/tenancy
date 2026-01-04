import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import path from 'path';
import { protect, adminOnly } from '../middleware/auth.js';
import User from '../models/User.js';
import PaymentSettings from '../models/PaymentSettings.js';

const router = express.Router();

// Configure multer for profile picture uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/profiles/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'));
        }
    }
});

// @route   GET /api/users/tenants
// @desc    Get all tenants (admin only)
// @access  Private (Admin)
router.get('/tenants', protect, adminOnly, async (req, res) => {
    try {
        const tenants = await User.find({ role: 'renter' }).sort({ createdAt: -1 });
        res.json(tenants);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PATCH /api/users/:id/approve
// @desc    Approve a pending tenant
// @access  Private (Admin)
router.patch('/:id/approve', protect, adminOnly, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.role !== 'renter') {
            return res.status(400).json({ message: 'Can only approve renters' });
        }

        user.status = 'approved';
        await user.save();

        res.json({ message: 'Tenant approved successfully', user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PATCH /api/users/:id/reject
// @desc    Reject a pending tenant
// @access  Private (Admin)
router.patch('/:id/reject', protect, adminOnly, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.role !== 'renter') {
            return res.status(400).json({ message: 'Can only reject renters' });
        }

        user.status = 'rejected';
        await user.save();

        res.json({ message: 'Tenant rejected successfully', user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PATCH /api/users/:id
// @desc    Update user profile
// @access  Private
router.patch('/:id', protect, async (req, res) => {
    try {
        const { name, unit, rentAmount, electricityRate, electricityUnits, municipalFee, parkingCharges, penalties, dues, upiId } = req.body;

        // Users can only update their own profile, unless they're admin
        if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (name !== undefined) user.name = name;
        if (unit !== undefined) user.unit = unit;
        if (rentAmount !== undefined) user.rentAmount = rentAmount;
        if (electricityRate !== undefined && req.user.role === 'admin') user.electricityRate = electricityRate;
        if (electricityUnits !== undefined && req.user.role === 'admin') user.electricityUnits = electricityUnits;
        if (municipalFee !== undefined && req.user.role === 'admin') user.municipalFee = municipalFee;
        if (parkingCharges !== undefined && req.user.role === 'admin') user.parkingCharges = parkingCharges;
        if (penalties !== undefined && req.user.role === 'admin') user.penalties = penalties;
        if (dues !== undefined && req.user.role === 'admin') user.dues = dues;
        if (upiId !== undefined && req.user.role === 'admin') user.upiId = upiId;

        await user.save();

        res.json({ message: 'Profile updated successfully', user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/users/upload-picture
// @desc    Upload profile picture
// @access  Private
router.post('/upload-picture', protect, upload.single('profilePicture'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const user = await User.findById(req.user._id);
        user.profilePicture = `/uploads/profiles/${req.file.filename}`;
        await user.save();

        res.json({ message: 'Profile picture uploaded successfully', profilePicture: user.profilePicture });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   DELETE /api/users/:id
// @desc    Delete a tenant account
// @access  Private (Admin)
router.delete('/:id', protect, adminOnly, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.role !== 'renter') {
            return res.status(400).json({ message: 'Can only delete renters' });
        }

        // Delete all records associated with this tenant
        const Record = mongoose.model('Record');
        await Record.deleteMany({ tenant: req.params.id });

        // Delete the user
        await User.findByIdAndDelete(req.params.id);

        res.json({ message: 'Tenant and their records deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
