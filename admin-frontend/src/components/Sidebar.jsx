import { NavLink, useNavigate } from 'react-router-dom';
import logo from '../assets/logo/autovaluelk-logo.png';

/**
 * Sidebar — Admin navigation with responsive mobile menu.
 * Uses NavLink for active state highlighting.
 */
function Sidebar({ isMobileMenuOpen, setIsMobileMenuOpen }) {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('admin_token');
        navigate('/admin/login');
    };

    const navItems = [
        {
            to: '/admin/dashboard',
            label: 'Dashboard',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
            ),
        },
        {
            to: '/admin/marketplace',
            label: 'Marketplace',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 7.5l1.664 9.152A2.25 2.25 0 006.879 18.5h10.242a2.25 2.25 0 002.215-1.848L21 7.5M3 7.5h18M3 7.5l1.2-2.4A2.25 2.25 0 016.213 3.75h11.574A2.25 2.25 0 0119.8 5.1L21 7.5M9 11.25h6" />
                </svg>
            ),
        },
        {
            to: '/admin/payments',
            label: 'Payments',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.25 8.25h19.5M3.75 6h16.5A1.5 1.5 0 0121.75 7.5v9A1.5 1.5 0 0120.25 18H3.75a1.5 1.5 0 01-1.5-1.5v-9A1.5 1.5 0 013.75 6zm2.25 7.5h3.75" />
                </svg>
            ),
        },
        {
            to: '/admin/financing',
            label: 'Financing',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                </svg>
            ),
        },
        {
            to: '/admin/loan-rates',
            label: 'Loan Rates',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
        },
        {
            to: '/admin/notifications',
            label: 'Notifications',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
            ),
        },
        {
            to: '/admin/support-tickets',
            label: 'Contact Messages',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21.75 6.75v10.5A2.25 2.25 0 0119.5 19.5H4.5a2.25 2.25 0 01-2.25-2.25V6.75M21.75 6.75A2.25 2.25 0 0019.5 4.5H4.5A2.25 2.25 0 002.25 6.75m19.5 0l-8.69 5.52a2 2 0 01-2.12 0L2.25 6.75" />
                </svg>
            ),
        },
    ];

    const linkClasses = ({ isActive }) =>
        `flex items-center gap-3 px-4 py-2.5 rounded-xl text-[0.8125rem] font-medium transition-all duration-250 ${isActive
            ? 'bg-blue-500/12 text-blue-400 border border-blue-500/20 shadow-sm shadow-blue-500/8'
            : 'text-gray-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
        }`;

    return (
        <>
            {/* Sidebar */}
            <aside
                className={`fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-gray-800/60 bg-gray-900/95 backdrop-blur-xl transition-transform duration-300 ease-out lg:translate-x-0
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
            >
                {/* Logo */}
                <div className="px-6 py-5 border-b border-gray-800/50">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 shadow-sm">
                            <img src={logo} alt="AutoValueLK" className="h-6 object-contain" />
                        </div>
                        <div>
                            <h2 className="heading-display text-sm font-bold text-white tracking-tight">AutoValueLK</h2>
                            <p className="text-[0.65rem] text-gray-500 uppercase tracking-[0.15em]">Admin Panel</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                    <p className="text-[0.65rem] text-gray-500/80 font-semibold uppercase tracking-[0.14em] px-4 mb-3">Main Menu</p>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={linkClasses}
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            {item.icon}
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                {/* Logout */}
                <div className="px-3 py-4 border-t border-gray-800/50">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-250"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                    </button>
                </div>
            </aside>
        </>
    );
}

export default Sidebar;
