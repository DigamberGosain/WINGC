import React, { useState } from 'react';
import { useSociety } from '../context/SocietyContext';
import { formatINR, getMonthDisplayName, RUPEE_SYMBOL } from '../utils/formatters';
import { ExpenseCategory, ExpenseItem } from '../types';
import {
  IndianRupee,
  Receipt,
  PlusCircle,
  TrendingDown,
  Tag,
  Calendar,
  CreditCard,
  Trash2,
  X,
  Search,
  CheckCircle2,
  FileText
} from 'lucide-react';

const CATEGORIES: ExpenseCategory[] = [
  'Security Guard',
  'Electricity',
  'Lift Maintenance (AMC)',
  'Water & Pump',
  'Housekeeping / Cleaning',
  'Repairs & Plumbing',
  'Festival / Celebration',
  'Administrative',
  'Others',
];

export const ExpensesTab: React.FC = () => {
  const { expenses, addExpense, deleteExpense, selectedMonth, totalExpenses, isAdmin } = useSociety();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Add Expense modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Security Guard');
  const [amount, setAmount] = useState<number | ''>('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paidTo, setPaidTo] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'UPI' | 'Net Banking' | 'Cheque'>('UPI');
  const [receiptNote, setReceiptNote] = useState('');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount || Number(amount) <= 0) return;

    addExpense({
      monthYear: selectedMonth,
      title: title.trim(),
      category,
      amount: Number(amount),
      date,
      paidTo: paidTo.trim() || 'Vendor',
      paymentMethod,
      receiptNote: receiptNote.trim(),
    });

    // Reset form
    setTitle('');
    setAmount('');
    setPaidTo('');
    setReceiptNote('');
    setShowAddModal(false);
  };

  // Filter expenses
  const filteredExpenses = expenses.filter(e => {
    const matchesCategory = selectedCategory === 'all' || e.category === selectedCategory;
    const matchesSearch = 
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.paidTo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.receiptNote && e.receiptNote.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-4 pb-20 pt-1">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <IndianRupee className="w-5 h-5 text-rose-400" />
              <span>Society Expenses Ledger</span>
            </h2>
            <p className="text-xs text-slate-400">
              {getMonthDisplayName(selectedMonth)} • Complete transparent ledger of all deductions
            </p>
          </div>

          {isAdmin && (
            <button
              type="button"
              id="btn-add-new-expense"
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white shadow-sm transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Record Expense</span>
            </button>
          )}
        </div>

        {/* Quick summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-center text-xs pt-2 border-t border-slate-800">
          <div className="bg-slate-800/60 p-2 rounded-xl">
            <span className="text-[10px] text-slate-400 block">Total Spent</span>
            <span className="font-bold text-rose-400 text-sm">{formatINR(totalExpenses)}</span>
          </div>
          <div className="bg-slate-800/60 p-2 rounded-xl">
            <span className="text-[10px] text-slate-400 block">Vouchers Recorded</span>
            <span className="font-bold text-white text-sm">{expenses.length} Entries</span>
          </div>
          <div className="bg-slate-800/60 p-2 rounded-xl col-span-2 sm:col-span-1">
            <span className="text-[10px] text-slate-400 block">Accounting Status</span>
            <span className="font-medium text-emerald-400 text-xs flex items-center justify-center gap-1 mt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Ledger Balanced
            </span>
          </div>
        </div>
      </div>

      {/* Search and Category Filter Pills */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            id="search-expenses-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search expense description, vendor, or receipt note..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-rose-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded-lg font-medium transition shrink-0 ${
              selectedCategory === 'all'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            All Categories ({expenses.length})
          </button>
          {CATEGORIES.map(cat => {
            const count = expenses.filter(e => e.category === cat).length;
            if (count === 0 && selectedCategory !== cat) return null;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg font-medium transition shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Expenses Cards List */}
      <div className="space-y-2.5">
        {filteredExpenses.length === 0 ? (
          <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 text-xs">
            No expenses found for this selection.
          </div>
        ) : (
          filteredExpenses.map((exp, idx) => (
            <div
              key={`${exp.id || 'exp'}-${idx}`}
              className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition shadow-xs flex flex-col justify-between"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/20">
                      {exp.category}
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {exp.date}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-white truncate">
                    {exp.title}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Paid to: <strong className="text-slate-200 font-medium">{exp.paidTo}</strong> • via {exp.paymentMethod}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-base font-bold text-rose-400 block">
                    -{formatINR(exp.amount)}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    by {exp.recordedBy}
                  </span>
                </div>
              </div>

              {/* Receipt Note / Voucher Details */}
              <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2 text-xs">
                <div className="text-slate-400 text-[11px] flex items-center gap-1 truncate">
                  <FileText className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>{exp.receiptNote || 'Verified voucher on society file.'}</span>
                </div>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => deleteExpense(exp.id)}
                    className="text-slate-400 hover:text-rose-400 p-1 transition"
                    title="Delete expense entry"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* RECORD EXPENSE MODAL (ADMIN ONLY) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-base font-bold text-white">Record Society Expense</h3>
                <p className="text-xs text-slate-400">Wing-C Lakeview Apartment • {getMonthDisplayName(selectedMonth)}</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Expense Title / Description *</label>
                <input
                  type="text"
                  id="input-expense-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Security Guard Salary, Lift Repair, LED lights"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:ring-1 focus:ring-rose-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Amount Spent (₹ Rupee) *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-rose-400 font-bold text-sm">
                      ₹
                    </div>
                    <input
                      type="number"
                      id="input-expense-amount"
                      min="1"
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      placeholder="5000"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-white font-bold text-sm focus:ring-1 focus:ring-rose-500"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Payment Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="UPI">UPI / QR Code</option>
                    <option value="Cash">Cash Voucher</option>
                    <option value="Net Banking">Net Banking (NEFT/IMPS)</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Paid To (Vendor / Person Name)</label>
                <input
                  type="text"
                  value={paidTo}
                  onChange={(e) => setPaidTo(e.target.value)}
                  placeholder="e.g. Security Guard Kishan / Otis Elevator Service"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Voucher / Bill Reference / Notes</label>
                <input
                  type="text"
                  value={receiptNote}
                  onChange={(e) => setReceiptNote(e.target.value)}
                  placeholder="e.g. Bill #8821, Approved in resident meeting"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-confirm-record-expense"
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 font-semibold text-white shadow-sm"
                >
                  Record & Deduct from In Hand
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
