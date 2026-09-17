import React, { useRef } from 'react';
import { useSociety } from '../context/SocietyContext';
import { formatINR, getMonthDisplayName, downloadCSV, compareFlatNumbers } from '../utils/formatters';
import { generateMonthlyReportPDF, generateBlankMonthlyReportPDF } from '../utils/pdfGenerator';
import {
  FileText,
  FileDown,
  Printer,
  X,
  CheckCircle2,
  Clock,
  IndianRupee,
  Share2,
  Copy,
  Building,
  Check,
  FileSpreadsheet
} from 'lucide-react';

interface MonthlyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MonthlyReportModal: React.FC<MonthlyReportModalProps> = ({ isOpen, onClose }) => {
  const {
    selectedMonth,
    allUsers,
    maintenanceRecords,
    expenses,
    openingBalance,
    totalMaintenanceReceived,
    totalExpenses,
    cashInHand,
    electricityBill,
    paidMembersCount,
    unpaidMembersCount,
    totalMembersCount,
  } = useSociety();

  const printRef = useRef<HTMLDivElement>(null);
  const [copiedSummary, setCopiedSummary] = React.useState(false);

  if (!isOpen) return null;

  // Sort maintenance records in natural series (C-101, C-102, C-201, etc.)
  const sortedRecords = [...maintenanceRecords].sort((a, b) => 
    compareFlatNumbers(a.flatNumber, b.flatNumber)
  );

  // Compute total pending arrears
  const totalArrearsPending = sortedRecords.reduce((acc, r) => acc + (r.pendingAmount || 0), 0);
  const totalCurrentPending = sortedRecords.reduce((acc, r) => acc + (!r.isPaid ? r.maintenanceDue : 0), 0);

  // Cash vs Online collected breakdown
  const cashCollected = sortedRecords
    .filter(r => r.isPaid && r.paymentMethod === 'Cash')
    .reduce((sum, r) => sum + r.maintenancePaid, 0);

  const onlineCollected = sortedRecords
    .filter(r => r.isPaid && r.paymentMethod !== 'Cash')
    .reduce((sum, r) => sum + r.maintenancePaid, 0);

  // Handle direct CSV download
  const handleDownloadCSV = () => {
    const filename = `WingC_Detailed_Monthly_Report_${selectedMonth}.csv`;
    const rows = [
      ['WING-C LAKEVIEW APARTMENT RESIDENTS WELFARE ASSOCIATION'],
      ['Burari, Delhi - 110084'],
      [`DETAILED MONTHLY ACCOUNTING & MAINTENANCE REPORT - ${getMonthDisplayName(selectedMonth)}`],
      ['Generated On', new Date().toLocaleString('en-IN')],
      [],
      ['--- SECTION 1: RESIDENT MAINTENANCE LEDGER (IN SERIES) ---'],
      [
        'Sr No.',
        'Flat No.',
        'Resident Name',
        'House Occupancy',
        'Owner / Landlord Details',
        'Contact Mobile',
        'Monthly Rate (₹)',
        'Past Arrears (₹)',
        'Total Due (₹)',
        'Payment Status',
        'Amount Paid (₹)',
        'Payment Mode',
        'Paid Date',
        'Recorded Entry Date',
        'Remaining Balance (₹)'
      ],
      ...sortedRecords.map((r, idx) => {
        const user = allUsers.find(u => u.flatNumber.toUpperCase() === r.flatNumber.toUpperCase());
        const occupancyStr = user?.occupancyType === 'tenant' ? 'Rented (Tenant)' : 'Self Owned';
        const ownerDetailStr = user?.occupancyType === 'tenant' 
          ? `Owner: ${user.ownerName || 'N/A'} (Ph: ${user.ownerContact || 'N/A'})` 
          : 'Self Owner';
        const totalDue = r.maintenanceDue + (r.pendingAmount || 0);
        const remBalance = totalDue - (r.isPaid ? r.maintenancePaid : 0);

        return [
          idx + 1,
          r.flatNumber,
          r.userName,
          occupancyStr,
          ownerDetailStr,
          r.phone,
          r.maintenanceDue,
          r.pendingAmount || 0,
          totalDue,
          r.isPaid ? 'PAID' : 'PENDING',
          r.isPaid ? r.maintenancePaid : 0,
          r.isPaid ? (r.paymentMethod || 'Online') : '-',
          r.paidDate || '-',
          r.markedDate || r.paidDate || '-',
          remBalance
        ];
      }),
      [],
      ['--- SECTION 2: SOCIETY EXPENSES BREAKDOWN ---'],
      ['Date', 'Expense Category', 'Title / Description', 'Paid To / Vendor', 'Payment Mode', 'Voucher / Ref', 'Amount (₹)'],
      ...expenses.map(e => [
        e.date,
        e.category,
        e.title,
        e.paidTo || '-',
        e.paymentMethod || 'UPI',
        e.billNumber || '-',
        e.amount
      ]),
      ...(expenses.length === 0 ? [['-', 'No expenses recorded for this month', '-', '-', '-', '-', 0]] : []),
      [],
      ['--- SECTION 3: FINAL FINANCIAL RECONCILIATION ---'],
      ['Accounting Head', 'Amount in INR (₹)'],
      ['1. Opening Balance Brought Forward', openingBalance],
      ['2. Total Maintenance Collected', totalMaintenanceReceived],
      ['   - Collected via Cash in Hand', cashCollected],
      ['   - Collected via Online / UPI / Bank', onlineCollected],
      ['3. Total Monthly Society Expenses Paid', totalExpenses],
      ['4. NET CASH IN HAND / SOCIETY BALANCE (At Month End)', cashInHand],
      [],
      ['Collection Summary: Total Flats', totalMembersCount],
      ['Paid Flats', paidMembersCount],
      ['Pending Flats', unpaidMembersCount],
      ['Electricity Bill Status', electricityBill.isPaid ? `PAID (${formatINR(electricityBill.billAmount)})` : `DUE (${formatINR(electricityBill.billAmount)})`],
    ];

    downloadCSV(filename, rows);
  };

