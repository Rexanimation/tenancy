import express from 'express';
import passport from '../config/passport.js';
import { generateToken } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /auth/google
// @desc    Initiate Google OAuth
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));

// @route   GET /auth/google/callback
// @desc    Google OAuth callback
router.get(
    '/google/callback',
    passport.authenticate('google', {
        failureRedirect: process.env.FRONTEND_URL,
        session: false
    }),
    (req, res) => {
        // Check if user is approved
        if (req.user.status !== 'approved') {
            // Redirect to frontend with pending status
            return res.redirect(`${process.env.FRONTEND_URL}?status=pending&message=Your account is pending approval`);
        }

        // Generate JWT token
        const token = generateToken(req.user._id);

        // Redirect to frontend with token
        res.redirect(`${process.env.FRONTEND_URL}?token=${token}`);
    }
);

// @route   GET /auth/me
// @desc    Get current logged-in user
router.get('/me', async (req, res) => {
    try {
        // Extract token from header
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const jwt = await import('jsonwebtoken');
        const decoded = jwt.default.verify(token, process.env.JWT_SECRET);

        const User = (await import('../models/User.js')).default;
        const user = await User.findById(decoded.id).select('-__v');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        res.status(401).json({ message: 'Not authorized' });
    }
});

// @route   POST /auth/logout
// @desc    Logout user (client-side token removal)
router.post('/logout', (req, res) => {
    res.json({ message: 'Logged out successfully' });
});

export default router;
