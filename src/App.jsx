import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './shared/hooks/useToast';
import { seedDatabase } from './db/seed';
import AppLayout from './shared/layouts/AppLayout';
import PinLogin from './modules/auth/PinLogin';
import DashboardScreen from './modules/dashboard/DashboardScreen';
import POSScreen from './modules/sales/POSScreen';
import OrderHistory from './modules/sales/OrderHistory';
import MenuManagement from './modules/menu/MenuManagement';
import InventoryManagement from './modules/inventory/InventoryManagement';
import ExpenseModule from './modules/expenses/ExpenseModule';
import SettingsScreen from './modules/settings/SettingsScreen';
import PWAUpdatePrompt from './shared/components/PWAUpdatePrompt';
import db from './db/database';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        await seedDatabase();
        // Apply saved theme
        const config = await db.businessConfig.get('config');
        if (config?.theme === 'dark') {
          document.documentElement.setAttribute('data-theme', 'dark');
        }
      } catch (err) {
        console.error('Init error:', err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // Background Sync
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      const { syncService } = await import('./modules/sync/services/syncService');
      syncService.performSync().then(res => {
        if (res.success && res.message !== 'Nothing to sync') {
          console.log('[Sync] Background sync successful:', res.message);
        }
      });
    }, 5 * 60 * 1000); // Every 5 minutes

    return () => clearInterval(interval);
  }, [user]);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (loading) {
    return (
      <div style={{
        height: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#1a1b1e',
        color: '#fff',
        fontFamily: 'Inter, sans-serif',
        flexDirection: 'column',
        gap: '16px',
      }}>
        <div style={{
          width: 64, height: 64,
          borderRadius: 16,
          background: '#e8590c',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2rem',
          fontWeight: 800,
          animation: 'pulse 1.5s ease-in-out infinite',
        }}>
          P
        </div>
        <p style={{ color: '#868e96' }}>Loading POS Local...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <ToastProvider>
        <PinLogin onSuccess={handleLogin} />
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout onLogout={handleLogout} />}>
            <Route path="/" element={<DashboardScreen />} />
            <Route path="/pos" element={<POSScreen />} />
            <Route path="/orders" element={<OrderHistory />} />
            <Route path="/menu" element={<MenuManagement />} />
            <Route path="/inventory" element={<InventoryManagement />} />
            <Route path="/expenses" element={<ExpenseModule />} />
            <Route path="/settings" element={<SettingsScreen />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <PWAUpdatePrompt />
    </ToastProvider>
  );
}

export default App;
