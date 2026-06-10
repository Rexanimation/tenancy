import { useState, useEffect, useCallback } from 'react';
import { User, RecordType, NewRecordData, Notification, ReceiptType } from '../types';
import { authAPI, userAPI, recordAPI, receiptAPI } from '../utils/api';
import { io, Socket } from 'socket.io-client';

let socketInstance: Socket | null = null;
const getSocketInstance = (): Socket => {
  if (!socketInstance) {
    const socketUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
    socketInstance = io(socketUrl, {
      withCredentials: true,
      autoConnect: true
    });
  }
  return socketInstance;
};

export type DemoRole = 'admin' | 'existing_renter' | 'new_renter';

export default function useTenancy() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [records, setRecords] = useState<RecordType[]>([]);
  const [receipts, setReceipts] = useState<ReceiptType[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Check for token in URL (from OAuth redirect)


  // Fetch current user on mount
  useEffect(() => {
    const fetchCurrentUser = async () => {
      // Token is now in HTTP-only cookie, just fetch user
      try {
        const user = await authAPI.getMe();
        setCurrentUser(user);

        if (!user) {
          setLoading(false);
          return;
        }

        if (user.status !== 'approved') {
          setMessage('Waiting for Approval');
          setLoading(false);
          return;
        }

        // Fetch additional data based on role
        if (user.role === 'admin') {
          const [tenantsData, recordsData, receiptsData] = await Promise.all([
            userAPI.getTenants(),
            recordAPI.getRecords(),
            receiptAPI.getReceipts(),
          ]);
          setUsers(tenantsData);
          setRecords(recordsData);
          setReceipts(receiptsData);
        } else {
          const [recordsData, receiptsData] = await Promise.all([
            recordAPI.getTenantRecords(user._id),
            receiptAPI.getReceipts(),
          ]);
          setRecords(recordsData);
          setReceipts(receiptsData);
        }
      } catch (err: any) {
        console.error('Error fetching user:', err);
        setError(err.response?.data?.message || 'Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  // Generate notifications
  useEffect(() => {
    const newNotifications: Notification[] = [];

    if (currentUser?.role === 'admin') {
      users.filter(u => u.role === 'renter' && u.status === 'pending').forEach(tenant => {
        newNotifications.push({
          id: `notif_approve_${tenant._id}`,
          userId: currentUser._id,
          message: `New renter '${tenant.name}' is awaiting approval.`,
          type: 'info',
          read: false,
          createdAt: new Date().toISOString(),
        });
      });
    }

    records.filter(r => !r.paid).forEach(record => {
      const dueDate = new Date(record.date);
      const today = new Date();
      const timeDiff = dueDate.getTime() - today.getTime();
      const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

      if (dayDiff < 0) {
        if (currentUser?.role === 'admin') {
          newNotifications.push({
            id: `notif_admin_overdue_${record._id}`,
            userId: currentUser._id,
            message: `${record.tenant?.name || 'Unknown'}'s ${record.month} rent is overdue.`,
            type: 'warning',
            read: false,
            createdAt: new Date().toISOString(),
          });
        }
        if (currentUser?._id === record.tenant?._id) {
          newNotifications.push({
            id: `notif_renter_overdue_${record._id}`,
            userId: currentUser._id,
            message: `Your ${record.month} rent is overdue. Please pay soon.`,
            type: 'warning',
            read: false,
            createdAt: new Date().toISOString(),
          });
        }
      } else if (dayDiff <= 7 && currentUser?._id === record.tenant?._id) {
        newNotifications.push({
          id: `notif_renter_due_${record._id}`,
          userId: currentUser._id,
          message: `Your ${record.month} rent is due in ${dayDiff} days.`,
          type: 'info',
          read: false,
          createdAt: new Date().toISOString(),
        });
      }
    });

    setNotifications(newNotifications.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ));
  }, [currentUser, users, records]);

  const googleSignIn = useCallback(async () => {
    try {
      authAPI.googleSignIn();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to sign in');
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('token'); // Clear token
      setCurrentUser(null);
      setUsers([]);
      setRecords([]);
      setNotifications([]);
      // Force redirect to login page to clear all state
      window.location.href = '/login';
    }
  }, []);

  // Set up socket connection and event listeners
  useEffect(() => {
    if (!currentUser || currentUser.status !== 'approved') return;

    const socket = getSocketInstance();

    // Join room for the logged-in user
    socket.emit('join_room', currentUser._id);
    console.log(`⚡ Socket joined room: ${currentUser._id}`);

    // Event Handlers
    const handleRecordCreated = (newRecord: RecordType) => {
      console.log('⚡ Socket event received: record_created', newRecord);
      setRecords(prev => {
        if (prev.some(r => r._id === newRecord._id)) return prev;

        const tenantId = newRecord.tenant && typeof newRecord.tenant === 'object'
          ? (newRecord.tenant as any)._id
          : String(newRecord.tenant);
        
        // Match user role / ownership
        if (
          currentUser.role === 'admin' || 
          tenantId === currentUser._id
        ) {
          return [newRecord, ...prev];
        }
        return prev;
      });
    };

    const handleRecordUpdated = (updatedRecord: RecordType) => {
      console.log('⚡ Socket event received: record_updated', updatedRecord);
      setRecords(prev => prev.map(r => r._id === updatedRecord._id ? updatedRecord : r));
    };

    const handleRecordDeleted = (data: { id: string }) => {
      console.log('⚡ Socket event received: record_deleted', data.id);
      setRecords(prev => prev.filter(r => r._id !== data.id));
    };

    const handleUserUpdated = (updatedUser: User) => {
      console.log('⚡ Socket event received: user_updated', updatedUser);
      if (currentUser.role === 'admin') {
        setUsers(prev => prev.map(u => u._id === updatedUser._id ? updatedUser : u));
      }
      if (currentUser._id === updatedUser._id) {
        setCurrentUser(prev => prev ? { ...prev, ...updatedUser } : updatedUser);
      }
    };

    const handleUserDeleted = (data: { id: string }) => {
      console.log('⚡ Socket event received: user_deleted', data.id);
      if (currentUser.role === 'admin') {
        setUsers(prev => prev.filter(u => u._id !== data.id));
      }
      if (currentUser._id === data.id) {
        logout();
      }
    };

    const handleReceiptCreated = (newReceipt: ReceiptType) => {
      console.log('⚡ Socket event received: receipt_created', newReceipt);
      setReceipts(prev => {
        if (prev.some(r => r._id === newReceipt._id)) return prev;
        return [newReceipt, ...prev];
      });
    };

    const handleConnect = () => {
      console.log('⚡ Socket connected successfully:', socket.id);
    };

    const handleConnectError = (error: any) => {
      console.error('🔴 Socket connection error:', error);
    };

    // Register events
    socket.on('connect', handleConnect);
    socket.on('connect_error', handleConnectError);
    socket.on('record_created', handleRecordCreated);
    socket.on('record_updated', handleRecordUpdated);
    socket.on('record_deleted', handleRecordDeleted);
    socket.on('user_updated', handleUserUpdated);
    socket.on('user_deleted', handleUserDeleted);
    socket.on('receipt_created', handleReceiptCreated);

    // 🟢 Cleanup: Unsubscribe listeners on unmount or user change
    return () => {
      console.log('🔌 Cleaning up socket listeners');
      socket.off('connect', handleConnect);
      socket.off('connect_error', handleConnectError);
      socket.off('record_created', handleRecordCreated);
      socket.off('record_updated', handleRecordUpdated);
      socket.off('record_deleted', handleRecordDeleted);
      socket.off('user_updated', handleUserUpdated);
      socket.off('user_deleted', handleUserDeleted);
      socket.off('receipt_created', handleReceiptCreated);
    };
  }, [currentUser, logout]);

  const addRecord = useCallback(async (recordData: NewRecordData): Promise<RecordType | null> => {
    try {
      const newRecord = await recordAPI.createRecord(recordData);

      // HYDRATION: Ensure tenant object is attached for UI display
      const tenant = users.find(u => u._id === recordData.tenantId);
      const hydratedRecord = tenant ? { ...newRecord, tenant } : newRecord;

      // Remove any existing unpaid records for the same tenant/month/year (they were deleted on backend)
      setRecords(prev => {
        const filtered = prev.filter(r =>
          !(r.tenant?._id === recordData.tenantId &&
            r.month === recordData.month &&
            r.year === recordData.year &&
            !r.paid)
        );
        return [hydratedRecord, ...filtered];
      });
      return hydratedRecord;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create record');
      return null;
    }
  }, [users]); // Added users dependency for hydration

  const approveTenant = useCallback(async (tenantId: string) => {
    try {
      const { user: updatedUser } = await userAPI.approveTenant(tenantId);
      setUsers(prev => prev.map(u => u._id === tenantId ? updatedUser : u));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to approve tenant');
    }
  }, []);

  const rejectTenant = useCallback(async (tenantId: string) => {
    try {
      const { user: updatedUser } = await userAPI.rejectTenant(tenantId);
      setUsers(prev => prev.map(u => u._id === tenantId ? updatedUser : u));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reject tenant');
    }
  }, []);

  const updateRecordStatus = useCallback(async (recordId: string, paid: boolean): Promise<RecordType | null> => {
    try {
      const updatedRecord = await recordAPI.updateRecordStatus(recordId, {
        paid,
        paymentMethod: paid ? 'upi' : '',
      });

      setRecords(prev => prev.map(r => {
        if (r._id === recordId) {
          // HYDRATION: Preserve existing tenant info if backend didn't return it populated
          if ((!updatedRecord.tenant || typeof updatedRecord.tenant === 'string') && r.tenant) {
            return { ...updatedRecord, tenant: r.tenant };
          }
          return updatedRecord;
        }
        return r;
      }));
      return updatedRecord;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update record');
      return null;
    }
  }, []);

  const updateRecord = useCallback(async (recordId: string, data: any): Promise<RecordType | null> => {
    try {
      const updatedRecord = await recordAPI.updateRecord(recordId, data);

      setRecords(prev => prev.map(r => {
        if (r._id === recordId) {
          // HYDRATION: Preserve existing tenant info if backend didn't return it populated
          if ((!updatedRecord.tenant || typeof updatedRecord.tenant === 'string') && r.tenant) {
            return { ...updatedRecord, tenant: r.tenant };
          }
          return updatedRecord;
        }
        return r;
      }));
      return updatedRecord;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update record');
      return null;
    }
  }, []);

  const deleteTenant = useCallback(async (tenantId: string) => {
    try {
      await userAPI.deleteTenant(tenantId);
      // Remove tenant from users list
      setUsers(prev => prev.filter(u => u._id !== tenantId));
      // Remove all records for this tenant
      setRecords(prev => prev.filter(r => r.tenant?._id !== tenantId));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete tenant');
    }
  }, []);

  // Refresh records and user data (for auto-update when payments are made)
  const refreshRecords = useCallback(async () => {
    try {
      if (currentUser?.role === 'admin') {
        const [tenantsData, recordsData, receiptsData] = await Promise.all([
          userAPI.getTenants(),
          recordAPI.getRecords(),
          receiptAPI.getReceipts(),
        ]);
        setUsers(tenantsData);
        setRecords(recordsData);
        setReceipts(receiptsData);
      } else if (currentUser) {
        // Fetch fresh user data (to sync dues/advance/profilePic) AND records AND receipts
        const [userData, recordsData, receiptsData] = await Promise.all([
          authAPI.getMe(),
          recordAPI.getTenantRecords(currentUser._id),
          receiptAPI.getReceipts(),
        ]);

        if (userData) {
          setCurrentUser(userData);
        }
        setRecords(recordsData);
        setReceipts(receiptsData);
      }
    } catch (err: any) {
      console.error('Error refreshing data:', err);
    }
  }, [currentUser]);

  const tenants = users.filter(u => u.role === 'renter');

  const updateTenants = useCallback((newTenants: User[]) => {
    setUsers(prev => {
      const nonRenters = prev.filter(u => u.role !== 'renter');
      return [...nonRenters, ...newTenants];
    });
  }, []);

  return {
    currentUser,
    tenants,
    records,
    receipts,
    googleSignIn,
    logout,
    addRecord,
    loading,
    error,
    message,
    approveTenant,
    rejectTenant,
    deleteTenant,
    updateRecordStatus,
    updateRecord,
    updateTenants,
    notifications,
    refreshRecords,
  };
}
