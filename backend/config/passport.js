import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(email => email.trim().toLowerCase()) || [];

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL,
            passReqToCallback: true // Enable access to req in callback
        },
        async (req, accessToken, refreshToken, profile, done) => {
            try {
                const email = profile.emails[0].value;
                const googleId = profile.id;
                const name = profile.displayName;
                const profilePicture = profile.photos[0]?.value || '';

                // Decode state to get requested role
                let requestedRole = 'renter';
                try {
                    if (req.query.state) {
                        const state = JSON.parse(req.query.state);
                        requestedRole = state.role || 'renter';
                    }
                } catch (e) {
                    console.error('Error parsing OAuth state:', e);
                }

                // Check if user exists
                let user = await User.findOne({ googleId });

                if (!user) {
                    // Check if user exists by email (in case they signed in before)
                    user = await User.findOne({ email });
                }

                const isAdmin = adminEmails.includes(email.toLowerCase());

                // If user requests admin role but is not in adminEmails list, force renter
                if (requestedRole === 'admin' && !isAdmin) {
                    requestedRole = 'renter';
                }

                // If user is in adminEmails, force admin
                if (isAdmin) {
                    requestedRole = 'admin';
                }

                if (user) {
                    // Update existing user
                    user.name = name;

                    // Only update profile picture if user doesn't have a custom uploaded one
                    if (!user.profilePicture || user.profilePicture.includes('googleusercontent.com')) {
                        user.profilePicture = profilePicture;
                    }

                    // For EXISTING users, we generally DO NOT change their role based on the login toggle
                    // strictly to avoid security issues or confusion.
                    // However, if they were rejected, we reset them to pending if they try again?
                    // Let's stick to: EXISTING roles are persistent.

                    if (isAdmin && user.role !== 'admin') {
                        user.role = 'admin';
                        user.status = 'approved';
                    }

                    if (user.status === 'rejected') {
                        user.status = 'pending';
                    }

                    // Auto-approve returning users who were previously approved
                    if (user.status === 'approved' || user.role === 'admin') {
                        user.status = 'approved';
                    }

                    await user.save();
                } else {
                    // Create new user with REQUESTED role
                    user = await User.create({
                        googleId,
                        email,
                        name,
                        profilePicture,
                        role: requestedRole,
                        status: requestedRole === 'admin' ? 'approved' : 'pending',
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
