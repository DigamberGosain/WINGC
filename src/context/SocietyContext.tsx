import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  User,
  ExpenseItem,
  MaintenanceRecord,
  ElectricityBill,
  MonthConfig,
  AdminHandoverLog,
  UserRole
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_MONTH_KEY,
  INITIAL_MONTH_CONFIG,
  INITIAL_ELECTRICITY_BILL,
  INITIAL_EXPENSES,
  INITIAL_MAINTENANCE_RECORDS,
  INITIAL_ADMIN_HANDOVER_LOGS
} from '../data/seedData';
import {
  saveUserToFirestore,
  deleteUserFromFirestore,
  saveExpenseToFirestore,
  deleteExpenseFromFirestore,
  saveMonthConfigToFirestore,
  saveElectricityBillToFirestore,
  resetFirestoreSocietyData,
  deleteMaintenanceRecordFromFirestore,
  checkDuplicateInFirestore,
  savePasswordResetCode,
  verifyPasswordResetCode as verifyCodeInFirestore,
  updateUserPasswordInFirestore
} from '../lib/firestoreService';
import { sendPasswordResetEmailViaGmail } from '../lib/gmailService';

interface SocietyContextType {
  // Current user & authentication
  currentUser: User | null;
  currentRole: UserRole | null;
  isAdmin: boolean;
  login: (identifier: string, password?: string) => { success: boolean; message: string };
  logout: () => void;
  registerUser: (userData: Omit<User, 'id' | 'registeredAt'>) => { success: boolean; message: string };
  updateProfile: (updated: Partial<User>) => void;
  deleteUser: (userId: string) => { success: boolean; message: string };
  
  // Password Recovery via Gmail & Firebase
  requestPasswordReset: (email: string) => Promise<{ success: boolean; message: string; code?: string; viaGmail: boolean }>;
  verifyPasswordReset: (email: string, code: string) => Promise<{ valid: boolean; message: string }>;
  resetPasswordWithCode: (email: string, code: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  resetAllToFirstTimeUse: () => Promise<{ success: boolean; message: string }>;
  
  // Admin single-person & handover management
  currentAdmin: User | null;
  transferAdminRole: (newAdminUserId: string, tenureMonths: number, remarks: string) => { success: boolean; message: string };
  adminHandoverLogs: AdminHandoverLog[];
  
  // Month selector & configuration
  selectedMonth: string; // "YYYY-MM"
  setSelectedMonth: (month: string) => void;
  activeRunningMonth: string;
  isRunningMonth: boolean;
  availableMonths: string[];
  currentMonthConfig: MonthConfig;
  updateMonthConfig: (updates: Partial<MonthConfig>) => void;
  
  // Financial metrics & ledger calculations
  openingBalance: number;
  totalMaintenanceReceived: number;
  totalExpenses: number;
  cashInHand: number;
  
  // Electricity bill
  electricityBill: ElectricityBill;
  updateElectricityBill: (updates: Partial<ElectricityBill>) => void;
  
  // Maintenance records
  maintenanceRecords: MaintenanceRecord[];
  markMaintenanceStatus: (recordId: string, isPaid: boolean, details?: Partial<MaintenanceRecord>) => void;
  updatePendingAmount: (recordId: string, newPendingAmount: number) => void;
  updateFlatRateAndArrears: (flatNumber: string, monthlyRate: number, arrears: number) => { success: boolean; message: string };
  paidMembersCount: number;
  unpaidMembersCount: number;
  totalMembersCount: number;
  unpaidPast15thList: MaintenanceRecord[]; // Members not paid past 15th
  
  // Expenses
  expenses: ExpenseItem[];
  addExpense: (expense: Omit<ExpenseItem, 'id' | 'recordedBy'>) => void;
  deleteExpense: (id: string) => void;
  
  // All society users
  allUsers: User[];
  
  // Reset / Refresh demo data
  resetToDefaults: () => void;
  resetSocietyData: (params: {
    monthYear: string;
    monthlyMaintenanceRate: number;
    openingBalance: number;
    electricityBill: ElectricityBill;
    initialExpenses?: ExpenseItem[];
    initializeFlats?: boolean;
  }) => Promise<void>;
}

const STORAGE_PREFIX = 'wing_c_lakeview_v1_';

// Helper to ensure expenses have guaranteed unique IDs and exact duplicates are purged
const ensureUniqueExpenses = (list: ExpenseItem[]): ExpenseItem[] => {
  if (!Array.isArray(list)) return [];
  const seenIds = new Set<string>();
  const uniqueList: ExpenseItem[] = [];

  for (const item of list) {
    if (!item) continue;
    let itemId = item.id || `exp-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    if (seenIds.has(itemId)) {
      // Check if it's an exact duplicate (e.g. from StrictMode double call)
      const isExactDuplicate = uniqueList.some(
        existing =>
          existing.monthYear === item.monthYear &&
          existing.title === item.title &&
          existing.amount === item.amount &&
          existing.category === item.category
      );
      if (isExactDuplicate) {
        continue; // Skip exact duplicate
      }
      // If different record with collided ID, reassign a unique ID
      itemId = `exp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }

    seenIds.add(itemId);
    uniqueList.push({ ...item, id: itemId });
  }

