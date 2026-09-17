import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import {
  User,
  ExpenseItem,
  MaintenanceRecord,
  ElectricityBill,
  MonthConfig,
  AdminHandoverLog
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

// Collection references
const USERS_COLLECTION = 'users';
const MONTHS_CONFIG_COLLECTION = 'monthsConfig';
const MAINTENANCE_RECORDS_COLLECTION = 'maintenanceRecords';
const EXPENSES_COLLECTION = 'expenses';
const ELECTRICITY_BILLS_COLLECTION = 'electricityBills';
const ADMIN_LOGS_COLLECTION = 'adminHandoverLogs';

/**
 * Strips any undefined fields from an object before writing to Firestore
 * to prevent Firestore "Unsupported field value: undefined" errors.
 */
function cleanPayload<T extends Record<string, any>>(obj: T): T {
  const result: any = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined) {
      result[key] = val;
    }
  }
  return result;
}

/**
 * Initializes Firestore with default seed data if collections are empty.
 */
export async function initializeFirestoreDatabase(): Promise<{ seeded: boolean; error?: string }> {
  try {
    const usersSnap = await getDocs(collection(db, USERS_COLLECTION));
    if (!usersSnap.empty) {
      console.log(`Firestore already populated with ${usersSnap.size} user records.`);
      return { seeded: false };
    }

    console.log('Seeding initial Wing-C Lakeview Apartment data to Firestore...');
    const batch = writeBatch(db);

    // 1. Seed initial users
    for (const u of INITIAL_USERS) {
      const userRef = doc(db, USERS_COLLECTION, u.id);
      batch.set(userRef, cleanPayload(u));
    }

    // 2. Seed initial month config
    const monthConfigRef = doc(db, MONTHS_CONFIG_COLLECTION, INITIAL_MONTH_KEY);
    batch.set(monthConfigRef, cleanPayload(INITIAL_MONTH_CONFIG));

    // 3. Seed initial electricity bill
    const billRef = doc(db, ELECTRICITY_BILLS_COLLECTION, INITIAL_MONTH_KEY);
    batch.set(billRef, cleanPayload(INITIAL_ELECTRICITY_BILL));

    // 4. Seed initial expenses
    for (const exp of INITIAL_EXPENSES) {
      const expRef = doc(db, EXPENSES_COLLECTION, exp.id);
      batch.set(expRef, cleanPayload(exp));
    }

    // 5. Seed initial maintenance records
    for (const rec of INITIAL_MAINTENANCE_RECORDS) {
      const recRef = doc(db, MAINTENANCE_RECORDS_COLLECTION, rec.id);
      batch.set(recRef, cleanPayload(rec));
    }

    // 6. Seed initial admin logs
    for (const log of INITIAL_ADMIN_HANDOVER_LOGS) {
      const logRef = doc(db, ADMIN_LOGS_COLLECTION, log.id);
      batch.set(logRef, cleanPayload(log));
    }

    await batch.commit();
    console.log('Initial Firestore seeding complete.');
    return { seeded: true };
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'initial_seed');
    return { seeded: false, error: String(err) };
  }
}

// ==========================================
// USERS FIRESTORE SYNC
// ==========================================

export function subscribeToUsers(
  onUpdate: (users: User[]) => void,
  onError?: (err: any) => void
) {
  return onSnapshot(
    collection(db, USERS_COLLECTION),
    (snapshot) => {
      const list: User[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as User);
      });
      onUpdate(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, USERS_COLLECTION);
      if (onError) onError(err);
    }
  );
}

export async function saveUserToFirestore(user: User): Promise<void> {
  try {
    const userRef = doc(db, USERS_COLLECTION, user.id);
    await setDoc(userRef, cleanPayload(user), { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${USERS_COLLECTION}/${user.id}`);
  }
}

export async function deleteUserFromFirestore(userId: string): Promise<void> {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    await deleteDoc(userRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${USERS_COLLECTION}/${userId}`);
  }
}

// ==========================================
// MONTHS CONFIG FIRESTORE SYNC
// ==========================================

export function subscribeToMonthsConfig(
  onUpdate: (configs: Record<string, MonthConfig>) => void,
  onError?: (err: any) => void
) {
  return onSnapshot(
    collection(db, MONTHS_CONFIG_COLLECTION),
    (snapshot) => {
      const map: Record<string, MonthConfig> = {};
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as MonthConfig;
        map[data.monthYear] = data;
      });
      onUpdate(map);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, MONTHS_CONFIG_COLLECTION);
      if (onError) onError(err);
    }
  );
}

