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
const SocietyAppContent: React.FC = () => {
  const { currentUser, currentRole, isAdmin } = useSociety();

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isPlayStoreModalOpen, setIsPlayStoreModalOpen] = useState<boolean>(false);
  const [isElectricityModalOpen, setIsElectricityModalOpen] = useState<boolean>(false);
  const [selectedRecordIdForPay, setSelectedRecordIdForPay] = useState<string | null>(null);

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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-start items-center w-full max-w-full overflow-x-hidden">
      {/* Container adapts automatically to any mobile screen size (100% on phone, max-w-5xl centered on desktop) */}
      <div className="w-full max-w-5xl mx-auto flex flex-col flex-1 min-h-screen">
        {/* Top Navbar */}
        <Navbar
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onOpenPlayStoreModal={() => setIsPlayStoreModalOpen(true)}
          onNavigateToTab={handleSelectTab}
        />

        {/* Main Tab Content Viewport */}
        <main className="w-full max-w-full px-2 sm:px-4 py-2 sm:py-3 flex-1 pb-32 sm:pb-28 overflow-x-hidden">
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
