import React, { useState, useEffect } from 'react';
import { SocietyProvider, useSociety } from './context/SocietyContext';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { DashboardTab } from './components/DashboardTab';
import { MaintenanceTab } from './components/MaintenanceTab';
import { ExpensesTab } from './components/ExpensesTab';
import { ProfileTab } from './components/ProfileTab';
import { ElectricityModal } from './components/ElectricityModal';
import { AuthModal } from './components/AuthModal';
import { PlayStoreGuideModal } from './components/PlayStoreGuideModal';
import {
  Wifi,
  Battery,
  Signal,
  Smartphone,
  Shield,
  Layers
} from 'lucide-react';

const SocietyAppContent: React.FC = () => {
  const { currentUser, currentRole, isAdmin } = useSociety();

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isPlayStoreModalOpen, setIsPlayStoreModalOpen] = useState<boolean>(false);
  const [isElectricityModalOpen, setIsElectricityModalOpen] = useState<boolean>(false);
  const [selectedRecordIdForPay, setSelectedRecordIdForPay] = useState<string | null>(null);

  // Desktop Android Smartphone Frame preview toggle
  const [isMobileDeviceFrame, setIsMobileDeviceFrame] = useState<boolean>(false);

  // Clock for Android status bar in mobile frame view
  const [currentTime, setCurrentTime] = useState<string>('09:41');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hrs = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      setCurrentTime(`${hrs}:${mins}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 10000);
    return () => clearInterval(timer);
  }, []);

  // Enforce role constraints: "The users will have only dashboard and expense and maintenance received pages"
  const handleSelectTab = (tab: string) => {
    if (tab === 'electricity') {
      setIsElectricityModalOpen(true);
      return;
    }
    setActiveTab(tab);
  };

  // Jump from Dashboard Defaulter list directly to Mark Paid
  const handleOpenMarkPaidFromDashboard = (recordId: string) => {
    setSelectedRecordIdForPay(recordId);
    setActiveTab('maintenance');
  };

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-start items-center ${
      isMobileDeviceFrame ? 'py-4 sm:py-8 px-2' : ''
    }`}>
      {/* Outer Mobile Frame wrapper (if mobile view enabled on desktop) */}
      <div className={`w-full transition-all duration-300 ${
        isMobileDeviceFrame
          ? 'max-w-[420px] rounded-[42px] border-[10px] border-slate-800 shadow-2xl overflow-hidden bg-slate-900 relative ring-1 ring-slate-700/50'
          : 'max-w-5xl mx-auto'
      }`}>
        {/* Android Simulated Status Bar (visible only in mobile frame mode) */}
        {isMobileDeviceFrame && (
          <div className="bg-slate-900 px-5 pt-3 pb-1 flex items-center justify-between text-[11px] font-semibold text-slate-300 border-b border-slate-800/60 select-none">
            <span>{currentTime}</span>
            {/* Center camera notch/punch hole */}
            <div className="w-4 h-4 rounded-full bg-black border border-slate-800 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div>
            </div>
            <div className="flex items-center gap-1.5">
              <Signal className="w-3 h-3" />
              <Wifi className="w-3 h-3" />
              <Battery className="w-3.5 h-3.5 text-emerald-400" />
            </div>
          </div>
        )}

        {/* Top Navbar */}
        <Navbar
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onOpenPlayStoreModal={() => setIsPlayStoreModalOpen(true)}
          isMobileDeviceFrame={isMobileDeviceFrame}
          onToggleMobileFrame={() => setIsMobileDeviceFrame(!isMobileDeviceFrame)}
          onNavigateToTab={handleSelectTab}
        />

        {/* Main Tab Content Viewport */}
        <main className="px-3 sm:px-4 py-3 min-h-[82vh]">
          {activeTab === 'dashboard' && (
            <DashboardTab
              onNavigateToTab={handleSelectTab}
              onOpenElectricityModal={() => setIsElectricityModalOpen(true)}
              onOpenMarkPaidModal={handleOpenMarkPaidFromDashboard}
            />
          )}

          {activeTab === 'maintenance' && (
            <MaintenanceTab
              selectedRecordIdForPay={selectedRecordIdForPay}
              onClearSelectedRecordForPay={() => setSelectedRecordIdForPay(null)}
            />
          )}

          {activeTab === 'expenses' && (
            <ExpensesTab />
          )}

          {activeTab === 'profile' && (
            <ProfileTab />
          )}
        </main>

        {/* Bottom Navigation */}
        <BottomNav
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
        />
      </div>

      {/* Global Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <ElectricityModal
        isOpen={isElectricityModalOpen}
        onClose={() => setIsElectricityModalOpen(false)}
      />

      <PlayStoreGuideModal
        isOpen={isPlayStoreModalOpen}
        onClose={() => setIsPlayStoreModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <SocietyProvider>
      <SocietyAppContent />
    </SocietyProvider>
  );
}
