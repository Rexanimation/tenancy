# Tenancy Tracker - Comprehensive Project Documentation

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture Overview](#architecture-overview)
3. [Technology Stack](#technology-stack)
4. [Database Models & ER Diagram](#database-models--er-diagram)
5. [Data Flow Diagram (DFD)](#data-flow-diagram-dfd)
6. [API Endpoints](#api-endpoints)
7. [Frontend Components](#frontend-components)
8. [Key Features](#key-features)
9. [Installation & Setup](#installation--setup)
10. [Running the Project](#running-the-project)
11. [Important Services & Utilities](#important-services--utilities)
12. [Project Structure](#project-structure)
13. [Major Dependencies & Purpose](#major-dependencies--purpose)
14. [Deployment Information](#deployment-information)

---

## 🎯 Project Overview

**Tenancy Tracker** is a comprehensive rental management system designed to streamline property management, tenant communication, and payment processing. It facilitates landlords (admins) and tenants (renters) in managing rental properties, tracking payments, managing utilities, and handling financial transactions.

### Key Objectives:
- Simplify rent and utility payment management
- Provide transparent billing and payment tracking
- Enable automated payment reminders
- Offer multiple payment methods (UPI, Cash, Bank Transfer, Razorpay)
- Facilitate digital receipt and invoice generation
- Streamline tenant approval workflow

---

## 🏗️ Architecture Overview

### System Architecture Pattern: **Client-Server Model**

```
┌─────────────────────┐
│   Frontend (React)  │
│   - TypeScript      │
│   - Vite            │
│   - Tailwind CSS    │
└──────────┬──────────┘
           │ HTTP/HTTPS
           │ REST API
           ↓
┌─────────────────────────────────────┐
│    Backend (Node.js/Express)        │
│  ┌─────────────────────────────────┐│
│  │   Routes & Controllers          ││
│  │  - Auth, Users, Records,        ││
│  │    Payments, Payment Settings   ││
│  └─────────────────────────────────┘│
│  ┌─────────────────────────────────┐│
│  │   Services & Utilities          ││
│  │  - Email, PDF, Cron, Passport   ││
│  └─────────────────────────────────┘│
└──────────┬──────────────────────────┘
           │
    ┌──────┴──────┬───────────┬──────────┐
    ↓             ↓           ↓          ↓
┌────────┐  ┌─────────┐ ┌────────┐ ┌─────────┐
│MongoDB │  │ Razorpay│ │ Gmail  │ │ Google  │
│ Atlas  │  │ Payment │ │ SMTP   │ │ OAuth   │
└────────┘  └─────────┘ └────────┘ └─────────┘
```

### Core Layers:
1. **Presentation Layer**: React Frontend with TypeScript
2. **Application Layer**: Express.js API Server
3. **Business Logic Layer**: Controllers, Middleware, Services
4. **Data Layer**: MongoDB with Mongoose ODM
5. **External Services**: Payment Gateway, Email, OAuth

---

## 💻 Technology Stack

### Frontend
- **Framework**: React 18.2.0
- **Language**: TypeScript 5.3.3
- **Build Tool**: Vite 7.2.7
- **Styling**: Tailwind CSS 3.3.6
- **HTTP Client**: Axios 1.6.2
- **Routing**: React Router DOM 7.11.0
- **Icons**: Lucide React 0.296.0

### Backend
- **Runtime**: Node.js
- **Framework**: Express 4.18.2
- **Language**: JavaScript (ES Modules)
- **Database**: MongoDB with Mongoose 8.0.3
- **Authentication**: Passport.js 0.7.0 with Google OAuth 2.0
- **Payment Gateway**: Razorpay 2.9.6
- **Email Service**: Nodemailer 8.0.8
- **Task Scheduling**: node-cron 4.2.1
- **File Upload**: Multer 1.4.5-lts.1
- **JWT**: jsonwebtoken 9.0.3
- **PDF Generation**: PDFKit 0.18.0
- **Utilities**: dotenv, cors, cookie-parser

### Deployment
- **Backend Hosting**: Render.com
- **Frontend Hosting**: Render.com (Static)
- **Database**: MongoDB Atlas
- **Package Manager**: npm

---

## 📊 Database Models & ER Diagram

### ER Diagram (Entity Relationship)

```
┌──────────────────────┐
│        User          │
├──────────────────────┤
│ _id (PK)             │
│ googleId (Unique)    │
│ name                 │
│ email (Unique)       │
│ profilePicture       │
│ role (admin/renter)  │
│ status (pending/...) │
│ unit                 │
│ rentAmount           │
│ electricityRate      │
│ municipalFee         │
│ parkingCharges       │
│ electricityUnits     │
│ penalties            │
│ dues                 │
│ advancePaid          │
│ upiId                │
│ timestamps           │
└──────────────────────┘
         │
         │ 1:N
         ↓
┌──────────────────────────────┐
│       Record                 │
├──────────────────────────────┤
│ _id (PK)                     │
│ tenant (FK → User)           │
│ month                        │
│ year                         │
│ rent                         │
│ electricity                  │
│ electricityUnits             │
│ electricityRate              │
│ municipalFee                 │
│ parking                      │
│ penalties                    │
│ dues                         │
│ advanceCredit                │
│ paid (Boolean)               │
│ paidAmount                   │
│ date                         │
│ paidDate                     │
│ transactionId                │
│ paymentMethod                │
│ timestamps                   │
│ Index: tenant+year+month     │
│ Index: paid                  │
└──────────────────────────────┘
         │
         │ 1:N
         ↓
┌──────────────────────────────┐
│     Transaction              │
├──────────────────────────────┤
│ _id (PK)                     │
│ record (FK → Record)         │
│ tenant (FK → User)           │
│ amount                       │
│ paymentMethod                │
│ transactionId                │
│ razorpayOrderId              │
│ razorpayPaymentId            │
│ status (pending/verified/..) │
│ verifiedBy (FK → User)       │
│ verifiedAt                   │
│ notes                        │
│ timestamps                   │
│ Index: tenant+createdAt      │
│ Index: status                │
└──────────────────────────────┘

┌──────────────────────────────┐
│   PaymentSettings            │
├──────────────────────────────┤
│ _id (PK)                     │
│ adminId (FK → User, Unique)  │
│ upiId                        │
│ qrCodePath                   │
│ timestamps                   │
└──────────────────────────────┘
```

### Model Details:

#### **User Model**
- Represents both Admins and Renters
- Stores personal info, financial charges, and UPI details
- Three roles: `admin`, `renter`
- Three approval statuses: `pending`, `approved`, `rejected`
- Integrates with Google OAuth via `googleId`

#### **Record Model**
- Monthly billing record for each tenant
- Aggregates all charges: rent, utilities, fees, penalties
- Tracks payment status and method
- Contains calculation indices for efficient queries
- Supports multiple payment methods

#### **Transaction Model**
- Logs all payment attempts and completions
- Maintains Razorpay integration data
- Allows admin verification of payments
- Tracks payment status throughout lifecycle

#### **PaymentSettings Model**
- Stores admin payment configuration
- Contains UPI ID and QR code path for payments
- One-to-One relationship with Admin user

---

## 📈 Data Flow Diagram (DFD)

### Level 0 - System Context

```
┌──────────────────┐
│  External Users  │
│ ┌──────────────┐ │
│ │ Admin/Renter │ │
│ └──────────────┘ │
└────────┬─────────┘
         │
    ┌────┴────┐
    │  HTTPS  │
    ↓         ↓
 Frontend  Backend
```

### Level 1 - Main Process Flow

```
┌─────────────────────────────────────────────────────────┐
│                  Tenancy Tracker System                  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │              Authentication (Google OAuth)         │ │
│  │  User Login → Google Passport → JWT Token         │ │
│  │  ↓                                                 │ │
│  │  User Record Created/Updated → Approval Workflow  │ │
│  └────────────────────────────────────────────────────┘ │
│                        │                                 │
│  ┌─────────────────────┴────────────────────────────┐   │
│  │                                                  │   │
│  ↓                                                  ↓   │
│  ┌──────────────────────────┐  ┌─────────────────┐    │
│  │   Record Management      │  │  Payment Flow   │    │
│  │ ├─ Create Records        │  │ ├─ Create Order │    │
│  │ ├─ Update Charges        │  │ ├─ Process Pay  │    │
│  │ ├─ Filter/Search         │  │ ├─ Verify Trans │    │
│  │ ├─ Generate Invoice      │  │ ├─ Send Receipt │    │
│  │ └─ Calculate Totals      │  │ └─ Update Rec   │    │
│  │                          │  │                 │    │
│  │  MongoDB ←→ Backend      │  │  Razorpay ↔ BE │    │
│  └──────────────────────────┘  └─────────────────┘    │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │         Notification & Communication            │  │
│  │  Email Reminders → SMTP Service → User Inbox    │  │
│  │  Cron Job: Daily at 9 AM → Check Unpaid → Mail │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │         Data Persistence & Export              │  │
│  │  PDF Generation → Email/Download               │  │
│  │  File Upload (Profiles, QR Codes) → Storage    │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Level 2 - Detailed Process Flows

#### **Authentication Flow**
```
User
  ↓
[Click Login with Google]
  ↓
Frontend: Redirect to /auth/google?role=renter
  ↓
Backend: Passport Google Strategy
  ↓
Google OAuth Service
  ↓
User Grants Permission
  ↓
Google Returns Profile Data
  ↓
Backend: Check if User Exists
  ├─ NO → Create new User with status=pending, role=renter
  └─ YES → Update existing user
  ↓
Emit Email Notification
  ↓
Generate JWT Token (7 days expiry)
  ↓
Redirect to Frontend with Token (Cookie)
  ↓
Frontend: Store Token & Redirect to Dashboard
  ↓
Dashboard: Check User Status
  ├─ pending → Show PendingApproval Page
  ├─ rejected → Show RejectionMessage
  └─ approved → Show Dashboard
```

#### **Record Creation & Payment Flow**
```
Admin
  ↓
[Create/Edit Monthly Record]
  ↓
Frontend: Calculate Total (Rent + Utilities + Penalties - Credits)
  ↓
POST /api/records
  ↓
Backend: Validate & Create Record in MongoDB
  ↓
Record Created with:
  - tenant (FK to User)
  - month, year, date
  - rent, electricity, parking, etc.
  - paid: false, paymentMethod: ''
  ↓
[Cron Job - Daily 9 AM]
  ↓
Find All Unpaid Records
  ↓
For Each Unpaid Record:
  - Calculate Days Overdue
  - Get Tenant Email
  - Generate Payment Reminder Email
  - Send via SMTP
  ↓
Renter Receives Email Reminder
  ↓
[Renter Initiates Payment]
  ↓
Choose Payment Method:
  ├─ Razorpay → Create Order → QR Code → Payment → Verify Signature
  ├─ UPI → Show QR Code → Manual Verification by Admin
  ├─ Cash → Admin Marks as Paid + Verified
  └─ Bank Transfer → Manual Verification
  ↓
If Verified:
  - Create Transaction Record
  - Update Record: paid=true, paidDate, transactionId
  - Generate PDF Receipt
  - Send Receipt Email
  ↓
If Not Verified:
  - Transaction status=pending
  - Admin Reviews & Verifies
```

---

## 🔌 API Endpoints

### Base URL: `https://tenancy-tracker.onrender.com`

### **Authentication Routes** (`/auth`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/google` | Initiate Google OAuth login | ❌ |
| GET | `/google/callback` | Google OAuth callback | ❌ |
| POST | `/logout` | Logout user (clear JWT) | ✅ |

### **User Routes** (`/api/users`)

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/` | Get current user profile | ✅ | All |
| GET | `/all` | Get all users (filtered) | ✅ | Admin |
| GET | `/:id` | Get specific user | ✅ | Admin |
| PUT | `/:id` | Update user profile | ✅ | All |
| PUT | `/:id/approve` | Approve pending renter | ✅ | Admin |
| PUT | `/:id/reject` | Reject pending renter | ✅ | Admin |
| DELETE | `/:id` | Delete user | ✅ | Admin |
| POST | `/profile-picture` | Upload profile picture | ✅ | All |

### **Record Routes** (`/api/records`)

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/` | Get filtered records | ✅ | All* |
| GET | `/tenant/:id` | Get records for specific tenant | ✅ | Admin/Self |
| POST | `/` | Create new record | ✅ | Admin |
| PUT | `/:id` | Update record | ✅ | Admin |
| DELETE | `/:id` | Delete record | ✅ | Admin |
| POST | `/:id/send-invoice` | Send invoice email | ✅ | Admin |

*Renters only see their own records; Admins see all

### **Payment Routes** (`/api/payments`)

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/settings` | Get payment settings (admin UPI) | ✅ | Admin |
| POST | `/settings` | Update payment settings | ✅ | Admin |
| POST | `/settings/qr` | Upload QR code | ✅ | Admin |
| POST | `/razorpay/order` | Create Razorpay order | ✅ | All |
| POST | `/razorpay/verify` | Verify Razorpay payment | ✅ | All |
| POST | `/upi/verify` | Verify UPI payment (manual) | ✅ | Admin |
| POST | `/cash/verify` | Verify cash payment | ✅ | Admin |
| GET | `/receipt/:recordId` | Download payment receipt | ✅ | Renter/Admin |

### **Health & Utility Routes**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check - returns "Backend is running 🚀" |
| GET | `/health` | Health check - returns "Server is running" |
| GET | `/test-email?to=email@example.com` | Send test email (for verification) |

---

## 🎨 Frontend Components

### Component Hierarchy & Flow

```
App.tsx (Main Entry Point)
├── BrowserRouter (Routes)
├── Routes:
│   ├── / → PublicHome (Login)
│   ├── /privacy → Privacy
│   ├── /terms → Terms
│   ├── /pending-approval → PendingApproval
│   └── /dashboard → ProtectedRoute
│       └── DashboardSwitcher
│           ├── AdminDashboard (if role=admin)
│           │   ├── UserManagement
│           │   ├── RecordManagement
│           │   ├── PaymentSettings
│           │   ├── AddRecordModal
│           │   ├── PaymentConfirmationModal
│           │   └── NotificationsPanel
│           └── RenterDashboard (if role=renter)
│               ├── TenantBillingPage
│               ├── PaymentPage
│               ├── PaymentReceipt
│               ├── ProfilePictureUpload
│               └── NotificationsPanel
└── Hooks:
    └── useTenancy.ts (Global State Management)
        ├── currentUser
        ├── tenants
        ├── records
        ├── notifications
        └── Methods: login, logout, addRecord, etc.
```

### Component Descriptions

#### **Core Components**

| Component | Purpose | Used By |
|-----------|---------|---------|
| **App.tsx** | Main entry point, routing setup | - |
| **LoginScreen** | Google OAuth login UI | Public Home |
| **PublicHome.tsx** | Landing page, login options | / |
| **ProtectedRoute.tsx** | Route protection, status checks | Dashboard Routes |
| **DashboardSwitcher** | Routes to Admin/Renter dashboard | Protected Routes |

#### **Admin Components**

| Component | Purpose |
|-----------|---------|
| **AdminDashboard.tsx** | Main admin interface with all controls |
| **AdminPaymentSettings.tsx** | Configure payment methods & UPI |
| **UserManagement** | Approve/Reject/Delete tenants |
| **RecordManagement** | Create/Edit/Delete monthly records |
| **AddRecordModal.tsx** | Modal for adding new records |
| **PaymentConfirmationModal.tsx** | Confirm payment details |

#### **Renter Components**

| Component | Purpose |
|-----------|---------|
| **RenterDashboard.tsx** | Renter home with billing overview |
| **TenantBillingPage.tsx** | View monthly bills & charges |
| **PaymentPage.tsx** | Choose payment method & initiate payment |
| **PaymentReceipt.tsx** | Display receipt after successful payment |
| **ProfilePictureUpload.tsx** | Upload profile picture |

#### **Shared Components**

| Component | Purpose |
|-----------|---------|
| **NotificationsPanel.tsx** | Display payment reminders & notifications |
| **PaymentReceipt.tsx** | Show payment receipt details |
| **MoneyCorporateLoader.tsx** | Loading spinner animation |
| **Privacy.tsx** | Privacy policy page |
| **Terms.tsx** | Terms & conditions page |

### Frontend Data Flow

```
useTenancy Hook (Custom Hook)
  ↓
├─ State:
│  ├─ currentUser (User Data)
│  ├─ tenants (All Tenants)
│  ├─ records (All Records)
│  └─ notifications (Notifications)
│
├─ useEffect on Mount:
│  ├─ Fetch current user from /api/users
│  ├─ Fetch all users from /api/users/all
│  ├─ Fetch all records from /api/records
│  └─ Setup error handling
│
└─ Methods:
   ├─ login(credentials) → /auth/google
   ├─ logout() → Clear localStorage, /auth/logout
   ├─ addRecord(recordData) → POST /api/records
   ├─ updateRecord(id, data) → PUT /api/records/:id
   ├─ updateRecordStatus(id, paid) → PUT /api/records/:id
   ├─ approveTenant(id) → PUT /api/users/:id/approve
   ├─ rejectTenant(id) → PUT /api/users/:id/reject
   ├─ deleteTenant(id) → DELETE /api/users/:id
   └─ refreshRecords() → Re-fetch records
```

---

## ✨ Key Features

### 1. **Authentication & Authorization**
- Google OAuth 2.0 integration
- JWT-based session management (7-day expiry)
- Role-based access control (Admin/Renter)
- User approval workflow for tenants

### 2. **Tenant Management**
- Approve/Reject pending registrations
- Manage tenant information (unit, contact)
- Configure charges per tenant
- Delete tenants and their records

### 3. **Billing & Records**
- Create monthly billing records
- Track multiple charge types:
  - Rent
  - Electricity (with unit-based calculation)
  - Municipal fees
  - Parking charges
  - Penalties & dues
  - Advance credits
- Filter records by tenant, month, year, payment status

### 4. **Payment Processing**
- **Multiple Payment Methods**:
  - Razorpay (Online, integrated)
  - UPI (QR Code)
  - Cash (Manual verification)
  - Bank Transfer (Manual verification)
- **Payment Verification**: Admin verification for non-Razorpay payments
- **Transaction Tracking**: Complete transaction history with status

### 5. **Automated Notifications**
- **Email Reminders**: Daily cron job at 9 AM IST
- **Invoice Emails**: When admin creates records
- **Receipt Emails**: After successful payment
- **Login Notifications**: When tenant approves account
- Multiple email account support (Sahil & Nick)

### 6. **Document Generation**
- **PDF Receipts**: Payment receipts with transaction details
- **Email Templates**: Professional HTML emails with branding
- **Invoice Generation**: Monthly billing invoices

### 7. **File Management**
- Profile picture uploads (user images)
- QR code uploads (payment QR codes)
- File storage on server (uploads/ directory)

### 8. **Admin Features**
- Dashboard with tenant overview
- User management interface
- Payment settings configuration
- Record CRUD operations
- Payment verification interface

### 9. **Renter Features**
- View personal billing records
- Check outstanding charges
- Track payment history
- Upload profile picture
- Initiate payments
- Download receipts

---

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- MongoDB Atlas account
- Google Cloud OAuth credentials
- Razorpay account (optional, for payment processing)
- Gmail account (for SMTP email service)

### Environment Variables Setup

#### **Backend (.env file)**
```
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/tenancy-tracker

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=https://backend-url/auth/google/callback

# JWT & Security
JWT_SECRET=your_secret_key_here
SESSION_SECRET=your_session_secret_here

# Admin Configuration
ADMIN_EMAILS=admin@example.com,admin2@example.com

# Frontend URL
FRONTEND_URL=https://frontend-url.onrender.com

# Razorpay (Optional)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Email Service (Gmail SMTP)
SMTP_USER_SAHIL=sahil@gmail.com
SMTP_PASS_SAHIL=app_specific_password
SMTP_USER_NICK=nick@gmail.com
SMTP_PASS_NICK=app_specific_password
EMAIL_FROM=noreply@tenancytracker.com
```

### Backend Installation

```bash
cd backend
npm install
npm run dev  # Development
npm start    # Production
```

### Frontend Installation

```bash
cd frontend
npm install
npm run dev    # Development server
npm run build  # Production build
npm run preview # Preview production build
```

---

## 🏃 Running the Project

### Development Mode

#### Terminal 1 - Backend
```bash
cd backend
npm run dev
# Server runs on http://localhost:5000
```

#### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
# Frontend runs on http://localhost:5173 (Vite default)
```

### Production Mode (Render Deployment)

Backend is deployed via `render.yaml`:
```yaml
services:
  - type: web
    name: tenancy-tracker
    env: node
    rootDir: backend
    buildCommand: npm install --production
    startCommand: node index.js
```

Frontend is deployed as static site:
```yaml
  - type: static
    name: tenancy-frontend
    rootDir: frontend
    buildCommand: npm install && npm run build
    staticPublishPath: dist
```

### Local Testing Checklist

- [ ] MongoDB connection working
- [ ] Google OAuth login succeeds
- [ ] Can create admin and renter users
- [ ] Can create and manage records
- [ ] Email service sending (test via `/test-email?to=your@email.com`)
- [ ] Razorpay integration working (if keys configured)
- [ ] PDF generation working
- [ ] File uploads working

---

## 🛠️ Important Services & Utilities

### **Email Service** (`backend/utils/emailService.js`)
- Handles all email communications
- Supports multiple SMTP accounts
- Functions:
  - `sendEmail(config)` - Send email with HTML template
  - Automatic fallback between SMTP accounts
  - Error logging and retry logic

### **Email Templates** (`backend/utils/emailTemplates.js`)
- HTML email templates with styling
- Templates:
  - `getTenantLoginNotificationTemplate()` - Welcome email
  - `getPaymentReminderTemplate()` - Payment due reminder
  - `getReceiptTemplate()` - Payment receipt
  - `getInvoiceTemplate()` - Monthly invoice

### **PDF Service** (`backend/utils/pdfService.js`)
- PDF generation using PDFKit
- `generatePaymentReceiptPDF()` - Creates downloadable receipt
- Includes transaction details, amounts, and formatting

### **Cron Service** (`backend/utils/cronService.js`)
- Scheduled tasks using node-cron
- **Payment Reminder Job**:
  - Runs daily at 9:00 AM IST
  - Finds all unpaid records
  - Sends reminder email to tenants
  - Logs job execution

### **Passport Configuration** (`backend/config/passport.js`)
- Google OAuth 2.0 strategy setup
- User creation/update logic on first login
- Extracts Google profile data
- Assigns user role based on admin email

### **Authentication Middleware** (`backend/middleware/auth.js`)
- JWT token verification
- `protect` middleware - Checks if user is authenticated
- `adminOnly` middleware - Checks if user is admin
- `approvedOnly` middleware - Checks if user is approved
- `generateToken()` - Creates JWT with 7-day expiry

---

## 📁 Project Structure

```
tenancy-tracker/
├── backend/
│   ├── index.js                          # Main server file
│   ├── package.json                      # Backend dependencies
│   ├── .env                              # Environment variables (not in repo)
│   │
│   ├── config/
│   │   └── passport.js                   # Google OAuth strategy
│   │
│   ├── middleware/
│   │   └── auth.js                       # JWT & role-based middleware
│   │
│   ├── models/
│   │   ├── User.js                       # User schema (Admin/Renter)
│   │   ├── Record.js                     # Monthly billing record schema
│   │   ├── Transaction.js                # Payment transaction schema
│   │   └── PaymentSettings.js            # Admin payment config
│   │
│   ├── routes/
│   │   ├── auth.js                       # Google OAuth routes
│   │   ├── users.js                      # User CRUD routes
│   │   ├── records.js                    # Record management routes
│   │   └── payments.js                   # Payment processing routes
│   │
│   ├── utils/
│   │   ├── emailService.js               # Email sending service
│   │   ├── emailTemplates.js             # HTML email templates
│   │   ├── pdfService.js                 # PDF generation
│   │   └── cronService.js                # Scheduled tasks
│   │
│   └── uploads/
│       ├── profiles/                     # User profile pictures
│       └── qr/                           # Payment QR codes
│
├── frontend/
│   ├── App.tsx                           # Main React component
│   ├── index.html                        # HTML entry point
│   ├── index.tsx                         # React entry point
│   ├── index.css                         # Global styles
│   ├── types.ts                          # TypeScript type definitions
│   ├── vite.config.ts                    # Vite configuration
│   ├── tsconfig.json                     # TypeScript configuration
│   ├── tailwind.config.js                # Tailwind CSS config
│   ├── postcss.config.js                 # PostCSS configuration
│   ├── package.json                      # Frontend dependencies
│   │
│   ├── components/
│   │   ├── LoginScreen.tsx               # Login UI
│   │   ├── PublicHome.tsx                # Landing page
│   │   ├── ProtectedRoute.tsx            # Route protection wrapper
│   │   ├── PendingApproval.tsx           # Pending approval page
│   │   ├── DashboardSwitcher.tsx         # Route to Admin/Renter
│   │   ├── AdminDashboard.tsx            # Admin main dashboard
│   │   ├── AdminPaymentSettings.tsx      # Admin payment config UI
│   │   ├── RenterDashboard.tsx           # Renter main dashboard
│   │   ├── TenantBillingPage.tsx         # Billing view
│   │   ├── PaymentPage.tsx               # Payment initiation
│   │   ├── PaymentReceipt.tsx            # Receipt display
│   │   ├── PaymentConfirmationModal.tsx  # Payment confirmation
│   │   ├── AddRecordModal.tsx            # Record creation form
│   │   ├── ProfilePictureUpload.tsx      # Profile upload
│   │   ├── NotificationsPanel.tsx        # Notification display
│   │   ├── MoneyCorporateLoader.tsx      # Loading animation
│   │   ├── Privacy.tsx                   # Privacy policy
│   │   └── Terms.tsx                     # Terms & conditions
│   │
│   ├── hooks/
│   │   └── useTenancy.ts                 # Global state hook
│   │
│   ├── utils/
│   │   ├── api.ts                        # API client (axios)
│   │   ├── currency.ts                   # Currency formatting
│   │   └── images.ts                     # Image utilities
│   │
│   └── public/
│       └── (Static assets)
│
├── render.yaml                           # Render.com deployment config
├── .gitignore                            # Git ignore rules
└── PROJECT_DOCUMENTATION.md              # This file
```

---

## 📦 Major Dependencies & Purpose

### Backend Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| **express** | 4.18.2 | Web framework for REST API |
| **mongoose** | 8.0.3 | MongoDB ODM and schema management |
| **passport** | 0.7.0 | Authentication middleware |
| **passport-google-oauth20** | 2.0.0 | Google OAuth 2.0 strategy |
| **jsonwebtoken** | 9.0.3 | JWT creation and verification |
| **cors** | 2.8.5 | Cross-Origin Resource Sharing |
| **dotenv** | 16.3.1 | Environment variable management |
| **nodemailer** | 8.0.8 | Email sending service |
| **node-cron** | 4.2.1 | Task scheduling |
| **multer** | 1.4.5-lts.1 | File upload handling |
| **razorpay** | 2.9.6 | Razorpay payment gateway |
| **pdfkit** | 0.18.0 | PDF generation |
| **googleapis** | 172.0.0 | Google APIs integration |
| **cookie-parser** | 1.4.6 | Cookie parsing middleware |

### Frontend Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| **react** | 18.2.0 | UI library |
| **react-dom** | 18.2.0 | React DOM rendering |
| **typescript** | 5.3.3 | Type safety for JavaScript |
| **vite** | 7.2.7 | Fast build tool and dev server |
| **react-router-dom** | 7.11.0 | Client-side routing |
| **axios** | 1.6.2 | HTTP client for API calls |
| **tailwindcss** | 3.3.6 | Utility-first CSS framework |
| **lucide-react** | 0.296.0 | Icon library |

---

## 🌐 Deployment Information

### Deployment Platform: **Render.com**

#### Backend Service
- **Service Type**: Web
- **Runtime**: Node.js
- **Build Command**: `npm install --production`
- **Start Command**: `node index.js`
- **URL**: `https://tenancy-tracker.onrender.com`

#### Frontend Service
- **Service Type**: Static Site
- **Build Command**: `npm install && npm run build`
- **Publish Path**: `dist/`
- **URL**: `https://tenancy-frontend.onrender.com`

#### Environment Variables (Set in Render Dashboard)
- MONGODB_URI
- GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET
- JWT_SECRET (auto-generated)
- SESSION_SECRET (auto-generated)
- RAZORPAY Keys
- Email SMTP credentials
- FRONTEND_URL & GOOGLE_CALLBACK_URL

### Deployment Workflow
1. Push code to GitHub main branch
2. Render automatically detects `render.yaml`
3. Backend: Installs dependencies → Runs `node index.js`
4. Frontend: Builds React → Serves from `dist/`
5. Both services deployed with environment variables

---

## 🔐 Security Considerations

1. **JWT Expiry**: 7 days - balance between security and convenience
2. **Google OAuth**: Uses official passport strategy
3. **CORS**: Configured for specific frontend URL
4. **File Upload Limits**: 2MB maximum for security
5. **Role-Based Access**: adminOnly and approvedOnly middleware
6. **Referrer Policy**: Relaxed for Google OAuth compatibility
7. **HTTPS**: Required for production deployment
8. **Password Storage**: Using Google OAuth (no passwords stored)

---

## 🐛 Common Issues & Solutions

### MongoDB Connection Issues
```
Error: connect ECONNREFUSED
Solution: Ensure MONGODB_URI is correct and network access is allowed
```

### Google OAuth Redirect Issues
```
Error: redirect_uri_mismatch
Solution: Update GOOGLE_CALLBACK_URL in .env and Google Console
```

### Email Service Not Working
```
Error: SMTP authentication failed
Solution: Enable "Less secure apps" or use App Passwords in Gmail
```

### Razorpay Integration
```
Error: Razorpay not initialized
Solution: Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env
```

---

## 📊 Performance Optimization

1. **Database Indexing**: Indexed on `paid`, `tenant+year+month`, `status`
2. **Lazy Loading**: Frontend components loaded on demand
3. **Caching**: JWT stored in HTTP-only cookies
4. **Compression**: gzip enabled by default in Render
5. **Image Optimization**: Profile pictures and QR codes served statically

---

## 🚀 Future Enhancement Ideas

1. Dashboard analytics and reporting
2. Automated payment receipts in SMS
3. WhatsApp integration for reminders
4. Advance payment tracking
5. Multi-property support
6. Expense tracking and reporting
7. Maintenance request system
8. Mobile app version
9. Two-factor authentication
10. Audit logs for admin actions

---

## 📞 Support & Contact

For issues, questions, or feature requests:
- Review logs in Render dashboard
- Check MongoDB Atlas connection status
- Verify Google OAuth credentials
- Test email service via `/test-email` endpoint

---

## 📄 License

MIT License - This project is open source and free to use

---

**Document Generated**: June 2, 2026  
**Project Version**: 1.0.0  
**Last Updated**: Comprehensive Documentation

---

## Quick Reference Commands

### Start Development Servers
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev

# Access the app at: http://localhost:5173
```

### Build for Production
```bash
# Backend (no special build needed)
npm install --production

# Frontend
npm run build
# Output in dist/ directory
```

### Database Operations
```bash
# Connect to MongoDB Atlas
# Use MongoDB Compass with connection string from MONGODB_URI
```

### Testing Email
```bash
# Test email service locally
curl "http://localhost:5000/test-email?to=your@email.com"
```

---
