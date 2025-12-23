import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

// Add token to requests
// Add token to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Handle token expiration
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            if (window.location.pathname !== '/' && window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// Auth APIs
export const authAPI = {
    getMe: async () => {
        const response = await api.get('/auth/me');
        return response.data;
    },

    logout: async () => {
        const response = await api.post('/auth/logout');
        // Cookie handled by backend
        return response.data;
    },

    googleSignIn: () => {
        window.location.href = `${API_BASE_URL}/auth/google`;
    },
};

// User APIs
export const userAPI = {
    getTenants: async () => {
        const response = await api.get('/api/users/tenants');
        return response.data;
    },

    approveTenant: async (tenantId: string) => {
        const response = await api.patch(`/api/users/${tenantId}/approve`);
        return response.data;
    },

    rejectTenant: async (tenantId: string) => {
        const response = await api.patch(`/api/users/${tenantId}/reject`);
        return response.data;
    },

    updateProfile: async (userId: string, data: any) => {
        const response = await api.patch(`/api/users/${userId}`, data);
        return response.data;
    },

    deleteTenant: async (tenantId: string) => {
        const response = await api.delete(`/api/users/${tenantId}`);
        return response.data;
    },

    uploadProfilePicture: async (file: File) => {
        const formData = new FormData();
        formData.append('profilePicture', file);
        const response = await api.post('/api/users/upload-picture', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },
};

// Record APIs
export const recordAPI = {
    getRecords: async (filters?: { year?: string; month?: string; tenantId?: string; paid?: boolean }) => {
        const response = await api.get('/api/records', { params: filters });
        return response.data;
    },

    getTenantRecords: async (tenantId: string) => {
        const response = await api.get(`/api/records/tenant/${tenantId}`);
        return response.data;
    },

    createRecord: async (data: any) => {
        const response = await api.post('/api/records', data);
        return response.data;
    },

    updateRecordStatus: async (recordId: string, data: { paid: boolean; transactionId?: string; paymentMethod?: string }) => {
        const response = await api.patch(`/api/records/${recordId}/status`, data);
        return response.data;
    },

    deleteRecord: async (recordId: string) => {
        const response = await api.delete(`/api/records/${recordId}`);
        return response.data;
    },
};

// Payment APIs
export const paymentAPI = {
    getSettings: async () => {
        const response = await api.get('/api/payments/settings');
        return response.data;
    },

    updateSettings: async (formData: FormData) => {
        const response = await api.post('/api/payments/settings', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    initiatePayment: async (data: { recordId: string; paymentMethod: string }) => {
        const response = await api.post('/api/payments/initiate', data);
        return response.data;
    },

    verifyPayment: async (data: { transactionId: string; transactionRef?: string; notes?: string }) => {
        const response = await api.post('/api/payments/verify', data);
        return response.data;
    },

    getReceipt: async (transactionId: string) => {
        const response = await api.get(`/api/payments/receipt/${transactionId}`);
        return response.data;
    },

    getTransactions: async (filters?: { status?: string }) => {
        const response = await api.get('/api/payments/transactions', { params: filters });
        return response.data;
    },

    // Razorpay APIs
    initiateRazorpayPayment: async (recordId: string) => {
        const response = await api.post('/api/payments/razorpay/order', { recordId });
        return response.data;
    },

    verifyRazorpayPayment: async (data: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
        transactionObjectId: string
    }) => {
        const response = await api.post('/api/payments/razorpay/verify', data);
        return response.data;
    },
};

export default api;
