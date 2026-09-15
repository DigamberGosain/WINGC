import React, { useState } from 'react';
import { useSociety } from '../context/SocietyContext';
import { formatIndianVehicle, isValidIndianVehicle, downloadCSV } from '../utils/formatters';
import {
  UserCheck,
  Shield,
  ShieldAlert,
  Car,
  Bike,
  Building,
  Phone,
  Mail,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Clock,
  History,
  Search,
  FileDown,
  RefreshCw,
  LogOut
} from 'lucide-react';

export const ProfileTab: React.FC = () => {
  const {
    currentUser,
    currentRole,
    isAdmin,
    currentAdmin,
    transferAdminRole,
    adminHandoverLogs,
    updateProfile,
    allUsers,
    logout,
    resetToDefaults,
  } = useSociety();

  // Profile edit state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [name, setName] = useState(currentUser?.name || '');
  const [mobile, setMobile] = useState(currentUser?.mobile || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [twoWheeler, setTwoWheeler] = useState(currentUser?.twoWheelerNumber || '');
  const [car, setCar] = useState(currentUser?.carNumber || '');
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Admin Transfer state
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [newAdminId, setNewAdminId] = useState('');
  const [tenureMonths, setTenureMonths] = useState(12);
  const [transferRemarks, setTransferRemarks] = useState('Tenure handover passed in annual general resident body meeting.');
  const [transferMsg, setTransferMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Vehicle directory search
  const [vehicleSearch, setVehicleSearch] = useState('');

  if (!currentUser) {
    return (
      <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-300 text-xs">
        Please sign in to view personal profile and vehicle registration.
      </div>
    );
  }

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);

    if (twoWheeler && !isValidIndianVehicle(twoWheeler)) {
      setProfileMsg({ type: 'error', text: 'Two-wheeler number must follow Indian format (e.g. DL 01 AB 1234)' });
      return;
    }

    if (car && !isValidIndianVehicle(car)) {
      setProfileMsg({ type: 'error', text: 'Car registration number must follow Indian format (e.g. DL 08 CD 5678)' });
      return;
    }

    updateProfile({
      name: name.trim(),
      mobile: mobile.trim(),
      email: email.trim(),
      twoWheelerNumber: formatIndianVehicle(twoWheeler),
      carNumber: formatIndianVehicle(car),
    });

    setIsEditingProfile(false);
    setProfileMsg({ type: 'success', text: 'Profile and vehicle details saved successfully!' });
    setTimeout(() => setProfileMsg(null), 3000);
  };

  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    setTransferMsg(null);

    if (!newAdminId) {
      setTransferMsg({ type: 'error', text: 'Please select a resident to receive the Admin role.' });
      return;
    }

    const res = transferAdminRole(newAdminId, Number(tenureMonths), transferRemarks);
    if (res.success) {
      setTransferMsg({ type: 'success', text: res.message });
      setTimeout(() => {
        setShowTransferModal(false);
        setTransferMsg(null);
      }, 1500);
    } else {
      setTransferMsg({ type: 'error', text: res.message });
    }
  };

  // Filter vehicle directory
  const filteredVehicles = allUsers.filter(u => {
    const q = vehicleSearch.toLowerCase();
    return (
      u.flatNumber.toLowerCase().includes(q) ||
      u.name.toLowerCase().includes(q) ||
      (u.twoWheelerNumber && u.twoWheelerNumber.toLowerCase().includes(q)) ||
      (u.carNumber && u.carNumber.toLowerCase().includes(q))
    );
  });

  // Download vehicle directory CSV
  const handleDownloadVehicleDirectory = () => {
    const filename = `WingC_Lakeview_Vehicle_Directory.csv`;
    const rows = [
      ['Wing-C Lakeview Apartment, Burari, Delhi'],
      ['Society Resident & Vehicle Directory'],
      ['Export Date', new Date().toLocaleDateString('en-IN')],
      [],
      ['Flat No.', 'Resident Name', 'Mobile', 'Two-Wheeler Reg. No.', 'Car Reg. No.', 'Role'],
      ...allUsers.map(u => [
        u.flatNumber,
        u.name,
        u.mobile,
        u.twoWheelerNumber || 'None',
        u.carNumber || 'None',
        u.role.toUpperCase(),
      ]),
    ];
    downloadCSV(filename, rows);
  };

  return (
    <div className="space-y-4 pb-20 pt-1">
      {/* Profile Overview Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-base shadow-sm ${
              isAdmin ? 'bg-amber-600 text-white' : 'bg-emerald-600 text-white'
            }`}>
              {isAdmin ? <Shield className="w-6 h-6" /> : currentUser.flatNumber}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">{currentUser.name}</h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  isAdmin ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}>
                  {currentUser.role}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Wing-C Lakeview Apartment • Flat {currentUser.flatNumber}
              </p>
            </div>
          </div>

          {!isEditingProfile && (
            <button
              type="button"
              id="btn-edit-profile"
              onClick={() => {
                setName(currentUser.name);
                setMobile(currentUser.mobile);
                setEmail(currentUser.email);
                setTwoWheeler(currentUser.twoWheelerNumber || '');
                setCar(currentUser.carNumber || '');
                setIsEditingProfile(true);
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-700 transition"
            >
              <Edit2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Edit Details</span>
            </button>
          )}
        </div>

        {profileMsg && (
          <div className={`mb-3 p-2.5 rounded-xl text-xs flex items-center gap-2 ${
            profileMsg.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
          }`}>
            {profileMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{profileMsg.text}</span>
          </div>
        )}

        {isEditingProfile ? (
          /* EDIT PROFILE FORM */
          <form onSubmit={handleSaveProfile} className="space-y-3 text-xs pt-2 border-t border-slate-800">
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Mobile Number</label>
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-medium">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                required
              />
            </div>

            {/* Indian Vehicle inputs */}
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700 space-y-2.5">
              <span className="text-xs font-semibold text-emerald-400 block">
                Vehicle Details (Indian Registration Format)
              </span>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-300 mb-1 flex items-center gap-1">
                    <Bike className="w-3.5 h-3.5 text-slate-400" /> Two-Wheeler No.
                  </label>
                  <input
                    type="text"
                    value={twoWheeler}
                    onChange={(e) => setTwoWheeler(e.target.value.toUpperCase())}
                    placeholder="e.g. DL 01 AB 1234"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 uppercase"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-300 mb-1 flex items-center gap-1">
                    <Car className="w-3.5 h-3.5 text-slate-400" /> Car Reg. No.
                  </label>
                  <input
                    type="text"
                    value={car}
                    onChange={(e) => setCar(e.target.value.toUpperCase())}
                    placeholder="e.g. DL 08 CD 5678"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 uppercase"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="px-3 py-1.5 rounded-xl text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-semibold text-white shadow-sm"
              >
                Save Changes
              </button>
            </div>
          </form>
        ) : (
          /* READ-ONLY DISPLAY */
          <div className="space-y-2 text-xs pt-2 border-t border-slate-800">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-800/40 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Phone</span>
                <span className="font-semibold text-slate-200">📱 {currentUser.mobile}</span>
              </div>
              <div className="bg-slate-800/40 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Email</span>
                <span className="font-semibold text-slate-200 truncate block">{currentUser.email}</span>
              </div>
            </div>

            {/* Registered Vehicles */}
            <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-800 space-y-1.5">
              <span className="text-[10px] text-slate-400 font-medium block">Registered Vehicles:</span>
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-200">
                  <Bike className="w-3.5 h-3.5 text-sky-400" />
                  <span className="font-mono font-medium">{currentUser.twoWheelerNumber || 'No two-wheeler recorded'}</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-200">
                  <Car className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-mono font-medium">{currentUser.carNumber || 'No car recorded'}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ADMIN TENURE & HANDOVER SECTION (Single Admin Rules) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Society Admin & Tenure Control</h3>
              <p className="text-[11px] text-slate-400">
                Rule: Exactly 1 person is Admin at a time with 1-year tenure leverage
              </p>
            </div>
          </div>

          {isAdmin && (
            <button
              type="button"
              id="btn-transfer-admin-role"
              onClick={() => setShowTransferModal(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-xs font-semibold text-white shadow-sm transition"
            >
              <History className="w-3.5 h-3.5" />
              <span>Handover Admin</span>
            </button>
          )}
        </div>

        {/* Current Active Admin info */}
        <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/80 text-xs space-y-1.5">
          <div className="flex justify-between">
            <span className="text-slate-400">Current Designated Admin:</span>
            <span className="font-bold text-amber-400">
              {currentAdmin ? `${currentAdmin.name} (Flat ${currentAdmin.flatNumber})` : 'None appointed'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Appointed Date:</span>
            <span className="text-slate-200">{currentAdmin?.adminAppointedDate || '2025-10-01'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Tenure Duration:</span>
            <span className="text-slate-200">{currentAdmin?.adminTenureMonths || 12} Months (Annual Handover)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Admin Contact:</span>
            <span className="text-slate-200">📱 {currentAdmin?.mobile}</span>
          </div>
        </div>

        {/* Handover Logs */}
        {adminHandoverLogs.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Historical Handover Log
            </span>
            <div className="space-y-2 text-xs">
              {adminHandoverLogs.map((log) => (
                <div key={log.id} className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-800 space-y-1">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-300">{log.fromAdminName} → <strong className="text-emerald-400">{log.toAdminName}</strong></span>
                    <span className="text-slate-400 text-[10px]">{log.transferDate}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 italic">{log.remarks}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SOCIETY VEHICLE DIRECTORY */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
              <Car className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Wing-C Vehicle Parking Directory</h3>
              <p className="text-[11px] text-slate-400">Search vehicle registration plates to identify owner flat</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDownloadVehicleDirectory}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition"
          >
            <FileDown className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export Directory</span>
          </button>
        </div>

        <div className="relative mb-3">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={vehicleSearch}
            onChange={(e) => setVehicleSearch(e.target.value)}
            placeholder="Search vehicle number (e.g. DL 01 AB 3456) or flat..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1 text-xs">
          {filteredVehicles.map(u => (
            <div key={u.id} className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/60 flex items-start justify-between gap-1">
              <div>
                <span className="font-bold text-emerald-400 inline-block mr-1.5">{u.flatNumber}</span>
                <span className="font-semibold text-white">{u.name}</span>
                <div className="mt-1 space-y-0.5 text-[11px]">
                  {u.twoWheelerNumber ? (
                    <span className="flex items-center gap-1 text-sky-300 font-mono">
                      <Bike className="w-3 h-3 text-sky-400" /> {u.twoWheelerNumber}
                    </span>
                  ) : null}
                  {u.carNumber ? (
                    <span className="flex items-center gap-1 text-emerald-300 font-mono">
                      <Car className="w-3 h-3 text-emerald-400" /> {u.carNumber}
                    </span>
                  ) : null}
                  {!u.twoWheelerNumber && !u.carNumber && (
                    <span className="text-slate-500 italic">No vehicles registered</span>
                  )}
                </div>
              </div>
              <span className="text-[10px] text-slate-400">📱 {u.mobile}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Demo Reset & Sign Out Section */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <button
          type="button"
          onClick={resetToDefaults}
          className="flex items-center gap-1.5 text-slate-400 hover:text-amber-400 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset Sample Demo Data</span>
        </button>

        <button
          type="button"
          onClick={logout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-300 hover:bg-rose-900/50 font-semibold transition"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out of App</span>
        </button>
      </div>

      {/* ADMIN TRANSFER MODAL */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Transfer Admin Responsibility</h3>
                  <p className="text-xs text-slate-400">Wing-C Lakeview Apartment, Burari</p>
                </div>
              </div>
            </div>

            {transferMsg && (
              <div className={`mb-3 p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                transferMsg.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
              }`}>
                {transferMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>{transferMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleExecuteTransfer} className="space-y-3 text-xs">
              <p className="text-slate-300 leading-relaxed bg-amber-950/30 p-2.5 rounded-xl border border-amber-800/40">
                Notice: Wing-C rules allow exactly one active Admin. Handing over will revoke your admin privileges and assign full ledger authority to the selected resident.
              </p>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Select New Admin Resident *</label>
                <select
                  value={newAdminId}
                  onChange={(e) => setNewAdminId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  required
                >
                  <option value="">-- Choose Resident --</option>
                  {allUsers
                    .filter(u => u.id !== currentUser.id)
                    .map(u => (
                      <option key={u.id} value={u.id}>
                        {u.flatNumber} - {u.name} ({u.mobile})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Tenure Duration (Months)</label>
                <select
                  value={tenureMonths}
                  onChange={(e) => setTenureMonths(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  <option value={6}>6 Months</option>
                  <option value={12}>1 Year (12 Months - Standard)</option>
                  <option value={24}>2 Years (24 Months)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">AGM Handover Resolution / Remarks</label>
                <textarea
                  rows={2}
                  value={transferRemarks}
                  onChange={(e) => setTransferRemarks(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-xs text-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-3 py-1.5 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 font-semibold text-white shadow-sm"
                >
                  Execute Admin Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
