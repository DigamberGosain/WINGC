import React, { useState } from 'react';
import { useSociety } from '../context/SocietyContext';
import { formatINR, compareFlatNumbers, getMonthDisplayName } from '../utils/formatters';
import {
  Sliders,
  CheckCircle2,
  AlertCircle,
  X,
  Building,
  RotateCcw,
  Save,
  Users
} from 'lucide-react';

interface SetupRatesAndArrearsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SetupRatesAndArrearsModal: React.FC<SetupRatesAndArrearsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    maintenanceRecords,
    allUsers,
    currentMonthConfig,
    updateMonthConfig,
    updateFlatRateAndArrears,
    selectedMonth,
  } = useSociety();

  // Local state for each flat's rate and arrears
  const sortedRecords = [...maintenanceRecords].sort((a, b) => 
    compareFlatNumbers(a.flatNumber, b.flatNumber)
  );

  const [defaultRate, setDefaultRate] = useState<number>(
    currentMonthConfig.standardMaintenanceAmount || 2000
  );

  const [ratesMap, setRatesMap] = useState<Record<string, { rate: number; arrears: number }>>(() => {
    const initial: Record<string, { rate: number; arrears: number }> = {};
    sortedRecords.forEach(r => {
      initial[r.flatNumber] = {
        rate: r.maintenanceDue,
        arrears: r.pendingAmount || 0,
      };
    });
    return initial;
  });

  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  // Apply default rate across all flats
  const handleApplyDefaultRate = () => {
    setRatesMap(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(flat => {
        next[flat] = {
          ...next[flat],
          rate: Number(defaultRate) || 0,
        };
      });
      return next;
    });
    setStatusMsg({
      type: 'success',
      text: `Applied ₹${defaultRate.toLocaleString('en-IN')} standard rate across all ${sortedRecords.length} flats.`,
    });
    setTimeout(() => setStatusMsg(null), 2500);
  };

  const handleRateChange = (flat: string, newRate: number) => {
    setRatesMap(prev => ({
      ...prev,
      [flat]: {
        ...prev[flat],
        rate: Math.max(0, newRate),
      },
    }));
  };

  const handleArrearsChange = (flat: string, newArrears: number) => {
    setRatesMap(prev => ({
      ...prev,
      [flat]: {
        ...prev[flat],
        arrears: Math.max(0, newArrears),
      },
    }));
  };

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Update standard monthly amount config
    updateMonthConfig({ standardMaintenanceAmount: Number(defaultRate) });

    // 2. Update each flat's rate and arrears
    (Object.entries(ratesMap) as [string, { rate: number; arrears: number }][]).forEach(([flat, values]) => {
      updateFlatRateAndArrears(flat, values.rate, values.arrears);
    });

    setStatusMsg({
      type: 'success',
      text: 'All flat maintenance rates and starting arrears saved successfully!',
    });

    setTimeout(() => {
      setStatusMsg(null);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl my-4 text-slate-100 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/90 rounded-t-2xl shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Setup Flat Rates & Arrears</h3>
              <p className="text-xs text-slate-400">
                Configure monthly maintenance charge and past pending arrears for all registered flats
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Batch Rate Setting Strip */}
        <div className="p-4 bg-slate-800/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">Standard Monthly Rate (₹):</span>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-emerald-400 font-bold">₹</span>
              <input
                type="number"
                value={defaultRate}
                onChange={(e) => setDefaultRate(Number(e.target.value))}
                className="w-28 bg-slate-900 border border-slate-700 rounded-lg pl-6 pr-2 py-1.5 text-white font-bold text-xs focus:ring-1 focus:ring-emerald-500"
                min="0"
                step="100"
              />
            </div>
            <button
              type="button"
              id="btn-apply-rate-to-all"
              onClick={handleApplyDefaultRate}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-semibold text-white transition shadow-xs"
            >
              Apply to All Flats
            </button>
          </div>

          <span className="text-[11px] text-slate-400">
            Total {sortedRecords.length} registered flats in Wing-C
          </span>
        </div>

        {/* Status notification */}
        {statusMsg && (
          <div className={`p-3 mx-4 mt-3 rounded-xl text-xs flex items-center gap-2 ${
            statusMsg.type === 'success' 
              ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300' 
              : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
          }`}>
            {statusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Flats Table */}
        <form onSubmit={handleSaveAll} className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-800 text-slate-300 border-b border-slate-700 text-[11px]">
                  <th className="py-2.5 px-3 font-semibold">Flat No.</th>
                  <th className="py-2.5 px-3 font-semibold">Resident</th>
                  <th className="py-2.5 px-3 font-semibold">Type</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Monthly Rate (₹)</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Starting Arrears (₹)</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Total Due (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {sortedRecords.map((r, index) => {
                  const user = allUsers.find(u => u.flatNumber.toUpperCase() === r.flatNumber.toUpperCase());
                  const currentValues = ratesMap[r.flatNumber] || { rate: r.maintenanceDue, arrears: r.pendingAmount || 0 };
                  const totalFlatDue = (currentValues.rate || 0) + (currentValues.arrears || 0);

                  return (
                    <tr key={`${r.id || r.flatNumber}-${index}`} className="hover:bg-slate-800/30 transition">
                      <td className="py-2.5 px-3 font-bold text-white font-mono">{r.flatNumber}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-200">{r.userName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{r.phone}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        {user?.occupancyType === 'tenant' ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/15 text-amber-400 font-medium">
                            Rented
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-medium">
                            Owned
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <span className="text-slate-400 font-bold">₹</span>
                          <input
                            type="number"
                            value={currentValues.rate}
                            onChange={(e) => handleRateChange(r.flatNumber, Number(e.target.value))}
                            className="w-24 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-right text-white font-bold text-xs focus:ring-1 focus:ring-emerald-500"
                            min="0"
                            step="50"
                            required
                          />
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <span className="text-amber-400 font-bold">₹</span>
                          <input
                            type="number"
                            value={currentValues.arrears}
                            onChange={(e) => handleArrearsChange(r.flatNumber, Number(e.target.value))}
                            className="w-24 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-right text-amber-300 font-bold text-xs focus:ring-1 focus:ring-amber-500"
                            min="0"
                            step="50"
                          />
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-100">
                        {formatINR(totalFlatDue)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-800 shrink-0">
            <span className="text-[11px] text-slate-400">
              * Changes apply to the current selected billing month ({getMonthDisplayName(selectedMonth)}).
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl text-slate-400 hover:text-white transition text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="btn-save-rates-arrears"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-semibold text-white text-xs shadow-md transition"
              >
                <Save className="w-4 h-4" />
                <span>Save All Rates & Arrears</span>
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};