export async function saveMonthConfigToFirestore(config: MonthConfig): Promise<void> {
  try {
    const configRef = doc(db, MONTHS_CONFIG_COLLECTION, config.monthYear);
    await setDoc(configRef, cleanPayload(config), { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${MONTHS_CONFIG_COLLECTION}/${config.monthYear}`);
  }
}

// ==========================================
// MAINTENANCE RECORDS FIRESTORE SYNC
// ==========================================

export function subscribeToMaintenanceRecords(
  onUpdate: (records: Record<string, MaintenanceRecord[]>) => void,
  onError?: (err: any) => void
) {
  return onSnapshot(
    collection(db, MAINTENANCE_RECORDS_COLLECTION),
    (snapshot) => {
      const recordsByMonth: Record<string, MaintenanceRecord[]> = {};
      snapshot.forEach((docSnap) => {
        const rec = docSnap.data() as MaintenanceRecord;
        if (!recordsByMonth[rec.monthYear]) {
          recordsByMonth[rec.monthYear] = [];
        }
        recordsByMonth[rec.monthYear].push(rec);
      });
      onUpdate(recordsByMonth);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, MAINTENANCE_RECORDS_COLLECTION);
      if (onError) onError(err);
    }
  );
}

export async function saveMaintenanceRecordToFirestore(record: MaintenanceRecord): Promise<void> {
  try {
    const recRef = doc(db, MAINTENANCE_RECORDS_COLLECTION, record.id);
    await setDoc(recRef, cleanPayload(record), { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${MAINTENANCE_RECORDS_COLLECTION}/${record.id}`);
  }
}

export async function saveBatchMaintenanceRecordsToFirestore(records: MaintenanceRecord[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    for (const rec of records) {
      const recRef = doc(db, MAINTENANCE_RECORDS_COLLECTION, rec.id);
      batch.set(recRef, cleanPayload(rec), { merge: true });
    }
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, MAINTENANCE_RECORDS_COLLECTION);
  }
}

// ==========================================
// EXPENSES FIRESTORE SYNC
// ==========================================

export function subscribeToExpenses(
  onUpdate: (expenses: ExpenseItem[]) => void,
  onError?: (err: any) => void
) {
  return onSnapshot(
    collection(db, EXPENSES_COLLECTION),
    (snapshot) => {
      const list: ExpenseItem[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as ExpenseItem);
      });
      onUpdate(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, EXPENSES_COLLECTION);
      if (onError) onError(err);
    }
  );
}

export async function saveExpenseToFirestore(expense: ExpenseItem): Promise<void> {
  try {
    const expRef = doc(db, EXPENSES_COLLECTION, expense.id);
    await setDoc(expRef, cleanPayload(expense), { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${EXPENSES_COLLECTION}/${expense.id}`);
  }
}

export async function deleteExpenseFromFirestore(expenseId: string): Promise<void> {
  try {
    const expRef = doc(db, EXPENSES_COLLECTION, expenseId);
    await deleteDoc(expRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${EXPENSES_COLLECTION}/${expenseId}`);
  }
}

// ==========================================
// ELECTRICITY BILLS FIRESTORE SYNC
// ==========================================

export function subscribeToElectricityBills(
  onUpdate: (bills: Record<string, ElectricityBill>) => void,
  onError?: (err: any) => void
) {
  return onSnapshot(
    collection(db, ELECTRICITY_BILLS_COLLECTION),
    (snapshot) => {
      const map: Record<string, ElectricityBill> = {};
      snapshot.forEach((docSnap) => {
        const bill = docSnap.data() as ElectricityBill;
        map[bill.monthYear] = bill;
      });
      onUpdate(map);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, ELECTRICITY_BILLS_COLLECTION);
      if (onError) onError(err);
    }
  );
}

