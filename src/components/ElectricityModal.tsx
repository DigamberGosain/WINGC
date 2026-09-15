import React, { useState } from 'react';
import { useSociety } from '../context/SocietyContext';
import { formatINR, getMonthDisplayName } from '../utils/formatters';
import { Zap, CheckCircle2, Clock, Calendar, FileText, AlertCircle, X, ShieldCheck } from 'lucide-react';

interface ElectricityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ElectricityModal: React.FC<ElectricityModalProps> = ({ isOpen, onClose }) => {
  const { electricityBill, updateElectricityBill, selectedMonth, isAdmin } = useSociety();

  const [billAmount, setBillAmount] = useState<number>(electricityBill.billAmount || 0);
  const [consumerNumber, setConsumerNumber] = useState<string>(electricityBill.consumerNumber || 'TPDDL-100482910');
  const [billingPeriod, setBillingPeriod] = useState<string>(electricityBill.billingPeriod || `Aug - Sep ${selectedMonth}`);
  const [unitsConsumed, setUnitsConsumed] = useState<number>(electricityBill.unitsConsumed || 0);
  const [dueDate, setDueDate] = useState<string>(electricityBill.dueDate || `${selectedMonth}-20`);
  const [isPaid, setIsPaid] = useState<boolean>(electricityBill.isPaid || false);
  const [paidDate, setPaidDate] = useState<string>(electricityBill.paidDate || new Date().toISOString().split('T')[0]);
  const [paymentRef, setPaymentRef] = useState<string>(electricityBill.paymentRef || '');
  const [billDetails, setBillDetails] = useState<string>(electricityBill.billDetails || '');

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateElectricityBill({
      billAmount: Number(billAmount),
      consumerNumber,
      billingPeriod,
      unitsConsumed: Number(unitsConsumed),
      dueDate,
      isPaid,
      paidDate: isPaid ? paidDate : undefined,
      paymentRef: isPaid ? paymentRef : undefined,
      billDetails,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Electricity Bill Management</h3>
              <p className="text-xs text-slate-400">Tata Power DDL (Burari Delhi) • {getMonthDisplayName(selectedMonth)}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current status display */}
        <div className="p-3.5 rounded-xl bg-slate-800/70 border border-slate-700/80 mb-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block">Total Bill Amount</span>
            <span className="text-2xl font-extrabold text-white">{formatINR(electricityBill.billAmount)}</span>
            <span className="text-[11px] text-slate-400 block mt-0.5">Consumer: {electricityBill.consumerNumber}</span>
          </div>

          <div>
            {electricityBill.isPaid ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5" /> PAID
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Clock className="w-3.5 h-3.5" /> DUE ({electricityBill.dueDate})
              </span>
            )}
          </div>
        </div>

        {isAdmin ? (
          /* ADMIN EDIT FORM */
          <form onSubmit={handleSave} className="space-y-3 text-xs">
            <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 text-amber-400" />
              <span>Admin Privilege: You can update the bill amount, consumption, and mark payment.</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Bill Amount (₹ Rupee) *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-amber-400 font-bold text-sm">
                    ₹
                  </div>
                  <input
                    type="number"
                    id="input-electricity-amount"
                    min="0"
                    value={billAmount}
                    onChange={(e) => setBillAmount(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-white font-bold text-sm focus:ring-1 focus:ring-amber-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Units Consumed (kWh)</label>
                <input
                  type="number"
                  min="0"
                  value={unitsConsumed}
                  onChange={(e) => setUnitsConsumed(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">TPDDL Consumer No.</label>
                <input
                  type="text"
                  value={consumerNumber}
                  onChange={(e) => setConsumerNumber(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-medium">Billing Period Cycle</label>
              <input
                type="text"
                value={billingPeriod}
                onChange={(e) => setBillingPeriod(e.target.value)}
                placeholder="e.g. 15 Aug 2026 - 14 Sep 2026"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
              />
            </div>

            {/* Bill Details / Notes */}
            <div>
              <label className="block text-slate-300 mb-1 font-medium">Bill Details & Meter Purpose</label>
              <textarea
                rows={2}
                id="input-electricity-details"
                value={billDetails}
                onChange={(e) => setBillDetails(e.target.value)}
                placeholder="e.g. Common area services: Lift power, water pump & 6 floor corridor lighting."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500"
              />
            </div>

            {/* Mark Paid Toggle */}
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2.5">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="font-semibold text-white block">Mark Bill as Paid</span>
                  <span className="text-[11px] text-slate-400">Automatically adds to monthly expense ledger if paid</span>
                </div>
                <input
                  type="checkbox"
                  id="checkbox-electricity-ispaid"
                  checked={isPaid}
                  onChange={(e) => setIsPaid(e.target.checked)}
                  className="w-5 h-5 rounded-md accent-emerald-500 cursor-pointer"
                />
              </label>

              {isPaid && (
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-700">
                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1">Paid Date</label>
                    <input
                      type="date"
                      value={paidDate}
                      onChange={(e) => setPaidDate(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1">Payment Ref / UTR</label>
                    <input
                      type="text"
                      value={paymentRef}
                      onChange={(e) => setPaymentRef(e.target.value)}
                      placeholder="e.g. UPI/TPDDL/625519"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-xl text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="btn-save-electricity-bill"
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 font-semibold text-white shadow-sm"
              >
                Save Electricity Details
              </button>
            </div>
          </form>
        ) : (
          /* RESIDENT READ-ONLY TRANSPARENCY VIEW */
          <div className="space-y-3 text-xs">
            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">DISCOM Provider:</span>
                <span className="font-semibold text-white">Tata Power DDL (Burari)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Consumer Account:</span>
                <span className="font-mono text-slate-200">{electricityBill.consumerNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Billing Period:</span>
                <span className="text-slate-200">{electricityBill.billingPeriod || selectedMonth}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Units Consumed:</span>
                <span className="font-bold text-sky-400">{electricityBill.unitsConsumed} kWh</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Due Date:</span>
                <span className="text-slate-200">{electricityBill.dueDate}</span>
              </div>
              {electricityBill.isPaid && (
                <>
                  <div className="flex justify-between text-emerald-400">
                    <span>Payment Date:</span>
                    <span>{electricityBill.paidDate}</span>
                  </div>
                  {electricityBill.paymentRef && (
                    <div className="flex justify-between text-slate-400">
                      <span>Transaction Ref:</span>
                      <span className="font-mono text-xs text-slate-200">{electricityBill.paymentRef}</span>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 block mb-1 font-medium">Bill Details:</span>
              <p className="text-slate-300 leading-relaxed">
                {electricityBill.billDetails || 'Common meter powering elevator, ground water booster pump, parking and stairwell illumination.'}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full mt-2 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 font-semibold text-white"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
