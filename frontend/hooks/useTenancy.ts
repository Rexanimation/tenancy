import { useState, useEffect, useCallback } from 'react';
import { User, RecordType, NewRecordData, Notification } from '../types';
import { authAPI, userAPI, recordAPI } from '../utils/api';

export type DemoRole = 'admin' | 'existing_renter' | 'new_renter';

export default function useTenancy() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [records, setRecords] = useState<RecordType[]>([]);
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
          setMessage('Your account is pending administrator approval.');
          setLoading(false);
          return;
        }

        // Fetch additional data based on role
        if (user.role === 'admin') {
          const [tenantsData, recordsData] = await Promise.all([
            userAPI.getTenants(),
            recordAPI.getRecords(),
          ]);
          setUsers(tenantsData);
          setRecords(recordsData);
        } else {
          const recordsData = await recordAPI.getTenantRecords(user._id);
          setRecords(recordsData);
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
            message: `${record.tenant.name}'s ${record.month} rent is overdue.`,
            type: 'warning',
            read: false,
            createdAt: new Date().toISOString(),
          });
        }
        if (currentUser?._id === record.tenant._id) {
          newNotifications.push({
            id: `notif_renter_overdue_${record._id}`,
            userId: currentUser._id,
            message: `Your ${record.month} rent is overdue. Please pay soon.`,
            type: 'warning',
            read: false,
            createdAt: new Date().toISOString(),
          });
        }
      } else if (dayDiff <= 7 && currentUser?._id === record.tenant._id) {
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
      setCurrentUser(null);
      setUsers([]);
      setRecords([]);
      setNotifications([]);
      // Force redirect to login page to clear all state
      window.location.href = '/login';
    }
  }, []);

  const addRecord = useCallback(async (recordData: NewRecordData): Promise<RecordType | null> => {
    try {
      const newRecord = await recordAPI.createRecord(recordData);
      // Remove any existing unpaid records for the same tenant/month/year (they were deleted on backend)
      setRecords(prev => {
        const filtered = prev.filter(r =>
          !(r.tenant._id === recordData.tenantId &&
            r.month === recordData.month &&
            r.year === recordData.year &&
            !r.paid)
        );
        return [newRecord, ...filtered];
      });
      return newRecord;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create record');
      return null;
    }
  }, []);

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
      setRecords(prev => prev.map(r => r._id === recordId ? updatedRecord : r));
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
      setRecords(prev => prev.filter(r => r.tenant._id !== tenantId));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete tenant');
    }
  }, []);

  // Refresh records from API (for auto-update when payments are made)
  const refreshRecords = useCallback(async () => {
    try {
      if (currentUser?.role === 'admin') {
        const [tenantsData, recordsData] = await Promise.all([
          userAPI.getTenants(),
          recordAPI.getRecords(),
        ]);
        setUsers(tenantsData);
        setRecords(recordsData);
      } else if (currentUser) {
        const recordsData = await recordAPI.getTenantRecords(currentUser._id);
        setRecords(recordsData);
      }
    } catch (err: any) {
      console.error('Error refreshing records:', err);
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
    updateTenants,
    notifications,
    refreshRecords,
  };
}
