import React, { useState } from 'react';
import { useSociety } from '../context/SocietyContext';
import { getMonthDisplayName } from '../utils/formatters';
import { PWAInstallButton } from './PWAInstallButton';
import {
  Building2,
  Calendar,
  Shield,
  User as UserIcon,
  LogOut,
  Smartphone,
  ChevronDown,
  Package,
  Car,
  FileDown
} from 'lucide-react';

interface NavbarProps {
  onOpenAuth: () => void;
  onOpenPlayStoreModal: () => void;
  onOpenDownloadModal: () => void;
  isMobileDeviceFrame?: boolean;
  onToggleMobileFrame?: () => void;
  onNavigateToTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAuth,
  onOpenPlayStoreModal,
  onOpenDownloadModal,
  onNavigateToTab,
}) => {
  const { currentUser, currentRole, isAdmin, logout, selectedMonth, setSelectedMonth, availableMonths, activeRunningMonth } = useSociety();
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 safe-area-top">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-2">
        {/* Left: Branding */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 p-0.5 shadow-md flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
                Wing-C Lakeview
              </h1>
              <span className="hidden xs:inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                Burari, Delhi
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block truncate">
              Society Accounting Ledger & Maintenance Portal
            </p>
          </div>
        </div>

        {/* Center/Right: Month Selector + Actions */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Running Month Selector */}
          <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg px-1.5 sm:px-2 py-1 shadow-xs max-w-[110px] xs:max-w-[130px] sm:max-w-none">
            <Calendar className="w-3.5 h-3.5 text-emerald-400 mr-1 shrink-0" />
            <select
              id="month-selector"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-[11px] sm:text-xs font-semibold text-slate-100 focus:outline-hidden cursor-pointer truncate"
            >
              {availableMonths.map((m) => (
                <option key={m} value={m} className="bg-slate-900 text-white">
                  {getMonthDisplayName(m)} {m === activeRunningMonth ? '(Running)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* PWA Install Button */}
          <PWAInstallButton />

          {/* Direct Project Download Button */}
          <button
            type="button"
            id="btn-download-project-header"
            onClick={onOpenDownloadModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition shadow-xs"
            title="Download Complete Project ZIP"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Download ZIP</span>
          </button>

          {/* Host & APK Test Button (Hidden on small mobile to prevent header overflow, accessible via menu) */}
          <button
            type="button"
            id="btn-playstore-guide"
            onClick={onOpenPlayStoreModal}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/30 text-xs font-semibold transition shadow-xs"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <span>Host &amp; APK Test</span>
          </button>

          {/* User Profile / Auth Status */}
          {currentUser ? (
            <div className="relative">
              <button
                type="button"
                id="user-menu-btn"
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-1 sm:gap-1.5 py-1 px-1.5 sm:px-2 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700/80 transition"
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] sm:text-[11px] font-bold text-white shrink-0 ${
                  isAdmin ? 'bg-amber-600' : 'bg-emerald-600'
                }`}>
                  {isAdmin ? <Shield className="w-3.5 h-3.5" /> : currentUser.flatNumber.replace('C-', '')}
                </div>
                <span className="text-xs font-medium text-slate-200 hidden lg:inline truncate max-w-[90px]">
                  {currentUser.name.split(' ')[0]}
                </span>
                <span className={`text-[9px] sm:text-[10px] px-1 py-0.2 rounded font-bold uppercase ${
                  isAdmin ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-700 text-slate-300'
                }`}>
                  {currentRole}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
              </button>

              {/* Dropdown Menu */}
              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-1.5 z-50 text-xs">
                  <div className="px-3 py-2 border-b border-slate-800">
                    <p className="font-semibold text-white truncate">{currentUser.name}</p>
                    <p className="text-[11px] text-slate-400">Flat: <span className="text-emerald-400 font-bold">{currentUser.flatNumber}</span> • {currentUser.mobile}</p>
                    {isAdmin && (
                      <div className="mt-1 flex items-center gap-1 text-[10px] text-amber-300 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40">
                        <Shield className="w-3 h-3 shrink-0" />
                        <span>Sole Active Admin (Wing-C)</span>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setShowUserDropdown(false);
                      onNavigateToTab('profile');
                    }}
                    className="w-full text-left px-3 py-2 text-slate-300 hover:bg-slate-800 flex items-center gap-2"
                  >
                    <Car className="w-3.5 h-3.5 text-emerald-400" />
                    <span>My Profile & Vehicles</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowUserDropdown(false);
                      onOpenPlayStoreModal();
                    }}
                    className="w-full text-left px-3 py-2 text-sky-300 hover:bg-slate-800 flex items-center gap-2"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-sky-400" />
                    <span>Host &amp; Android APK Guide</span>
                  </button>

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserDropdown(false);
                        onNavigateToTab('profile');
                      }}
                      className="w-full text-left px-3 py-2 text-amber-300 hover:bg-slate-800 flex items-center gap-2"
                    >
                      <Shield className="w-3.5 h-3.5 text-amber-400" />
                      <span>Admin Tenure & Handover</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setShowUserDropdown(false);
                      onOpenAuth();
                    }}
                    className="w-full text-left px-3 py-2 text-slate-300 hover:bg-slate-800 flex items-center gap-2"
                  >
                    <UserIcon className="w-3.5 h-3.5 text-sky-400" />
                    <span>Switch Resident / Register</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowUserDropdown(false);
                      onOpenDownloadModal();
                    }}
                    className="w-full text-left px-3 py-2 text-emerald-400 hover:bg-slate-800 flex items-center gap-2 font-medium"
                  >
                    <FileDown className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Download Project (Full / Android)</span>
                  </button>

                  <div className="border-t border-slate-800 mt-1 pt-1">
                    <button
                      type="button"
                      id="btn-logout"
                      onClick={() => {
                        setShowUserDropdown(false);
                        logout();
                      }}
                      className="w-full text-left px-3 py-2 text-rose-400 hover:bg-rose-950/30 flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              id="btn-nav-login"
              onClick={onOpenAuth}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition shadow-sm"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
