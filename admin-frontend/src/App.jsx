import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLogin from './pages/AdminLogin';
import Dashboard from './pages/Dashboard';
import Notifications from './pages/Notifications';
import Financing from './pages/Financing';
import SupportTickets from './pages/SupportTickets';
import Marketplace from './pages/Marketplace';
import Payments from './pages/Payments';

/**
 * AdminLayout — sidebar + scrollable content area.
 * Only rendered for authenticated routes.
 */
function AdminLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="admin-layout">
      <button
        type="button"
        onClick={() => setIsMobileMenuOpen((open) => !open)}
        className="admin-mobile-toggle lg:hidden"
        aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={isMobileMenuOpen}
      >
        {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>
      <Sidebar
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}
      <main className="admin-main">
        <div className="admin-main-inner">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public — login */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Protected — admin layout */}
        <Route
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/admin/dashboard" element={<Dashboard />} />
          <Route path="/admin/marketplace" element={<Marketplace />} />
          <Route path="/admin/payments" element={<Payments />} />
          <Route path="/admin/financing" element={<Financing />} />
          <Route path="/admin/notifications" element={<Notifications />} />
          <Route path="/admin/support-tickets" element={<SupportTickets />} />
        </Route>

        {/* Catch-all → redirect to login */}
        <Route path="*" element={<Navigate to="/admin/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
