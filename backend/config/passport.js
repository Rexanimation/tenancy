import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(email => email.trim()) || [];

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL,
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const email = profile.emails[0].value;
                const googleId = profile.id;
                const name = profile.displayName;
                const profilePicture = profile.photos[0]?.value || '';

                // Check if user exists
                let user = await User.findOne({ googleId });

                if (!user) {
                    // Check if user exists by email (in case they signed in before)
                    user = await User.findOne({ email });
                }

                const isAdmin = adminEmails.includes(email);

                if (user) {
                    // Update existing user
                    user.name = name;

                    // Only update profile picture if user doesn't have a custom uploaded one
                    // (If profilePicture is empty or starts with Google's URL, use Google's picture)
                    if (!user.profilePicture || user.profilePicture.includes('googleusercontent.com')) {
                        user.profilePicture = profilePicture;
                    }

                    // Update role if they're an admin
                    if (isAdmin && user.role !== 'admin') {
                        user.role = 'admin';
                        user.status = 'approved'; // Admins are auto-approved
                    }

                    // Reset rejected users to pending so admin can re-approve/reject
                    if (user.status === 'rejected') {
                        user.status = 'pending';
                    }

                    // Auto-approve returning users who were previously approved
                    if (user.status === 'approved' || user.role === 'admin') {
                        user.status = 'approved';
                    }

                    await user.save();
                } else {
                    // Create new user
                    user = await User.create({
                        googleId,
                        email,
                        name,
                        profilePicture,
                        role: isAdmin ? 'admin' : 'renter',
                        status: isAdmin ? 'approved' : 'pending', // Admins auto-approved, renters need approval
                    });
                }

                return done(null, user);
            } catch (error) {
                return done(error, null);
            }
        }
    )
);

// No serialization needed for JWT-only flow
// passport.serializeUser / deserializeUser removed

export default passport;