  return uniqueList;
};

const SocietyContext = createContext<SocietyContextType | undefined>(undefined);

export const SocietyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Users state
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}users`);
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return INITIAL_USERS;
  });

  // 2. Currently logged in user ID (persisted until logout)
  const [currentUserId, setCurrentUserId] = useState<string | null>(() => {
    return localStorage.getItem(`${STORAGE_PREFIX}current_user_id`) || 'user-admin-1';
  });

  // 3. Month selection
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    return localStorage.getItem(`${STORAGE_PREFIX}selected_month`) || INITIAL_MONTH_KEY;
  });

  // 4. Months configuration (Standard maintenance, proposed summary, opening balance)
  const [monthsConfig, setMonthsConfig] = useState<Record<string, MonthConfig>>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}months_config`);
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return { [INITIAL_MONTH_KEY]: INITIAL_MONTH_CONFIG };
  });

  // 5. Electricity bills per month
  const [electricityBills, setElectricityBills] = useState<Record<string, ElectricityBill>>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}electricity_bills`);
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return { [INITIAL_MONTH_KEY]: INITIAL_ELECTRICITY_BILL };
  });

  // 6. Expenses list (Sanitized on load to eliminate any prior duplicate keys)
  const [expenses, setExpenses] = useState<ExpenseItem[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}expenses`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return ensureUniqueExpenses(parsed);
        }
      } catch { /* ignore */ }
    }
    return ensureUniqueExpenses(INITIAL_EXPENSES);
  });

  // 7. Maintenance records per month
  const [maintenanceRecordsMap, setMaintenanceRecordsMap] = useState<Record<string, MaintenanceRecord[]>>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}maintenance_records`);
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return { [INITIAL_MONTH_KEY]: INITIAL_MAINTENANCE_RECORDS };
  });

  // 8. Admin handover logs
  const [adminHandoverLogs, setAdminHandoverLogs] = useState<AdminHandoverLog[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}admin_logs`);
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return INITIAL_ADMIN_HANDOVER_LOGS;
  });

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}users`, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUserId) {
      localStorage.setItem(`${STORAGE_PREFIX}current_user_id`, currentUserId);
    } else {
      localStorage.removeItem(`${STORAGE_PREFIX}current_user_id`);
    }
  }, [currentUserId]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}selected_month`, selectedMonth);
  }, [selectedMonth]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}months_config`, JSON.stringify(monthsConfig));
  }, [monthsConfig]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}electricity_bills`, JSON.stringify(electricityBills));
  }, [electricityBills]);

  useEffect(() => {
    const cleaned = ensureUniqueExpenses(expenses);
    if (cleaned.length !== expenses.length || cleaned.some((e, i) => e.id !== expenses[i]?.id)) {
      setExpenses(cleaned);
      return;
    }
    localStorage.setItem(`${STORAGE_PREFIX}expenses`, JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}maintenance_records`, JSON.stringify(maintenanceRecordsMap));
  }, [maintenanceRecordsMap]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}admin_logs`, JSON.stringify(adminHandoverLogs));
  }, [adminHandoverLogs]);

  // Derived current user & current admin
  const currentUser = useMemo(() => {
    return users.find(u => u.id === currentUserId) || null;
  }, [users, currentUserId]);

  const currentRole = currentUser ? currentUser.role : null;
  const isAdmin = currentRole === 'admin';

  const currentAdmin = useMemo(() => {
    return users.find(u => u.role === 'admin') || null;
  }, [users]);

  // Ensure current month configuration exists
  const currentMonthConfig: MonthConfig = useMemo(() => {
    if (monthsConfig[selectedMonth]) {
      return monthsConfig[selectedMonth];
    }
    // Default config if month is newly navigated to
    return {
      monthYear: selectedMonth,
      monthName: selectedMonth,
      standardMaintenanceAmount: 2000,
      proposedMaintenanceSummary: 'Standard maintenance is ₹2,000. Please clear dues on time.',
      openingBalance: 50000,
    };
  }, [monthsConfig, selectedMonth]);

  // Ensure electricity bill exists for current month
  const electricityBill: ElectricityBill = useMemo(() => {
    if (electricityBills[selectedMonth]) {
      return electricityBills[selectedMonth];
    }
    return {
      monthYear: selectedMonth,
      billAmount: 0,
      consumerNumber: 'TPDDL-100482910',
      billingPeriod: `Billing for ${selectedMonth}`,
      unitsConsumed: 0,
      dueDate: `${selectedMonth}-20`,
      isPaid: false,
      billDetails: 'TPDDL Burari common area supply.',
    };
  }, [electricityBills, selectedMonth]);

  // Ensure maintenance records exist for the selected month
  const maintenanceRecords: MaintenanceRecord[] = useMemo(() => {
    if (maintenanceRecordsMap[selectedMonth]) {
      return maintenanceRecordsMap[selectedMonth];
    }
    // Generate fresh records based on existing users
    const generated: MaintenanceRecord[] = users.map(user => ({
      id: `maint-${selectedMonth}-${user.id}`,
      monthYear: selectedMonth,
      userId: user.id,
      userName: user.name,
      flatNumber: user.flatNumber,
      phone: user.mobile,
      maintenanceDue: currentMonthConfig.standardMaintenanceAmount || 2000,
      maintenancePaid: 0,
      isPaid: false,
      pendingAmount: 0,
      notes: '',
    }));
    return generated;
  }, [maintenanceRecordsMap, selectedMonth, users, currentMonthConfig.standardMaintenanceAmount]);

  // Filter expenses for selected month
  const monthExpenses = useMemo(() => {
    return expenses.filter(e => e.monthYear === selectedMonth);
  }, [expenses, selectedMonth]);

  // Calculations for Ledger
  const totalMaintenanceReceived = useMemo(() => {
    return maintenanceRecords.reduce((sum, r) => sum + (r.isPaid ? r.maintenancePaid : 0), 0);
  }, [maintenanceRecords]);

  const totalExpenses = useMemo(() => {
    return monthExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [monthExpenses]);

  const openingBalance = currentMonthConfig.openingBalance || 0;

  // In Hand dynamically calculated: Opening Balance + Maintenance Received - Expenses Paid
  const cashInHand = useMemo(() => {
    return openingBalance + totalMaintenanceReceived - totalExpenses;
  }, [openingBalance, totalMaintenanceReceived, totalExpenses]);

  // Active Running Month definition (Current ongoing month)
  const ACTIVE_RUNNING_MONTH = '2026-09';
  const isRunningMonth = selectedMonth === ACTIVE_RUNNING_MONTH;

  // Paid / Unpaid counters
  const totalMembersCount = maintenanceRecords.length;
  const paidMembersCount = maintenanceRecords.filter(r => r.isPaid).length;
  const unpaidMembersCount = totalMembersCount - paidMembersCount;

  // Members not paid until 15th of month (Unpaid past 15th)
  const unpaidPast15thList = useMemo(() => {
    return maintenanceRecords.filter(r => !r.isPaid);
  }, [maintenanceRecords]);

  // Available months list - reports starting from first use of app
  const availableMonths = useMemo(() => {
    const set = new Set<string>([INITIAL_MONTH_KEY, '2026-08', '2026-09']);
    Object.keys(monthsConfig).forEach(m => set.add(m));
    Object.keys(maintenanceRecordsMap).forEach(m => set.add(m));
    expenses.forEach(e => set.add(e.monthYear));
    return Array.from(set).sort().reverse();
  }, [monthsConfig, maintenanceRecordsMap, expenses]);

  // -------------------------------------------------------------
  // ACTIONS
  // -------------------------------------------------------------

  // Authentication: Login
  const login = (identifier: string, password?: string) => {
    const cleanId = identifier.trim().toLowerCase();
    const user = users.find(u => 
      u.email.toLowerCase() === cleanId || 
      u.mobile === cleanId ||
      u.flatNumber.toLowerCase() === cleanId
    );

    if (!user) {
      return { success: false, message: 'User not found. Please register or verify Flat/Mobile/Email.' };
    }

    if (password && user.password && user.password !== password) {
      return { success: false, message: 'Incorrect password. Please try again.' };
    }

    setCurrentUserId(user.id);
    return { success: true, message: `Welcome back, ${user.name} (${user.role.toUpperCase()})` };
  };

  // Authentication: Logout
  const logout = () => {
    setCurrentUserId(null);
  };

  // User Registration
  const registerUser = (userData: Omit<User, 'id' | 'registeredAt'>) => {
    // 1. Admin can ONLY be one person at a time rule:
    if (userData.role === 'admin') {
      const existingAdmin = users.find(u => u.role === 'admin');
      if (existingAdmin) {
        return {
          success: false,
          message: `Admin registration blocked: Only one active admin is permitted at a time. Currently ${existingAdmin.name} (Flat ${existingAdmin.flatNumber}) is the designated Admin. Admin role can be transferred by the current Admin.`,
        };
      }
    }

    // 2. Check if Flat or Mobile already exists (strict uniqueness)
    const normFlat = userData.flatNumber.trim().toUpperCase();
    const normMobile = userData.mobile.trim();

    const flatExisting = users.find(u => u.flatNumber && u.flatNumber.trim().toUpperCase() === normFlat);
    if (flatExisting) {
      return {
        success: false,
        message: `Registration blocked: Flat ${normFlat} is already registered under resident ${flatExisting.name} (${flatExisting.occupancyType === 'tenant' ? 'Tenant' : 'Owner'}, Mobile: ${flatExisting.mobile}). Each flat can only have 1 active resident account. If the previous resident has moved out, ask the Society Admin to remove their profile.`,
      };
    }

    const mobileExisting = users.find(u => u.mobile && u.mobile.trim() === normMobile);
    if (mobileExisting) {
      return {
        success: false,
        message: `Registration blocked: Mobile number ${normMobile} is already registered with Flat ${mobileExisting.flatNumber} (${mobileExisting.name}). Duplicate mobile numbers cannot be registered.`,
      };
    }

    const newUser: User = {
      ...userData,
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      flatNumber: normFlat,
      occupancyType: userData.occupancyType || 'owner',
      ownerName: userData.occupancyType === 'tenant' ? userData.ownerName?.trim() : undefined,
      ownerContact: userData.occupancyType === 'tenant' ? userData.ownerContact?.trim() : undefined,
      registeredAt: new Date().toISOString().split('T')[0],
      adminAppointedDate: userData.role === 'admin' ? new Date().toISOString().split('T')[0] : undefined,
      adminTenureMonths: userData.role === 'admin' ? 12 : undefined,
    };

    setUsers(prev => [...prev, newUser]);
    saveUserToFirestore(newUser).catch(err => console.warn('Could not sync new user to Firestore:', err));

    // Add or update maintenance record for current month
    setMaintenanceRecordsMap(prev => {
      const currentList = prev[selectedMonth] || [];
      const existingIdx = currentList.findIndex(r => r.flatNumber.toUpperCase() === normFlat);

      if (existingIdx >= 0) {
        // Flat already had an initialized placeholder row from fresh setup, attach the registered resident
        const updatedList = [...currentList];
        updatedList[existingIdx] = {
          ...updatedList[existingIdx],
          userId: newUser.id,
          userName: newUser.name,
          phone: newUser.mobile,
        };
        return {
          ...prev,
          [selectedMonth]: updatedList,
        };
      }

      const newRecord: MaintenanceRecord = {
        id: `maint-${selectedMonth}-${newUser.id}`,
        monthYear: selectedMonth,
        userId: newUser.id,
        userName: newUser.name,
        flatNumber: newUser.flatNumber,
        phone: newUser.mobile,
        maintenanceDue: currentMonthConfig.standardMaintenanceAmount || 2000,
        maintenancePaid: 0,
        isPaid: false,
        pendingAmount: 0,
      };
      return {
        ...prev,
        [selectedMonth]: [...currentList, newRecord],
      };
    });

    setCurrentUserId(newUser.id);
    return { success: true, message: `Account created successfully! Logged in as ${newUser.name}.` };
  };

  // Remove / Delete user (e.g. tenant vacated or member moved out)
  const deleteUser = (userId: string) => {
    const target = users.find(u => u.id === userId);
    if (!target) {
      return { success: false, message: 'User not found in society records.' };
    }
    if (target.role === 'admin') {
      return { 
        success: false, 
        message: 'Cannot remove the active Admin. Please transfer Admin responsibilities to another resident first.' 
      };
    }

    // Remove user from local state
    setUsers(prev => prev.filter(u => u.id !== userId));

    // Sync deletion to Firestore
    deleteUserFromFirestore(userId).catch(err => console.warn('Could not sync user deletion to Firestore:', err));

    // Remove or detach their record from maintenance records
    setMaintenanceRecordsMap(prev => {
      const updatedMap: Record<string, MaintenanceRecord[]> = {};
      Object.keys(prev).forEach(m => {
        // Convert the record to an unassigned blank flat record so the flat series remains clean
        updatedMap[m] = prev[m].map(r => {
          if (r.userId === userId || r.flatNumber.toUpperCase() === target.flatNumber.toUpperCase()) {
            return {
              ...r,
              userId: undefined,
              userName: `Flat ${target.flatNumber} (Vacated)`,
              phone: '',
              isPaid: false,
              maintenancePaid: 0,
              notes: 'Resident moved out - ready for next tenant/owner',
            };
          }
          return r;
        });
      });
      return updatedMap;
    });

    if (currentUserId === userId) {
      setCurrentUserId(null);
    }

    return { 
      success: true, 
      message: `Resident ${target.name} (Flat ${target.flatNumber}) removed from Wing-C society records. The flat is now vacant and open for fresh registration.` 
    };
  };

  // Update flat maintenance rate and opening arrears
  const updateFlatRateAndArrears = (flatNumber: string, monthlyRate: number, arrears: number) => {
    setMaintenanceRecordsMap(prev => {
      const list = prev[selectedMonth] || maintenanceRecords;
      const targetNormalized = flatNumber.trim().toUpperCase();
      const updated = list.map(r => {
        if (r.flatNumber.toUpperCase() === targetNormalized) {
          return {
            ...r,
            maintenanceDue: monthlyRate,
            pendingAmount: Math.max(0, arrears),
          };
        }
        return r;
      });
      return {
        ...prev,
        [selectedMonth]: updated,
      };
    });
    return { success: true, message: `Updated rate and arrears for Flat ${flatNumber.toUpperCase()}` };
  };

  // Update profile / vehicle info
  const updateProfile = (updated: Partial<User>) => {
    if (!currentUser) return;
    setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, ...updated } : u));
  };

  // Admin Transfer (Leverage to change admin from time to time e.g. 1 year tenure)
  const transferAdminRole = (newAdminUserId: string, tenureMonths: number = 12, remarks: string) => {
    if (!isAdmin || !currentUser) {
      return { success: false, message: 'Only current Admin has the authority to transfer the Admin role.' };
    }

    const targetUser = users.find(u => u.id === newAdminUserId);
    if (!targetUser) {
      return { success: false, message: 'Target resident not found.' };
    }

    const handoverDate = new Date().toISOString().split('T')[0];

    // Log the transfer
    const newLog: AdminHandoverLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      fromAdminName: currentUser.name,
      fromAdminFlat: currentUser.flatNumber,
      toAdminName: targetUser.name,
      toAdminFlat: targetUser.flatNumber,
      transferDate: handoverDate,
      handoverTenureMonths: tenureMonths,
      remarks: remarks || `Admin tenure transferred for ${tenureMonths} months.`,
    };

    setAdminHandoverLogs(prev => [newLog, ...prev]);

    // Update roles: old admin becomes 'user', new becomes 'admin'
    setUsers(prev => prev.map(u => {
      if (u.id === currentUser.id) {
        return { ...u, role: 'user' };
      }
      if (u.id === targetUser.id) {
        return {
          ...u,
          role: 'admin',
          adminAppointedDate: handoverDate,
          adminTenureMonths: tenureMonths,
        };
      }
      return u;
    }));

    return {
      success: true,
      message: `Admin rights successfully handed over to ${targetUser.name} (${targetUser.flatNumber}) for ${tenureMonths} months tenure.`,
    };
  };

  // Update Month Configuration (Standard maintenance amount, proposed summary, opening balance)
  const updateMonthConfig = (updates: Partial<MonthConfig>) => {
    setMonthsConfig(prev => {
      const current = prev[selectedMonth] || currentMonthConfig;
      const updated = { ...current, ...updates };

      // If standardMaintenanceAmount changed, optionally update unpaid dues for this month
      if (updates.standardMaintenanceAmount && updates.standardMaintenanceAmount !== current.standardMaintenanceAmount) {
        setMaintenanceRecordsMap(recMap => {
          const list = recMap[selectedMonth] || [];
          const updatedList = list.map(r => {
            if (!r.isPaid) {
              return { ...r, maintenanceDue: updates.standardMaintenanceAmount! };
            }
            return r;
          });
          return { ...recMap, [selectedMonth]: updatedList };
        });
      }

      return {
        ...prev,
        [selectedMonth]: updated,
      };
    });
  };

  // Update Electricity Bill
  const updateElectricityBill = (updates: Partial<ElectricityBill>) => {
    const current = electricityBills[selectedMonth] || electricityBill;
    const updated = {
      ...current,
      ...updates,
      updatedBy: currentUser ? `${currentUser.name} (${currentUser.role})` : current.updatedBy,
    };

    setElectricityBills(prev => ({
      ...prev,
      [selectedMonth]: updated,
    }));

    // If marked as paid, automatically add or link to expenses if not already present
    if (updates.isPaid && !current.isPaid) {
      const billAmount = updates.billAmount ?? current.billAmount;
      if (billAmount > 0) {
        const expTitle = `Electricity Bill (${current.consumerNumber})`;
        setExpenses(expList => {
          const exists = expList.some(e => e.monthYear === selectedMonth && e.category === 'Electricity');
          if (exists) return expList;
          const newExp: ExpenseItem = {
            id: `exp-elec-${selectedMonth}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
            monthYear: selectedMonth,
            title: expTitle,
            category: 'Electricity',
            amount: billAmount,
            date: updates.paidDate || new Date().toISOString().split('T')[0],
            paidTo: 'TPDDL (Tata Power Delhi)',
            paymentMethod: 'UPI',
            receiptNote: updates.paymentRef || 'Paid via online bill portal',
            recordedBy: currentUser?.name || 'Admin',
          };
          return ensureUniqueExpenses([newExp, ...expList]);
        });
      }
    }
  };

  // Mark Maintenance Payment Status (Admin action)
  const markMaintenanceStatus = (recordId: string, isPaid: boolean, details?: Partial<MaintenanceRecord>) => {
    setMaintenanceRecordsMap(prev => {
      const list = prev[selectedMonth] || maintenanceRecords;
      const todayDate = new Date().toISOString().split('T')[0];
      const updated = list.map(r => {
        if (r.id === recordId) {
          const paidAmount = isPaid ? (details?.maintenancePaid ?? r.maintenanceDue) : 0;
          const method = details?.paymentMethod || 'Online';
          return {
            ...r,
            isPaid,
            maintenancePaid: paidAmount,
            paidDate: isPaid ? (details?.paidDate || todayDate) : undefined,
            markedDate: isPaid ? (details?.markedDate || todayDate) : undefined,
            paymentMethod: isPaid ? method : undefined,
            transactionRef: isPaid 
              ? (details?.transactionRef || (method === 'Cash' ? 'Cash in Hand (Paid to Admin)' : `ONLINE-${Date.now().toString().slice(-6)}`))
              : undefined,
            notes: details?.notes !== undefined ? details.notes : r.notes,
          };
        }
        return r;
      });
      return {
        ...prev,
        [selectedMonth]: updated,
      };
    });
  };

  // Update Pending Amount / Arrears for a member (Admin privilege)
  const updatePendingAmount = (recordId: string, newPendingAmount: number) => {
    setMaintenanceRecordsMap(prev => {
      const list = prev[selectedMonth] || maintenanceRecords;
      const updated = list.map(r => {
        if (r.id === recordId) {
          return {
            ...r,
            pendingAmount: Math.max(0, newPendingAmount),
          };
        }
        return r;
      });
      return {
        ...prev,
        [selectedMonth]: updated,
      };
    });
  };

  // Add Expense Item
  const addExpense = (newExp: Omit<ExpenseItem, 'id' | 'recordedBy'>) => {
    const item: ExpenseItem = {
      ...newExp,
      id: `exp-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      recordedBy: currentUser ? `${currentUser.name} (${currentUser.role})` : 'Admin',
    };
    setExpenses(prev => ensureUniqueExpenses([item, ...prev]));
  };

  // Delete Expense Item
  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  // Reset demo
  const resetToDefaults = () => {
    localStorage.clear();
    setUsers(INITIAL_USERS);
    setCurrentUserId('user-admin-1');
    setSelectedMonth(INITIAL_MONTH_KEY);
    setMonthsConfig({ [INITIAL_MONTH_KEY]: INITIAL_MONTH_CONFIG });
    setElectricityBills({ [INITIAL_MONTH_KEY]: INITIAL_ELECTRICITY_BILL });
    setExpenses(INITIAL_EXPENSES);
    setMaintenanceRecordsMap({ [INITIAL_MONTH_KEY]: INITIAL_MAINTENANCE_RECORDS });
    setAdminHandoverLogs(INITIAL_ADMIN_HANDOVER_LOGS);
  };

  // Fresh setup & reset ledger (Admin authority)
  const resetSocietyData = async (params: {
    monthYear: string;
    monthlyMaintenanceRate: number;
    openingBalance: number;
    electricityBill: ElectricityBill;
    initialExpenses?: ExpenseItem[];
    initializeFlats?: boolean;
  }) => {
    const { monthYear, monthlyMaintenanceRate, openingBalance, electricityBill, initialExpenses = [], initializeFlats = true } = params;

    const newMonthConfig: MonthConfig = {
      monthYear,
      monthName: monthYear,
      openingBalance,
      standardMaintenanceAmount: monthlyMaintenanceRate,
      proposedMaintenanceSummary: `Standard maintenance rate is ₹${monthlyMaintenanceRate.toLocaleString('en-IN')}.`,
    };

    // Keep admin user profile
    const adminUser: User = (currentUser && currentUser.role === 'admin')
      ? currentUser
      : (users.find(u => u.role === 'admin') || INITIAL_USERS[0]);

    const newUsers: User[] = [adminUser];
    let newRecords: MaintenanceRecord[] = [];

    if (initializeFlats) {
      const WING_C_FLAT_NUMBERS = [
        'C-101', 'C-102', 'C-103', 'C-104',
        'C-201', 'C-202', 'C-203', 'C-204',
        'C-301', 'C-302', 'C-303', 'C-304',
        'C-401', 'C-402', 'C-403', 'C-404'
      ];

      newRecords = WING_C_FLAT_NUMBERS.map(flat => {
        const isCurrentAdminFlat = flat === adminUser.flatNumber;
        return {
          id: `rec-${monthYear}-${flat}`,
          monthYear,
          userId: isCurrentAdminFlat ? adminUser.id : undefined,
          flatNumber: flat,
          userName: isCurrentAdminFlat ? adminUser.name : `Flat ${flat}`,
          phone: isCurrentAdminFlat ? adminUser.mobile : '',
          maintenanceDue: monthlyMaintenanceRate,
          pendingAmount: 0,
          maintenancePaid: 0,
          isPaid: false,
          notes: isCurrentAdminFlat ? 'Admin Flat' : 'Unassigned / Blank ledger line'
        };
      });
    } else {
      newRecords = [{
        id: `rec-${monthYear}-${adminUser.flatNumber}`,
        monthYear,
        userId: adminUser.id,
        flatNumber: adminUser.flatNumber,
        userName: adminUser.name,
        phone: adminUser.mobile,
        maintenanceDue: monthlyMaintenanceRate,
        pendingAmount: 0,
        maintenancePaid: 0,
        isPaid: false,
        notes: 'Admin Flat'
      }];
    }

    // Update Local Storage and State
    setSelectedMonth(monthYear);
    setUsers(newUsers);
    setMonthsConfig({ [monthYear]: newMonthConfig });
    setElectricityBills({ [monthYear]: electricityBill });
    setExpenses(initialExpenses);
    setMaintenanceRecordsMap({ [monthYear]: newRecords });

    // Sync to Firestore
    try {
      await resetFirestoreSocietyData({
        adminUser,
        monthConfig: newMonthConfig,
        electricityBill,
        expenses: initialExpenses,
        maintenanceRecords: newRecords
      });
    } catch (err) {
      console.warn('Could not sync fresh reset to Firestore (offline or rule constraint):', err);
    }
  };

  // ==========================================
  // PASSWORD RECOVERY VIA GMAIL & FIREBASE
  // ==========================================

  // In-memory OTP cache for instant verification
  const [resetCodes, setResetCodes] = useState<Record<string, { code: string; expiresAt: number }>>({});

  const requestPasswordReset = async (
    email: string
  ): Promise<{ success: boolean; message: string; code?: string; viaGmail: boolean }> => {
    const cleanEmail = email.trim().toLowerCase();
    const user = users.find((u) => u.email && u.email.trim().toLowerCase() === cleanEmail);
    if (!user) {
      return {
        success: false,
        message: `No registered society resident found with email "${email}". Please verify the email address or register a new flat account.`,
        viaGmail: false,
      };
    }

    // Generate random 6-digit numeric verification code
    const generatedCode = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = Date.now() + 15 * 60 * 1000;

    // Cache locally for instant verification
    setResetCodes((prev) => ({
      ...prev,
      [cleanEmail]: { code: generatedCode, expiresAt },
    }));

    // Save to Firestore (with timeout safeguard so it never blocks)
    try {
      await Promise.race([
        savePasswordResetCode(cleanEmail, generatedCode),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Firestore timeout')), 2000)),
      ]);
    } catch (e) {
      console.warn('Firestore code sync skipped (using in-memory verification):', e);
    }

    // Send email via Gmail API
    const emailRes = await sendPasswordResetEmailViaGmail({
      recipientEmail: cleanEmail,
      recipientName: user.name,
      resetCode: generatedCode,
      senderEmail: currentUser?.email || 'admin@lakeview.burari',
    });

    return {
      success: true,
      message: emailRes.message,
      code: generatedCode,
      viaGmail: emailRes.viaGmail,
    };
  };

  const verifyPasswordReset = async (
    email: string,
    code: string
  ): Promise<{ valid: boolean; message: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();

    // 1. Check local state cache
    const cached = resetCodes[cleanEmail];
    if (cached) {
      if (Date.now() > cached.expiresAt) {
        return { valid: false, message: 'This 6-digit verification code has expired. Please request a new code.' };
      }
      if (cached.code === cleanCode) {
        return { valid: true, message: 'Verification successful!' };
      }
    }

    // 2. Check Firestore
    return await verifyCodeInFirestore(cleanEmail, cleanCode);
  };

  const resetPasswordWithCode = async (
    email: string,
    code: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> => {
    const cleanEmail = email.trim().toLowerCase();

    // Verify code first
    const verification = await verifyPasswordReset(cleanEmail, code);
    if (!verification.valid) {
      return { success: false, message: verification.message };
    }

    if (!newPassword || newPassword.length < 6) {
      return { success: false, message: 'Password must be at least 6 characters long.' };
    }

    // Update in local state
    setUsers((prev) =>
      prev.map((u) =>
        u.email && u.email.trim().toLowerCase() === cleanEmail ? { ...u, password: newPassword } : u
      )
    );

    // Update in Firestore
    const firestoreRes = await updateUserPasswordInFirestore(cleanEmail, newPassword);

    // Clear used code from cache
    setResetCodes((prev) => {
      const copy = { ...prev };
      delete copy[cleanEmail];
      return copy;
    });

    return {
      success: true,
      message: firestoreRes.success
        ? 'Password updated successfully! Firebase has saved your new password.'
        : 'Password updated successfully!',
    };
  };

  // ==========================================
  // RESET ALL DETAILS TO CLEAN FIRST TIME USE
  // ==========================================
  const resetAllToFirstTimeUse = async (): Promise<{ success: boolean; message: string }> => {
    try {
      // 1. Clear old localStorage keys
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith(STORAGE_PREFIX) || key.startsWith('wing_c_')) {
          localStorage.removeItem(key);
        }
      });
      localStorage.setItem('wing_c_first_time_ready_v3', 'true');

      // 2. Reset state variables
      setUsers(INITIAL_USERS);
      setCurrentUserId('user-admin-1');
      setSelectedMonth(INITIAL_MONTH_KEY);
      setMonthsConfig({ [INITIAL_MONTH_KEY]: INITIAL_MONTH_CONFIG });
      setElectricityBills({ [INITIAL_MONTH_KEY]: INITIAL_ELECTRICITY_BILL });
      setExpenses([]);
      setMaintenanceRecordsMap({ [INITIAL_MONTH_KEY]: INITIAL_MAINTENANCE_RECORDS });
      setAdminHandoverLogs(INITIAL_ADMIN_HANDOVER_LOGS);

      // 3. Reset Firestore collections to fresh initial state
      const adminUser = INITIAL_USERS[0];
      await resetFirestoreSocietyData({
        adminUser,
        monthConfig: INITIAL_MONTH_CONFIG,
        electricityBill: INITIAL_ELECTRICITY_BILL,
        expenses: [],
        maintenanceRecords: INITIAL_MAINTENANCE_RECORDS,
      });

      return {
        success: true,
        message: 'All details have been completely reset and initialized ready for first-time use!',
      };
    } catch (err: any) {
      console.warn('Reset error:', err);
      return {
        success: false,
        message: 'Reset error: ' + (err?.message || String(err)),
      };
    }
  };

  // Automatic one-time clean setup on initial boot if not yet initialized
  useEffect(() => {
    const isCleaned = localStorage.getItem('wing_c_first_time_ready_v3');
    if (!isCleaned) {
      resetAllToFirstTimeUse().catch(console.warn);
    }
  }, []);

  return (
    <SocietyContext.Provider
      value={{
        currentUser,
        currentRole,
        isAdmin,
        login,
        logout,
        registerUser,
        updateProfile,
        deleteUser,
        requestPasswordReset,
        verifyPasswordReset,
        resetPasswordWithCode,
        resetAllToFirstTimeUse,
        currentAdmin,
        transferAdminRole,
        adminHandoverLogs,
        selectedMonth,
        setSelectedMonth,
        activeRunningMonth: ACTIVE_RUNNING_MONTH,
        isRunningMonth,
        availableMonths,
        currentMonthConfig,
        updateMonthConfig,
        openingBalance,
        totalMaintenanceReceived,
        totalExpenses,
        cashInHand,
        electricityBill,
        updateElectricityBill,
        maintenanceRecords,
        markMaintenanceStatus,
        updatePendingAmount,
        updateFlatRateAndArrears,
        paidMembersCount,
        unpaidMembersCount,
        totalMembersCount,
        unpaidPast15thList,
        expenses: monthExpenses,
        addExpense,
        deleteExpense,
        allUsers: users,
        resetToDefaults,
        resetSocietyData,
      }}
    >
      {children}
    </SocietyContext.Provider>
  );
};

export function useSociety() {
  const context = useContext(SocietyContext);
  if (!context) {
    throw new Error('useSociety must be used within a SocietyProvider');
  }
  return context;
}
