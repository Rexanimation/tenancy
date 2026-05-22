# Tenancy Tracker: Complete Codebase Walkthrough & Folder Structure

To confidently explain your project in an interview, you need to understand the architecture from the moment a user HTTP request hits the server to how it renders on the screen. 

The **Tenancy Tracker** uses the **MERN Stack** (MongoDB, Express, React, Node.js) and is split into two completely separate decoupled folders: `frontend` and `backend`.

---

## 🏗️ 1. The Backend (Node.js + Express + MongoDB)

The `backend/` folder acts as the brain. It connects to the database, verifies security tokens, and serves pure JSON data to the frontend via REST APIs.

### Backend Folder Structure
```text
backend/
├── index.js             // The main entry point. Sets up Express, CORS, connects to MongoDB.
├── .env                 // Secret keys (DB String, Razorpay Secrets, JWT Secrets). Never pushed to Git!
├── models/              // Defines the structure of the database using Mongoose.
│   ├── User.js          // Defines Tenant/Admin schema (name, base64 profilePic, rent details).
│   └── Record.js        // Defines the Billing schema (rent, electrity, paid status).
├── routes/              // The URL endpoints the frontend calls (e.g., /api/auth, /api/records).
│   ├── auth.js          // Handles Google OAuth and User Login state.
│   ├── records.js       // Handles fetching, creating, or marking Bills as paid.
│   └── users.js         // Handles fetching tenants and uploading profile pictures.
└── middlewares/         // Functions that intercept requests before they hit the Routes.
    └── auth.js          // The gatekeeper: verifying if a request contains a valid JWT token.
```

### The Backend Data Flow (Example: Marking a Bill as Paid)
1. **Frontend Request:** The React app sends a `PATCH /api/records/123/status` request.
2. **Middleware (`middlewares/auth.js`):** Intercepts the request. Looks for the `Authorization: Bearer <token>` header. If the token is valid, it attaches the user ID to the request and lets it pass. If invalid, returns `401 Unauthorized`.
3. **Route & Controller (`routes/records.js`):** Receives the request. Locates the specific `Record` in MongoDB using the `123` ID.
4. **Database Node (`models/Record.js`):** The Mongoose Schema strictly ensures that the updated `paid` field must be a boolean. It saves the update to MongoDB Atlas in the cloud.
5. **Response:** The Node server returns the updated Record JSON object back to the Frontend.

---

## 🎨 2. The Frontend (React + Vite + Tailwind)

The `frontend/` folder handles the User Interface (UI), routing, and state management. It has no direct connection to the database. It only asks the Backend for data via Axios.

### Frontend Folder Structure
```text
frontend/
├── index.html           // The single HTML file that React mounts into (<div id="root">).
├── vite.config.ts       // Configuration for the Vite bundler (fast compilation).
├── src/                 
│   ├── main.tsx         // The React entry point. Starts the Router and mounts App.tsx.
│   ├── App.tsx          // Defines the URL Routing (e.g., /login goes to LoginPage).
│   ├── types/           // TypeScript Definitions (interfaces holding the shape of Users/Records).
│   ├── utils/           // Helper non-UI logic.
│   │   ├── api.ts       // Centralized Axios setup with JWT interceptors. The only file that talks to the Backend.
│   │   └── currency.ts  // Formats numbers into INR strings (₹10,000).
│   ├── hooks/           // Custom React Hooks to manage Reusable State.
│   │   └── useTenancy.ts// Manages fetching and storing users/records so components don't have to duplicate fetches.
│   └── components/      // The visual UI building blocks.
│       ├── AdminDashboard.tsx      // The massive dashboard file. Calculates Total Revenue.
│       ├── RenterDashboard.tsx     // The tenant view. Contains the Payment Modal.
│       ├── TenantBillingPage.tsx   // The sub-page where Admins create new bills.
│       └── ProfilePictureUpload.tsx// The component converting images into Base64 strings.
```

### The Frontend Data Flow (Example: Admin Viewing Dashboard)
1. **Routing:** The URL hits `/admin`. `App.tsx` routes the user to `<AdminDashboard />`.
2. **State Initialization (`hooks/useTenancy.ts`):** The component renders empty. The custom hook's `useEffect` fires. It uses `utils/api.ts` to ask the Backend for `/api/records`.
3. **Network Call (`utils/api.ts`):** Axios attaches the local JWT token and makes the HTTP GET request.
4. **Data Injection:** The frontend receives an array of JSON bills. `useTenancy.ts` calls `setRecords(data)`.
5. **Re-rendering (`components/AdminDashboard.tsx`):** The React component notices the `records` state is no longer empty. It triggers a re-render.
6. **Computation (`AdminDashboard.tsx`):** The `useMemo` hooks grab the bills, filter out the ones that don't match the current Month/Year dropdown, and run a `.reduce` method to calculate the Total Revenue metric.
7. **Screen Output:** The beautiful UI is finally painted on the User's screen.

---

## 🚀 3. How the Pieces Fit Together (The Full Sequence)

If the interviewer asks: **"Walk me through the lifecycle of your application when an Admin assigns a new bill to a tenant,"** here is your script:

1. **User Action:** The Admin opens `TenantBillingPage.tsx` and clicks "Create Bill".
2. **Frontend State Capture:** React grabs the values from the input fields (Rent, Electricity) mapped to local `useState` variables.
3. **API Call (`utils/api.ts`):** The frontend packages this standard JavaScript object into JSON. It calls the `axios.post('/api/records')` function, attaching the Admin's JWT token for security.
4. **Backend Gateway (`index.js` -> `middlewares/auth.js`):** The Node server receives the request. The auth middleware verifies the Admin's JWT to ensure they have the authority to create bills.
5. **Database Transaction (`routes/records.js`):** The route parses the incoming JSON, instantiates a new Mongoose `Record` object, and runs `.save()`. MongoDB permanently writes the document to the cluster.
6. **Server Response:** The Backend replies with a Status 201 (Created) and the newly created JSON document.
7. **UI Hydration (`components/TenantBillingPage.tsx`):** The frontend receives the success response. It triggers the `onRefreshRecords()` prop function.
8. **Silent Re-fetch (`hooks/useTenancy.ts`):** The hook silently asks the backend for the updated list of records in the background.
9. **Final Render:** React receives the new array, recalculates the "Pending Payments" count, and updates the Admin Dashboard instantly without a page reload (Virtual DOM diffing in action).
