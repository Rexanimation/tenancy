# Tenancy Tracker - Full Stack MERN Application

A comprehensive tenancy and rent management system with Google OAuth authentication, role-based access control, and payment tracking in INR (Indian Rupees).

![Tenancy Tracker](C:/Users/Sahil%20Sharma/.gemini/antigravity/brain/424e6153-dede-4bae-a88e-f35b20e78660/uploaded_image_1765338038294.png)

## Features

### 🔐 Authentication
- Google OAuth 2.0 sign-in
- Role-based access control (Admin/Tenant)
- Admin privileges via email whitelist
- Automatic tenant approval workflow

### 👨‍💼 Admin Panel
- View and manage all tenants
- Add/Edit payment records
- Approve pending tenants
- Filter payments by year, month, and tenant
- Payment verification system
- Setup UPI payment QR codes
- Generate payment receipts
- Real-time revenue statistics

### 🏠 Tenant Panel
- View monthly payment amounts in INR (₹)
- Access payment history
- View dues list (unpaid bills)
- Make payments via UPI QR code
- View payment receipts
- Real-time payment notifications

### 💳 Payment Features
- UPI QR code integration
- Payment gateway support (Razorpay ready)
- Manual payment verification
- Transaction history
- Digital receipt generation

## Tech Stack

### Backend
- Node.js + Express
- MongoDB + Mongoose
- Passport.js (Google OAuth)
- JWT authentication
- Multer (file uploads)

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS
- Axios
- Lucide Icons

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- Google Cloud Console account (for OAuth credentials)

## 🚀 Deployment Guide (Render)

