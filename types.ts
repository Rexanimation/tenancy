
export type UserRole = 'admin' | 'renter';
export type UserStatus = 'pending' | 'approved' | 'rejected';

export interface User {
  _id: string;
  name: string;
  email: string;
  profilePicture?: string;
  unit?: string;
  rentAmount?: number;
  electricityRate?: number;
  electricityUnits?: number;
  municipalFee?: number;
  parkingCharges?: number;
  penalties?: number;
  dues?: number;
  advancePaid?: number;
  role: UserRole;
  status: UserStatus;
  upiId?: string;
}

export interface RecordType {
  _id: string;
  tenant: User;
  month: string;
  year: string;
  rent: number;
  electricity: number;
  electricityUnits?: number;
  electricityRate?: number;
  municipalFee?: number;
  parking: number;
  penalties?: number;
  dues?: number;
  advanceCredit?: number;
  paid: boolean;
  date: string; // 'YYYY-MM-DD'
  paidDate?: Date;
  transactionId?: string;
  paymentMethod?: 'upi' | 'cash' | 'bank_transfer' | 'cashfree' | '';
}

export interface NewRecordData {
  tenantId: string;
  month: string;
  year: string;
  rent: number;
  electricity: number;
  parking: number;
  paid: boolean;
}

export interface Notification {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'success';
  read: boolean;
  userId: string; // To whom this notification belongs
  createdAt: string;
}

export interface Transaction {
  _id: string;
  record: RecordType;
  tenant: User;
  amount: number;
  paymentMethod: 'upi' | 'cash' | 'bank_transfer' | 'cashfree';
  transactionId?: string;
  cashfreeOrderId?: string;
  cashfreePaymentId?: string;
  status: 'pending' | 'verified' | 'failed';
  verifiedBy?: User;
  verifiedAt?: Date;
  notes?: string;
  createdAt: Date;
}

export interface PaymentSettings {
  upiId: string;
  qrCodePath: string;
}
