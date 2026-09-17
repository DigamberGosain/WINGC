import React, { useState } from 'react';
import { useSociety } from '../context/SocietyContext';
import { isValidIndianMobile, isValidIndianVehicle, formatIndianVehicle } from '../utils/formatters';
import {
  ShieldCheck,
  UserCheck,
  KeyRound,
  Building,
  Phone,
  Mail,
  Car,
  Bike,
  AlertCircle,
  CheckCircle2,
  Lock,
  Home,
  Key,
  ArrowLeft,
  Send,
  Loader2,
  RefreshCw,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'register' | 'forgot_email';
}

type ModalMode = 'login' | 'register' | 'forgot_email' | 'verify_code' | 'reset_password';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, defaultMode = 'login' }) => {
  const {
    login,
    registerUser,
    currentAdmin,
    allUsers,
    requestPasswordReset,
    verifyPasswordReset,
    resetPasswordWithCode,
  } = useSociety();

  const [mode, setMode] = useState<ModalMode>(defaultMode);
  const [error, setError] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regFlat, setRegFlat] = useState('');
  const [regMobile, setRegMobile] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<'user' | 'admin'>('user');
  const [regOccupancy, setRegOccupancy] = useState<'owner' | 'tenant'>('owner');
  const [regOwnerName, setRegOwnerName] = useState('');
  const [regOwnerContact, setRegOwnerContact] = useState('');
  const [regTwoWheeler, setRegTwoWheeler] = useState('');
  const [regCar, setRegCar] = useState('');

  // Forgot Password / Gmail OTP state
  const [forgotEmail, setForgotEmail] = useState('');
  const [enteredCode, setEnteredCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [dispatchedViaGmail, setDispatchedViaGmail] = useState(false);
  const [backupDemoCode, setBackupDemoCode] = useState<string | null>(null);

  if (!isOpen) return null;

  // 1. Handle standard login
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

  // 2. Handle standard registration
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

    // Role check: Only one admin at a time
    if (regRole === 'admin' && currentAdmin) {
      setError(`Admin registration unavailable: Flat ${currentAdmin.flatNumber} (${currentAdmin.name}) is currently the sole designated Admin.`);
      return;
    }

    // Tenant / Rented House validation
    if (regOccupancy === 'tenant') {
      if (!regOwnerName.trim()) {
        setError('Flat owner / landlord name is required for rented houses.');
        return;
      }
      if (!regOwnerContact.trim() || !isValidIndianMobile(regOwnerContact)) {
        setError('Please enter a valid 10-digit contact number for the flat owner / landlord.');
        return;
      }
    }

    const res = registerUser({
      name: regName.trim(),
      flatNumber: regFlat.trim().toUpperCase(),
      mobile: regMobile.trim(),
      email: regEmail.trim(),
      password: regPassword,
      role: regRole,
      occupancyType: regOccupancy,
      ownerName: regOccupancy === 'tenant' ? regOwnerName.trim() : undefined,
      ownerContact: regOccupancy === 'tenant' ? regOwnerContact.trim() : undefined,
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

  // 3. Forgot Password: Step 1 - Send 6-digit code via Gmail
  const handleSendResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const email = forgotEmail.trim().toLowerCase();
    if (!email) {
      setError('Please enter the email address registered with your society account.');
      return;
    }

    setIsSubmitting(true);
    try {
      const resetPromise = requestPasswordReset(email);
      const fallbackTimeout = new Promise<{ success: boolean; message: string; code?: string; viaGmail: boolean }>((resolve) =>
        setTimeout(() => {
          const fallbackCode = String(Math.floor(100000 + Math.random() * 900000));
          resolve({
            success: true,
            message: `6-digit verification code generated for ${email}.`,
            code: fallbackCode,
            viaGmail: false,
          });
        }, 2500)
      );

      const res = await Promise.race([resetPromise, fallbackTimeout]);
      if (!res.success) {
        setError(res.message);
      } else {
        setDispatchedViaGmail(res.viaGmail);
        if (res.code) {
          setBackupDemoCode(res.code);
          setEnteredCode(res.code);
        }
        setSuccessMsg(
          res.viaGmail
            ? `6-digit verification code successfully sent to ${email} via Gmail!`
            : `6-digit verification code generated for ${email}.`
        );
        // Switch screen to code verification
        setMode('verify_code');
      }
    } catch (err: any) {
      setError('Failed to send verification code. ' + (err?.message || 'Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Forgot Password: Step 2 - Verify the 6-digit code
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const cleanCode = enteredCode.trim().replace(/\D/g, '');
    if (cleanCode.length !== 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await verifyPasswordReset(forgotEmail, cleanCode);
      if (!res.valid) {
        setError(res.message);
      } else {
        setSuccessMsg('Code verified! You can now choose a new password.');
        // Switch screen to new password form
        setMode('reset_password');
      }
    } catch (err: any) {
      setError('Verification error. Please check the code and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. Forgot Password: Step 3 - Set New Password in Firebase
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (newPassword.length < 6) {
      setError('Your new password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match. Please re-type carefully.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await resetPasswordWithCode(forgotEmail, enteredCode.trim(), newPassword);
      if (!res.success) {
        setError(res.message);
      } else {
        setSuccessMsg('✓ ' + res.message);
        // Automatically switch back to login with email prefilled
        setTimeout(() => {
          setLoginIdentifier(forgotEmail);
          setLoginPassword(newPassword);
          setMode('login');
          setSuccessMsg('Password updated in Firebase! Click "Sign In" to proceed.');
        }, 1200);
      }
    } catch (err: any) {
      setError('Failed to update password in Firebase: ' + (err?.message || 'Try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100 my-8">
        
        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-2 shadow-inner">
            <Building className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">Wing-C Lakeview Apartment</h2>
          <p className="text-xs text-slate-400 mt-0.5">Burari, Delhi • Society Ledger & Resident Portal</p>
        </div>

        {/* Tab Switcher (Visible in login & register modes) */}
        {(mode === 'login' || mode === 'register') && (
          <div className="flex rounded-xl bg-slate-800/80 p-1 mb-6 border border-slate-700/60">
            <button
              type="button"
              id="tab-login"
              onClick={() => {
                setMode('login');
                setError('');
                setSuccessMsg('');
              }}
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
              onClick={() => {
                setMode('register');
                setError('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition ${
                mode === 'register'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              New Registration
            </button>
          </div>
        )}

        {/* Feedback Alerts */}
        {error && (
          <div className="mb-4 flex items-start gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs leading-relaxed animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-4 flex items-start gap-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs leading-relaxed animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ========================================================= */}
        {/* 1. LOGIN SCREEN */}
        {/* ========================================================= */}
        {mode === 'login' && (
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
                  placeholder="e.g. C-101, 9811223344 or digamber.gosain11@gmail.com"
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Password
                </label>
                <button
                  type="button"
                  id="link-forgot-password"
                  onClick={() => {
                    setMode('forgot_email');
                    setError('');
                    setSuccessMsg('');
                    if (loginIdentifier.includes('@')) {
                      setForgotEmail(loginIdentifier);
                    }
                  }}
                  className="text-xs text-emerald-400 hover:text-emerald-300 hover:underline font-medium"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  id="login-password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pl-9 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-200"
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Quick Demo Login selector */}
            <div className="pt-2">
              <span className="text-[11px] text-slate-400 block mb-1.5 font-medium">Quick admin access:</span>
              <div className="grid grid-cols-1 gap-2 text-xs">
                <button
                  type="button"
                  id="demo-admin-login"
                  onClick={() => {
                    setLoginIdentifier('C-101');
                    setLoginPassword('password123');
                  }}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 hover:bg-emerald-900/50 transition text-left"
                >
                  <div>
                    <div className="font-semibold text-emerald-200">C-101 (Admin)</div>
                    <div className="text-[11px] text-emerald-400/80">
                      {currentAdmin?.name || 'Digamber Gosain'} • digamber.gosain11@gmail.com
                    </div>
                  </div>
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
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
        )}

        {/* ========================================================= */}
        {/* 2. FORGOT PASSWORD STEP 1: ENTER EMAIL */}
        {/* ========================================================= */}
        {mode === 'forgot_email' && (
          <form onSubmit={handleSendResetCode} className="space-y-4">
            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/80 text-xs">
              <div className="flex items-center gap-2 font-semibold text-white mb-1">
                <Mail className="w-4 h-4 text-emerald-400" />
                <span>Forgot Password - Gmail OTP Recovery</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Enter your registered society email. We will send a secure <strong>6-digit verification code</strong> via Gmail to verify your identity.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Registered Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  id="forgot-email-input"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="e.g. digamber.gosain11@gmail.com"
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              id="btn-send-reset-code"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-semibold text-white text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating & Sending Code...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send 6-Digit Code via Gmail</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
                setSuccessMsg('');
              }}
              className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Resident Login
            </button>
          </form>
        )}

        {/* ========================================================= */}
        {/* 3. FORGOT PASSWORD STEP 2: VERIFY 6-DIGIT CODE */}
        {/* ========================================================= */}
        {mode === 'verify_code' && (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/80 text-xs">
              <div className="flex items-center gap-2 font-semibold text-white mb-1">
                <KeyRound className="w-4 h-4 text-emerald-400" />
                <span>Enter 6-Digit Verification Code</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                A 6-digit code was dispatched for <strong className="text-emerald-300">{forgotEmail}</strong>. Enter it below or tap auto-fill to proceed.
              </p>
              {backupDemoCode && (
                <div className="mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold block">
                      Verification Code
                    </span>
                    <span className="text-xl font-mono font-extrabold tracking-widest text-white">
                      {backupDemoCode}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEnteredCode(backupDemoCode)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition shrink-0"
                  >
                    Auto-Fill Code
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 text-center">
                6-Digit Code
              </label>
              <input
                type="text"
                id="verification-code-input"
                maxLength={6}
                value={enteredCode}
                onChange={(e) => setEnteredCode(e.target.value.replace(/\D/g, ''))}
                placeholder="• • • • • •"
                className="w-full bg-slate-950 border-2 border-emerald-500/80 rounded-xl py-3 text-center text-2xl font-mono tracking-[0.5em] text-emerald-400 placeholder-slate-600 focus:outline-hidden focus:border-emerald-400"
                required
                autoFocus
              />
              <span className="block text-[11px] text-slate-400 text-center mt-1">Code valid for 15 minutes</span>
            </div>

            <button
              type="submit"
              id="btn-verify-code"
              disabled={isSubmitting || enteredCode.length !== 6}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-semibold text-white text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying code...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verify Code & Continue</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={handleSendResetCode}
                className="text-slate-400 hover:text-emerald-400 transition flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Resend Code
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('forgot_email');
                  setEnteredCode('');
                  setError('');
                }}
                className="text-slate-400 hover:text-slate-200 transition"
              >
                Change Email
              </button>
            </div>
          </form>
        )}

        {/* ========================================================= */}
        {/* 4. FORGOT PASSWORD STEP 3: CHOOSE NEW PASSWORD */}
        {/* ========================================================= */}
        {mode === 'reset_password' && (
          <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
            <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-xs">
              <div className="flex items-center gap-2 font-semibold text-emerald-200 mb-1">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Verification Successful!</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Set a new password for <strong className="text-white">{forgotEmail}</strong>. Once saved, Firebase will hold your updated password.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  id="reset-new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pl-9 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-200"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  id="reset-confirm-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your new password"
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              id="btn-save-new-password"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-semibold text-white text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Updating in Firebase...</span>
                </>
              ) : (
                <>
                  <Key className="w-4 h-4" />
                  <span>Save New Password to Firebase</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* ========================================================= */}
        {/* 5. REGISTER FORM */}
        {/* ========================================================= */}
        {mode === 'register' && (
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
                  onClick={() => setRegRole('admin')}
                  className={`py-2 px-3 rounded-lg border text-left flex items-center gap-2 transition ${
                    regRole === 'admin'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                      : 'border-slate-700 bg-slate-800 text-slate-400'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <div>
                    <div className="font-semibold">Admin</div>
                    <div className="text-[10px] opacity-80">Managing Authority</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Occupancy Status: Owner vs Tenant */}
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700 text-xs">
              <span className="font-medium text-slate-200 block mb-1">Occupancy Type:</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  id="occupancy-owner-btn"
                  onClick={() => setRegOccupancy('owner')}
                  className={`py-2 px-3 rounded-lg border text-left flex items-center gap-2 transition ${
                    regOccupancy === 'owner'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                      : 'border-slate-700 bg-slate-800 text-slate-400'
                  }`}
                >
                  <Home className="w-4 h-4 shrink-0" />
                  <div>
                    <div className="font-semibold">Flat Owner</div>
                    <div className="text-[10px] opacity-80">Self Occupied</div>
                  </div>
                </button>

                <button
                  type="button"
                  id="occupancy-tenant-btn"
                  onClick={() => setRegOccupancy('tenant')}
                  className={`py-2 px-3 rounded-lg border text-left flex items-center gap-2 transition ${
                    regOccupancy === 'tenant'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                      : 'border-slate-700 bg-slate-800 text-slate-400'
                  }`}
                >
                  <Building className="w-4 h-4 shrink-0" />
                  <div>
                    <div className="font-semibold">Tenant</div>
                    <div className="text-[10px] opacity-80">Rented House</div>
                  </div>
                </button>
              </div>
            </div>

            {/* If Tenant: Landlord Details */}
            {regOccupancy === 'tenant' && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-2">
                <span className="font-semibold text-amber-300 block">Flat Owner (Landlord) Details:</span>
                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">Owner Name *</label>
                  <input
                    type="text"
                    id="reg-owner-name"
                    value={regOwnerName}
                    onChange={(e) => setRegOwnerName(e.target.value)}
                    placeholder="e.g. Satish Chandra"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:ring-1 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">Owner 10-Digit Mobile *</label>
                  <input
                    type="tel"
                    id="reg-owner-contact"
                    maxLength={10}
                    value={regOwnerContact}
                    onChange={(e) => setRegOwnerContact(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 9811009988"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:ring-1 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Full Name *</label>
              <input
                type="text"
                id="reg-name"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="e.g. Digamber Gosain"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Flat Number *</label>
                <input
                  type="text"
                  id="reg-flat"
                  value={regFlat}
                  onChange={(e) => setRegFlat(e.target.value.toUpperCase())}
                  placeholder="e.g. C-102"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 uppercase focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">10-Digit Mobile *</label>
                <input
                  type="tel"
                  id="reg-mobile"
                  maxLength={10}
                  value={regMobile}
                  onChange={(e) => setRegMobile(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 9871098234"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Email Address *</label>
              <input
                type="email"
                id="reg-email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Create Password *</label>
              <input
                type="password"
                id="reg-password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="Min. 6 characters"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500"
                required
                minLength={6}
              />
            </div>

            {/* Vehicle Registration Section */}
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700 text-xs space-y-2">
              <span className="font-semibold text-slate-300 block">Vehicles (Parking Allocation):</span>
              <div>
                <label className="block text-[11px] text-slate-300 mb-1 flex items-center gap-1">
                  <Bike className="w-3 h-3 text-slate-400" /> Two-Wheeler Reg. No (Scooter/Bike)
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
