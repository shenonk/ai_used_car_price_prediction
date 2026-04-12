import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLogin from './pages/AdminLogin';
import Dashboard from './pages/Dashboard';
import LoanRates from './pages/LoanRates';
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
    <div className="min-h-screen bg-[#0b1120]">
      <button
        type="button"
        onClick={() => setIsMobileMenuOpen((open) => !open)}
        className="fixed left-4 top-4 z-50 rounded-xl border border-gray-700 bg-gray-800/95 p-2 text-white shadow-lg shadow-black/20 backdrop-blur lg:hidden"
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
      <main className="min-h-screen w-full lg:ml-64 lg:w-[calc(100%-16rem)]">
        <div className="w-full px-4 pb-6 pt-20 sm:pb-8 sm:pt-24 lg:px-8 lg:pt-8">
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
          <Route path="/admin/loan-rates" element={<LoanRates />} />
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
