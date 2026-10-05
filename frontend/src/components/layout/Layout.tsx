import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { GlobalSearchModal } from './GlobalSearchModal';
import { QuickActionsModal } from './QuickActionsModal';
import { NotificationDrawer } from './NotificationDrawer';
import { Toaster } from 'sonner';

export const Layout: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [quickActionOpen, setQuickActionOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-[#F5F6F8] text-slate-900 font-sans antialiased overflow-x-hidden">
      <Sidebar mobileOpen={mobileMenuOpen} onCloseMobile={() => setMobileMenuOpen(false)} />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        <Header
          onOpenSearch={() => setSearchOpen(true)}
          onOpenQuickAction={() => setQuickActionOpen(true)}
          onOpenNotifications={() => setNotificationsOpen(true)}
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        />
        <main className="flex-1 p-3 sm:p-5 md:p-6 max-w-7xl w-full mx-auto space-y-6 overflow-x-hidden">
          <Outlet />
        </main>
      </div>

      <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <QuickActionsModal isOpen={quickActionOpen} onClose={() => setQuickActionOpen(false)} />
      <NotificationDrawer isOpen={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
      <Toaster position="top-right" richColors />
    </div>
  );
};
