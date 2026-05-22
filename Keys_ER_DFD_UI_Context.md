# Tenancy Tracker - Keys, ER Diagram, DFD & UI Context

## Table of Contents
1. [Database Keys](#1-database-keys)
   - [Primary Keys](#primary-keys)
   - [Secondary Keys (Unique Constraints & Indexes)](#secondary-keys-unique-constraints--indexes)
   - [Foreign Keys (References)](#foreign-keys-references)
2. [Entity-Relationship (ER) Diagram](#2-entity-relationship-er-diagram)
3. [Data Flow Diagram (DFD)](#3-data-flow-diagram-dfd)
4. [UI Context & Component Structure](#4-ui-context--component-structure)

---

## 1. Database Keys

### Primary Keys
All MongoDB collections automatically use `_id` (ObjectId) as their primary key.

| Collection | Primary Key | Type | Description |
|------------|-------------|------|-------------|
| users | `_id` | ObjectId | Unique identifier for each user (admin/tenant) |
| records | `_id` | ObjectId | Unique identifier for each billing record |
| transactions | `_id` | ObjectId | Unique identifier for each payment transaction |
| paymentsettings | `_id` | ObjectId | Unique identifier for payment settings |

---

### Secondary Keys (Unique Constraints & Indexes)

#### Unique Secondary Keys
These fields enforce uniqueness and prevent duplicate entries.

##### User Model (backend/models/User.js)
```javascript
{
  googleId: { type: String, unique: true },   // Unique Google OAuth ID
  email: { type: String, unique: true }       // Unique user email
}
```

##### PaymentSettings Model (backend/models/PaymentSettings.js)
```javascript
{
  adminId: { type: ObjectId, unique: true }    // Only one settings per admin
}
```

#### Indexes (Performance Optimization)
These indexes speed up common query patterns.

##### Record Model (backend/models/Record.js)
```javascript
// Compound index for efficient tenant + period queries
recordSchema.index({ tenant: 1, year: 1, month: 1 });

// Index for filtering paid/unpaid records
recordSchema.index({ paid: 1 });
```

##### Transaction Model (backend/models/Transaction.js)
```javascript
// Compound index for tenant transaction history (sorted by date descending)
transactionSchema.index({ tenant: 1, createdAt: -1 });

// Index for filtering transactions by status
transactionSchema.index({ status: 1 });
```

---

### Foreign Keys (References)
These establish relationships between collections.

| Source Collection | Field | Target Collection | Target Field | Relationship |
|------------------|-------|-------------------|--------------|--------------|
| records | `tenant` | users | `_id` | M:1 (Many records → One user) |
| transactions | `record` | records | `_id` | 1:1 (One transaction → One record) |
| transactions | `tenant` | users | `_id` | M:1 (Many transactions → One user) |
| transactions | `verifiedBy` | users | `_id` | M:1 (Many transactions → One admin) |
| paymentsettings | `adminId` | users | `_id` | 1:1 (One settings → One admin) |

---

## 2. Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    USER ||--o{ RECORD : "has many"
    USER ||--o{ TRANSACTION : "initiates many"
    USER ||--|| PAYMENT_SETTINGS : "configures"
    RECORD ||--|| TRANSACTION : "is paid by"
    
    USER {
        ObjectId _id PK
        string googleId UK
        string email UK
        string name
        string profilePicture
        string role
        string status
        string unit
        number rentAmount
        number electricityRate
        number electricityUnits
        number municipalFee
        number parkingCharges
        number penalties
        number dues
        number advancePaid
        string upiId
        date createdAt
        date updatedAt
    }
    
    RECORD {
        ObjectId _id PK
        ObjectId tenant FK
        string month
        string year
        number rent
        number electricity
        number electricityUnits
        number electricityRate
        number municipalFee
        number parking
        number penalties
        number dues
        number advanceCredit
        boolean paid
        number paidAmount
        string date
        date paidDate
        string transactionId
        string paymentMethod
        date createdAt
        date updatedAt
    }
    
    TRANSACTION {
        ObjectId _id PK
        ObjectId record FK
        ObjectId tenant FK
        number amount
        string paymentMethod
        string transactionId
        string razorpayOrderId
        string razorpayPaymentId
        string status
        ObjectId verifiedBy FK
        date verifiedAt
        string notes
        date createdAt
        date updatedAt
    }
    
    PAYMENT_SETTINGS {
        ObjectId _id PK
        ObjectId adminId FK UK
        string upiId
        string qrCodePath
        date createdAt
        date updatedAt
    }
```

### Entity Relationships Explained
1. **USER ↔ RECORD**: One user (tenant) can have many billing records
2. **USER ↔ TRANSACTION**: One user can initiate many payment transactions
3. **USER ↔ PAYMENT_SETTINGS**: One admin user has one payment settings configuration
4. **RECORD ↔ TRANSACTION**: One billing record has one corresponding payment transaction

---

## 3. Data Flow Diagram (DFD)

### Level 0 DFD (Context Diagram)
```
┌─────────────────────────────────────────────────────────────────┐
│                      Tenancy Tracker System                       │
└─────────────────────────────┬─────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌─────────────────┐
│     Tenant    │    │     Admin     │    │  Google OAuth   │
│   (External)  │    │   (External)  │    │   (External)    │
└───────────────┘    └───────────────┘    └─────────────────┘
```

### Level 1 DFD
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                  EXTERNAL ENTITIES                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   Tenant     │  │    Admin     │  │Google OAuth  │  │  MongoDB Database │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────────┬───────┘  │
└─────────┼──────────────────┼───────────────┼─────────────────────────┼───────────┘
          │                  │               │                         │
          │ 1. Login         │               │                         │
          │─────────────────▶│               │                         │
          │                  │ 2. Auth Req   │                         │
          │                  │──────────────▶│                         │
          │                  │               │ 3. Validate             │
          │                  │               │────────────────────────▶
          │                  │               │                         │
          │                  │               │◀────────────────────────│
          │                  │◀──────────────│ 4. Token                │
          │◀─────────────────│               │                         │
          │                  │               │                         │
          │ 5. View Dues     │               │                         │
          │─────────────────▶│               │                         │
          │                  │ 6. Query DB   │                         │
          │                  │────────────────────────────────────────▶
          │                  │               │                         │
          │                  │◀────────────────────────────────────────│
          │◀─────────────────│ 7. Records    │                         │
          │                  │               │                         │
          │ 8. Make Payment  │               │                         │
          │─────────────────▶│               │                         │
          │                  │ 9. Create Txn │                         │
          │                  │────────────────────────────────────────▶
          │                  │               │                         │
          │                  │◀────────────────────────────────────────│
          │◀─────────────────│ 10. Receipt   │                         │
          │                  │               │                         │
          │                  │ 11. Approve   │                         │
          │                  │ Tenant        │                         │
          │                  │────────────────────────────────────────▶
          │                  │               │                         │
          │                  │◀────────────────────────────────────────│
          │                  │ 12. Status    │                         │
          │                  │ Updated       │                         │
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

## 4. UI Context & Component Structure

### Frontend Application Flow
```
index.html
  └─▶ index.tsx (Entry Point)
        └─▶ App.tsx (Main App with Routing)
              ├─▶ BrowserRouter
              │     ├─▶ Route "/" → PublicHome
              │     ├─▶ Route "/login" → LoginScreen
              │     ├─▶ Route "/pending-approval" → PendingApproval
              │     ├─▶ Route "/dashboard" → ProtectedRoute → DashboardSwitcher
              │     │     ├─▶ AdminDashboard (if role=admin)
              │     │     └─▶ RenterDashboard (if role=renter)
              │     ├─▶ Route "/privacy" → Privacy
              │     └─▶ Route "/terms" → Terms
```

### Component Hierarchy

#### 1. PublicHome Component
- Landing page for unauthenticated users
- Shows app features and login options

#### 2. LoginScreen Component
- Google OAuth sign-in button
- Role selection (Admin/Tenant toggle)
- Error handling display

#### 3. PendingApproval Component
- Shown to tenants waiting for admin approval
- Displays status message and instructions

#### 4. AdminDashboard Component
**Tabs**:
- **Overview**: Total revenue, active tenants, pending payments
- **Records**: Billing records table with filters (year/month/tenant)
- **Tenants**: Tenant management (approve/reject/delete)

**Sub-components**:
- `AddRecordModal`: Create new billing record
- `PaymentConfirmationModal`: Show payment confirmation
- `NotificationsPanel`: Real-time notifications
- `AdminPaymentSettings`: Configure UPI QR code
- `TenantBillingPage`: Detailed tenant billing view

#### 5. RenterDashboard Component
**Features**:
- Total outstanding due display
- Passbook dues and advance credit
- Latest bill breakdown
- Billing history with filters
- Payment initiation
- Receipt viewing

**Sub-components**:
- `PaymentPage`: Payment interface with UPI QR
- `PaymentReceipt`: Digital receipt display
- `ProfilePictureUpload`: Profile photo management
- `NotificationsPanel`: Tenant notifications

### Key UI Components File Structure
```
frontend/
├── components/
│   ├── LoginScreen.tsx           # Authentication screen
│   ├── PublicHome.tsx            # Landing page
│   ├── AdminDashboard.tsx        # Admin main dashboard
│   ├── RenterDashboard.tsx       # Tenant main dashboard
│   ├── TenantBillingPage.tsx     # Admin view for tenant billing
│   ├── AddRecordModal.tsx        # Modal to add billing record
│   ├── PaymentPage.tsx           # Payment interface
│   ├── PaymentReceipt.tsx        # Receipt display
│   ├── PaymentConfirmationModal.tsx
│   ├── PendingApproval.tsx       # Pending tenant status
│   ├── NotificationsPanel.tsx    # Real-time notifications
│   ├── AdminPaymentSettings.tsx  # Payment settings
│   ├── ProfilePictureUpload.tsx  # Profile photo upload
│   ├── ProtectedRoute.tsx        # Route protection wrapper
│   ├── Privacy.tsx               # Privacy policy
│   └── Terms.tsx                 # Terms of service
├── hooks/
│   └── useTenancy.ts             # Custom hook for state management
├── utils/
│   ├── api.ts                    # API client (Axios)
│   ├── currency.ts               # INR formatting
│   └── images.ts                 # Image utilities
├── types.ts                      # TypeScript interfaces
├── App.tsx                       # Main app with routing
└── index.tsx                     # React entry point
```

### UI User Flows

#### Admin Flow
1. Login via Google OAuth (must be in `ADMIN_EMAILS`)
2. Land on Admin Dashboard
3. Approve/reject pending tenants
4. Add/view billing records
5. Mark payments as verified
6. Configure payment settings (UPI QR)

#### Tenant Flow
1. Login via Google OAuth
2. If pending approval: See PendingApproval screen
3. If approved: Land on Renter Dashboard
4. View dues and billing history
5. Make payments via UPI QR
6. View payment receipts

---

## Summary

| Concept | Key Points |
|---------|------------|
| **Primary Keys** | `_id` (ObjectId) for all collections |
| **Unique Keys** | `googleId`, `email` (User); `adminId` (PaymentSettings) |
| **Indexes** | Compound indexes on tenant+year+month, tenant+createdAt, etc. |
| **Foreign Keys** | References between User↔Record, Record↔Transaction, etc. |
| **ER Diagram** | 4 entities with 1:1 and 1:M relationships |
| **DFD** | Shows data flow between Tenant, Admin, Google OAuth, and Database |
| **UI Context** | Role-based dashboards (Admin/Renter) with modal-driven interactions |
