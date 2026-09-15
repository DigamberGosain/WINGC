import React, { useState } from 'react';
import { useSociety } from '../context/SocietyContext';
import { formatINR, getMonthDisplayName, downloadCSV } from '../utils/formatters';
import {
  Wallet,
  IndianRupee,
  TrendingDown,
  Users,
  Zap,
  AlertTriangle,
  ArrowRight,
  FileDown,
  Edit3,
  CheckCircle2,
  Clock,
  Send,
  Sparkles,
  Info,
  Shield,
  Building,
  Check
} from 'lucide-react';

interface DashboardTabProps {
  onNavigateToTab: (tab: string) => void;
  onOpenElectricityModal: () => void;
  onOpenMarkPaidModal?: (recordId: string) => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  onNavigateToTab,
  onOpenElectricityModal,
  onOpenMarkPaidModal,
}) => {
  const {
    selectedMonth,
    currentMonthConfig,
    updateMonthConfig,
    cashInHand,
    openingBalance,
    totalMaintenanceReceived,
    totalExpenses,
    electricityBill,
    paidMembersCount,
    unpaidMembersCount,
    totalMembersCount,
    unpaidPast15thList,
    maintenanceRecords,
    isAdmin,
    expenses,
    currentUser,
  } = useSociety();

  // Proposed maintenance summary editable state (Admin)
  const [isEditingProposed, setIsEditingProposed] = useState(false);
  const [proposedText, setProposedText] = useState(currentMonthConfig.proposedMaintenanceSummary);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // WhatsApp reminder copy notification
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleSaveProposed = () => {
    updateMonthConfig({ proposedMaintenanceSummary: proposedText });
    setIsEditingProposed(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  // Download detailed monthly report (CSV)
  const handleDownloadReport = () => {
    const filename = `WingC_Lakeview_Ledger_${selectedMonth}.csv`;
    const rows = [
      ['Wing-C Lakeview Apartment, Burari, Delhi'],
      [`Monthly Society Accounting & Maintenance Report - ${getMonthDisplayName(selectedMonth)}`],
      ['Generated On', new Date().toLocaleString('en-IN')],
      [],
      ['Flat No.', 'Resident Name', 'Mobile', 'Maintenance Paid (₹)', 'Pending / Arrears (₹)', 'Total Previous Month Balance (₹)', 'Status', 'Payment Date', 'Payment Method', 'Transaction Ref'],
      ...maintenanceRecords.map(r => [
        r.flatNumber,
        r.userName,
        r.phone,
        r.isPaid ? r.maintenancePaid : 0,
        r.pendingAmount,
        r.pendingAmount, // Previous month arrears
        r.isPaid ? 'PAID' : 'PENDING (PAST 15th)',
        r.paidDate || '-',
        r.paymentMethod || '-',
        r.transactionRef || '-',
      ]),
      [],
      ['--- SUMMARY ACCOUNTING LEDGER ---'],
      ['Opening Reserve Balance', openingBalance],
      ['Total Maintenance Collected', totalMaintenanceReceived],
      ['Total Society Expenses Paid', totalExpenses],
      ['NET CASH IN HAND', cashInHand],
      ['Electricity Bill Status', electricityBill.isPaid ? `PAID (${formatINR(electricityBill.billAmount)})` : `DUE (${formatINR(electricityBill.billAmount)})`],
    ];
    downloadCSV(filename, rows);
  };

  // Quick WhatsApp message generator
  const handleCopyReminder = (record: typeof maintenanceRecords[0]) => {
    const msg = `Dear ${record.userName} ji (${record.flatNumber}), polite reminder regarding Wing-C Lakeview Apartment maintenance for ${getMonthDisplayName(selectedMonth)}. Due amount: ₹${record.maintenanceDue}${record.pendingAmount > 0 ? ` + Past Arrears: ₹${record.pendingAmount}` : ''}. Kindly transfer via UPI to society admin or inform once paid. Thank you!`;
    navigator.clipboard.writeText(msg);
    setCopiedId(record.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const collectionPercent = totalMembersCount > 0 
    ? Math.round((paidMembersCount / totalMembersCount) * 100) 
    : 0;

  return (
    <div className="space-y-4 pb-20 pt-1">
      {/* Running Month Header Bar */}
      <div className="bg-gradient-to-r from-slate-800 via-slate-800 to-slate-900 border border-slate-700/80 rounded-2xl p-4 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block">
              Wing-C Society Ledger
            </span>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>{getMonthDisplayName(selectedMonth)}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 font-normal">
                Running Month
              </span>
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-download-monthly-report"
              onClick={handleDownloadReport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white shadow-sm transition"
              title="Download detailed monthly report with resident names, payments & pending dues"
            >
              <FileDown className="w-4 h-4" />
              <span>Download Monthly Report</span>
            </button>
          </div>
        </div>

        {/* Resident personal status chip if logged in as resident */}
        {currentUser && !isAdmin && (
          <div className="mt-3 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs">
            <span className="text-slate-300">
              Your Flat: <strong className="text-white font-semibold">{currentUser.flatNumber}</strong> ({currentUser.name})
            </span>
            {(() => {
              const myRec = maintenanceRecords.find(r => r.flatNumber === currentUser.flatNumber);
              if (myRec?.isPaid) {
                return (
                  <span className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Maintenance Paid ({formatINR(myRec.maintenancePaid)})
                  </span>
                );
              }
              return (
                <span className="flex items-center gap-1 text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 font-medium">
                  <Clock className="w-3.5 h-3.5" /> Payment Pending ({formatINR((myRec?.maintenanceDue || 2000) + (myRec?.pendingAmount || 0))})
                </span>
              );
            })()}
          </div>
        )}
      </div>

      {/* Primary Financial Metric Cards: Cash in Hand & Total Expenses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* CASH IN HAND CARD (Dynamically calculated) */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-500/40 p-4 shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-medium text-emerald-400 flex items-center gap-1.5 mb-1">
                <Wallet className="w-4 h-4" /> Net In Hand Amount
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {formatINR(cashInHand)}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Dynamically calculated after deducting all expenses from income
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>

          {/* Ledger Breakdown Formulas */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-slate-800/50 p-2 rounded-xl border border-slate-700/50">
              <span className="text-[10px] text-slate-400 block truncate">Opening Fund</span>
              <span className="font-semibold text-slate-200">{formatINR(openingBalance)}</span>
            </div>
            <div className="bg-slate-800/50 p-2 rounded-xl border border-slate-700/50">
              <span className="text-[10px] text-emerald-400 block truncate">+ Received</span>
              <span className="font-semibold text-emerald-300">+{formatINR(totalMaintenanceReceived)}</span>
            </div>
            <div className="bg-slate-800/50 p-2 rounded-xl border border-slate-700/50">
              <span className="text-[10px] text-rose-400 block truncate">- Spent</span>
              <span className="font-semibold text-rose-300">-{formatINR(totalExpenses)}</span>
            </div>
          </div>
        </div>

        {/* TOTAL AMOUNT SPENT AS EXPENSES CARD (With link to see details) */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-950/40 via-slate-900 to-slate-900 border border-rose-500/30 p-4 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-medium text-rose-400 flex items-center gap-1.5 mb-1">
                  <IndianRupee className="w-4 h-4" /> Total Expenses Spent
                </span>
                <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {formatINR(totalExpenses)}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {expenses.length} society expenses recorded for this month
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <IndianRupee className="w-5 h-5" />
              </div>
            </div>

            {/* Quick Preview of latest 2 expenses */}
            <div className="mt-3 space-y-1.5 text-xs">
              {expenses.slice(0, 2).map(exp => (
                <div key={exp.id} className="flex items-center justify-between text-slate-300 bg-slate-800/40 px-2.5 py-1.5 rounded-lg">
                  <span className="truncate pr-2 text-[11px]">{exp.title}</span>
                  <span className="font-semibold text-rose-300 shrink-0">{formatINR(exp.amount)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Link to See Full Details */}
          <div className="mt-4 pt-2 border-t border-slate-800/80">
            <button
              type="button"
              id="link-see-expense-details"
              onClick={() => onNavigateToTab('expenses')}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-semibold transition group"
            >
              <span>See Full Expense Details & Receipts</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Maintenance Collection Status + Electricity Bill */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* MEMBERS MAINTENANCE COLLECTION COUNTER */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-400" /> Maintenance Status
            </span>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              {collectionPercent}% Paid
            </span>
          </div>

          <div className="flex items-baseline justify-between mt-2">
            <div>
              <span className="text-2xl font-bold text-white">{paidMembersCount}</span>
              <span className="text-xs text-slate-400 ml-1.5">of {totalMembersCount} Flats Paid</span>
            </div>
            <div className="text-right">
              <span className="text-xs font-medium text-amber-400">{unpaidMembersCount} Flats Pending</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden mt-3 border border-slate-700/50">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
              style={{ width: `${collectionPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
            <span>Collected: <strong className="text-emerald-300">{formatINR(totalMaintenanceReceived)}</strong></span>
            <span>Unpaid: <strong className="text-amber-300">{formatINR(unpaidMembersCount * currentMonthConfig.standardMaintenanceAmount)}</strong></span>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              Standard Rate: <strong className="text-slate-200">{formatINR(currentMonthConfig.standardMaintenanceAmount)}/flat</strong>
            </span>
            <button
              type="button"
              onClick={() => onNavigateToTab('maintenance')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
            >
              <span>{isAdmin ? "Mark Payments →" : "View Flat Status →"}</span>
            </button>
          </div>
        </div>

        {/* ELECTRICITY BILL CARD */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-400" /> Electricity Bill (TPDDL Delhi)
              </span>
              {electricityBill.isPaid ? (
                <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Paid
                </span>
              ) : (
                <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Due by {electricityBill.dueDate || '20th'}
                </span>
              )}
            </div>

            <div className="flex items-baseline justify-between mt-1">
              <div>
                <div className="text-2xl font-bold text-white">
                  {formatINR(electricityBill.billAmount)}
                </div>
                <div className="text-[11px] text-slate-400">
                  Consumer No: <span className="text-slate-200 font-medium">{electricityBill.consumerNumber}</span>
                </div>
              </div>

              {electricityBill.unitsConsumed > 0 && (
                <div className="text-right text-xs">
                  <span className="text-slate-400 block">Units</span>
                  <span className="font-semibold text-sky-400">{electricityBill.unitsConsumed} kWh</span>
                </div>
              )}
            </div>

            {/* Bill Details Description */}
            <p className="text-[11px] text-slate-400 mt-2 line-clamp-2 bg-slate-800/40 p-2 rounded-lg border border-slate-800">
              {electricityBill.billDetails || 'Covers lift power, water pump & society corridor lighting.'}
            </p>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[10px] text-slate-400">
              {electricityBill.isPaid && electricityBill.paidDate 
                ? `Paid on: ${electricityBill.paidDate}` 
                : `Period: ${electricityBill.billingPeriod || selectedMonth}`}
            </span>
            <button
              type="button"
              id="btn-edit-electricity-bill"
              onClick={onOpenElectricityModal}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
            >
              <span>{isAdmin ? "Enter Amount / Mark Paid →" : "View Bill Details →"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* LIST ON SIDE: MEMBERS WHO DID NOT PAY MAINTENANCE UNTIL 15th OF THE MONTH */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Unpaid Members (Past 15th Cutoff)</span>
                <span className="text-xs px-2 py-0.2 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  {unpaidPast15thList.length} Defaulters
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                15th of the running month is the agreed cutoff date for Wing-C maintenance payment
              </p>
            </div>
          </div>
        </div>

        {unpaidPast15thList.length === 0 ? (
          <div className="p-4 text-center rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-emerald-300 text-xs">
            <CheckCircle2 className="w-6 h-6 mx-auto mb-1 text-emerald-400" />
            <p className="font-semibold">All members have cleared maintenance for {getMonthDisplayName(selectedMonth)}!</p>
            <p className="text-[11px] text-emerald-400/80">No unpaid dues or arrears pending past the 15th.</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {unpaidPast15thList.map((rec) => {
                const totalDue = rec.maintenanceDue + rec.pendingAmount;
                const isCopied = copiedId === rec.id;
                return (
                  <div
                    key={rec.id}
                    className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/80 hover:border-slate-600 transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <div>
                          <span className="inline-block px-1.5 py-0.5 rounded text-xs font-bold bg-slate-700 text-emerald-400 border border-slate-600 mb-1">
                            Flat {rec.flatNumber}
                          </span>
                          <h4 className="text-xs font-semibold text-white truncate max-w-[140px]">
                            {rec.userName}
                          </h4>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-rose-400 block">
                            {formatINR(totalDue)}
                          </span>
                          {rec.pendingAmount > 0 && (
                            <span className="text-[9px] text-amber-400/90 block">
                              (incl. {formatINR(rec.pendingAmount)} arrears)
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                        <span>📱 {rec.phone}</span>
                        <span className="text-[10px] text-rose-400 bg-rose-950/40 px-1.5 py-0.5 rounded border border-rose-800/40">
                          Unpaid
                        </span>
                      </div>
                    </div>

                    {/* Admin Actions: Mark Paid Quick & Copy WhatsApp Reminder */}
                    <div className="mt-2.5 pt-2 border-t border-slate-700/60 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleCopyReminder(rec)}
                        className="flex-1 py-1 px-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-[11px] font-medium text-slate-200 transition flex items-center justify-center gap-1"
                        title="Copy WhatsApp reminder message"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3 h-3 text-sky-400" />
                            <span>Remind</span>
                          </>
                        )}
                      </button>

                      {isAdmin && onOpenMarkPaidModal && (
                        <button
                          type="button"
                          onClick={() => onOpenMarkPaidModal(rec.id)}
                          className="py-1 px-2.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/40 border border-emerald-500/40 text-emerald-300 text-[11px] font-semibold transition"
                        >
                          Mark Paid
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* TEXT BOX AT BOTTOM: PROPOSED MAINTENANCE SUMMARY */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Proposed Maintenance & Society Agenda</h3>
              <p className="text-[11px] text-slate-400">
                Official announcement & proposed maintenance breakdown for {getMonthDisplayName(selectedMonth)}
              </p>
            </div>
          </div>

          {isAdmin && !isEditingProposed && (
            <button
              type="button"
              id="btn-edit-proposed-summary"
              onClick={() => setIsEditingProposed(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-700 transition"
            >
              <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Edit Summary</span>
            </button>
          )}
        </div>

        {savedSuccess && (
          <div className="mb-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Proposed maintenance summary updated successfully!</span>
          </div>
        )}

        {isEditingProposed ? (
          <div className="space-y-3 mt-2">
            <textarea
              id="textarea-proposed-summary"
              rows={4}
              value={proposedText}
              onChange={(e) => setProposedText(e.target.value)}
              placeholder="Enter proposed maintenance details, agenda, special funds or repair notices..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setProposedText(currentMonthConfig.proposedMaintenanceSummary);
                  setIsEditingProposed(false);
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-save-proposed-summary"
                onClick={handleSaveProposed}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white shadow-sm transition"
              >
                Save Announcement
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-2 p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
            {currentMonthConfig.proposedMaintenanceSummary || "No special notices posted for this month."}
          </div>
        )}
      </div>
    </div>
  );
};
