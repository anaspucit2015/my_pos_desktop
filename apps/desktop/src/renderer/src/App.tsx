import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';
import { UserRole } from '@my-pos/shared';
import Sidebar from './components/Sidebar/Sidebar';
import POSPage from './pages/POSPage';
import DashboardPage from './pages/DashboardPage';
import InventoryPage from './pages/InventoryPage';
import CustomersPage from './pages/CustomersPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import CategoriesPage from './pages/CategoriesPage';
import LoginPage from './pages/LoginPage';

/** Wraps a route so it redirects to /login when unauthenticated. */
function ProtectedRoute({ children }: { children: React.ReactNode }): React.JSX.Element {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

/** Wraps a route so it redirects to /pos when the user is not an ADMIN. */
function AdminRoute({ children }: { children: React.ReactNode }): React.JSX.Element {
  const currentUser = useAuthStore((s) => s.currentUser);
  return currentUser?.role === UserRole.ADMIN ? <>{children}</> : <Navigate to="/pos" replace />;
}

/** Shell layout: icon sidebar on the left, scrollable content on the right. */
function AppLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <div className="flex h-screen overflow-hidden bg-surface text-t1">
      <Sidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}

/** Root application component. Restores session and initialises theme on mount. */
export default function App(): React.JSX.Element {
  const restoreSession = useAuthStore((s) => s.restoreSession);
  const initTheme = useThemeStore((s) => s.initTheme);

  useEffect(() => {
    // initTheme runs synchronously — reads localStorage / OS preference
    // and applies the correct CSS class to <html> before the first paint.
    initTheme();
    restoreSession();
  }, [initTheme, restoreSession]);

  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Routes>
                  <Route index element={<Navigate to="/pos" replace />} />
                  <Route path="/pos"        element={<POSPage />} />
                  <Route path="/dashboard"  element={<DashboardPage />} />
                  <Route path="/inventory"  element={<InventoryPage />} />
                  <Route path="/customers"  element={<CustomersPage />} />
                  <Route path="/categories" element={<AdminRoute><CategoriesPage /></AdminRoute>} />
                  <Route path="/reports"    element={<AdminRoute><ReportsPage /></AdminRoute>} />
                  <Route path="/settings"   element={<AdminRoute><SettingsPage /></AdminRoute>} />
                </Routes>
              </AppLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </HashRouter>
  );
}
