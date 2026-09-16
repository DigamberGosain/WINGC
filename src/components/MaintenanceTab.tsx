import React, { useState } from 'react';
import { useSociety } from '../context/SocietyContext';
import { formatINR, getMonthDisplayName, downloadCSV, compareFlatNumbers } from '../utils/formatters';
import { generateMonthlyReportPDF } from '../utils/pdfGenerator';
import { MaintenanceRecord, User } from '../types';
import { MonthlyReportModal } from './MonthlyReportModal';
import { SetupRatesAndArrearsModal } from './SetupRatesAndArrearsModal';
import {
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  CreditCard,
  Edit2,
  FileDown,
  FileText,
  Receipt,
  Settings,
  AlertCircle,
  X,
  Phone,
  Check,
  Building,
  Sliders,
  UserMinus,
  Trash2,
  MessageSquare,
  Copy,
  Send
} from 'lucide-react';

interface MaintenanceTabProps {
  selectedRecordIdForPay?: string | null;
  onClearSelectedRecordForPay?: () => void;
}

export const MaintenanceTab: React.FC<MaintenanceTabProps> = ({
  selectedRecordIdForPay,
  onClearSelectedRecordForPay,
}) => {
  const {
    selectedMonth,
    maintenanceRecords,
    allUsers,
    deleteUser,
    markMaintenanceStatus,
    updatePendingAmount,
    currentMonthConfig,
    updateMonthConfig,
    isAdmin,
    currentUser,
    paidMembersCount,
    unpaidMembersCount,
    totalMembersCount,
    totalMaintenanceReceived,
    totalExpenses,
    expenses,
    openingBalance,
    cashInHand,
    electricityBill,
  } = useSociety();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'unpaid'>('all');

  // Modals state
  const [showReportModal, setShowReportModal] = useState(false);
  const [showRatesModal, setShowRatesModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const [editingRecord, setEditingRecord] = useState<MaintenanceRecord | null>(null);
  const [payAmount, setPayAmount] = useState<number>(2000);
  const [payMethod, setPayMethod] = useState<'Online' | 'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque'>('Online');
  const [payDate, setPayDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [payMarkedDate, setPayMarkedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [payRef, setPayRef] = useState<string>('');
  const [payNotes, setPayNotes] = useState<string>('');

  // Pending Arrears Modal
  const [arrearsRecord, setArrearsRecord] = useState<MaintenanceRecord | null>(null);
  const [newArrearsAmount, setNewArrearsAmount] = useState<number>(0);

  // Set Standard Maintenance Amount Modal (Admin privilege)
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [newStandardAmount, setNewStandardAmount] = useState(currentMonthConfig.standardMaintenanceAmount || 2000);

  // Receipt Modal
  const [receiptRecord, setReceiptRecord] = useState<MaintenanceRecord | null>(null);

  // WhatsApp & SMS reminder copy state
  const [copiedReminderId, setCopiedReminderId] = useState<string | null>(null);

  // Polite reminder message generator with Cash & UPI payment options
  const getReminderMessage = (record: MaintenanceRecord) => {
    const totalDue = record.maintenanceDue + (record.pendingAmount || 0);
    const breakdown = record.pendingAmount > 0 
      ? ` (Monthly: ₹${record.maintenanceDue.toLocaleString('en-IN')} + Previous Arrears: ₹${record.pendingAmount.toLocaleString('en-IN')})` 
      : '';
    return `Dear ${record.userName} ji (${record.flatNumber}),

Polite reminder regarding Wing-C Lakeview Apartment maintenance for ${getMonthDisplayName(selectedMonth)}.

• Total Due: ₹${totalDue.toLocaleString('en-IN')}${breakdown}

Accepted Payment Modes:
💵 1. Cash: Submit cash directly to the Society Treasurer / Admin
📱 2. UPI / Online: Transfer via UPI / Net Banking to Society Admin

Kindly inform or share receipt/screenshot once payment is done. Thank you!
- Wing-C Society Management`;
  };

  const handleCopyReminder = (record: MaintenanceRecord) => {
    const msg = getReminderMessage(record);
    navigator.clipboard.writeText(msg);
    setCopiedReminderId(record.id);
    setTimeout(() => setCopiedReminderId(null), 2500);
  };

  // Handle external trigger from dashboard (if any)
  React.useEffect(() => {
    if (selectedRecordIdForPay) {
      const rec = maintenanceRecords.find(r => r.id === selectedRecordIdForPay);
      if (rec) {
        openMarkPaidModal(rec);
      }
      onClearSelectedRecordForPay?.();
    }
  }, [selectedRecordIdForPay, maintenanceRecords]);

  // Open mark paid modal
  const openMarkPaidModal = (record: MaintenanceRecord) => {
    setEditingRecord(record);
    setPayAmount(record.maintenanceDue);
    setPayMethod(record.paymentMethod || 'Online');
    setPayDate(record.paidDate || new Date().toISOString().split('T')[0]);
    setPayMarkedDate(record.markedDate || new Date().toISOString().split('T')[0]);
    setPayRef(record.transactionRef || (record.paymentMethod === 'Cash' ? 'Cash Received' : `UPI-${Date.now().toString().slice(-6)}`));
    setPayNotes(record.notes || '');
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;

    markMaintenanceStatus(editingRecord.id, true, {
      maintenancePaid: payAmount,
      paymentMethod: payMethod,
      paidDate: payDate,
      markedDate: payMarkedDate,
      transactionRef: payRef,
      notes: payNotes,
    });

    setEditingRecord(null);
  };

  // Open Arrears Modal
  const openArrearsModal = (record: MaintenanceRecord) => {
    setArrearsRecord(record);
    setNewArrearsAmount(record.pendingAmount || 0);
  };

  const handleSaveArrears = (e: React.FormEvent) => {
    e.preventDefault();
    if (!arrearsRecord) return;
    updatePendingAmount(arrearsRecord.id, Number(newArrearsAmount));
    setArrearsRecord(null);
  };

  // Save standard monthly maintenance charge
  const handleSaveStandardCharge = (e: React.FormEvent) => {
    e.preventDefault();
    updateMonthConfig({ standardMaintenanceAmount: Number(newStandardAmount) });
    setShowConfigModal(false);
  };

  // Filtered records
  const filteredRecords = maintenanceRecords.filter(r => {
    const matchesSearch = 
      r.flatNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.phone.includes(searchQuery);

    if (filterStatus === 'paid') return matchesSearch && r.isPaid;
    if (filterStatus === 'unpaid') return matchesSearch && !r.isPaid;
    return matchesSearch;
  });

  // Download Report - opens detailed comprehensive modal
  const handleDownloadReport = () => {
    setShowReportModal(true);
  };

  // Direct PDF Download
  const handleDownloadPDF = () => {
    const sortedRecords = [...maintenanceRecords].sort((a, b) => 
      compareFlatNumbers(a.flatNumber, b.flatNumber)
    );
    const cashCollected = sortedRecords
      .filter(r => r.isPaid && r.paymentMethod === 'Cash')
      .reduce((sum, r) => sum + r.maintenancePaid, 0);
    const onlineCollected = sortedRecords
      .filter(r => r.isPaid && r.paymentMethod !== 'Cash')
      .reduce((sum, r) => sum + r.maintenancePaid, 0);

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

  return (
    <div className="space-y-4 pb-20 pt-1">
      {/* Header & Stats Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3">
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="truncate">Maintenance Received Ledger</span>
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-400">
              {getMonthDisplayName(selectedMonth)} • Society member collections & arrears
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {isAdmin && (
              <>
                <button
                  type="button"
                  id="btn-setup-rates-arrears-maint"
                  onClick={() => setShowRatesModal(true)}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition"
                  title="Configure maintenance rates & starting arrears for all flats"
                >
                  <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden xs:inline">Rates & Arrears</span>
                  <span className="xs:hidden">Rates</span>
                </button>

                <button
                  type="button"
                  id="btn-set-maintenance-rate"
                  onClick={() => {
                    setNewStandardAmount(currentMonthConfig.standardMaintenanceAmount);
                    setShowConfigModal(true);
                  }}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition"
                  title="Change standard maintenance amount for this month"
                >
                  <Settings className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Rate: {formatINR(currentMonthConfig.standardMaintenanceAmount)}</span>
                </button>
              </>
            )}

            {/* Direct PDF Download Button */}
            <button
              type="button"
              id="btn-maint-download-pdf"
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white shadow-md transition"
              title="Download official PDF Monthly Report"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>

            <button
              type="button"
              id="btn-maint-download-report"
              onClick={handleDownloadReport}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition"
              title="View full society report and ledger"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>Full Report</span>
            </button>
          </div>
        </div>

        {/* Quick summary strip */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs pt-2 border-t border-slate-800">
          <div className="bg-slate-800/60 p-2 rounded-xl">
            <span className="text-[10px] text-slate-400 block">Total Collected</span>
            <span className="font-bold text-emerald-400">{formatINR(totalMaintenanceReceived)}</span>
          </div>
          <div className="bg-slate-800/60 p-2 rounded-xl">
            <span className="text-[10px] text-slate-400 block">Paid Flats</span>
            <span className="font-bold text-white">{paidMembersCount} / {totalMembersCount}</span>
          </div>
          <div className="bg-slate-800/60 p-2 rounded-xl">
            <span className="text-[10px] text-slate-400 block">Pending Flats</span>
            <span className="font-bold text-amber-400">{unpaidMembersCount}</span>
          </div>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center gap-2">
        <div className="relative w-full sm:flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            id="search-maintenance-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search flat (e.g. C-101), name, or mobile..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto">
          <button
            type="button"
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition shrink-0 ${
              filterStatus === 'all'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({maintenanceRecords.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('paid')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition shrink-0 ${
              filterStatus === 'paid'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Paid ({paidMembersCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('unpaid')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition shrink-0 ${
              filterStatus === 'unpaid'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Unpaid ({unpaidMembersCount})
          </button>
        </div>
      </div>

      {/* Flat Maintenance Records List */}
      <div className="space-y-2.5">
        {filteredRecords.length === 0 ? (
          <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 text-xs">
            No maintenance records match your search criteria.
          </div>
        ) : (
          filteredRecords.map((record, index) => {
            const isMyFlat = currentUser && currentUser.flatNumber === record.flatNumber;
            const totalPayable = record.maintenanceDue + record.pendingAmount;

            return (
              <div
                key={`${record.id || record.flatNumber}-${index}`}
                className={`p-3.5 rounded-2xl border transition shadow-xs ${
                  isMyFlat
                    ? 'bg-slate-800/90 border-emerald-500/60'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                      record.isPaid
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                    }`}>
                      {record.flatNumber}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-xs sm:text-sm font-semibold text-white truncate">
                          {record.userName}
                        </h4>
                        {isMyFlat && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-medium">
                            Your Flat
                          </span>
                        )}
                        {(() => {
                          const u = allUsers.find(usr => usr.flatNumber.toUpperCase() === record.flatNumber.toUpperCase());
                          if (!u) return null;
                          return u.occupancyType === 'tenant' ? (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-500/15 text-amber-400 font-medium">
                              Rented
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-slate-300 font-medium">
                              Owned
                            </span>
                          );
                        })()}
                      </div>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 truncate mt-0.5">
                        <Phone className="w-3 h-3" /> {record.phone}
                      </p>
                      {(() => {
                        const u = allUsers.find(usr => usr.flatNumber.toUpperCase() === record.flatNumber.toUpperCase());
                        if (u?.occupancyType === 'tenant' && u.ownerName) {
                          return (
                            <p className="text-[10px] text-amber-300/80 truncate mt-0.5">
                              Owner: {u.ownerName} {u.ownerContact ? `(${u.ownerContact})` : ''}
                            </p>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>

                  {/* Payment status badge & total */}
                  <div className="text-right shrink-0">
                    {record.isPaid ? (
                      <div>
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" /> Paid {formatINR(record.maintenancePaid)}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            record.paymentMethod === 'Cash'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                          }`}>
                            {record.paymentMethod === 'Cash' ? '💵 Cash' : '🌐 Online'}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1 space-y-0.5 text-right">
                          <div>Paid: <strong className="text-slate-200">{record.paidDate}</strong></div>
                          {record.markedDate && (
                            <div>Entry: <span className="text-slate-300">{record.markedDate}</span></div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                          <Clock className="w-3 h-3" /> Due {formatINR(totalPayable)}
                        </span>
                        {record.pendingAmount > 0 && (
                          <span className="block text-[10px] text-amber-400 mt-0.5">
                            (incl. {formatINR(record.pendingAmount)} arrears)
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Arrears & Notes strip if present */}
                {(record.pendingAmount > 0 || record.notes) && (
                  <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-1 text-[11px]">
                    {record.pendingAmount > 0 && (
                      <span className="text-amber-300/90 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Previous pending arrears: <strong>{formatINR(record.pendingAmount)}</strong>
                      </span>
                    )}
                    {record.notes && (
                      <span className="text-slate-400 italic truncate max-w-xs">
                        Note: {record.notes}
                      </span>
                    )}
                  </div>
                )}

                {/* Actions row */}
                <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between gap-2">
                  {/* View receipt slip */}
                  {record.isPaid ? (
                    <button
                      type="button"
                      onClick={() => setReceiptRecord(record)}
                      className="flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 font-medium"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>View Receipt Slip</span>
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-500">
                      Standard due: {formatINR(record.maintenanceDue)}
                    </span>
                  )}

                  {/* Admin controls */}
                  {isAdmin && (
                    <div className="flex items-center gap-1.5">
                      {/* Remove resident option if resident moved out */}
                      {(() => {
                        const u = allUsers.find(usr => usr.flatNumber.toUpperCase() === record.flatNumber.toUpperCase());
                        if (u && u.role !== 'admin') {
                          return (
                            <button
                              type="button"
                              onClick={() => setUserToDelete(u)}
                              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-rose-950/40 border border-slate-700 hover:border-rose-700 text-[11px] font-medium text-slate-400 hover:text-rose-300 transition flex items-center gap-1"
                              title="Remove resident from society (vacated / moved out)"
                            >
                              <UserMinus className="w-3 h-3 text-rose-400" />
                              <span className="hidden sm:inline">Remove</span>
                            </button>
                          );
                        }
                        return null;
                      })()}

                      {/* For Unpaid records: WhatsApp & Copy Reminder (Cash & UPI) */}
                      {!record.isPaid && (
                        <>
                          {record.phone && (
                            <a
                              href={`https://wa.me/91${record.phone.replace(/\D/g, '')}?text=${encodeURIComponent(getReminderMessage(record))}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-1 rounded-lg bg-emerald-600/80 hover:bg-emerald-500 text-white text-[11px] font-semibold transition flex items-center gap-1 shadow-xs"
                              title="Send reminder on WhatsApp (includes Cash & UPI options)"
                            >
                              <MessageSquare className="w-3 h-3" />
                              <span className="hidden sm:inline">WhatsApp</span>
                            </a>
                          )}

                          <button
                            type="button"
                            onClick={() => handleCopyReminder(record)}
                            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] font-medium text-sky-300 transition flex items-center gap-1"
                            title="Copy reminder message (Cash & UPI options) to clipboard"
                          >
                            {copiedReminderId === record.id ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 text-sky-400" />
                                <span>Remind</span>
                              </>
                            )}
                          </button>
                        </>
                      )}

                      {/* Edit Pending Amount (Arrears from previous months) */}
                      <button
                        type="button"
                        onClick={() => openArrearsModal(record)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] font-medium text-amber-300 transition flex items-center gap-1"
                        title="Set previous month arrears / pending balance"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Arrears</span>
                      </button>

                      {/* Mark Paid button */}
                      {record.isPaid ? (
                        <button
                          type="button"
                          onClick={() => markMaintenanceStatus(record.id, false)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-rose-950/40 border border-slate-700 hover:border-rose-700 text-[11px] font-medium text-slate-400 hover:text-rose-300 transition"
                          title="Revert to unpaid status"
                        >
                          Mark Unpaid
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openMarkPaidModal(record)}
                          className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-[11px] font-semibold text-white shadow-xs transition flex items-center gap-1"
                        >
                          <CreditCard className="w-3 h-3" />
                          <span>Mark Paid</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: MARK PAID (ADMIN) */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-base font-bold text-white">Record Maintenance Payment</h3>
                <p className="text-xs text-slate-400">Flat {editingRecord.flatNumber} • {editingRecord.userName}</p>
              </div>
              <button onClick={() => setEditingRecord(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Amount Received (₹ Rupee) *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-emerald-400 font-bold text-sm">
                    ₹
                  </div>
                  <input
                    type="number"
                    value={payAmount}
                    onChange={(e) => setPayAmount(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-white font-bold text-sm focus:ring-1 focus:ring-emerald-500"
                    required
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Standard charge is {formatINR(editingRecord.maintenanceDue)}
                  {editingRecord.pendingAmount > 0 ? ` + Arrears ${formatINR(editingRecord.pendingAmount)}` : ''}
                </span>
              </div>

              <div>
                <label className="block text-slate-300 mb-1.5 font-medium">Payment Mode (Cash or Online) *</label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPayMethod('Cash');
                      if (!payRef || payRef.startsWith('UPI')) setPayRef('Cash in Hand');
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                      payMethod === 'Cash'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>💵 Cash in Hand</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPayMethod('Online');
                      if (payRef === 'Cash in Hand') setPayRef('');
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                      payMethod !== 'Cash'
                        ? 'bg-sky-500/20 border-sky-500 text-sky-300 shadow-sm'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>🌐 Online / UPI / Bank</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Date Member Paid *</label>
                  <input
                    type="date"
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Date Entry Recorded by Admin *</label>
                  <input
                    type="date"
                    value={payMarkedDate}
                    onChange={(e) => setPayMarkedDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">
                  {payMethod === 'Cash' ? 'Cash Receipt / Handed To Remarks' : 'Transaction Reference / UTR'}
                </label>
                <input
                  type="text"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  placeholder={payMethod === 'Cash' ? 'e.g. Handed to President / Cash Slip #12' : 'e.g. UPI/1298401928 / IMPS'}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Remarks / Receipt Note</label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="Optional remarks"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="px-3 py-1.5 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-semibold text-white shadow-sm"
                >
                  Confirm & Mark Paid
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT ARREARS / PENDING AMOUNT (ADMIN PRIVILEGE) */}
      {arrearsRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-base font-bold text-white">Set Past Pending Arrears</h3>
                <p className="text-xs text-slate-400">Flat {arrearsRecord.flatNumber} • {arrearsRecord.userName}</p>
              </div>
              <button onClick={() => setArrearsRecord(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveArrears} className="space-y-3 text-xs">
              <p className="text-slate-300 leading-relaxed bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
                Enter the pending amount carried forward from previous months for Flat {arrearsRecord.flatNumber}.
              </p>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Pending Amount / Arrears (₹ Rupee)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-emerald-400 font-bold text-sm">
                    ₹
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={newArrearsAmount}
                    onChange={(e) => setNewArrearsAmount(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-white font-bold text-sm focus:ring-1 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setArrearsRecord(null)}
                  className="px-3 py-1.5 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-semibold text-white shadow-sm"
                >
                  Update Pending Arrears
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SET STANDARD MAINTENANCE CHARGE (ADMIN PRIVILEGE) */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-base font-bold text-white">Change Maintenance Rate</h3>
                <p className="text-xs text-slate-400">{getMonthDisplayName(selectedMonth)}</p>
              </div>
              <button onClick={() => setShowConfigModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStandardCharge} className="space-y-3 text-xs">
              <p className="text-slate-300 leading-relaxed bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
                As Admin, you can set the standard monthly maintenance amount required from each flat for this month.
              </p>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Standard Maintenance Amount per Flat (₹ Rupee)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-emerald-400 font-bold text-sm">
                    ₹
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={newStandardAmount}
                    onChange={(e) => setNewStandardAmount(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-white font-bold text-sm focus:ring-1 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-3 py-1.5 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-semibold text-white shadow-sm"
                >
                  Save Standard Rate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PAYMENT RECEIPT SLIP */}
      {receiptRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-100 relative">
            <button
              onClick={() => setReceiptRecord(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Printable Slip Design */}
            <div className="border border-emerald-500/30 rounded-xl p-5 bg-gradient-to-b from-slate-800/80 to-slate-900/90">
              <div className="text-center pb-4 border-b border-slate-700">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 mb-1">
                  <Building className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-white">Wing-C Lakeview Apartment</h3>
                <p className="text-xs text-slate-400">Burari, Delhi • Maintenance Payment Receipt</p>
                <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/30">
                  OFFICIAL RECEIPT
                </span>
              </div>

              <div className="py-4 space-y-2 text-xs border-b border-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-400">Receipt No:</span>
                  <span className="font-mono text-slate-200">REC-WINGC-{receiptRecord.id.slice(-6).toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Month Period:</span>
                  <span className="font-semibold text-white">{getMonthDisplayName(selectedMonth)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Flat Number:</span>
                  <span className="font-bold text-emerald-400">{receiptRecord.flatNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Resident Name:</span>
                  <span className="font-semibold text-white">{receiptRecord.userName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Date Paid:</span>
                  <span className="text-slate-200">{receiptRecord.paidDate || 'Paid'}</span>
                </div>
                {receiptRecord.markedDate && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Entry Recorded Date:</span>
                    <span className="text-slate-200">{receiptRecord.markedDate}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">Payment Mode:</span>
                  <span className={`font-semibold ${receiptRecord.paymentMethod === 'Cash' ? 'text-amber-300' : 'text-sky-300'}`}>
                    {receiptRecord.paymentMethod === 'Cash' ? 'Cash in Hand' : (receiptRecord.paymentMethod || 'Online')}
                  </span>
                </div>
                {receiptRecord.transactionRef && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Reference:</span>
                    <span className="font-mono text-xs text-slate-300">{receiptRecord.transactionRef}</span>
                  </div>
                )}
              </div>

              <div className="pt-3 flex justify-between items-center text-sm font-bold">
                <span className="text-slate-300">Amount Received:</span>
                <span className="text-lg text-emerald-400">{formatINR(receiptRecord.maintenancePaid)}</span>
              </div>

              <p className="mt-4 text-[10px] text-center text-slate-400">
                Acknowledged by Wing-C Resident Welfare Association, Burari Delhi.
              </p>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
              >
                Print Receipt
              </button>
              <button
                type="button"
                onClick={() => setReceiptRecord(null)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REMOVE RESIDENT CONFIRMATION */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-2xl text-slate-100">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center mb-3">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">Remove Resident from Flat</h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Are you sure you want to remove <strong>{userToDelete.name}</strong> from Flat <strong>{userToDelete.flatNumber}</strong>?
              <br /><br />
              Use this when a tenant has vacated or a resident has moved out. You can re-register a new resident for this flat anytime.
            </p>

            <div className="flex items-center justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-3 py-2 rounded-xl text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-remove-user"
                onClick={() => {
                  deleteUser(userToDelete.id);
                  setUserToDelete(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 font-semibold text-white transition shadow-sm"
              >
                Yes, Remove Resident
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DETAILED MONTHLY REPORT */}
      <MonthlyReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
      />

      {/* MODAL: SETUP RATES AND ARREARS */}
      <SetupRatesAndArrearsModal
        isOpen={showRatesModal}
        onClose={() => setShowRatesModal(false)}
      />
    </div>
  );
};
