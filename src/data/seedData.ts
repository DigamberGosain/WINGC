import { User, ExpenseItem, MaintenanceRecord, ElectricityBill, MonthConfig, AdminHandoverLog } from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'user-admin-1',
    role: 'admin',
    name: 'Digamber Gosain',
    flatNumber: 'C-101',
    mobile: '9811223344',
    email: 'digamber.gosain11@gmail.com',
    password: 'password123',
    occupancyType: 'owner',
    twoWheelerNumber: '',
    carNumber: '',
    registeredAt: '2026-09-01',
    adminAppointedDate: '2026-09-01',
    adminTenureMonths: 12,
  }
];

export const INITIAL_MONTH_KEY = '2026-09';

export const INITIAL_MONTH_CONFIG: MonthConfig = {
  monthYear: '2026-09',
  monthName: 'September 2026',
  standardMaintenanceAmount: 2000,
  proposedMaintenanceSummary: 'Standard monthly maintenance is ₹2,000 per flat. Please clear dues by the 15th of each month.',
  openingBalance: 0,
};

export const INITIAL_ELECTRICITY_BILL: ElectricityBill = {
  monthYear: '2026-09',
  billAmount: 0,
  consumerNumber: 'TPDDL-100482910',
  billingPeriod: '15 Aug 2026 - 14 Sep 2026',
  unitsConsumed: 0,
  dueDate: '2026-09-24',
  isPaid: false,
  billDetails: 'Common area services: Lift power, underground water booster pump, parking lights & stairway illumination.',
  updatedBy: 'Digamber Gosain (Admin)',
};

export const INITIAL_EXPENSES: ExpenseItem[] = [];

export const INITIAL_MAINTENANCE_RECORDS: MaintenanceRecord[] = [
  {
    id: 'maint-1',
    monthYear: '2026-09',
    userId: 'user-admin-1',
    userName: 'Digamber Gosain',
    flatNumber: 'C-101',
    phone: '9811223344',
    maintenanceDue: 2000,
    maintenancePaid: 0,
    isPaid: false,
    pendingAmount: 2000,
    notes: 'Initial month ledger',
  }
];

export const INITIAL_ADMIN_HANDOVER_LOGS: AdminHandoverLog[] = [
  {
    id: 'log-1',
    fromAdminName: 'Society Founding Committee',
    fromAdminFlat: 'Office',
    toAdminName: 'Digamber Gosain',
    toAdminFlat: 'C-101',
    transferDate: '2026-09-01',
    handoverTenureMonths: 12,
    remarks: 'Initial appointment of Admin for Wing-C Lakeview Apartment.',
  }
];
