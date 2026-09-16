/**
 * Types and interfaces for Wing-C Lakeview Apartment, Burari, Delhi
 * Society Accounting & Maintenance Mobile Application
 */

export type UserRole = 'admin' | 'user';

export type OccupancyType = 'owner' | 'tenant';

export interface User {
  id: string;
  role: UserRole;
  name: string;
  flatNumber: string; // e.g. "C-101", "C-302"
  mobile: string;     // 10-digit Indian phone number
  email: string;
  password?: string;
  occupancyType?: OccupancyType; // 'owner' or 'tenant'
  ownerName?: string;            // If rented: owner/landlord name
  ownerContact?: string;         // If rented: owner/landlord 10-digit mobile
  twoWheelerNumber?: string; // e.g. "DL 01 AB 1234"
  carNumber?: string;        // e.g. "DL 08 CD 5678"
  registeredAt: string;
  adminAppointedDate?: string;
  adminTenureMonths?: number;
}

export type ExpenseCategory = 
  | 'Security Guard'
  | 'Electricity'
  | 'Lift Maintenance (AMC)'
  | 'Water & Pump'
  | 'Housekeeping / Cleaning'
  | 'Repairs & Plumbing'
  | 'Festival / Celebration'
  | 'Administrative'
  | 'Others';

export interface ExpenseItem {
  id: string;
  monthYear: string; // "YYYY-MM", e.g. "2026-09"
  title: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  paidTo: string;
  paymentMethod: 'Cash' | 'UPI' | 'Net Banking' | 'Cheque';
  receiptNote?: string;
  recordedBy: string;
}

export interface MaintenanceRecord {
  id: string;
  monthYear: string; // "YYYY-MM", e.g. "2026-09"
  userId: string;
  userName: string;
  flatNumber: string;
  phone: string;
  maintenanceDue: number;
  maintenancePaid: number;
  isPaid: boolean;
  paidDate?: string;
  markedDate?: string; // Date admin recorded the entry in the system
  paymentMethod?: 'Cash' | 'Online' | 'UPI' | 'Bank Transfer' | 'Cheque';
  transactionRef?: string;
  pendingAmount: number; // arrears/pending carried forward from previous periods
  notes?: string;
}

export interface ElectricityBill {
  monthYear: string;
  billAmount: number;
  consumerNumber: string; // e.g. "TPDDL-1004928" (Burari Delhi DISCOM)
  billingPeriod: string;
  unitsConsumed: number;
  dueDate: string;
  isPaid: boolean;
  paidDate?: string;
  paymentRef?: string;
  billDetails?: string;
  updatedBy?: string;
}

export interface MonthConfig {
  monthYear: string;
  monthName: string; // e.g. "September 2026"
  standardMaintenanceAmount: number;
  proposedMaintenanceSummary: string;
  openingBalance: number;
}

export interface AdminHandoverLog {
  id: string;
  fromAdminName: string;
  fromAdminFlat: string;
  toAdminName: string;
  toAdminFlat: string;
  transferDate: string;
  handoverTenureMonths: number;
  remarks: string;
}

export interface SocietyState {
  users: User[];
  currentUserId: string | null;
  currentMonth: string; // "YYYY-MM"
  monthsConfig: Record<string, MonthConfig>;
  maintenanceRecords: Record<string, MaintenanceRecord[]>; // monthYear -> records
  expenses: ExpenseItem[];
  electricityBills: Record<string, ElectricityBill>;
  adminHandoverLogs: AdminHandoverLog[];
}
