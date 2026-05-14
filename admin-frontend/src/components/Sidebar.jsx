import {
  Bell,
  CreditCard,
  Landmark,
  LayoutDashboard,
  LogOut,
  Mail,
  Percent,
  ShoppingBag,
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import adminLogo from '../assets/logo/AutovalueLK_admin_logo.png';

const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/marketplace', label: 'Marketplace', icon: ShoppingBag },
  { to: '/admin/payments', label: 'Payments', icon: CreditCard },
  { to: '/admin/financing', label: 'Financing', icon: Landmark },
  { to: '/admin/loan-rates', label: 'Loan Rates', icon: Percent },
  { to: '/admin/notifications', label: 'Notifications', icon: Bell },
  { to: '/admin/support-tickets', label: 'Contact Messages', icon: Mail },
];

function Sidebar({ isMobileMenuOpen, setIsMobileMenuOpen }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate('/admin/login');
  };

  const closeMobileMenu = () => {
    if (setIsMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <aside className={`admin-sidebar ${isMobileMenuOpen ? 'admin-sidebar--open' : ''}`}>
      <div className="admin-sidebar-logo">
        <div className="admin-sidebar-logo-icon">
          <img src={adminLogo} alt="AutoValueLK Admin" />
        </div>
        <div className="admin-sidebar-logo-text">
          <span className="admin-sidebar-logo-name">AutoValueLK</span>
          <span className="admin-sidebar-logo-sub">Admin Panel</span>
        </div>
      </div>

      <nav className="admin-sidebar-nav">
        <div className="admin-sidebar-section-label">Control</div>
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={closeMobileMenu}
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon className="admin-nav-icon" size={15} />
            <span>{label}</span>
          </NavLink>
        ))}

        <div className="admin-sidebar-divider" />

        <button type="button" className="admin-nav-item admin-logout-item" onClick={handleLogout}>
          <LogOut className="admin-nav-icon" size={15} />
          <span>Logout</span>
        </button>
      </nav>

      <div className="admin-sidebar-user-area">
        <div className="admin-sidebar-user">
          <div className="admin-sidebar-avatar">A</div>
          <div className="min-w-0">
            <div className="admin-sidebar-user-name">Admin</div>
            <div className="admin-sidebar-user-label">Administrator</div>
          </div>
          <button type="button" className="admin-sidebar-logout" onClick={handleLogout} aria-label="Log out">
            <LogOut size={15} />
          </button>
        </div>
      </div>

      <div className="admin-sidebar-bottom-glow" />
      <div className="admin-sidebar-edge" />
    </aside>
  );
}

export default Sidebar;