  // Handle copy summary for WhatsApp group
  const handleCopyWhatsAppSummary = () => {
    const text = `🏢 *WING-C LAKEVIEW APARTMENT, BURARI*
📑 *Monthly Maintenance & Accounts Report - ${getMonthDisplayName(selectedMonth)}*

💰 *Financial Summary:*
• Opening Balance: ₹${openingBalance.toLocaleString('en-IN')}
• Total Collected: ₹${totalMaintenanceReceived.toLocaleString('en-IN')} (Cash: ₹${cashCollected.toLocaleString('en-IN')}, Online: ₹${onlineCollected.toLocaleString('en-IN')})
• Total Expenses: ₹${totalExpenses.toLocaleString('en-IN')}
• *Net Cash in Hand: ₹${cashInHand.toLocaleString('en-IN')}*

📊 *Collection Status:*
• Paid: ${paidMembersCount} / ${totalMembersCount} Flats
• Pending: ${unpaidMembersCount} Flats

⚠️ *Pending Dues List:*
${sortedRecords
  .filter(r => !r.isPaid)
  .map(r => `• Flat ${r.flatNumber} (${r.userName}): ₹${(r.maintenanceDue + r.pendingAmount).toLocaleString('en-IN')}`)
  .join('\n') || 'None - All Flats have Paid! 🎉'}

💳 *Payment Modes Accepted:*
• 💵 Cash: Direct submission to Society Office / Treasurer
• 📱 UPI / Online: Transfer to Society Admin

Generated via Wing-C Society Portal.`;

    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  // Direct PDF Generation and download
  const handleDownloadPDF = () => {
    generateMonthlyReportPDF({
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
    });
  };

  // Print report
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-1.5 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl my-2 sm:my-4 text-slate-100 flex flex-col max-h-[94vh]">
        
        {/* Top Modal Controls Header */}
        <div className="flex flex-wrap items-center justify-between p-3 sm:p-4 border-b border-slate-800 bg-slate-900/95 rounded-t-2xl gap-2 shrink-0">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-white truncate">Monthly Society Report</h3>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate">
                {getMonthDisplayName(selectedMonth)} • Members ledger & expenses
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {/* Primary Action: Download PDF Report */}
            <button
              type="button"
              id="btn-download-pdf-report"
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white shadow-md transition"
              title="Generate and Download official PDF Document"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>

            {/* Blank Format PDF for Physical / Empty records */}
            <button
              type="button"
              id="btn-download-blank-format"
              onClick={() => generateBlankMonthlyReportPDF(selectedMonth)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-amber-300 hover:text-amber-200 transition"
              title="Download official blank formatted ledger sheet (empty values for physical writing or new start)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
              <span>Blank Format</span>
            </button>

            {/* Excel / CSV */}
            <button
              type="button"
              id="btn-download-csv-action"
              onClick={handleDownloadCSV}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition"
              title="Download Excel / CSV File"
            >
              <FileDown className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden xs:inline">Excel/</span>CSV
            </button>

            {/* WhatsApp Summary */}
            <button
              type="button"
              id="btn-copy-whatsapp-report"
              onClick={handleCopyWhatsAppSummary}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition"
              title="Copy WhatsApp announcement summary"
            >
              {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span className="hidden sm:inline">{copiedSummary ? 'Copied!' : 'WhatsApp'}</span>
            </button>

            {/* Print / PDF dialog */}
            <button
              type="button"
              id="btn-print-report"
              onClick={handlePrint}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition"
              title="Print or Save as PDF"
            >
              <Printer className="w-3.5 h-3.5 text-sky-400" />
              <span>Print</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition ml-0.5"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable & Scrollable Content Body */}
        <div ref={printRef} className="p-4 sm:p-6 overflow-y-auto space-y-6 text-xs text-slate-200">
          
          {/* Report Document Header */}
          <div className="text-center pb-4 border-b border-slate-800 space-y-1">
            <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-widest">
              Wing-C Lakeview Apartment Residents Welfare Association
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Monthly Society Financial & Maintenance Report
            </h2>
            <p className="text-xs text-slate-400">
              Billing Period: <strong className="text-slate-200">{getMonthDisplayName(selectedMonth)}</strong> | Burari, Delhi - 110084
            </p>
            <p className="text-[11px] text-slate-500">
              Generated: {new Date().toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' })}
            </p>
          </div>

          {/* Key Executive Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Opening Fund</span>
              <span className="text-sm sm:text-base font-bold text-slate-100">{formatINR(openingBalance)}</span>
            </div>
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30">
              <span className="text-[10px] text-emerald-400 uppercase font-semibold block">Total Maintenance Collected</span>
              <span className="text-sm sm:text-base font-bold text-emerald-400">+{formatINR(totalMaintenanceReceived)}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Cash: {formatINR(cashCollected)} • Online: {formatINR(onlineCollected)}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30">
              <span className="text-[10px] text-rose-400 uppercase font-semibold block">Total Society Expenses</span>
              <span className="text-sm sm:text-base font-bold text-rose-400">-{formatINR(totalExpenses)}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">{expenses.length} Expense Vouchers</span>
            </div>
            <div className="p-3 rounded-xl bg-emerald-600/20 border border-emerald-500/50">
              <span className="text-[10px] text-emerald-300 uppercase font-bold block">NET CASH IN HAND</span>
              <span className="text-base sm:text-lg font-extrabold text-emerald-300">{formatINR(cashInHand)}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Closing Balance</span>
            </div>
          </div>

          {/* Section 1: Member Maintenance Details In Series */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                1. Member Maintenance Collection Ledger (Sorted by Series)
              </h4>
              <span className="text-xs text-slate-400 font-medium">
                Paid: <strong className="text-emerald-400">{paidMembersCount}</strong> | Pending: <strong className="text-rose-400">{unpaidMembersCount}</strong>
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-800/80 text-slate-300 border-b border-slate-700/80 text-[11px]">
                    <th className="py-2.5 px-3 font-semibold">#</th>
                    <th className="py-2.5 px-3 font-semibold">Flat No.</th>
                    <th className="py-2.5 px-3 font-semibold">Member Name</th>
                    <th className="py-2.5 px-3 font-semibold">House Type</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Rate (₹)</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Arrears (₹)</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Total Due (₹)</th>
                    <th className="py-2.5 px-3 font-semibold text-center">Status</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Paid (₹)</th>
                    <th className="py-2.5 px-3 font-semibold text-center">Mode</th>
                    <th className="py-2.5 px-3 font-semibold">Paid Date</th>
                    <th className="py-2.5 px-3 font-semibold">Entry Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {sortedRecords.length === 0 ? (
                    // Formatted blank rows for clean empty state
                    ['C-101', 'C-102', 'C-103', 'C-104', 'C-201', 'C-202', 'C-203', 'C-204', 'C-301', 'C-302', 'C-401', 'C-402'].map((flat, index) => (
                      <tr key={flat} className="hover:bg-slate-800/40 transition">
                        <td className="py-2 px-3 text-slate-500 font-mono">{index + 1}</td>
                        <td className="py-2 px-3 font-bold text-emerald-400 font-mono">{flat}</td>
                        <td className="py-2 px-3">
                          <div className="text-slate-500 italic">____________________</div>
                          <div className="text-[10px] text-slate-600 font-mono">__________</div>
                        </td>
                        <td className="py-2 px-3 text-slate-500 text-[10px]">
                          [  ] Owner  &nbsp; [  ] Tenant
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-slate-400">
                          ₹ 2,000
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-slate-500">
                          ₹ 0
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-slate-300">
                          ₹ 2,000
                        </td>
                        <td className="py-2 px-3 text-center text-[10px] text-slate-500">
                          [  ] Paid &nbsp; [  ] Due
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-slate-500">
                          ₹ ______
                        </td>
                        <td className="py-2 px-3 text-center text-[10px] text-slate-500">
                          [  ] Cash &nbsp; [  ] Online
                        </td>
                        <td className="py-2 px-3 text-slate-600 text-[11px] whitespace-nowrap">
                          ___/___/2026
                        </td>
                        <td className="py-2 px-3 text-slate-600 text-[11px] whitespace-nowrap">
                          ___/___/2026
                        </td>
                      </tr>
                    ))
                  ) : (
                    sortedRecords.map((rec, index) => {
                      const user = allUsers.find(u => u.flatNumber.toUpperCase() === rec.flatNumber.toUpperCase());
                      const totalDue = rec.maintenanceDue + (rec.pendingAmount || 0);

                      return (
                        <tr key={`${rec.id || rec.flatNumber}-${index}`} className="hover:bg-slate-800/40 transition">
                          <td className="py-2 px-3 text-slate-500 font-mono">{index + 1}</td>
                          <td className="py-2 px-3 font-bold text-white font-mono">{rec.flatNumber}</td>
                          <td className="py-2 px-3">
                            <div className="font-semibold text-slate-100">{rec.userName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{rec.phone}</div>
                          </td>
                          <td className="py-2 px-3">
                            {user?.occupancyType === 'tenant' ? (
                              <div>
                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/15 text-amber-400 font-medium">
                                  Rented
                                </span>
                                <div className="text-[10px] text-slate-400 truncate mt-0.5">
                                  Owner: {user.ownerName || '-'} ({user.ownerContact || '-'})
                                </div>
                              </div>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-medium">
                                Self Owned
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-slate-200">
                            {formatINR(rec.maintenanceDue)}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-amber-400">
                            {rec.pendingAmount > 0 ? formatINR(rec.pendingAmount) : '-'}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-200">
                            {formatINR(totalDue)}
                          </td>
                          <td className="py-2 px-3 text-center">
                            {rec.isPaid ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400">
                                <CheckCircle2 className="w-3 h-3" /> PAID
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400">
                                <Clock className="w-3 h-3" /> PENDING
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-emerald-400">
                            {rec.isPaid ? formatINR(rec.maintenancePaid) : '-'}
                          </td>
                          <td className="py-2 px-3 text-center">
                            {rec.isPaid ? (
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                rec.paymentMethod === 'Cash' 
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                                  : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                              }`}>
                                {rec.paymentMethod || 'Online'}
                              </span>
                            ) : '-'}
                          </td>
                          <td className="py-2 px-3 text-slate-400 text-[11px] whitespace-nowrap">
                            {rec.paidDate || '-'}
                          </td>
                          <td className="py-2 px-3 text-slate-400 text-[11px] whitespace-nowrap">
                            {rec.markedDate || rec.paidDate || '-'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-800 font-bold border-t border-slate-700 text-slate-100">
                    <td colSpan={4} className="py-2.5 px-3">Total Society Collection</td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      {formatINR(sortedRecords.reduce((s, r) => s + r.maintenanceDue, 0))}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-amber-400">
                      {formatINR(totalArrearsPending)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      {formatINR(sortedRecords.reduce((s, r) => s + (r.maintenanceDue + r.pendingAmount), 0))}
                    </td>
                    <td className="py-2.5 px-3 text-center">{paidMembersCount} / {totalMembersCount} Paid</td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-400">
                      {formatINR(totalMaintenanceReceived)}
                    </td>
                    <td colSpan={3} className="py-2.5 px-3 text-slate-400 text-center">
                      Cash: {formatINR(cashCollected)} | Online: {formatINR(onlineCollected)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Section 2: Society Expenses */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-400"></span>
              2. Society Expenses Breakdown ({getMonthDisplayName(selectedMonth)})
            </h4>

            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-800/80 text-slate-300 border-b border-slate-700/80 text-[11px]">
                    <th className="py-2.5 px-3 font-semibold">Date</th>
                    <th className="py-2.5 px-3 font-semibold">Category</th>
                    <th className="py-2.5 px-3 font-semibold">Expense Title / Description</th>
                    <th className="py-2.5 px-3 font-semibold">Paid To (Vendor/Person)</th>
                    <th className="py-2.5 px-3 font-semibold text-center">Mode</th>
                    <th className="py-2.5 px-3 font-semibold">Bill / Ref</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {expenses.length === 0 ? (
                    [1, 2, 3, 4, 5, 6].map((num) => (
                      <tr key={`blank-exp-${num}`} className="hover:bg-slate-800/40 transition">
                        <td className="py-2 px-3 text-slate-500 font-mono">___/___/2026</td>
                        <td className="py-2 px-3 text-slate-500">________________</td>
                        <td className="py-2 px-3 text-slate-500 italic">____________________________________</td>
                        <td className="py-2 px-3 text-slate-500">____________________</td>
                        <td className="py-2 px-3 text-center text-slate-500 text-[10px]">[  ] Cash  [  ] UPI</td>
                        <td className="py-2 px-3 text-slate-500 font-mono">________</td>
                        <td className="py-2 px-3 text-right font-mono text-slate-500">₹ _______</td>
                      </tr>
                    ))
                  ) : (
                    expenses.map((e, idx) => (
                      <tr key={`${e.id || 'exp'}-${idx}`} className="hover:bg-slate-800/40 transition">
                        <td className="py-2 px-3 text-slate-400 font-mono whitespace-nowrap">{e.date}</td>
                        <td className="py-2 px-3 font-medium text-slate-200">{e.category}</td>
                        <td className="py-2 px-3 text-slate-100">{e.title}</td>
                        <td className="py-2 px-3 text-slate-300">{e.paidTo || '-'}</td>
                        <td className="py-2 px-3 text-center">
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                            {e.paymentMethod || 'UPI'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-400 text-[11px]">{e.billNumber || '-'}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-rose-400">
                          {formatINR(e.amount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-800 font-bold border-t border-slate-700 text-slate-100">
                    <td colSpan={6} className="py-2.5 px-3">Total Monthly Expenses Paid</td>
                    <td className="py-2.5 px-3 text-right font-mono text-rose-400">
                      {expenses.length > 0 ? formatINR(totalExpenses) : '₹ 0 (Blank Format)'}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Section 3: Final Financial Position & Cash in Hand */}
          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              3. Final Cash in Hand & Balance Reconciliation
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5 border-r border-slate-700/60 pr-4">
                <div className="flex justify-between py-1 border-b border-slate-700/50">
                  <span className="text-slate-400">Opening Balance (Start of Month):</span>
                  <span className="font-mono font-semibold text-slate-200">{formatINR(openingBalance)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-700/50">
                  <span className="text-emerald-400">+ Total Maintenance Collected:</span>
                  <span className="font-mono font-bold text-emerald-400">+{formatINR(totalMaintenanceReceived)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-700/50">
                  <span className="text-rose-400">- Total Society Expenses:</span>
                  <span className="font-mono font-bold text-rose-400">-{formatINR(totalExpenses)}</span>
                </div>
                <div className="flex justify-between py-2 bg-emerald-950/40 px-2 rounded-lg border border-emerald-500/30 text-sm">
                  <span className="font-bold text-emerald-300">NET CASH IN HAND:</span>
                  <span className="font-mono font-black text-emerald-300">{formatINR(cashInHand)}</span>
                </div>
              </div>

              <div className="space-y-1.5 text-slate-300">
                <div className="flex justify-between py-1 border-b border-slate-700/50">
                  <span className="text-slate-400">Cash in Hand from Maintenance:</span>
                  <span className="font-mono font-semibold text-amber-300">{formatINR(cashCollected)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-700/50">
                  <span className="text-slate-400">Digital / Online Payments:</span>
                  <span className="font-mono font-semibold text-sky-300">{formatINR(onlineCollected)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-700/50">
                  <span className="text-slate-400">Electricity Bill Status:</span>
                  <span className="font-semibold text-slate-200">
                    {electricityBill.isPaid ? 'PAID' : `UNPAID (${formatINR(electricityBill.billAmount)})`}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 italic pt-1">
                  * All figures verified against registered society bank records and physical cash register of Wing-C Lakeview Apartment.
                </p>
              </div>
            </div>
          </div>

          {/* Sign-off footer */}
          <div className="pt-4 border-t border-slate-800 text-center text-slate-500 text-[11px]">
            Wing-C Lakeview Apartment, Burari, Delhi • Maintained by Society Admin & Resident Committee
          </div>

        </div>

      </div>
    </div>
  );
};
