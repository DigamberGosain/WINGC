import React from 'react';
import { useSociety } from '../context/SocietyContext';
import {
  LayoutDashboard,
  IndianRupee,
  FileSpreadsheet,
  Zap,
  ShieldAlert,
  UserCheck
} from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onSelectTab }) => {
  const { isAdmin, unpaidPast15thList } = useSociety();

  // Common tabs for all residents
  const tabs = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'maintenance',
      label: 'Maintenance',
      icon: FileSpreadsheet,
      badge: unpaidPast15thList.length > 0 ? unpaidPast15thList.length : undefined,
    },
    {
      id: 'expenses',
      label: 'Expenses',
      icon: IndianRupee,
    },
  ];

  // Electricity bill tab (Admin gets dedicated tab; Users see it embedded directly on Dashboard as requested)
  if (isAdmin) {
    tabs.push({
      id: 'electricity',
      label: 'Electricity',
      icon: Zap,
    });
  }

  // Profile & Society management
  tabs.push({
    id: 'profile',
    label: isAdmin ? 'Admin / Society' : 'My Profile',
    icon: isAdmin ? ShieldAlert : UserCheck,
  });

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 safe-area-bottom shadow-lg">
      <div className="max-w-md mx-auto flex items-center justify-around px-2 pt-1.5 pb-0.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition relative ${
                isActive
                  ? 'text-emerald-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 font-medium'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
                {tab.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[68px]">
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-0.5 w-6 h-0.5 bg-emerald-400 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
