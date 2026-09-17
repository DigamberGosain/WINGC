import React, { useState } from 'react';
import { useSociety } from '../context/SocietyContext';
import { generateBlankMonthlyReportPDF } from '../utils/pdfGenerator';
import {
  RotateCcw,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle2,
  X,
  Zap,
  IndianRupee,
  Calendar,
  Building2,
  Trash2,
  Plus,
  FileDown,
  ShieldAlert
} from 'lucide-react';

interface FreshSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FreshSetupModal: React.FC<FreshSetupModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, selectedMonth, resetSocietyData, resetAllToFirstTimeUse } = useSociety();

  const [activeTab, setActiveTab] = useState<'reset' | 'blank_report'>('reset');

  // Form states
  const [month, setMonth] = useState(selectedMonth || '2026-09');
  const [monthlyRate, setMonthlyRate] = useState<number>(2000);
  const [openingBalance, setOpeningBalance] = useState<number>(0);

  // Electricity bill setup
  const [elecAmount, setElecAmount] = useState<number>(1240);
  const [consumerNumber, setConsumerNumber] = useState('TPDDL-100482910');
  const [elecDueDate, setElecDueDate] = useState('2026-09-25');
  const [elecStatus, setElecStatus] = useState<'Due' | 'Paid'>('Due');

  // Initial Expenses list
  const [initialExpenses, setInitialExpenses] = useState<
    Array<{ id: string; title: string; category: string; amount: number; date: string; paidTo: string; paymentMethod: 'UPI' | 'Cash' }>
  >([]);
  const [newExpTitle, setNewExpTitle] = useState('');
  const [newExpAmount, setNewExpAmount] = useState('');
  const [newExpCategory, setNewExpCategory] = useState('Water Tank / Motor');

  // Flats seed mode
  const [flatsMode, setFlatsMode] = useState<'wing_c_flats' | 'admin_only' | 'blank'>('wing_c_flats');

  // Confirm text safety check
  const [confirmText, setConfirmText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpTitle.trim() || !newExpAmount || Number(newExpAmount) <= 0) return;

    setInitialExpenses(prev => [
      ...prev,
      {
        id: `exp-init-${Date.now()}`,
        title: newExpTitle.trim(),
        category: newExpCategory,
        amount: Number(newExpAmount),
        date: `${month}-05`,
        paidTo: 'Vendor',
        paymentMethod: 'UPI'
      }
    ]);
    setNewExpTitle('');
    setNewExpAmount('');
  };

  const handleRemoveExpense = (id: string) => {
    setInitialExpenses(prev => prev.filter(e => e.id !== id));
  };

  const handleExecuteReset = async () => {
    if (confirmText.toUpperCase() !== 'RESET') {
      alert('Please type "RESET" in capital letters to confirm this action.');
      return;
    }

    setIsProcessing(true);
    try {
      await resetSocietyData({
        monthYear: month,
        monthlyMaintenanceRate: monthlyRate,
        openingBalance: openingBalance,
        electricityBill: {
          monthYear: month,
          amount: elecAmount,
          consumerNumber: consumerNumber,
          dueDate: elecDueDate,
          status: elecStatus,
          isPaid: elecStatus === 'Paid',
          paidDate: elecStatus === 'Paid' ? `${month}-10` : undefined,
          markedBy: currentUser?.name || 'Society Admin'
        },
        initialExpenses: initialExpenses,
        initializeFlats: flatsMode === 'wing_c_flats'
      });

      setSuccessMsg('Society ledger has been completely reset and initialized with fresh details!');
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1500);
    } catch (err: any) {
      alert('Error during fresh setup: ' + (err.message || err));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Fresh Society Setup & Reset Ledger</h3>
              <p className="text-xs text-slate-400">Wing-C Lakeview Apartment • Admin Authority</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6">
          <button
            type="button"
            onClick={() => setActiveTab('reset')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'reset'
                ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            Fresh Setup & Data Reset
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('blank_report')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'blank_report'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Blank Form & Printable Ledger
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-slate-200">
          {successMsg && (
            <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-3 text-emerald-400 font-semibold text-sm animate-fade-in">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {activeTab === 'blank_report' ? (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <FileSpreadsheet className="w-5 h-5" />
                  <h4>Official Blank Society Register & Report Sheet</h4>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Need a clean, formatted blank sheet with no values for physical noticeboard display, door-to-door signature collection, or manual accounting entries? You can download or print the official Wing-C format anytime.
                </p>

                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => generateBlankMonthlyReportPDF(month)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition"
                  >
                    <FileDown className="w-4 h-4" />
                    Download Blank PDF Ledger
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs transition"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-sky-400" />
                    Print Blank Document
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-2 text-slate-400">
                <div className="font-semibold text-slate-300">Format specifications included in blank document:</div>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Header: Wing-C Lakeview Apartment RWA, Burari, Delhi</li>
                  <li>Executive financial reconciliation boxes (Opening, Collection, Expense, Balance)</li>
                  <li>Complete 16-Flat numerical series (C-101 to C-404) with blank resident rows</li>
                  <li>Itemized 12-row society expenses vouchers statement with payment mode checkboxes</li>
                  <li>Official verification statement with Treasurer & President signature blocks</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Alert Warning */}
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-amber-200/90 leading-relaxed">
                  <span className="font-bold text-amber-300">Caution: Fresh Reset Action.</span> This will reset society ledger records, expenses, and payments for a clean new start. Your Admin profile (<span className="text-white font-mono">{currentUser?.email || 'Admin'}</span>) will remain preserved as authorized administrator.
                </div>
              </div>

              {/* Ready for First-Time Use Banner */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-500/40 shadow-sm space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Initialize Clean Slate for First-Time Use</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Recommended
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Immediately resets all details: clears dummy expenses and test payments, sets initial Admin to <strong>Digamber Gosain</strong> (Flat C-101 • <span className="text-emerald-300">digamber.gosain11@gmail.com</span>), and prepares the entire 16-flat society registry for clean production use.
                </p>
                <button
                  type="button"
                  id="btn-quick-first-time-reset"
                  onClick={async () => {
                    if (window.confirm('Reset all details in the app to clean first-time use state? This will initialize Digamber Gosain as admin and clear all test entries.')) {
                      setIsProcessing(true);
                      const res = await resetAllToFirstTimeUse();
                      setIsProcessing(false);
                      if (res.success) {
                        setSuccessMsg('App successfully reset and ready for first-time use!');
                        setTimeout(() => {
                          onClose();
                        }, 900);
                      } else {
                        alert(res.message);
                      }
                    }
                  }}
                  disabled={isProcessing}
                  className="w-full sm:w-auto px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow transition flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset All Details (Ready for First-Time Use)</span>
                </button>
              </div>

              {/* Section 1: Month and Rates */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-sky-400" />
                  1. Billing Cycle & Standard Rates
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Starting Month (YYYY-MM)</label>
                    <input
                      type="month"
                      value={month}
                      onChange={(e) => setMonth(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Monthly Maintenance Rate (₹)</label>
                    <input
                      type="number"
                      value={monthlyRate}
                      onChange={(e) => setMonthlyRate(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                      min="0"
                      step="100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Opening Cash Balance (₹)</label>
                    <input
                      type="number"
                      value={openingBalance}
                      onChange={(e) => setOpeningBalance(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                      min="0"
                      step="500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Electricity Bill */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  2. Common Electricity Bill
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Bill Amount (₹)</label>
                    <input
                      type="number"
                      value={elecAmount}
                      onChange={(e) => setElecAmount(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Consumer / CA No.</label>
                    <input
                      type="text"
                      value={consumerNumber}
                      onChange={(e) => setConsumerNumber(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Bill Due Date</label>
                    <input
                      type="date"
                      value={elecDueDate}
                      onChange={(e) => setElecDueDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Payment Status</label>
                    <select
                      value={elecStatus}
                      onChange={(e) => setElecStatus(e.target.value as 'Due' | 'Paid')}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="Due">Pending / Due</option>
                      <option value="Paid">Paid</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 3: Initial Expenses / Spent */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <IndianRupee className="w-3.5 h-3.5 text-rose-400" />
                    3. Initial Month Spent / Expenses (Optional)
                  </span>
                  <span className="text-[11px] font-normal text-slate-400">
                    Total: ₹{initialExpenses.reduce((s, e) => s + e.amount, 0).toLocaleString('en-IN')}
                  </span>
                </h4>

                <form onSubmit={handleAddExpense} className="flex flex-wrap gap-2">
                  <input
                    type="text"
                    placeholder="Expense title (e.g. Motor Repair)"
                    value={newExpTitle}
                    onChange={(e) => setNewExpTitle(e.target.value)}
                    className="flex-1 min-w-[160px] bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                  <select
                    value={newExpCategory}
                    onChange={(e) => setNewExpCategory(e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Water Tank / Motor">Water Tank / Motor</option>
                    <option value="Electricity / Lift">Electricity / Lift</option>
                    <option value="Sweeper & Cleaning">Sweeper & Cleaning</option>
                    <option value="Maintenance / Repair">Maintenance / Repair</option>
                    <option value="Security / Guard">Security / Guard</option>
                  </select>
                  <input
                    type="number"
                    placeholder="₹ Amount"
                    value={newExpAmount}
                    onChange={(e) => setNewExpAmount(e.target.value)}
                    className="w-24 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                    min="1"
                  />
                  <button
                    type="submit"
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add
                  </button>
                </form>

                {initialExpenses.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {initialExpenses.map((e) => (
                      <div
                        key={e.id}
                        className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-200">{e.title}</span>
                          <span className="text-[10px] text-slate-500">({e.category})</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-rose-400">₹{e.amount.toLocaleString('en-IN')}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveExpense(e.id)}
                            className="text-slate-500 hover:text-rose-400 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section 4: Flats & Resident Seed Mode */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                  4. Apartment Flats Configuration
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                      flatsMode === 'wing_c_flats'
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="flatsMode"
                      checked={flatsMode === 'wing_c_flats'}
                      onChange={() => setFlatsMode('wing_c_flats')}
                      className="mt-0.5"
                    />
                    <div className="text-xs">
                      <div className="font-bold text-white">Initialize Wing-C Flats (C-101 to C-404)</div>
                      <div className="text-slate-400 text-[11px] mt-0.5">
                        Creates empty ledger records for all 16 flats ready for residents to register or record payments.
                      </div>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                      flatsMode === 'admin_only'
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="flatsMode"
                      checked={flatsMode === 'admin_only'}
                      onChange={() => setFlatsMode('admin_only')}
                      className="mt-0.5"
                    />
                    <div className="text-xs">
                      <div className="font-bold text-white">Admin Profile Only</div>
                      <div className="text-slate-400 text-[11px] mt-0.5">
                        Keep only current Admin flat ({currentUser?.flatNumber || 'C-202'}), residents will create records upon registration.
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Confirmation Gate */}
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-3">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Type "RESET" to confirm ledger initialization</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="Type RESET here"
                    className="flex-1 bg-slate-950 border border-rose-500/40 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-400 font-mono tracking-wider uppercase"
                  />
                  <button
                    type="button"
                    onClick={handleExecuteReset}
                    disabled={confirmText.toUpperCase() !== 'RESET' || isProcessing}
                    className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{isProcessing ? 'Resetting...' : 'Confirm Fresh Reset'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
