import express from 'express';
import passport from '../config/passport.js';
import jwt from 'jsonwebtoken';
import { protect } from '../middleware/auth.js';

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

        res.cookie('token', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.redirect("https://tenancy-frontend.onrender.com");
    }
);

// @route   GET /auth/me
// @desc    Get current logged-in user
router.get('/me', protect, (req, res) => {
    res.json(req.user);
});

// @route   POST /auth/logout
// @desc    Logout user
router.post('/logout', (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: true,
        sameSite: 'none'
    });
    res.json({ message: 'Logged out successfully' });
});

export default router;
