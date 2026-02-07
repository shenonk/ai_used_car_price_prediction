import { Link, Outlet, useLocation } from "react-router-dom";

function MainLayout() {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Dashboard", icon: "📊" },
    { path: "/price-check", label: "Price Check", icon: "🔍" },
    { path: "/results", label: "Results", icon: "📋" },
    { path: "/analytics", label: "Analytics", icon: "📈" },
    { path: "/notifications", label: "Notifications", icon: "🔔" },
  ];

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex min-h-screen bg-[#0f172a]">

      {/* PREMIUM SIDEBAR */}
      <div className="w-72 bg-slate-900/80 backdrop-blur-xl border-r border-slate-700/50 flex flex-col fixed h-screen">

        {/* Logo Section */}
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-xl shadow-lg shadow-blue-500/30">
              🚗
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">CarPrice AI</h1>
              <p className="text-xs text-slate-500">Sri Lanka Market</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
              {isActive(item.path) && (
                <span className="ml-auto w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
              )}
            </Link>
          ))}
        </nav>

        {/* Quick Stats */}
        <div className="p-4 border-t border-slate-700/50">
          <div className="bg-slate-800/50 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400">Model Accuracy</span>
              <span className="text-xs font-semibold text-emerald-400">87%</span>
            </div>
            <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full" style={{ width: '87%' }}></div>
            </div>
          </div>
        </div>

        {/* User Section */}
        <div className="p-4 border-t border-slate-700/50">
          <button className="w-full btn-primary flex items-center justify-center gap-2">
            <span>👤</span>
            <span>Login / Register</span>
          </button>
        </div>

      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 ml-72 min-h-screen">
        <Outlet />
      </div>

    </div>
  );
}

export default MainLayout;
