# 🏠 Tenancy Tracker

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-blue.svg)](https://nodejs.org)
[![Vite Client](https://img.shields.io/badge/Vite-Client-blueviolet.svg)](https://vite.dev)

A modern, real-time rental and tenancy management platform designed to automate billing, utility tracking, payment processing, and tenant notifications. Built using **React + TypeScript** on the frontend and **Node.js + Express + MongoDB** on the backend.

---

## 🎯 Key Features

- **🔐 Google OAuth 2.0 & JWT Sessions**: Secured login flows with role-based routing (Admin vs. Renter).
- **📊 Real-Time Updates**: Instantly synchronize dashboard data (balances, payment status, receipts) using WebSockets (Socket.io) without page refreshes.
- **⚡ Utility Meter Billing**: Unit-based electricity bill calculator, municipal corporation fees, and rent breakdowns.
- **💳 Multi-Method Payments**: Integrated online checkout with Razorpay, UPI QR-code transfers, cash logging, and manual payment verification.
- **📄 Digital Receipts**: Dynamic PDF receipts generated on-the-fly via PDFKit and delivered directly to the tenant's inbox.
- **📅 Automated Reminders**: Daily node-cron scheduler sending automated email notifications for overdue/unpaid rent.

---

## 💻 Tech Stack

### Frontend Client
- React 18.2 (TypeScript)
- Vite 7.2 (Bundler)
- Tailwind CSS (Styling)
- React Router DOM 7.11 (Routing)
- socket.io-client 4.7 (WebSockets)
- Axios (HTTP client)

### Backend API Server
- Node.js & Express
- MongoDB Atlas & Mongoose 8.0 ODM
- Passport.js (Google OAuth Strategy)
- socket.io 4.7 (WebSocket Server)
- Razorpay SDK (Online payment processing)
- Nodemailer (Email transmission)
- PDFKit (PDF generation)
- node-cron (Task scheduler)

---

## 📂 Quick Links

For comprehensive system documentation, architecture diagrams, and service details, see:
- [📄 Comprehensive Project Documentation](./PROJECT_DOCUMENTATION.md): Contains the database schema (ER Diagram), Data Flow Diagrams (DFDs), Gantt charts/timeline, API reference, socket deduplication patterns, and email troubleshooting guides.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+) installed.
- A running MongoDB instance (or Atlas connection URI).
- Google OAuth and Razorpay Credentials.

### 1. Installation

Clone the repository and install dependencies for both the backend and frontend:

```bash
# Clone the repository
git clone https://github.com/Rexanimation/tenancy.git
cd tenancy-tracker

# Setup Backend
cd backend
npm install

# Setup Frontend
cd ../frontend
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `backend/` directory:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=your_mongodb_connection_uri
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/auth/google/callback
FRONTEND_URL=http://localhost:5173
ADMIN_EMAILS=your_admin_email@gmail.com
JWT_SECRET=your_jwt_secret_key
SESSION_SECRET=your_session_secret_key
```

### 3. Run Development Servers

Run the backend and frontend dev servers concurrently:

#### Start Backend
```bash
cd backend
npm run dev
# API running on http://localhost:5000
```

#### Start Frontend
```bash
cd frontend
npm run dev
# Frontend running on http://localhost:5173
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