This application is configured for easy deployment on [Render](https://render.com).

### Steps to Deploy

1.  **Push your code to GitHub/GitLab**.
2.  **Create a New Web Service** on Render.
3.  **Connect your repository**.
4.  **Select "Docker"** as the Runtime.
5.  **Environment Variables**: Add the following in the Render dashboard:
    *   `MONGODB_URI`: Your MongoDB Atlas connection string.
    *   `GOOGLE_CLIENT_ID`: From Google Cloud Console.
    *   `GOOGLE_CLIENT_SECRET`: From Google Cloud Console.
    *   `GOOGLE_CALLBACK_URL`: `https://<your-app-name>.onrender.com/auth/google/callback`
    *   `JWT_SECRET`: A random strong string.
    *   `SESSION_SECRET`: A random strong string.
    *   `ADMIN_EMAILS`: Comma-separated list of admin emails.
    *   `FRONTEND_URL`: `https://<your-app-name>.onrender.com` (Same as your Render URL)

### Important - Google OAuth Setup

Once deployed:
1.  Go to **Google Cloud Console**.
2.  Edit your OAuth 2.0 Client credentials.
3.  Add your Render URL to **Authorized JavaScript origins**:
    *   `https://<your-app-name>.onrender.com`
4.  Add your Callback URL to **Authorized redirect URIs**:
    *   `https://<your-app-name>.onrender.com/auth/google/callback`

## Setup Instructions (Local)

### 1. Clone and Install Dependencies

```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ..
npm install
```

### 2. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure consent screen
6. Create OAuth client ID (Web application)
7. Add authorized redirect URIs:
   - `http://localhost:5000/auth/google/callback`
8. Copy Client ID and Client Secret

### 3. Configure Backend Environment

```bash
cd server
cp .env.example .env
```

Edit `server/.env`:

```env
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/tenancy-tracker

# Google OAuth - REPLACE WITH YOUR CREDENTIALS
GOOGLE_CLIENT_ID=your_actual_google_client_id_here
GOOGLE_CLIENT_SECRET=your_actual_google_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:5000/auth/google/callback

# Frontend URL
FRONTEND_URL=http://localhost:5173

# JWT Secret (generate a random string)
JWT_SECRET=your_random_jwt_secret_key

# Admin Emails - REPLACE WITH YOUR ADMIN EMAIL ADDRESSES
ADMIN_EMAILS=admin@example.com,your-admin-email@gmail.com

# Razorpay (Optional)
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

# Session Secret (generate a random string)
SESSION_SECRET=your_random_session_secret
```

**IMPORTANT**: Replace the following:
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` with your actual Google OAuth credentials
- `ADMIN_EMAILS` with email addresses that should have admin access
- `JWT_SECRET` and `SESSION_SECRET` with random secure strings

### 4. Configure Frontend Environment

```bash
# In root directory
cp .env.example .env
```

Edit `.env`:

```env
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your_actual_google_client_id_here
```

### 5. Start MongoDB

```bash
# If using local MongoDB
mongod

# Or use MongoDB Atlas connection string in MONGODB_URI
```

### 6. Start the Application

**Terminal 1 - Backend**:
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend**:
```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## Usage Guide

### First Time Setup

1. **Admin Account**:
   - Sign in with Google using an email listed in `ADMIN_EMAILS`
   - You'll automatically get admin role and access

2. **Tenant Account**:
   - Sign in with Google using any other email
   - Account will be in "pending" status
   - Admin must approve from the Admin Panel → Tenants tab

### Admin Workflow

1. **Approve Tenants**:
   - Go to "Tenants" tab
   - Click "Approve" for pending tenants

2. **Add Payment Records**:
   - Click "Add Record" button
   - Select tenant, month, year
   - Enter rent, electricity, parking amounts
   - Save

3. **Setup Payment QR Code**:
   - Go to Settings (if implemented)
   - Upload UPI QR code image
   - Enter UPI ID

4. **Verify Payments**:
   - View records with "pending" status
   - Click "Mark as Paid" after verifying payment

### Tenant Workflow

1. **View Dues**:
   - Dashboard shows total outstanding amount
   - View dues list with all unpaid bills

2. **Make Payment**:
   - Click "Pay Now"
   - Scan UPI QR code
   - Pay using any UPI app
   - Confirm payment (admin will verify)

3. **View Receipts**:
   - Access payment history
   - View digital receipts for paid bills

## Currency Formatting

All amounts are displayed in Indian Rupees (₹) using the Indian numbering system.

Example: ₹12,50,000 (12.5 lakhs)

## API Endpoints

### Authentication
- `GET /auth/google` - Initiate Google OAuth
- `GET /auth/google/callback` - OAuth callback
- `GET /auth/me` - Get current user
- `POST /auth/logout` - Logout

### Users
- `GET /api/users/tenants` - Get all tenants (admin)
- `PATCH /api/users/:id/approve` - Approve tenant (admin)
- `PATCH /api/users/:id` - Update user profile
- `POST /api/users/upload-picture` - Upload profile picture

### Records
- `GET /api/records` - Get filtered records
- `GET /api/records/tenant/:id` - Get tenant records
- `POST /api/records` - Create record (admin)
- `PATCH /api/records/:id/status` - Update payment status

### Payments
- `GET /api/payments/settings` - Get payment settings
- `POST /api/payments/settings` - Update payment settings (admin)
- `POST /api/payments/initiate` - Initiate payment
- `POST /api/payments/verify` - Verify payment
- `GET /api/payments/receipt/:id` - Get payment receipt
- `GET /api/payments/transactions` - Get transaction history

## Project Structure

```
tenancy-tracker/
├── server/                 # Backend
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── middleware/        # Auth middleware
│   ├── config/            # Passport config
│   ├── uploads/           # Uploaded files
│   └── index.js           # Express server
│
├── components/            # React components
│   ├── AdminDashboard.tsx
│   ├── RenterDashboard.tsx
│   ├── LoginScreen.tsx
│   └── ...
│
├── hooks/                 # Custom React hooks
│   └── useTenancy.ts
│
├── utils/                 # Utilities
│   ├── api.ts            # API client
│   └── currency.ts       # INR formatting
│
├── types.ts              # TypeScript types
├── App.tsx               # Main app
└── index.tsx             # Entry point
```

## Security Notes

- Never commit `.env` files to version control
- Use strong, random values for `JWT_SECRET` and `SESSION_SECRET`
- Keep Google OAuth credentials secure
- Admin emails are case-sensitive

## Troubleshooting

### Google OAuth Not Working
- Verify Google OAuth credentials in `.env`
- Check authorized redirect URIs in Google Console
- Ensure callback URL matches exactly

### Database Connection Failed
- Ensure MongoDB is running
- Check `MONGODB_URI` in `.env`
- Verify network connectivity

### Admin Access Issues
- Verify your email is in `ADMIN_EMAILS`
- Check email spelling and case sensitivity
- Clear browser cookies and try again

## Future Enhancements

- Razorpay automated payment gateway
- Email notifications
- PDF receipt generation
- Bulk payment record upload
- Mobile app (React Native)

## License

MIT

## Support

For issues or questions, please create an issue in the repository or contact the development team.