export async function saveElectricityBillToFirestore(bill: ElectricityBill): Promise<void> {
  try {
    const billRef = doc(db, ELECTRICITY_BILLS_COLLECTION, bill.monthYear);
    await setDoc(billRef, cleanPayload(bill), { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${ELECTRICITY_BILLS_COLLECTION}/${bill.monthYear}`);
  }
}

// ==========================================
// ADMIN HANDOVER LOGS FIRESTORE SYNC
// ==========================================

export function subscribeToAdminLogs(
  onUpdate: (logs: AdminHandoverLog[]) => void,
  onError?: (err: any) => void
) {
  return onSnapshot(
    collection(db, ADMIN_LOGS_COLLECTION),
    (snapshot) => {
      const list: AdminHandoverLog[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as AdminHandoverLog);
      });
      onUpdate(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, ADMIN_LOGS_COLLECTION);
      if (onError) onError(err);
    }
  );
}

export async function saveAdminLogToFirestore(log: AdminHandoverLog): Promise<void> {
  try {
    const logRef = doc(db, ADMIN_LOGS_COLLECTION, log.id);
    await setDoc(logRef, cleanPayload(log), { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${ADMIN_LOGS_COLLECTION}/${log.id}`);
  }
}

export async function deleteMaintenanceRecordFromFirestore(recordId: string): Promise<void> {
  try {
    const recRef = doc(db, MAINTENANCE_RECORDS_COLLECTION, recordId);
    await deleteDoc(recRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${MAINTENANCE_RECORDS_COLLECTION}/${recordId}`);
  }
}

/**
 * Checks Firestore for existing users with duplicate flatNumber or mobile.
 */
export async function checkDuplicateInFirestore(
  flatNumber: string,
  mobile: string,
  excludeUserId?: string
): Promise<{ isDuplicate: boolean; reason?: string; existingUser?: User }> {
  try {
    const usersSnap = await getDocs(collection(db, USERS_COLLECTION));
    const normalizedFlat = flatNumber.trim().toUpperCase();
    const normalizedMobile = mobile.trim();

    for (const docSnap of usersSnap.docs) {
      const u = docSnap.data() as User;
      if (excludeUserId && u.id === excludeUserId) continue;

      if (u.flatNumber && u.flatNumber.trim().toUpperCase() === normalizedFlat) {
        return {
          isDuplicate: true,
          reason: `Flat ${normalizedFlat} is already registered with resident ${u.name} (Mobile: ${u.mobile}). Each flat can only have one active resident account. If the resident has moved out, ask the society Admin to remove them.`,
          existingUser: u,
        };
      }

      if (u.mobile && u.mobile.trim() === normalizedMobile) {
        return {
          isDuplicate: true,
          reason: `Mobile number ${normalizedMobile} is already registered under Flat ${u.flatNumber} (${u.name}). Duplicate mobile numbers are not allowed.`,
          existingUser: u,
        };
      }
    }

    return { isDuplicate: false };
  } catch (err) {
    console.warn('Firestore duplicate check offline or errored, falling back to local verification:', err);
    return { isDuplicate: false };
  }
}

/**
 * Resets Firestore database to fresh blank state with Admin's specified initial settings.
 */
export async function resetFirestoreSocietyData(params: {
  adminUser: User;
  monthConfig: MonthConfig;
  electricityBill: ElectricityBill;
  expenses: ExpenseItem[];
  maintenanceRecords: MaintenanceRecord[];
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { adminUser, monthConfig, electricityBill, expenses, maintenanceRecords } = params;

    // 1. Clear existing documents in batches
    const collectionsToClear = [
      USERS_COLLECTION,
      EXPENSES_COLLECTION,
      MAINTENANCE_RECORDS_COLLECTION
    ];

    for (const colName of collectionsToClear) {
      const snap = await getDocs(collection(db, colName));
      const batch = writeBatch(db);
      snap.forEach(d => {
        batch.delete(d.ref);
      });
      await batch.commit();
    }

    // 2. Write fresh seed data
    const batch = writeBatch(db);

    // Save admin user
    const adminRef = doc(db, USERS_COLLECTION, adminUser.id);
    batch.set(adminRef, cleanPayload(adminUser));

    // Save month config
    const configRef = doc(db, MONTHS_CONFIG_COLLECTION, monthConfig.monthYear);
    batch.set(configRef, cleanPayload(monthConfig));

    // Save electricity bill
    const billRef = doc(db, ELECTRICITY_BILLS_COLLECTION, electricityBill.monthYear);
    batch.set(billRef, cleanPayload(electricityBill));

    // Save any initial expenses
    for (const exp of expenses) {
      const expRef = doc(db, EXPENSES_COLLECTION, exp.id);
      batch.set(expRef, cleanPayload(exp));
    }

    // Save any initial maintenance records
    for (const rec of maintenanceRecords) {
      const recRef = doc(db, MAINTENANCE_RECORDS_COLLECTION, rec.id);
      batch.set(recRef, cleanPayload(rec));
    }

    await batch.commit();
    return { success: true };
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'reset_society_data');
    return { success: false, error: String(err) };
  }
}

// ==========================================
// PASSWORD RESET CODE FIRESTORE HELPERS
// ==========================================

const PASSWORD_RESETS_COLLECTION = 'passwordResetRequests';

export interface PasswordResetRecord {
  id: string;
  email: string;
  code: string;
  createdAt: string;
  expiresAt: number;
  used: boolean;
}

/**
 * Saves a 6-digit verification code to Firestore for password reset.
 */
export async function savePasswordResetCode(email: string, code: string): Promise<void> {
  try {
    const docId = `reset-${email.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    const resetRef = doc(db, PASSWORD_RESETS_COLLECTION, docId);
    const data: PasswordResetRecord = {
      id: docId,
      email: email.toLowerCase().trim(),
      code: code.trim(),
      createdAt: new Date().toISOString(),
      expiresAt: Date.now() + 15 * 60 * 1000, // 15 minutes validity
      used: false,
    };
    await setDoc(resetRef, data);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${PASSWORD_RESETS_COLLECTION}/${email}`);
  }
}

/**
 * Verifies a 6-digit code against Firestore.
 */
export async function verifyPasswordResetCode(
  email: string,
  code: string
): Promise<{ valid: boolean; message: string }> {
  try {
    const docId = `reset-${email.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    const snap = await getDocs(collection(db, PASSWORD_RESETS_COLLECTION));
    let matchedDoc: PasswordResetRecord | null = null;

    snap.forEach((d) => {
      const rec = d.data() as PasswordResetRecord;
      if (rec.email.toLowerCase() === email.toLowerCase().trim()) {
        matchedDoc = rec;
      }
    });

    if (!matchedDoc) {
      return { valid: false, message: 'No reset request found for this email address.' };
    }

    const rec: PasswordResetRecord = matchedDoc;

    if (rec.used) {
      return { valid: false, message: 'This verification code has already been used. Please request a new one.' };
    }

    if (Date.now() > rec.expiresAt) {
      return { valid: false, message: 'This verification code has expired. Please request a new 6-digit code.' };
    }

    if (rec.code !== code.trim()) {
      return { valid: false, message: 'Incorrect 6-digit verification code. Please check and try again.' };
    }

    return { valid: true, message: 'Verification successful!' };
  } catch (err) {
    console.warn('Firestore verification lookup fallback:', err);
    return { valid: false, message: 'Verification error occurred. Please try again.' };
  }
}

/**
 * Marks a password reset code as used in Firestore.
 */
export async function markPasswordResetCodeUsed(email: string): Promise<void> {
  try {
    const docId = `reset-${email.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    const resetRef = doc(db, PASSWORD_RESETS_COLLECTION, docId);
    await setDoc(resetRef, { used: true, usedAt: new Date().toISOString() }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${PASSWORD_RESETS_COLLECTION}/${email}`);
  }
}

/**
 * Updates a user's password in Firestore by email.
 */
export async function updateUserPasswordInFirestore(
  email: string,
  newPassword: string
): Promise<{ success: boolean; user?: User; message: string }> {
  try {
    const usersSnap = await getDocs(collection(db, USERS_COLLECTION));
    let foundDocId: string | null = null;
    let foundUser: User | null = null;

    usersSnap.forEach((d) => {
      const u = d.data() as User;
      if (u.email.toLowerCase() === email.toLowerCase().trim()) {
        foundDocId = d.id;
        foundUser = u;
      }
    });

    if (!foundDocId || !foundUser) {
      return { success: false, message: 'User not found in society directory.' };
    }

    const updatedUser: User = {
      ...(foundUser as User),
      password: newPassword,
    };

    const userRef = doc(db, USERS_COLLECTION, foundDocId);
    await setDoc(userRef, cleanPayload(updatedUser), { merge: true });

    // Mark reset code used
    await markPasswordResetCodeUsed(email);

    return { success: true, user: updatedUser, message: 'Password updated successfully in Firebase.' };
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, USERS_COLLECTION);
    return { success: false, message: 'Failed to update password in Firebase: ' + String(err) };
  }
}

