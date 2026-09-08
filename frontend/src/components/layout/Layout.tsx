import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { GlobalSearchModal } from './GlobalSearchModal';
import { QuickActionsModal } from './QuickActionsModal';
import { NotificationDrawer } from './NotificationDrawer';
import { Toaster } from 'sonner';

export const Layout: React.FC = () => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [quickActionOpen, setQuickActionOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onOpenSearch={() => setSearchOpen(true)}
          onOpenQuickAction={() => setQuickActionOpen(true)}
          onOpenNotifications={() => setNotificationsOpen(true)}
        />
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
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
