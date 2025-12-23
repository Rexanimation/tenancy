import express from 'express';
import passport from '../config/passport.js';
import jwt from 'jsonwebtoken';
import { protect } from '../middleware/auth.js';
import User from '../models/User.js'; // Import User model

const router = express.Router();

// @route   GET /auth/google
// @desc    Initiate Google OAuth
// @route   GET /auth/google
// @desc    Initiate Google OAuth
router.get('/google', (req, res, next) => {
    const role = req.query.role || 'renter';
    const state = JSON.stringify({ role });

    passport.authenticate('google', {
        scope: ['profile', 'email'],
        state
    })(req, res, next);
});

// @route   GET /auth/google/callback
// @desc    Google OAuth callback
router.get(
    '/google/callback',
    passport.authenticate('google', { session: false }),
    (req, res) => {
        const user = req.user;

        const token = jwt.sign(
            {
                id: user._id,
                email: user.email,
                role: user.role,
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // res.cookie('token', token, { ... }); // Cookie approach failed due to cross-subdomain restrictions

        // Redirect with token in URL (Frontend will save to LocalStorage)
        res.redirect(`${process.env.FRONTEND_URL}/login?token=${token}`);
    }
);

// @route   GET /auth/me
// @desc    Get current logged-in user (Silent Auth)
router.get('/me', async (req, res) => {
    try {
        const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.json(null); // Return null instead of 401 to avoid console errors
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-__v');

        if (!user) {
            return res.json(null);
        }

        res.json(user);
    } catch (error) {
        return res.json(null); // Invalid token -> null
    }
});

// @route   POST /auth/logout
// @desc    Logout user
router.post('/logout', (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/'
    });
    res.json({ message: 'Logged out successfully' });
});

export default router;
