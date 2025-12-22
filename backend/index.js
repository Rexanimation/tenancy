import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';
import passport from './config/passport.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import cookieParser from 'cookie-parser';

// Routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import recordRoutes from './routes/records.js';
import paymentRoutes from './routes/payments.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Ensure upload directories exist
const uploadDirs = ['uploads/profiles', 'uploads/qr'];
uploadDirs.forEach(dir => {
    const fullPath = path.join(__dirname, dir);
    if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
    }
});

// Middleware
app.use(cookieParser());
app.use(cors({
    origin: [
        'http://localhost:5173',
        'https://tenancy-frontend.onrender.com',
        'https://tenancy-backend-2511.onrender.com',
        process.env.FRONTEND_URL
    ].filter(Boolean),
    credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'your_session_secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
    }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Serve static files (uploaded images)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/payments', paymentRoutes);

// Health check route
app.get('/', (req, res) => {
    res.json({ status: 'Backend is running 🚀' });
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: err.message || 'Something went wrong!' });
});

// Database connection
const PORT = process.env.PORT || 5000;

const connectDB = async () => {
    try {
        let mongoURI = process.env.MONGODB_URI;

        if (process.env.NODE_ENV === 'production') {
            if (!mongoURI) {
                console.error('❌ FATAL ERROR: MONGODB_URI environment variable is not defined.');
                console.error('👉 Tip: Add MONGODB_URI to your Render Environment Variables.');
                process.exit(1);
            }
            if (mongoURI.includes('localhost') || mongoURI.includes('127.0.0.1')) {
                console.warn('⚠️ WARNING: MONGODB_URI contains "localhost" in production mode. This will likely fail.');
            }
        } else {
            // Fallback for local development only
            if (!mongoURI) {
                console.log('ℹ️  MONGODB_URI not found, falling back to local database.');
                mongoURI = 'mongodb://localhost:27017/tenancy-tracker';
            }
        }

        console.log(`⏳ Connecting to MongoDB... (${process.env.NODE_ENV === 'production' ? 'Production' : 'Development'})`);

        await mongoose.connect(mongoURI, {
            serverSelectionTimeoutMS: 5000, // Fail fast after 5s
        });

        console.log('✅ Connected to MongoDB');

        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            if (process.env.FRONTEND_URL) {
                console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL}`);
            }
            console.log(`🔑 Google Callback URL: ${process.env.GOOGLE_CALLBACK_URL || 'NOT SET (OAuth will fail)'}`);
        });

    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error.message);
        if (error.name === 'MongooseServerSelectionError') {
            console.error('👉 Check if your IP is whitelisted in MongoDB Atlas (Network Access -> Allow 0.0.0.0/0)');
            console.error('👉 Check if your username/password in the connection string are correct.');
        }
        process.exit(1);
    }
};

connectDB();

export default app;
