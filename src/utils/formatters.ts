/**
 * Utility formatters and validators for Wing-C Lakeview Apartment
 */

export const RUPEE_SYMBOL = '₹';

// Format Indian Currency (e.g., ₹2,50,000)
// Explicitly guarantees the Indian Rupee symbol (₹) across all platforms & locales
export function formatINR(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return `${RUPEE_SYMBOL}0`;
  }
  
  const isNegative = amount < 0;
  const absVal = Math.abs(Math.round(amount));
  
  // Format in Indian numbering system (Lakhs & Crores, e.g. 2,50,000)
  let formattedNumber: string;
  try {
    formattedNumber = absVal.toLocaleString('en-IN', { maximumFractionDigits: 0 });
  } catch {
    const s = absVal.toString();
    const lastThree = s.substring(s.length - 3);
    const otherNumbers = s.substring(0, s.length - 3);
    formattedNumber = otherNumbers !== '' ? otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree : lastThree;
  }

  return `${isNegative ? '-' : ''}${RUPEE_SYMBOL}${formattedNumber}`;
}

// Indian Vehicle Number standard validation regex
// Handles: DL 01 AB 1234, DL-1C-AB-1234, HR 26 DQ 5555, DL 10 A 1234, etc.
const INDIAN_VEHICLE_REGEX = /^[A-Z]{2}[ -]?[0-9]{1,2}[ -]?[A-Z]{1,3}[ -]?[0-9]{4}$/i;

export function isValidIndianVehicle(numberStr: string): boolean {
  if (!numberStr || !numberStr.trim()) return true; // Optional field
  return INDIAN_VEHICLE_REGEX.test(numberStr.trim());
}

export function formatIndianVehicle(numberStr: string): string {
  if (!numberStr) return '';
  return numberStr.trim().toUpperCase();
}

// Phone validator (10-digit Indian mobile)
export function isValidIndianMobile(mobile: string): boolean {
  const clean = mobile.replace(/\D/g, '');
  return clean.length === 10 && /^[6-9]/.test(clean);
}

// Month name helper
export function getMonthDisplayName(monthKey: string): string {
  // monthKey is "YYYY-MM"
  try {
    const [year, month] = monthKey.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  } catch {
    return monthKey;
  }
}

// Flat number series comparator (e.g., C-101, C-102, C-201, C-202 ...)
export function compareFlatNumbers(flatA: string, flatB: string): number {
  const numA = parseInt(flatA.replace(/\D/g, ''), 10) || 0;
  const numB = parseInt(flatB.replace(/\D/g, ''), 10) || 0;
  if (numA !== numB) return numA - numB;
  return flatA.localeCompare(flatB);
}

// Export array to CSV download using Blob and UTF-8 BOM
export function downloadCSV(filename: string, rows: (string | number)[][]): boolean {
  try {
    const csvString = rows
      .map(row => row.map(cell => {
        const val = cell === null || cell === undefined ? '' : String(cell);
        return `"${val.replace(/"/g, '""')}"`;
      }).join(','))
      .join('\r\n');

    // Add \uFEFF BOM for Excel compatibility with Rupee symbol and Indian formatting
    const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 1000);
    return true;
  } catch (err) {
    console.error('Failed to download CSV:', err);
    return false;
  }
}
