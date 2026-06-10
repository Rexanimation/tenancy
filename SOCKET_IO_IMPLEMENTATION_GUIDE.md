# ⚡ Real-Time Updates Implementation Guide (Socket.io)

यह गाइड **Tenancy Tracker** में Socket.io का उपयोग करके एडमिन और किराएदार डैशबोर्ड्स को रियल-टाइम (बिना पेज रीलोड किए ऑटो-अपडेट) बनाने के लिए संपूर्ण स्टेप-बाय-स्टेप गाइड है।

---

## 📋 Table of Contents
1. [Backend Setup (Express + Socket.io)](#1-backend-setup-express--socketio)
2. [Accessing Sockets in Controllers (Emitting Events)](#2-accessing-sockets-in-controllers-emitting-events)
3. [Frontend Client Setup (React Context + Hooks)](#3-frontend-client-setup-react-context--hooks)
4. [Listening and Updating State in Components](#4-listening-and-updating-state-in-components)
5. [Summary of Best Practices & Cleanup](#5-summary-of-best-practices--cleanup)

---

## 1. Backend Setup (Express + Socket.io)

सबसे पहले हमें बैकएंड पर `socket.io` लाइब्रेरी को इंस्टॉल करना होगा:
```bash
cd backend
npm install socket.io
```

### Server initialization (`backend/index.js`)
हमें Express के `app.listen` को `http.createServer(app)` में बदलना होगा ताकि Socket.io उसी पोर्ट पर चल सके।

यहाँ `backend/index.js` का संशोधित ढांचा दिया गया है:

```javascript
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
// ... अन्य imports

dotenv.config();
const app = express();

// 1. Create HTTP Server from Express App
const httpServer = createServer(app);

// 2. Initialize Socket.io with CORS configuration
const io = new Server(httpServer, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true
    }
});

// 3. Make Socket.io instance accessible in Express app/controllers
app.set('socketio', io);

// 4. Socket Connection Handling
io.on('connection', (socket) => {
    console.log(`⚡ Socket Connected: ${socket.id}`);

    // Join room based on user role or user ID (useful for private tenant notifications)
    socket.on('join_room', (userId) => {
        socket.join(userId);
        console.log(`👤 User ${userId} joined room`);
    });

    socket.on('disconnect', () => {
        console.log(`🔌 Socket Disconnected: ${socket.id}`);
    });
});

// ... Express Middlewares & Routes ...

// 5. Change connectDB to listen using httpServer instead of app
const connectDB = async () => {
    try {
        // ... mongoose connection logic ...
        
        const PORT = process.env.PORT || 5000;
        httpServer.listen(PORT, () => {
            console.log(`🚀 Server + Sockets running on port ${PORT}`);
        });
    } catch (error) {
        console.error('❌ Connection Error:', error);
    }
};

connectDB();
```

---

## 2. Accessing Sockets in Controllers (Emitting Events)

हम Express के `req.app.get('socketio')` का उपयोग करके अपने कंट्रोलर्स से आसानी से रियल-टाइम इवेंट्स एमिट (emit) कर सकते हैं।

### Example: Record Controller (`backend/routes/records.js` या संबंधित Controller)
जब भी एडमिन कोई नया पेमेंट रिकॉर्ड बनाता है या एडिट करता है, तो हम इवेंट्स एमिट करेंगे:

```javascript
// POST /api/records (Create monthly billing record)
router.post('/', protect, adminOnly, async (req, res) => {
    try {
        const newRecord = await Record.create(req.body);
        
        // 1. Get the Socket.io instance
        const io = req.app.get('socketio');
        
        // 2. Emit event to all connected sockets
        io.emit('record_created', newRecord);
        
        // 3. (Optional) Private event: Send only to the specific tenant
        io.to(newRecord.tenant.toString()).emit('new_tenant_bill', {
            message: `Your bill for ${newRecord.month} has been generated.`,
            record: newRecord
        });

        res.status(201).json(newRecord);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// PUT /api/records/:id/verify (Verify tenant payment)
router.put('/:id/verify', protect, adminOnly, async (req, res) => {
    try {
        const updatedRecord = await Record.findByIdAndUpdate(
            req.params.id, 
            { paid: true, status: 'verified' }, 
            { new: true }
        ).populate('tenant');

        const io = req.app.get('socketio');
        
        // Broadcast that a payment has been verified (Dashboard stats will update)
        io.emit('payment_verified', updatedRecord);
        
        // Inform the specific tenant that their payment was approved
        io.to(updatedRecord.tenant._id.toString()).emit('payment_receipt_generated', updatedRecord);

        res.json(updatedRecord);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});
```

---

## 3. Frontend Client Setup (React Context + Hooks)

क्लाइंट साइड पर, हमें `socket.io-client` इंस्टॉल करना होगा:
```bash
cd frontend
npm install socket.io-client
```

### Best Practice: React Context Provider (`frontend/context/SocketContext.tsx`)
बड़े डैशबोर्ड्स में एक से अधिक कॉम्पोनेंट्स को सॉकेट कनेक्शन की आवश्यकता होती है। कनेक्शन को बार-बार खोलने के बजाय, हम एक सिंगल कनेक्शन बनाएंगे और उसे **React Context** के माध्यम से शेयर करेंगे।

```tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({ socket: null, isConnected: false });

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState<boolean>(false);

    useEffect(() => {
        // Backend Socket URL (Loads from environment variables)
        const socketUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
        
        const newSocket = io(socketUrl, {
            withCredentials: true,
            autoConnect: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        });

        newSocket.on('connect', () => {
            setIsConnected(true);
            console.log('⚡ Connected to WebSockets server');
        });

        newSocket.on('disconnect', () => {
            setIsConnected(false);
            console.log('🔌 Disconnected from WebSockets server');
        });

        setSocket(newSocket);

        // Cleanup: Close socket connection when provider unmounts
        return () => {
            newSocket.close();
        };
    }, []);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};

// Custom Hook to use socket easily
export const useSocket = () => {
    return useContext(SocketContext);
};
```

---

## 4. Listening and Updating State in Components

अब, हम डैशबोर्ड के कॉम्पोनेंट्स में इस सॉकेट कनेक्शन का उपयोग करेंगे और **useEffect** के भीतर इवेंट्स को लिसन (listen) करेंगे।

> [!IMPORTANT]
> **Memory Leak और Duplicate Events से बचाव (The Cleanup Phase):**
> जब कोई कॉम्पोनेंट अनमाउंट (unmount) होता है, तो हमें `socket.off('event_name')` का उपयोग करके इवेंट लिसनर को हटाना **अनिवार्य** है। अगर ऐसा नहीं किया गया, तो हर री-रेंडर या री-माउंट पर नया लिसनर बनता रहेगा, जिससे एक ही काम बार-बार होगा और ब्राउज़र क्रैश हो सकता है।

### Example: Admin Record Table (`frontend/components/RecordManagement.tsx`)

```tsx
import React, { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import axios from 'axios';

interface RecordType {
    _id: string;
    month: string;
    rent: number;
    paid: boolean;
    // ... अन्य fields
}

export const RecordManagement: React.FC = () => {
    const [records, setRecords] = useState<RecordType[]>([]);
    const { socket, isConnected } = useSocket();

    // 1. Fetch initial records via REST API
    useEffect(() => {
        const fetchRecords = async () => {
            const res = await axios.get('/api/records');
            setRecords(res.data);
        };
        fetchRecords();
    }, []);

    // 2. Setup Socket listeners for real-time updates
    useEffect(() => {
        if (!socket) return;

        // Listener 1: When a new record is created
        const handleRecordCreated = (newRecord: RecordType) => {
            setRecords((prevRecords) => [newRecord, ...prevRecords]);
        };

        // Listener 2: When a record payment is verified
        const handlePaymentVerified = (updatedRecord: RecordType) => {
            setRecords((prevRecords) =>
                prevRecords.map((rec) =>
                    rec._id === updatedRecord._id ? updatedRecord : rec
                )
            );
        };

        // Bind events
        socket.on('record_created', handleRecordCreated);
        socket.on('payment_verified', handlePaymentVerified);

        // 🟢 Cleanup Function (Crucial for preventing duplicates & leaks)
        return () => {
            socket.off('record_created', handleRecordCreated);
            socket.off('payment_verified', handlePaymentVerified);
        };
    }, [socket]); // Executes when socket object is initialized

    return (
        <div className="p-4 bg-white rounded shadow">
            <h2 className="text-xl font-bold mb-4">
                Billing Records {isConnected ? '🟢 Live' : '🔴 Offline'}
            </h2>
            
            <table className="min-w-full divide-y divide-gray-200">
                <thead>
                    <tr>
                        <th>Month</th>
                        <th>Rent</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {records.map((rec) => (
                        <tr key={rec._id}>
                            <td>{rec.month}</td>
                            <td>₹{rec.rent}</td>
                            <td>
                                <span className={`px-2 py-1 rounded text-xs ${
                                    rec.paid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                    {rec.paid ? 'Paid' : 'Unpaid'}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
```

---

## 5. Summary of Best Practices & Cleanup

1. **Keep Controllers Decoupled:**
   कंट्रोलर्स में सीधे सॉकेट कनेक्शन को इंपोर्ट करने के बजाय `req.app.get('socketio')` का उपयोग करें। यह आपकी सर्वर फाइलों को साफ और परीक्षण योग्य (testable) रखता है।
2. **Dynamic Rooms:**
   किराएदारों के डैशबोर्ड में, लॉगिन के समय यूजर की आईडी का एक रूम ज्वाइन करवाएं (`socket.emit('join_room', user._id)`)। इससे आप केवल उस विशेष किराएदार को उसके निजी बिल और रसीदें भेज सकते हैं, जिससे अनावश्यक ब्रॉडकास्ट (Clog) से बचा जा सकेगा।
3. **Always Unsubscribe (Cleanup):**
   `useEffect` के रिटर्न फंक्शन में `socket.off('event', handler)` का उपयोग बिल्कुल न भूलें। यदि आप एक ही फंक्शन वैरिएबल को ऑफ करना चाहते हैं, तो हैंडलर फंक्शन को `useEffect` के अंदर ही डिक्लेयर करें ताकि उसका रेफरेंस सही तरीके से रिमूव हो सके।
