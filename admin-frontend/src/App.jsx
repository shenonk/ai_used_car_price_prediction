import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLogin from './pages/AdminLogin';
import Dashboard from './pages/Dashboard';
import LoanRates from './pages/LoanRates';
import Notifications from './pages/Notifications';

/**
 * AdminLayout — sidebar + scrollable content area.
 * Only rendered for authenticated routes.
 */
function AdminLayout() {
  return (
    <div className="min-h-screen bg-[#0b1120]">
      <Sidebar />
      <main className="lg:ml-64 min-h-screen">
        <div className="p-6 lg:p-8 max-w-6xl">
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
          <Route path="/admin/loan-rates" element={<LoanRates />} />
          <Route path="/admin/notifications" element={<Notifications />} />
        </Route>

        {/* Catch-all → redirect to login */}
        <Route path="*" element={<Navigate to="/admin/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
