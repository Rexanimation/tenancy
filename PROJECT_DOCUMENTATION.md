# Tenancy Tracker - Comprehensive Project Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Code Flow Diagram](#code-flow-diagram)
4. [Data Flow Diagram (DFD)](#data-flow-diagram-dfd)
5. [Gantt Chart - Development Timeline](#gantt-chart---development-timeline)
6. [Database Schema](#database-schema)
7. [API Documentation](#api-documentation)
8. [Frontend Component Structure](#frontend-component-structure)
9. [Security Architecture](#security-architecture)
10. [Deployment Flow](#deployment-flow)

---

## Project Overview

**Tenancy Tracker** is a comprehensive full-stack MERN (MongoDB, Express, React, Node.js) application designed for managing tenancy and rent payments. The system features Google OAuth authentication, role-based access control (Admin/Tenant), and payment tracking in INR (Indian Rupees).

### Key Features
- **Authentication**: Google OAuth 2.0 with role-based access
- **Admin Panel**: Manage tenants, payment records, approvals, QR code setup
- **Tenant Panel**: View dues, payment history, make payments via UPI
- **Payment System**: UPI QR integration, manual verification, digital receipts
- **Notifications**: Real-time alerts for overdue payments and pending approvals

### Tech Stack
| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript, Vite, Tailwind CSS, Axios |
| Backend | Node.js, Express.js, Passport.js, JWT |
| Database | MongoDB + Mongoose |
| Auth | Google OAuth 2.0 |
| Deployment | Render (Docker) |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────────┐  │
│  │   Web Browser   │    │   Mobile View   │    │    Third-Party OAuth    │  │
│  │   (React App)   │    │  (Responsive)   │    │      (Google)           │  │
│  └────────┬────────┘    └────────┬────────┘    └───────────┬─────────────┘  │
└───────────┼────────────────────────┼────────────────────────┼───────────────┘
            │                        │                        │
            │ HTTPS/REST             │ HTTPS/REST             │ OAuth 2.0
            ▼                        ▼                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           API GATEWAY LAYER                                  │
│                      (Express.js Server :5000)                               │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │  CORS │ JSON Parser │ Cookie Parser │ Passport │ Error Handler        │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ROUTE LAYER                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │  /auth       │  │  /api/users  │  │ /api/records │  │ /api/payments  │  │
│  │  (Auth)      │  │  (Users)     │  │  (Records)   │  │  (Payments)    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CONTROLLER LAYER                                      │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │  Authentication │ User Management │ Record Management │ Payment Processing│ │
│  └────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MODEL LAYER (Mongoose)                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │    User      │  │    Record    │  │  Transaction │  │PaymentSettings │  │
│  │    Model     │  │    Model     │  │    Model     │  │    Model       │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        DATABASE LAYER (MongoDB)                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │                    MongoDB Atlas / Local MongoDB                       │  │
│  │         (tenancy-tracker database with 4 collections)                  │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Code Flow Diagram

### 1. User Authentication Flow

```
┌──────────┐     ┌──────────────┐     ┌────────────────┐     ┌──────────────┐
│  User    │     │   Frontend   │     │     Backend    │     │    Google    │
└────┬─────┘     └──────┬───────┘     └────────┬───────┘     └──────┬───────┘
     │                  │                      │                    │
     │ Click Google     │                      │                    │
     │ Sign In          │                      │                    │
     │─────────────────▶│                      │                    │
     │                  │ Redirect to          │                    │
     │                  │ /auth/google         │                    │
     │                  │─────────────────────▶│                    │
     │                  │                      │ OAuth Request      │
     │                  │                      │───────────────────▶│
     │                  │                      │                    │
     │                  │                      │◀───────────────────│
     │                  │                      │  User Profile      │
     │                  │                      │  (Token Generated) │
     │                  │◀─────────────────────│  Redirect w/ Token │
     │                  │                      │                    │
     │                  │ Store Token in       │                    │
     │                  │ LocalStorage         │                    │
     │                  │ (authAPI.getMe)    │                    │
     │                  │─────────────────────▶│                    │
     │                  │                      │ Verify JWT         │
     │                  │                      │ Decode User Info   │
     │                  │◀─────────────────────│ Return User Data   │
     │                  │                      │                    │
     │                  │ Route to Dashboard   │                    │
     │◀─────────────────│ (Admin/Renter)       │                    │
     │                  │                      │                    │
```

### 2. Payment Processing Flow

```
┌──────────┐     ┌──────────────┐     ┌────────────────┐     ┌──────────────┐
│  Tenant  │     │   Frontend   │     │     Backend    │     │   Database   │
└────┬─────┘     └──────┬───────┘     └────────┬───────┘     └──────┬───────┘
     │                  │                      │                    │
     │ View Dues        │                      │                    │
     │─────────────────▶│                      │                    │
     │                  │ GET /api/records     │                    │
     │                  │/tenant/:id           │                    │
     │                  │─────────────────────▶│                    │
     │                  │                      │ Query Records      │
     │                  │                      │───────────────────▶│
     │                  │                      │◀───────────────────│
     │                  │◀─────────────────────│ Return Records     │
     │◀─────────────────│ Display Dues         │                    │
     │                  │                      │                    │
     │ Click Pay Now    │                      │                    │
     │─────────────────▶│                      │                    │
     │                  │ POST /api/payments   │                    │
     │                  │ /initiate            │                    │
     │                  │─────────────────────▶│                    │
     │                  │                      │ Create Transaction │
     │                  │                      │ Update Record      │
     │                  │                      │──────┬─────────────▶│
     │                  │                      │      │             │
     │                  │                      │◀─────┘             │
     │                  │◀─────────────────────│ Return QR/Details  │
     │◀─────────────────│ Show Payment Page    │                    │
     │                  │                      │                    │
     │ Complete Payment │                      │                    │
     │ (UPI Scan)       │                      │                    │
     │─────────────────▶│                      │                    │
     │                  │ POST /api/payments   │                    │
     │                  │ /verify              │                    │
     │                  │─────────────────────▶│                    │
     │                  │                      │ Verify Payment     │
     │                  │                      │ Update Status      │
     │                  │                      │──────┬─────────────▶│
     │                  │                      │      │             │
     │                  │                      │◀─────┘             │
     │                  │◀─────────────────────│ Success Response   │
     │◀─────────────────│ Show Receipt         │                    │
     │                  │                      │                    │
```

### 3. Admin Tenant Approval Flow

```
┌──────────┐     ┌──────────────┐     ┌────────────────┐     ┌──────────────┐
│  Admin   │     │   Frontend   │     │     Backend    │     │   Database   │
└────┬─────┘     └──────┬───────┘     └────────┬───────┘     └──────┬───────┘
     │                  │                      │                    │
     │ View Tenants     │                      │                    │
     │─────────────────▶│                      │                    │
     │                  │ GET /api/users/      │                    │
     │                  │ tenants              │                    │
     │                  │─────────────────────▶│                    │
     │                  │                      │ Query Users        │
     │                  │                      │ (role=renter)      │
     │                  │                      │───────────────────▶│
     │                  │                      │◀───────────────────│
     │                  │◀─────────────────────│ Return Tenant List │
     │◀─────────────────│ Show Pending/        │                    │
     │                  │ Approved List        │                    │
     │                  │                      │                    │
     │ Click Approve    │                      │                    │
     │─────────────────▶│                      │                    │
     │                  │ PATCH /api/users/    │                    │
     │                  │ :id/approve          │                    │
     │                  │─────────────────────▶│                    │
     │                  │                      │ Verify Admin       │
     │                  │                      │ Update User Status │
     │                  │                      │ (pending→approved) │
     │                  │                      │───────────────────▶│
     │                  │                      │◀───────────────────│
     │                  │◀─────────────────────│ Return Updated     │
     │◀─────────────────│ Update UI            │                    │
     │                  │                      │                    │
```

---

## Data Flow Diagram (DFD)

### Level 0 DFD (Context Diagram)

```
                              ┌─────────────────────┐
                              │   Tenancy Tracker   │
                              │      System         │
                              └──────────┬──────────┘
                                         │
         ┌───────────────────────────────┼───────────────────────────────┐
         │                               │                               │
         ▼                               ▼                               ▼
┌─────────────────┐           ┌─────────────────────┐          ┌─────────────────┐
│     Tenant      │           │      Admin          │          │  Google OAuth   │
│   (External)    │           │    (External)       │          │   (External)    │
└─────────────────┘           └─────────────────────┘          └─────────────────┘
```

### Level 1 DFD

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                    EXTERNAL ENTITIES                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────────┐ │
│  │   Tenant     │  │    Admin     │  │Google OAuth  │  │      MongoDB Database        │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────────────┬───────────────┘ │
└─────────┼─────────────────┼───────────────┼─────────────────────────┼───────────────────┘
          │                 │               │                         │
          │ 1. Login        │               │                         │
          │────────────────▶│               │                         │
          │                 │ 2. Auth Req   │                         │
          │                 │──────────────▶│                         │
          │                 │               │ 3. Validate             │
          │                 │               │────────────────────────▶
          │                 │               │                         │
          │                 │               │◀────────────────────────│
          │                 │◀──────────────│ 4. Token                │
          │◀────────────────│               │                         │
          │                 │               │                         │
          │ 5. View Dues    │               │                         │
          │────────────────▶│               │                         │
          │                 │ 6. Query DB   │                         │
          │                 │────────────────────────────────────────▶
          │                 │               │                         │
          │                 │◀────────────────────────────────────────│
          │◀────────────────│ 7. Records    │                         │
          │                 │               │                         │
          │ 8. Make Payment │               │                         │
          │────────────────▶│               │                         │
          │                 │ 9. Create Txn │                         │
          │                 │────────────────────────────────────────▶
          │                 │               │                         │
          │                 │◀────────────────────────────────────────│
          │◀────────────────│ 10. Receipt   │                         │
          │                 │               │                         │
          │                 │ 11. Approve   │                         │
          │                 │ Tenant        │                         │
          │                 │────────────────────────────────────────▶
          │                 │               │                         │
          │                 │◀────────────────────────────────────────│
          │                 │ 12. Status    │                         │
          │                 │ Updated       │                         │
```

### Data Flow Descriptions

| Flow # | From | To | Data | Description |
|--------|------|-----|------|-------------|
| 1 | Tenant | Frontend | Credentials | Login request with role selection |
| 2 | Frontend | Backend | Auth Request | Google OAuth initiation |
| 3 | Backend | Google | Auth Token | Validate OAuth credentials |
| 4 | Google | Backend | User Profile | Return authenticated user data |
| 5 | Tenant | Frontend | View Request | Request to see dues/payments |
| 6 | Backend | Database | Query | Fetch records for tenant |
| 7 | Database | Backend | Records | Return payment records |
| 8 | Tenant | Frontend | Payment | Initiate payment request |
| 9 | Backend | Database | Transaction | Create payment transaction |
| 10 | Database | Frontend | Receipt | Return payment confirmation |
| 11 | Admin | Database | Approval | Update tenant status to approved |
| 12 | Database | Admin | Confirmation | Return updated tenant status |

---

## Gantt Chart - Development Timeline

```
Phase/Activity                    │ W1 │ W2 │ W3 │ W4 │ W5 │ W6 │ W7 │ W8 │
─────────────────────────────────┼────┼────┼────┼────┼────┼────┼────┼────┤
PHASE 1: PROJECT SETUP            │████│    │    │    │    │    │    │    │
  ├─ Repository Setup           │████│    │    │    │    │    │    │    │
  ├─ Tech Stack Configuration     │████│    │    │    │    │    │    │    │
  ├─ Database Schema Design     │ ███│    │    │    │    │    │    │    │
  └─ Environment Configuration  │  ██│    │    │    │    │    │    │    │
                                  │    │    │    │    │    │    │    │    │
PHASE 2: BACKEND DEVELOPMENT      │    │████│████│    │    │    │    │    │
  ├─ Express Server Setup       │    │████│    │    │    │    │    │    │
  ├─ MongoDB Models             │    │████│    │    │    │    │    │    │
  ├─ Google OAuth Integration   │    │ ███│    │    │    │    │    │    │
  ├─ JWT Authentication         │    │  ██│    │    │    │    │    │    │
  ├─ User API Routes            │    │    │████│    │    │    │    │    │
  ├─ Records API Routes         │    │    │████│    │    │    │    │    │
  └─ Payment API Routes         │    │    │ ███│    │    │    │    │    │
                                  │    │    │    │    │    │    │    │    │
PHASE 3: FRONTEND DEVELOPMENT     │    │    │    │████│████│    │    │    │
  ├─ React + Vite Setup         │    │    │    │████│    │    │    │    │
  ├─ Tailwind Configuration     │    │    │    │ ███│    │    │    │    │
  ├─ TypeScript Types           │    │    │    │ ███│    │    │    │    │
  ├─ API Client (Axios)         │    │    │    │  ██│    │    │    │    │
  ├─ Auth Components            │    │    │    │    │████│    │    │    │
  ├─ Admin Dashboard            │    │    │    │    │████│    │    │    │
  ├─ Tenant Dashboard           │    │    │    │    │████│    │    │    │
  └─ Payment Components         │    │    │    │    │ ███│    │    │    │
                                  │    │    │    │    │    │    │    │    │
PHASE 4: INTEGRATION & TESTING    │    │    │    │    │    │████│    │    │
  ├─ Frontend-Backend Connect   │    │    │    │    │    │████│    │    │
  ├─ OAuth Flow Testing         │    │    │    │    │    │████│    │    │
  ├─ Payment Flow Testing       │    │    │    │    │    │ ███│    │    │
  └─ Bug Fixes & Optimization   │    │    │    │    │    │ ███│    │    │
                                  │    │    │    │    │    │    │    │    │
PHASE 5: DEPLOYMENT               │    │    │    │    │    │    │████│    │
  ├─ Render Configuration       │    │    │    │    │    │    │████│    │
  ├─ Environment Variables      │    │    │    │    │    │    │ ███│    │
  ├─ Database Migration         │    │    │    │    │    │    │  ██│    │
  └─ Production Deployment        │    │    │    │    │    │    │  ██│    │
                                  │    │    │    │    │    │    │    │    │
PHASE 6: DOCUMENTATION            │    │    │    │    │    │    │    │████│
  ├─ Code Documentation         │    │    │    │    │    │    │    │████│
  ├─ API Documentation          │    │    │    │    │    │    │    │████│
  └─ User Guide                 │    │    │    │    │    │    │    │ ███│
─────────────────────────────────┴────┴────┴────┴────┴────┴────┴────┴────┘

Legend: ████ = Active Development Period
```

---

## Database Schema

### Entity Relationship Diagram (ERD)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATABASE SCHEMA                                 │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────┐         ┌─────────────────────┐
│       USER          │         │       RECORD        │
├─────────────────────┤         ├─────────────────────┤
│ _id: ObjectId  (PK) │         │ _id: ObjectId  (PK) │
│ googleId: String    │         │ tenant: ObjectId(FK)│◀───────────┐
│ name: String        │         │ month: String       │            │
│ email: String       │         │ year: String        │            │
│ profilePicture: Str│         │ rent: Number        │            │
│ role: Enum          │         │ electricity: Number │            │
│   [admin|renter]    │◀────────│ electricityUnits:Num│            │
│ status: Enum        │    1:M  │ electricityRate:Num │            │
│   [pending|approved │◀────────┤ municipalFee: Num  │            │
│   |rejected]        │         │ parking: Number     │            │
│ unit: String        │         │ penalties: Number   │            │
│ rentAmount: Number  │         │ dues: Number        │            │
│ electricityRate: Num│         │ advanceCredit: Num  │            │
│ electricityUnits:Num│         │ paid: Boolean       │            │
│ municipalFee: Num  │         │ paidAmount: Number    │            │
│ parkingCharges: Num │         │ date: String        │            │
│ penalties: Number   │         │ paidDate: Date      │            │
│ dues: Number        │         │ transactionId: Str  │            │
│ advancePaid: Num   │         │ paymentMethod: Enum │            │
│ upiId: String       │         │ createdAt: Date     │            │
│ createdAt: Date     │         │ updatedAt: Date     │            │
│ updatedAt: Date     │         └─────────────────────┘            │
└─────────────────────┘                      │                     │
         │                                   │                     │
         │                                   │ 1:1                 │
         │                                   ▼                     │
         │                          ┌─────────────────────┐        │
         │                          │    TRANSACTION      │        │
         │                          ├─────────────────────┤        │
         │                          │ _id: ObjectId  (PK) │        │
         │                          │ record: ObjectId(FK)│◀─────────┘
         │◀─────────────────────────│ tenant: ObjectId(FK)│
         │         M:1              │ amount: Number      │
         │                        │ paymentMethod: Enum │
         │                        │ transactionId: Str  │
         │                        │ razorpayOrderId: Str│
         │                        │ razorpayPaymentId:Sr│
         │                        │ status: Enum        │
         │                        │   [pending|verified │
         │                        │   |failed]          │
         │                        │ verifiedBy: ObjId  │
         │                        │ verifiedAt: Date    │
         │                        │ notes: String       │
         │                        │ createdAt: Date     │
         │                        │ updatedAt: Date     │
         │                        └─────────────────────┘
         │
         │
         ▼
┌─────────────────────┐
│  PAYMENT SETTINGS   │
├─────────────────────┤
│ _id: ObjectId  (PK) │
│ upiId: String       │
│ qrCodePath: String  │
│ razorpayKeyId: Str  │
│ createdAt: Date     │
│ updatedAt: Date     │
└─────────────────────┘

RELATIONSHIPS:
─────────────
• USER 1:M RECORD (One user can have many records)
• USER 1:M TRANSACTION (One user can have many transactions)
• RECORD 1:1 TRANSACTION (One record has one transaction)
• USER M:1 USER (Admin approves Tenants - self-referential)
```

### Collection Details

#### 1. Users Collection
```javascript
{
  _id: ObjectId,
  googleId: String,           // Unique Google ID
  name: String,                 // User's full name
  email: String,                // Unique email address
  profilePicture: String,       // URL to profile image
  role: String,                 // 'admin' | 'renter'
  status: String,               // 'pending' | 'approved' | 'rejected'
  unit: String,                 // Property unit number
  rentAmount: Number,           // Monthly rent amount
  electricityRate: Number,      // Rate per unit
  electricityUnits: Number,     // Current month units
  municipalFee: Number,         // Municipal charges
  parkingCharges: Number,       // Parking fees
  penalties: Number,            // Late payment penalties
  dues: Number,                 // Outstanding dues
  advancePaid: Number,          // Advance payment amount
  upiId: String,                // UPI ID for payments
  createdAt: Date,
  updatedAt: Date
}
```

#### 2. Records Collection
```javascript
{
  _id: ObjectId,
  tenant: ObjectId,             // Reference to User
  month: String,                // e.g., 'January'
  year: String,                 // e.g., '2024'
  rent: Number,                 // Rent amount
  electricity: Number,          // Electricity charges
  electricityUnits: Number,     // Units consumed
  electricityRate: Number,      // Rate applied
  municipalFee: Number,         // Municipal fee
  parking: Number,              // Parking charges
  penalties: Number,            // Penalties
  dues: Number,                 // Previous dues
  advanceCredit: Number,        // Advance credit applied
  paid: Boolean,                // Payment status
  paidAmount: Number,           // Amount paid
  date: String,                 // Due date (YYYY-MM-DD)
  paidDate: Date,               // Actual payment date
  transactionId: String,        // Transaction reference
  paymentMethod: String,        // 'upi' | 'cash' | 'bank_transfer' | 'razorpay'
  createdAt: Date,
  updatedAt: Date
}
```

#### 3. Transactions Collection
```javascript
{
  _id: ObjectId,
  record: ObjectId,             // Reference to Record
  tenant: ObjectId,             // Reference to User
  amount: Number,               // Transaction amount
  paymentMethod: String,        // Payment method used
  transactionId: String,        // External transaction ID
  razorpayOrderId: String,      // Razorpay order ID
  razorpayPaymentId: String,    // Razorpay payment ID
  status: String,               // 'pending' | 'verified' | 'failed'
  verifiedBy: ObjectId,         // Admin who verified
  verifiedAt: Date,             // Verification timestamp
  notes: String,                // Additional notes
  createdAt: Date,
  updatedAt: Date
}
```

---

## API Documentation

### Base URL
```
Development: http://localhost:5000
Production:  https://<your-app>.onrender.com
```

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/auth/google` | Initiate Google OAuth | No |
| GET | `/auth/google/callback` | OAuth callback handler | No |
| GET | `/auth/me` | Get current user | Yes (JWT) |
| POST | `/auth/logout` | Logout user | Yes |

### User Endpoints

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/api/users/tenants` | Get all tenants | Yes | Admin |
| PATCH | `/api/users/:id/approve` | Approve tenant | Yes | Admin |
| PATCH | `/api/users/:id/reject` | Reject tenant | Yes | Admin |
| PATCH | `/api/users/:id` | Update user profile | Yes | Any |
| DELETE | `/api/users/:id` | Delete tenant | Yes | Admin |
| POST | `/api/users/upload-picture` | Upload profile picture | Yes | Any |

### Record Endpoints

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/api/records` | Get filtered records | Yes | Admin |
| GET | `/api/records/tenant/:id` | Get tenant records | Yes | Any |
| POST | `/api/records` | Create new record | Yes | Admin |
| PUT | `/api/records/:id` | Update record | Yes | Admin |
| PATCH | `/api/records/:id/status` | Update payment status | Yes | Any |
| DELETE | `/api/records/:id` | Delete record | Yes | Admin |

### Payment Endpoints

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/api/payments/settings` | Get payment settings | Yes | Any |
| POST | `/api/payments/settings` | Update payment settings | Yes | Admin |
| POST | `/api/payments/initiate` | Initiate payment | Yes | Tenant |
| POST | `/api/payments/verify` | Verify payment | Yes | Any |
| GET | `/api/payments/receipt/:id` | Get payment receipt | Yes | Any |
| GET | `/api/payments/transactions` | Get transactions | Yes | Any |
| POST | `/api/payments/razorpay/order` | Create Razorpay order | Yes | Tenant |
| POST | `/api/payments/razorpay/verify` | Verify Razorpay payment | Yes | Any |

---

## Frontend Component Structure

```
frontend/
│
├── App.tsx                    # Main application router
├── types.ts                   # TypeScript interfaces
├── index.tsx                  # Entry point
│
├── components/
│   ├── LoginScreen.tsx        # Google OAuth login
│   ├── ProtectedRoute.tsx     # Auth route guard
│   ├── PendingApproval.tsx    # Pending approval screen
│   │
│   ├── AdminDashboard.tsx     # Admin main dashboard
│   ├── AddRecordModal.tsx     # Add/edit payment records
│   ├── AdminPaymentSettings.tsx # UPI QR configuration
│   │
│   ├── RenterDashboard.tsx    # Tenant main dashboard
│   ├── PaymentPage.tsx        # Payment processing page
│   ├── PaymentReceipt.tsx     # Receipt generation
│   ├── TenantBillingPage.tsx  # Billing details view
│   │
│   ├── PublicHome.tsx         # Landing page
│   ├── Privacy.tsx            # Privacy policy
│   ├── Terms.tsx              # Terms of service
│   │
│   ├── NotificationsPanel.tsx # Notification display
│   ├── ProfilePictureUpload.tsx # Avatar upload
│   └── PaymentConfirmationModal.tsx # Payment success
│
├── hooks/
│   └── useTenancy.ts          # Main data fetching hook
│
└── utils/
    ├── api.ts                 # API client functions
    ├── currency.ts            # INR formatting utilities
    └── helpers.ts             # Helper functions
```

### Component Hierarchy

```
App.tsx
├── BrowserRouter
│   └── AppRoutes
│       ├── PublicHome ("/")
│       ├── LoginScreen ("/login")
│       ├── Privacy ("/privacy")
│       ├── Terms ("/terms")
│       ├── PendingApproval ("/pending-approval")
│       └── ProtectedRoute ("/dashboard")
│           └── DashboardSwitcher
│               ├── AdminDashboard (role === 'admin')
│               │   ├── NotificationsPanel
│               ├── AddRecordModal (modal)
│               ├── AdminPaymentSettings (modal)
│               └── ProfilePictureUpload (modal)
│               │
│               └── RenterDashboard (role === 'renter')
│                   ├── PaymentPage (route)
│                   ├── PaymentReceipt (modal)
│                   ├── TenantBillingPage (view)
│                   └── PaymentConfirmationModal (modal)
```

---

## Security Architecture

### Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SECURITY LAYERS                                     │
└─────────────────────────────────────────────────────────────────────────────┘

Layer 1: TRANSPORT SECURITY
───────────────────────────
• HTTPS enforced in production
• CORS configured for specific origins
• Secure cookie attributes (httpOnly, secure, sameSite)

Layer 2: AUTHENTICATION
───────────────────────
1. Google OAuth 2.0 Flow:
   User → Google Sign-In → Google Token → Backend Validation
                                          ↓
2. JWT Generation:
   Backend creates JWT with:
   - User ID
   - Email
   - Role (admin/renter)
   - Expiration (7 days)
                                          ↓
3. Token Storage:
   - Stored in localStorage (frontend)
   - Sent via Authorization header
   - Verified on every protected request

Layer 3: AUTHORIZATION
──────────────────────
• Role-based access control (RBAC)
• Admin emails whitelist
• Middleware checks on protected routes

Layer 4: DATA PROTECTION
────────────────────────
• Passwordless authentication (OAuth only)
• No sensitive data in JWT payload
• MongoDB ObjectIds for internal references
• Input validation on all endpoints
```

### Security Middleware

```javascript
// JWT Verification Middleware
const protect = async (req, res, next) => {
  // 1. Extract token from header or cookie
  // 2. Verify JWT signature
  // 3. Decode user info
  // 4. Attach user to request
  // 5. Proceed or reject
};

// Admin Verification Middleware
const adminOnly = async (req, res, next) => {
  // 1. Check req.user.role === 'admin'
  // 2. Reject if not admin
  // 3. Proceed if admin
};
```

---

## Deployment Flow

### Render Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            RENDER PLATFORM                                   │
│                                                                              │
│  ┌─────────────────────────┐         ┌─────────────────────────────────┐   │
│  │    Web Service          │         │         MongoDB Atlas           │   │
│  │  (Docker Container)      │         │     (Cloud Database)            │   │
│  │                         │         │                                 │   │
│  │  ┌─────────────────┐    │         │  ┌─────────────────────────┐   │   │
│  │  │   Nginx/Node    │    │◀───────▶│  │   tenancy-tracker DB    │   │   │
│  │  │   (Port 5000)   │    │  HTTPS  │  │                         │   │   │
│  │  └─────────────────┘    │         │  │  • users collection     │   │   │
│  │                         │         │  │  • records collection   │   │   │
│  │  ┌─────────────────┐    │         │  │  • transactions coll.   │   │   │
│  │  │  Static Files   │    │         │  │  • paymentsettings coll.│   │   │
│  │  │  (Frontend Build)│   │         │  └─────────────────────────┘   │   │
│  │  └─────────────────┘    │         └─────────────────────────────────┘   │
│  │                         │                                              │
│  │  ┌─────────────────┐    │         ┌─────────────────────────────────┐   │
│  │  │  Uploads Dir    │    │         │     Google Cloud Console        │   │
│  │  │  (Profile pics, │◀───│────────▶│                                 │   │
│  │  │   QR codes)     │    │  OAuth  │  • OAuth 2.0 Client ID          │   │
│  │  └─────────────────┘    │         │  • Client Secret                │   │
│  └─────────────────────────┘         │  • Authorized Redirects         │   │
│                                        └─────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Deployment Steps

1. **Environment Setup**
   ```bash
   # Environment Variables Required:
   MONGODB_URI=mongodb+srv://...
   GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=xxx
   GOOGLE_CALLBACK_URL=https://app.onrender.com/auth/google/callback
   JWT_SECRET=random_secure_string
   SESSION_SECRET=random_secure_string
   ADMIN_EMAILS=admin1@email.com,admin2@email.com
   FRONTEND_URL=https://app.onrender.com
   ```

2. **Build Process**
   ```
   Frontend Build:
   npm install → npm run build → dist/ folder generated
   
   Backend Start:
   npm install → node index.js
   ```

3. **Docker Configuration**
   ```dockerfile
   # Multi-stage build
   FROM node:18-alpine AS builder
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci
   COPY . .
   RUN npm run build
   
   FROM node:18-alpine
   WORKDIR /app
   COPY --from=builder /app/dist ./dist
   COPY --from=builder /app/backend ./backend
   CMD ["node", "backend/index.js"]
   ```

---

## Summary Statistics

| Metric | Count |
|--------|-------|
| **Backend Files** | 15+ |
| **Frontend Components** | 16+ |
| **API Endpoints** | 25+ |
| **Database Models** | 4 |
| **TypeScript Types** | 8 interfaces |
| **Total Lines of Code** | ~15,000+ |

---

*Documentation generated for Tenancy Tracker Project*
*Last updated: May 2026*
