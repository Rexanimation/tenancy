# Tenancy Tracker - Code Structure

## Project Overview
A full-stack tenancy management application for tracking rent payments, generating bills, and managing tenant records.

## Tech Stack
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + MongoDB
- **Auth**: Passport.js (Google OAuth)
- **Payments**: Razorpay Integration
- **Email**: Nodemailer (Gmail SMTP)
- **PDF**: PDFKit
- **Deployment**: Render

---

## Root Directory Structure
```
tenancy-tracker/
├── backend/          # Node.js/Express Backend
├── frontend/         # React/TypeScript Frontend
├── .gitignore
├── render.yaml       # Render deployment config
└── CODE_STRUCTURE.md # This file
```

---

## Backend Structure (`backend/`)

### Core Files
- **`index.js`**: Main entry point, server setup, MongoDB connection, cron job initialization
- **`package.json`**: Backend dependencies and scripts
- **`.env.example`**: Environment variable template

### Config (`config/`)
- **`passport.js`**: Passport.js configuration for Google OAuth authentication

### Middleware (`middleware/`)
- **`auth.js`**: Authentication middleware (`protect`, `adminOnly`, `approvedOnly`)

### Models (`models/`)
- **`User.js`**: User model (tenants and admins)
- **`Record.js`**: Billing record model (rent, electricity, parking, etc.)
- **`Transaction.js`**: Payment transaction model
- **`PaymentSettings.js`**: Payment settings model (UPI, QR code)

### Routes (`routes/`)
- **`auth.js`**: Authentication routes (login, logout, Google OAuth)
- **`users.js`**: User management routes (approve/reject tenants, profile)
- **`records.js`**: Billing record routes (CRUD operations)
- **`payments.js`**: Payment routes (Razorpay, receipts, PDF download)

### Utils (`utils/`)
- **`emailService.js`**: Email sending service (Nodemailer)
- **`emailTemplates.js`**: HTML email templates for all notifications
- **`pdfService.js`**: PDF receipt generation (PDFKit)
- **`cronService.js`**: Daily payment reminder cron job (9:00 AM IST)

---

## Frontend Structure (`frontend/`)

### Core Files
- **`index.tsx`**: React entry point
- **`App.tsx`**: Main app component with routing
- **`index.html`**: HTML template
- **`index.css`**: Global styles (Tailwind imports)
- **`types.ts`**: TypeScript type definitions
- **`package.json`**: Frontend dependencies and scripts
- **`vite.config.ts`**: Vite configuration
- **`tailwind.config.js`**: Tailwind CSS configuration
- **`tsconfig.json`**: TypeScript configuration

### Components (`components/`)
- **`PublicHome.tsx`**: Landing page
- **`LoginScreen.tsx`**: Login screen with Google OAuth
- **`ProtectedRoute.tsx`**: Protected route wrapper
- **`PendingApproval.tsx`**: Pending approval screen for new tenants
- **`AdminDashboard.tsx`**: Admin dashboard (overview, tenants, records)
- **`RenterDashboard.tsx`**: Tenant dashboard (billing, payments)
- **`TenantBillingPage.tsx`**: Tenant billing details page
- **`AddRecordModal.tsx`**: Modal for adding new billing records
- **`PaymentPage.tsx`**: Payment page (UPI, Razorpay)
- **`PaymentReceipt.tsx`**: Payment receipt viewer with PDF download
- **`PaymentConfirmationModal.tsx`**: Payment confirmation modal
- **`AdminPaymentSettings.tsx`**: Admin payment settings (UPI, QR code)
- **`ProfilePictureUpload.tsx`**: Profile picture upload component
- **`NotificationsPanel.tsx`**: Notifications panel
- **`Terms.tsx`**: Terms of service page
- **`Privacy.tsx`**: Privacy policy page

### Hooks (`hooks/`)
- **`useTenancy.ts`**: Custom hook for tenancy state management

### Utils (`utils/`)
- **`api.ts`**: Axios API client with all API endpoints
- **`currency.ts`**: Currency formatting utilities (INR)
- **`images.ts`**: Image utilities

### Public (`public/`)
- Static assets

---

## Key Features
1. **User Authentication**: Google OAuth for tenants and admins
2. **Tenant Management**: Approve/reject tenants, view tenant list
3. **Billing Records**: Create, view, edit billing records
4. **Payments**: Razorpay integration, manual payments
5. **Receipts**: PDF receipt generation and download
6. **Email Notifications**:
   - Tenant approval/rejection
   - Bill generation
   - Payment confirmation (with PDF receipt)
   - Daily payment reminders (9:00 AM IST)
   - Admin notifications (login, bill generated, payment received)
7. **Profile Management**: Upload profile picture, update details

---

## Environment Variables

### Backend (.env)
```
MONGO_URI=mongodb://localhost:27017/tenancy-tracker
PORT=5000
SESSION_SECRET=your-session-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/auth/google/callback
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER_SAHIL=sahil@example.com
SMTP_PASS_SAHIL=your-app-password
SMTP_USER_NICK=nick@example.com
SMTP_PASS_NICK=your-app-password
EMAIL_FROM=noreply@tenancy-tracker.com
ADMIN_EMAILS=admin1@example.com,admin2@example.com
NODE_ENV=development
```

### Frontend (.env.development / .env.production)
```
VITE_API_URL=http://localhost:5000
```

---

## Deployment (Render)
- Backend: Render Web Service
- Frontend: Render Static Site
- Database: MongoDB Atlas (or Render MongoDB)
- Configuration: `render.yaml`

---

## API Endpoints

### Auth
- `GET /auth/google` - Google OAuth login
- `GET /auth/google/callback` - Google OAuth callback
- `GET /auth/me` - Get current user
- `POST /auth/logout` - Logout

### Users
- `GET /api/users/tenants` - Get all tenants (admin)
- `PATCH /api/users/:id/approve` - Approve tenant (admin)
- `PATCH /api/users/:id/reject` - Reject tenant (admin)
- `PATCH /api/users/:id` - Update user profile
- `DELETE /api/users/:id` - Delete tenant (admin)
- `POST /api/users/upload-picture` - Upload profile picture

### Records
- `GET /api/records` - Get all billing records
- `GET /api/records/tenant/:id` - Get tenant's records
- `POST /api/records` - Create new record (admin)
- `PUT /api/records/:id` - Update record (admin)
- `PATCH /api/records/:id/status` - Update payment status
- `DELETE /api/records/:id` - Delete record (admin)

### Payments
- `GET /api/payments/settings` - Get payment settings
- `POST /api/payments/settings` - Update payment settings (admin)
- `POST /api/payments/razorpay/order` - Create Razorpay order
- `POST /api/payments/razorpay/verify` - Verify Razorpay payment
- `GET /api/payments/transactions` - Get payment transactions
- `GET /api/payments/receipt/:id` - Get single receipt
- `GET /api/payments/receipt/:id/pdf` - Download receipt as PDF
