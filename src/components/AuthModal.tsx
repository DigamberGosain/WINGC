import React, { useState } from 'react';
import { useSociety } from '../context/SocietyContext';
import { isValidIndianMobile, isValidIndianVehicle, formatIndianVehicle } from '../utils/formatters';
import { ShieldCheck, UserCheck, KeyRound, Building, Phone, Mail, Car, Bike, AlertCircle, CheckCircle2, Lock } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, defaultMode = 'login' }) => {
  const { login, registerUser, currentAdmin, allUsers } = useSociety();
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode);
  const [error, setError] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regFlat, setRegFlat] = useState('');
  const [regMobile, setRegMobile] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<'user' | 'admin'>('user');
  const [regTwoWheeler, setRegTwoWheeler] = useState('');
  const [regCar, setRegCar] = useState('');

  if (!isOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!loginIdentifier.trim()) {
      setError('Please enter your Flat Number, Mobile Number, or Email.');
      return;
    }

    const res = login(loginIdentifier, loginPassword);
    if (!res.success) {
      setError(res.message);
    } else {
      setSuccessMsg(res.message);
      setTimeout(() => {
        onClose();
      }, 500);
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!regName.trim() || !regFlat.trim() || !regMobile.trim() || !regEmail.trim() || !regPassword) {
      setError('Please fill in all mandatory fields.');
      return;
    }

    if (!isValidIndianMobile(regMobile)) {
      setError('Please enter a valid 10-digit Indian mobile number (e.g. 9811223344).');
      return;
    }

    if (regTwoWheeler && !isValidIndianVehicle(regTwoWheeler)) {
      setError('Two-wheeler number must follow Indian vehicle format (e.g. DL 01 AB 1234).');
      return;
    }

    if (regCar && !isValidIndianVehicle(regCar)) {
      setError('Car registration number must follow Indian vehicle format (e.g. DL 08 CD 5678).');
      return;
    }

    // Role check: Only one admin at a time!
    if (regRole === 'admin' && currentAdmin) {
      setError(`Admin registration unavailable: Flat ${currentAdmin.flatNumber} (${currentAdmin.name}) is currently the sole designated Admin. Admin role can be handed over by current Admin.`);
      return;
    }

    const res = registerUser({
      name: regName.trim(),
      flatNumber: regFlat.trim().toUpperCase(),
      mobile: regMobile.trim(),
      email: regEmail.trim(),
      password: regPassword,
      role: regRole,
      twoWheelerNumber: formatIndianVehicle(regTwoWheeler),
      carNumber: formatIndianVehicle(regCar),
    });

    if (!res.success) {
      setError(res.message);
    } else {
      setSuccessMsg(res.message);
      setTimeout(() => {
        onClose();
      }, 600);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100 my-8">
        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-2">
            <Building className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">Wing-C Lakeview Apartment</h2>
          <p className="text-xs text-slate-400 mt-0.5">Burari, Delhi • Society Ledger & Portal</p>
        </div>

        {/* Mode Switcher */}
        <div className="flex rounded-xl bg-slate-800/80 p-1 mb-6 border border-slate-700/60">
          <button
            type="button"
            id="tab-login"
            onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); }}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition ${
              mode === 'login'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Resident / Admin Login
          </button>
          <button
            type="button"
            id="tab-register"
            onClick={() => { setMode('register'); setError(''); setSuccessMsg(''); }}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition ${
              mode === 'register'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            New Registration
          </button>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div className="mb-4 flex items-start gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs leading-relaxed">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-4 flex items-start gap-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs leading-relaxed">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* LOGIN FORM */}
        {mode === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Flat Number, Mobile, or Email
              </label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  id="login-identifier"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="e.g. C-101 or 9811223344"
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  id="login-password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>

            {/* Quick Demo Login selector */}
            <div className="pt-2">
              <span className="text-[11px] text-slate-400 block mb-1.5 font-medium">Quick switch demo accounts:</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  id="demo-admin-login"
                  onClick={() => {
                    setLoginIdentifier('C-101');
                    setLoginPassword('password123');
                  }}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 hover:bg-emerald-900/50 transition text-left"
                >
                  <div>
                    <div className="font-semibold">C-101 (Admin)</div>
                    <div className="text-[10px] text-emerald-400/80">Ramesh Sharma</div>
                  </div>
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                </button>

                <button
                  type="button"
                  id="demo-user-login"
                  onClick={() => {
                    setLoginIdentifier('C-201');
                    setLoginPassword('password123');
                  }}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-800/70 border border-slate-700 text-slate-300 hover:bg-slate-700/60 transition text-left"
                >
                  <div>
                    <div className="font-semibold">C-201 (Resident)</div>
                    <div className="text-[10px] text-slate-400">Vikram Rajput</div>
                  </div>
                  <UserCheck className="w-4 h-4 text-slate-400 shrink-0" />
                </button>
              </div>
            </div>

            <button
              type="submit"
              id="btn-login-submit"
              className="w-full mt-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-semibold text-white text-sm shadow-md transition"
            >
              Sign In to Apartment Portal
            </button>
          </form>
        ) : (
          /* REGISTER FORM */
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5 max-h-[60vh] overflow-y-auto pr-1">
            {/* Role Selection Notice */}
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700 text-xs">
              <span className="font-medium text-slate-200 block mb-1">Account Role:</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  id="role-user-btn"
                  onClick={() => setRegRole('user')}
                  className={`py-2 px-3 rounded-lg border text-left flex items-center gap-2 transition ${
                    regRole === 'user'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                      : 'border-slate-700 bg-slate-800 text-slate-400'
                  }`}
                >
                  <UserCheck className="w-4 h-4 shrink-0" />
                  <div>
                    <div className="font-semibold">Resident</div>
                    <div className="text-[10px] opacity-80">Wing-C Member</div>
                  </div>
                </button>

                <button
                  type="button"
                  id="role-admin-btn"
                  onClick={() => {
                    if (currentAdmin) {
                      setError(`Only one Admin allowed. Flat ${currentAdmin.flatNumber} (${currentAdmin.name}) is currently the Admin.`);
                    } else {
                      setRegRole('admin');
                    }
                  }}
                  className={`py-2 px-3 rounded-lg border text-left flex items-center gap-2 transition ${
                    currentAdmin
                      ? 'border-slate-800 bg-slate-800/40 text-slate-500 cursor-not-allowed'
                      : regRole === 'admin'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                      : 'border-slate-700 bg-slate-800 text-slate-400'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <div>
                    <div className="font-semibold">Admin</div>
                    <div className="text-[10px] opacity-80">
                      {currentAdmin ? 'Active Admin Exists' : 'Single Admin'}
                    </div>
                  </div>
                </button>
              </div>

              {currentAdmin && (
                <p className="mt-2 text-[11px] text-amber-300/80 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  Admin is occupied by {currentAdmin.name} ({currentAdmin.flatNumber}). Transfer can be done via Admin tenure settings.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="reg-name"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Flat Number *
                </label>
                <input
                  type="text"
                  id="reg-flat"
                  value={regFlat}
                  onChange={(e) => setRegFlat(e.target.value.toUpperCase())}
                  placeholder="e.g. C-302"
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 uppercase focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Mobile (10 Digits) *
                </label>
                <input
                  type="tel"
                  id="reg-mobile"
                  value={regMobile}
                  onChange={(e) => setRegMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="98XXXXXXXX"
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="reg-email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="name@gmail.com"
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Password *
              </label>
              <input
                type="password"
                id="reg-password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="Choose a secure password"
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            {/* Vehicle Information (Indian Format) */}
            <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5" /> Vehicle Information (Burari / Delhi)
                </span>
                <span className="text-[10px] text-slate-400 font-normal">Indian Reg. Format</span>
              </div>

              <div>
                <label className="block text-[11px] text-slate-300 mb-1 flex items-center gap-1">
                  <Bike className="w-3 h-3 text-slate-400" /> Two-Wheeler Reg. No (Bike/Scooter)
                </label>
                <input
                  type="text"
                  id="reg-twowheeler"
                  value={regTwoWheeler}
                  onChange={(e) => setRegTwoWheeler(e.target.value.toUpperCase())}
                  placeholder="e.g. DL 01 AB 1234"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 uppercase focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-300 mb-1 flex items-center gap-1">
                  <Car className="w-3 h-3 text-slate-400" /> Car Reg. No (Sedan/SUV/Hatchback)
                </label>
                <input
                  type="text"
                  id="reg-car"
                  value={regCar}
                  onChange={(e) => setRegCar(e.target.value.toUpperCase())}
                  placeholder="e.g. DL 08 CD 5678"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 uppercase focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              id="btn-register-submit"
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-semibold text-white text-sm shadow-md transition"
            >
              Complete Registration
            </button>
          </form>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full py-2 text-xs font-medium text-slate-400 hover:text-slate-200 text-center"
        >
          Cancel and return to app
        </button>
      </div>
    </div>
  );
};
