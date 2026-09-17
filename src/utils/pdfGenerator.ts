import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MaintenanceRecord, ExpenseItem, User, MonthConfig, ElectricityBill } from '../types';
import { formatINR, getMonthDisplayName, compareFlatNumbers } from './formatters';

interface GenerateReportPDFParams {
  selectedMonth: string;
  sortedRecords: MaintenanceRecord[];
  allUsers: User[];
  expenses: ExpenseItem[];
  openingBalance: number;
  totalMaintenanceReceived: number;
  cashCollected: number;
  onlineCollected: number;
  totalExpenses: number;
  cashInHand: number;
  paidMembersCount: number;
  unpaidMembersCount: number;
  totalMembersCount: number;
  electricityBill: ElectricityBill;
}

export const generateMonthlyReportPDF = (params: GenerateReportPDFParams) => {
  const {
    selectedMonth,
    sortedRecords,
    allUsers,
    expenses,
    openingBalance,
    totalMaintenanceReceived,
    cashCollected,
    onlineCollected,
    totalExpenses,
    cashInHand,
    paidMembersCount,
    unpaidMembersCount,
    totalMembersCount,
    electricityBill,
  } = params;

  // Create landscape A4 document for rich tabular layout
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const monthName = getMonthDisplayName(selectedMonth);
  const generationDate = new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Color Palette
  const primaryEmerald = [6, 78, 59] as [number, number, number]; // #064E3B
  const darkSlate = [15, 23, 42] as [number, number, number]; // #0F172A
  const textMuted = [100, 116, 139] as [number, number, number]; // #64748B

  // Page Header
  doc.setFillColor(primaryEmerald[0], primaryEmerald[1], primaryEmerald[2]);
  doc.rect(0, 0, 297, 24, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('WING-C LAKEVIEW APARTMENT RESIDENTS WELFARE ASSOCIATION', 14, 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(209, 250, 229);
  doc.text('Burari, Delhi - 110084 • Society Accounts & Maintenance Record', 14, 16);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text(`REPORT: ${monthName.toUpperCase()}`, 283, 10, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(209, 250, 229);
  doc.text(`Generated: ${generationDate}`, 283, 16, { align: 'right' });

  // Summary Metrics Cards (Table format)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.text('1. FINANCIAL EXECUTIVE SUMMARY & RECONCILIATION', 14, 32);

  const summaryData = [
    [
      `Opening Balance:\nRs. ${openingBalance.toLocaleString('en-IN')}`,
      `Total Maintenance Collected:\nRs. ${totalMaintenanceReceived.toLocaleString('en-IN')}\n(Cash: Rs. ${cashCollected.toLocaleString('en-IN')} | Online: Rs. ${onlineCollected.toLocaleString('en-IN')})`,
      `Total Monthly Expenses:\nRs. ${totalExpenses.toLocaleString('en-IN')}`,
      `Net Cash / Balance in Hand:\nRs. ${cashInHand.toLocaleString('en-IN')}`,
      `Collection Status:\n${paidMembersCount} Paid / ${totalMembersCount} Flats\n(${unpaidMembersCount} Pending)`,
      `Common Electricity Bill:\nRs. ${electricityBill.billAmount.toLocaleString('en-IN')}\nStatus: ${electricityBill.isPaid ? 'PAID' : 'PENDING'}`
    ]
  ];

  autoTable(doc, {
    startY: 35,
    body: summaryData,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 3,
      font: 'helvetica',
      textColor: darkSlate,
      valign: 'middle',
      halign: 'center',
    },
    headStyles: {
      fillColor: [241, 245, 249],
    },
    columnStyles: {
      0: { cellWidth: 42, fontStyle: 'bold', fillColor: [248, 250, 252] },
      1: { cellWidth: 54, fontStyle: 'bold', fillColor: [240, 253, 244] },
      2: { cellWidth: 42, fontStyle: 'bold', fillColor: [254, 242, 242] },
      3: { cellWidth: 45, fontStyle: 'bold', fillColor: [236, 253, 245] },
      4: { cellWidth: 43, fillColor: [248, 250, 252] },
      5: { cellWidth: 43, fillColor: [248, 250, 252] },
    },
    margin: { left: 14, right: 14 },
  });

  // Section 2: Residents Ledger
  const currentYAfterSummary = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 8 : 58;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.text('2. RESIDENT MAINTENANCE LEDGER (NUMERICAL SERIES)', 14, currentYAfterSummary);

  const ledgerHeaders = [
    '#',
    'Flat',
    'Resident Name',
    'Occupancy & Landlord',
    'Mobile',
    'Rate (Rs.)',
    'Arrears (Rs.)',
    'Total Due',
    'Status',
    'Paid (Rs.)',
    'Mode',
    'Paid Date',
    'Entry Date',
    'Balance'
  ];

  const ledgerRows = sortedRecords.map((r, idx) => {
    const user = allUsers.find(u => u.flatNumber.toUpperCase() === r.flatNumber.toUpperCase());
    const occupancyStr = user?.occupancyType === 'tenant'
      ? `Tenant (Owner: ${user.ownerName || '-'})`
      : 'Owner';

    const totalDue = r.maintenanceDue + (r.pendingAmount || 0);
    const balance = totalDue - (r.isPaid ? r.maintenancePaid : 0);

    return [
      idx + 1,
      r.flatNumber,
      r.userName,
      occupancyStr,
      r.phone,
      r.maintenanceDue.toLocaleString('en-IN'),
      (r.pendingAmount || 0).toLocaleString('en-IN'),
      totalDue.toLocaleString('en-IN'),
      r.isPaid ? 'PAID' : 'PENDING',
      (r.isPaid ? r.maintenancePaid : 0).toLocaleString('en-IN'),
      r.isPaid ? (r.paymentMethod === 'Cash' ? 'Cash' : 'Online') : '-',
      r.paidDate || '-',
      r.markedDate || r.paidDate || '-',
      balance <= 0 ? '0' : balance.toLocaleString('en-IN')
    ];
  });

  // If no records exist, print complete official blank formatted rows
  if (ledgerRows.length === 0) {
    const defaultWingCFlats = [
      'C-101', 'C-102', 'C-103', 'C-104',
      'C-201', 'C-202', 'C-203', 'C-204',
      'C-301', 'C-302', 'C-303', 'C-304',
      'C-401', 'C-402', 'C-403', 'C-404'
    ];
    defaultWingCFlats.forEach((flat, idx) => {
      ledgerRows.push([
        idx + 1,
        flat,
        '_____________________',
        '[  ] Owner   [  ] Tenant',
        '__________',
        '________',
        '________',
        '________',
        '[  ] Paid   [  ] Due',
        '________',
        '[  ] Cash   [  ] UPI',
        '___/___/2026',
        '___/___/2026',
        '________'
      ]);
    });
  }

  autoTable(doc, {
    startY: currentYAfterSummary + 3,
    head: [ledgerHeaders],
    body: ledgerRows,
    theme: 'striped',
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      font: 'helvetica',
      textColor: darkSlate,
      valign: 'middle',
    },
    headStyles: {
      fillColor: primaryEmerald,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 15, fontStyle: 'bold', halign: 'center' },
      2: { cellWidth: 32, fontStyle: 'bold' },
      3: { cellWidth: 38 },
      4: { cellWidth: 23, halign: 'center' },
      5: { cellWidth: 17, halign: 'right' },
      6: { cellWidth: 17, halign: 'right' },
      7: { cellWidth: 18, halign: 'right', fontStyle: 'bold' },
      8: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
      9: { cellWidth: 18, halign: 'right', fontStyle: 'bold' },
      10: { cellWidth: 16, halign: 'center' },
      11: { cellWidth: 20, halign: 'center' },
      12: { cellWidth: 20, halign: 'center' },
      13: { cellWidth: 15, halign: 'right', fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      // Highlight PAID vs PENDING
      if (data.section === 'body' && data.column.index === 8) {
        if (data.cell.raw === 'PAID') {
          data.cell.styles.textColor = [5, 150, 105]; // emerald
          data.cell.styles.fontStyle = 'bold';
        } else if (data.cell.raw === 'PENDING') {
          data.cell.styles.textColor = [220, 38, 38]; // red
          data.cell.styles.fontStyle = 'bold';
        }
      }
      // Highlight Cash vs Online
      if (data.section === 'body' && data.column.index === 10) {
        if (data.cell.raw === 'Cash') {
          data.cell.styles.textColor = [180, 83, 9]; // amber
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
    margin: { left: 14, right: 14 },
  });

  // Next Section: Society Expenses
  const yAfterLedger = (doc as any).lastAutoTable.finalY + 8;
  
  // If not enough room on page, add page
  let nextSectionY = yAfterLedger;
  if (nextSectionY > 150) {
    doc.addPage();
    nextSectionY = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.text('3. SOCIETY EXPENSES ITEMIZED STATEMENT', 14, nextSectionY);

  const expenseHeaders = [
    '#',
    'Date',
    'Category',
    'Expense Title & Description',
    'Paid To / Vendor',
    'Payment Mode',
    'Bill / Ref No.',
    'Amount (Rs.)'
  ];

  const expenseRows = expenses.map((e, idx) => [
    idx + 1,
    e.date,
    e.category,
    e.title,
    e.paidTo || '-',
    e.paymentMethod || 'UPI',
    e.receiptNote || '-',
    Number(e.amount).toLocaleString('en-IN')
  ]);

  if (expenses.length === 0) {
    // Generate 6 formatted blank rows for recording expenses
    for (let i = 1; i <= 6; i++) {
      expenseRows.push([
        i as any,
        '___/___/2026',
        '________________',
        '________________________________________',
        '____________________',
        '[  ] Cash   [  ] UPI',
        '____________',
        '__________'
      ]);
    }
  }

  // Add total row to expenses
  expenseRows.push([
    '' as any,
    '',
    '',
    'TOTAL MONTHLY EXPENSES',
    '',
    '',
    '',
    expenses.length > 0 ? totalExpenses.toLocaleString('en-IN') : 'Rs. __________'
  ]);

  autoTable(doc, {
    startY: nextSectionY + 3,
    head: [expenseHeaders],
    body: expenseRows,
    theme: 'striped',
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      font: 'helvetica',
      textColor: darkSlate,
      valign: 'middle',
    },
    headStyles: {
      fillColor: [30, 41, 59], // dark slate
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 25, halign: 'center' },
      2: { cellWidth: 35, fontStyle: 'bold' },
      3: { cellWidth: 80 },
      4: { cellWidth: 40 },
      5: { cellWidth: 25, halign: 'center' },
      6: { cellWidth: 25, halign: 'center' },
      7: { cellWidth: 29, halign: 'right', fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.row.index === expenseRows.length - 1) {
        data.cell.styles.fillColor = [241, 245, 249];
        data.cell.styles.fontStyle = 'bold';
      }
    },
    margin: { left: 14, right: 14 },
  });

  // Footer & Official Signatures block
  let finalY = (doc as any).lastAutoTable.finalY + 12;
  if (finalY > 175) {
    doc.addPage();
    finalY = 25;
  }

  // Verification Box
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, finalY, 269, 24, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.text('CERTIFICATE & RECONCILIATION STATEMENT:', 18, finalY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(
    `This is an authentic ledger generated from the Wing-C Lakeview Apartment management system for ${monthName}. ` +
    `Closing Net Cash in Hand / Society Balance stands reconciled at Rs. ${cashInHand.toLocaleString('en-IN')}. ` +
    `Total Collections: Rs. ${totalMaintenanceReceived.toLocaleString('en-IN')} (Cash: Rs. ${cashCollected.toLocaleString('en-IN')}, Online: Rs. ${onlineCollected.toLocaleString('en-IN')}).`,
    18,
    finalY + 12,
    { maxWidth: 260 }
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.text('Treasurer / Manager Signature: ___________________', 20, finalY + 20);
  doc.text('Authorized Admin / RWA President (Wing-C): ___________________', 170, finalY + 20);

  // Save the PDF
  const filename = `WingC_Lakeview_Report_${selectedMonth}.pdf`;
  doc.save(filename);
};

/**
 * Generates an official, completely blank formatted accounting and maintenance sheet
 * for physical record keeping, AGM distributions, or fresh empty records.
 */
export const generateBlankMonthlyReportPDF = (monthLabel?: string) => {
  const selectedMonth = monthLabel || 'BLANK_FORMAT';
  const monthName = monthLabel ? getMonthDisplayName(monthLabel) : '_______________ 2026';
  const generationDate = new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const primaryEmerald = [6, 78, 59] as [number, number, number];
  const darkSlate = [15, 23, 42] as [number, number, number];
  const textMuted = [100, 116, 139] as [number, number, number];

  // Page Header
  doc.setFillColor(primaryEmerald[0], primaryEmerald[1], primaryEmerald[2]);
  doc.rect(0, 0, 297, 24, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('WING-C LAKEVIEW APARTMENT RESIDENTS WELFARE ASSOCIATION', 14, 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(209, 250, 229);
  doc.text('Burari, Delhi - 110084 • Official Blank Ledger & Society Maintenance Register', 14, 16);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text(`MONTH: ${monthName.toUpperCase()}`, 283, 10, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(209, 250, 229);
  doc.text(`Print Date: ${generationDate}`, 283, 16, { align: 'right' });

  // Section 1: Financial Summary Cards (Blank)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.text('1. FINANCIAL EXECUTIVE SUMMARY & RECONCILIATION (BLANK FORMAT)', 14, 32);

  const summaryData = [
    [
      'Opening Balance:\nRs. ________________',
      'Total Maintenance Collected:\nRs. ________________\n(Cash: Rs. _______ | Online: Rs. _______)',
      'Total Monthly Expenses:\nRs. ________________',
      'Net Cash / Balance in Hand:\nRs. ________________',
      'Collection Status:\n____ Paid / ____ Flats\n(____ Pending)',
      'Common Electricity Bill:\nRs. ________________\nStatus: [  ] Paid   [  ] Due'
    ]
  ];

  autoTable(doc, {
    startY: 35,
    body: summaryData,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 3,
      font: 'helvetica',
      textColor: darkSlate,
      valign: 'middle',
      halign: 'center',
    },
    columnStyles: {
      0: { cellWidth: 42, fontStyle: 'bold', fillColor: [248, 250, 252] },
      1: { cellWidth: 54, fontStyle: 'bold', fillColor: [240, 253, 244] },
      2: { cellWidth: 42, fontStyle: 'bold', fillColor: [254, 242, 242] },
      3: { cellWidth: 45, fontStyle: 'bold', fillColor: [236, 253, 245] },
      4: { cellWidth: 43, fillColor: [248, 250, 252] },
      5: { cellWidth: 43, fillColor: [248, 250, 252] },
    },
    margin: { left: 14, right: 14 },
  });

  // Section 2: Ledger Rows for Wing-C Flats
  const currentYAfterSummary = (doc as any).lastAutoTable.finalY + 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.text('2. RESIDENT MAINTENANCE LEDGER (NUMERICAL SERIES)', 14, currentYAfterSummary);

  const ledgerHeaders = [
    '#',
    'Flat',
    'Resident Name',
    'Occupancy & Landlord',
    'Mobile',
    'Rate (Rs.)',
    'Arrears (Rs.)',
    'Total Due',
    'Status',
    'Paid (Rs.)',
    'Mode',
    'Paid Date',
    'Entry Date',
    'Member Sign / Balance'
  ];

  const defaultFlats = [
    'C-101', 'C-102', 'C-103', 'C-104',
    'C-201', 'C-202', 'C-203', 'C-204',
    'C-301', 'C-302', 'C-303', 'C-304',
    'C-401', 'C-402', 'C-403', 'C-404'
  ];

  const ledgerRows = defaultFlats.map((flat, idx) => [
    idx + 1,
    flat,
    '_____________________',
    '[  ] Owner   [  ] Tenant',
    '__________',
    '________',
    '________',
    '________',
    '[  ] Paid   [  ] Due',
    '________',
    '[  ] Cash   [  ] UPI',
    '___/___/2026',
    '___/___/2026',
    '________________'
  ]);

  autoTable(doc, {
    startY: currentYAfterSummary + 3,
    head: [ledgerHeaders],
    body: ledgerRows,
    theme: 'striped',
    styles: {
      fontSize: 7.5,
      cellPadding: 2.2,
      font: 'helvetica',
      textColor: darkSlate,
      valign: 'middle',
    },
    headStyles: {
      fillColor: primaryEmerald,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 15, fontStyle: 'bold', halign: 'center' },
      2: { cellWidth: 32, fontStyle: 'bold' },
      3: { cellWidth: 38 },
      4: { cellWidth: 23, halign: 'center' },
      5: { cellWidth: 17, halign: 'right' },
      6: { cellWidth: 17, halign: 'right' },
      7: { cellWidth: 18, halign: 'right', fontStyle: 'bold' },
      8: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
      9: { cellWidth: 18, halign: 'right', fontStyle: 'bold' },
      10: { cellWidth: 16, halign: 'center' },
      11: { cellWidth: 20, halign: 'center' },
      12: { cellWidth: 20, halign: 'center' },
      13: { cellWidth: 20, halign: 'center' },
    },
    margin: { left: 14, right: 14 },
  });

  // Next Page for Expenses & Signatures
  doc.addPage();
  const nextSectionY = 20;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.text('3. SOCIETY EXPENSES ITEMIZED STATEMENT (BLANK FORMAT)', 14, nextSectionY);

  const expenseHeaders = [
    '#',
    'Date',
    'Category',
    'Expense Title & Description',
    'Paid To / Vendor',
    'Payment Mode',
    'Bill / Ref No.',
    'Amount (Rs.)'
  ];

  const expenseRows: any[] = [];
  for (let i = 1; i <= 12; i++) {
    expenseRows.push([
      i,
      '___/___/2026',
      '________________',
      '________________________________________',
      '____________________',
      '[  ] Cash   [  ] UPI',
      '____________',
      '__________'
    ]);
  }

  expenseRows.push([
    '',
    '',
    '',
    'TOTAL MONTHLY EXPENSES',
    '',
    '',
    '',
    'Rs. ________________'
  ]);

  autoTable(doc, {
    startY: nextSectionY + 3,
    head: [expenseHeaders],
    body: expenseRows,
    theme: 'striped',
    styles: {
      fontSize: 8,
      cellPadding: 2.8,
      font: 'helvetica',
      textColor: darkSlate,
      valign: 'middle',
    },
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 25, halign: 'center' },
      2: { cellWidth: 35, fontStyle: 'bold' },
      3: { cellWidth: 80 },
      4: { cellWidth: 40 },
      5: { cellWidth: 25, halign: 'center' },
      6: { cellWidth: 25, halign: 'center' },
      7: { cellWidth: 29, halign: 'right', fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.row.index === expenseRows.length - 1) {
        data.cell.styles.fillColor = [241, 245, 249];
        data.cell.styles.fontStyle = 'bold';
      }
    },
    margin: { left: 14, right: 14 },
  });

  // Footer & Official Signatures block
  const finalY = (doc as any).lastAutoTable.finalY + 12;

  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, finalY, 269, 24, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.text('CERTIFICATE & RECONCILIATION STATEMENT:', 18, finalY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(
    `This is an authentic official blank accounting ledger template for Wing-C Lakeview Apartment, Burari, Delhi. ` +
    `Use for manual data collection, audit verifications, or physical noticeboard display.`,
    18,
    finalY + 12,
    { maxWidth: 260 }
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.text('Treasurer / Manager Signature: ___________________', 20, finalY + 20);
  doc.text('Authorized Admin / RWA President (Wing-C): ___________________', 170, finalY + 20);

  // Save the PDF
  const filename = `WingC_Lakeview_Blank_Ledger_Format.pdf`;
  doc.save(filename);
};
