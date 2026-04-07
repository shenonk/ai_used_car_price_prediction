import { useState, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, ShoppingBag, Search, FileText, HandCoins, BarChart3, Bell, Settings, HelpCircle, Menu, X } from "lucide-react";
import { isLoggedIn, logout, getCurrentUser } from "../utils/auth";
import logo from "../assets/logo/autovaluelk-logo.png";
import { useTranslation } from "react-i18next";
import { applyTheme, getStoredTheme } from "../utils/theme";

const MainLayout = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [loggedIn, setLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState({ email: null, username: null });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (i18n.resolvedLanguage === "si" || i18n.resolvedLanguage === "ta") {
      document.body.style.letterSpacing = "0.02em";
      document.body.style.lineHeight = "1.6";
    } else {
      document.body.style.letterSpacing = "normal";
      document.body.style.lineHeight = "normal";
    }
  }, [i18n.resolvedLanguage]);

  useEffect(() => {
    applyTheme(getStoredTheme());
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const isLogged = await isLoggedIn();
      setLoggedIn(isLogged);
      if (isLogged) {
        const user = await getCurrentUser();
        setUserInfo(user || { email: null, username: null });
      }
    };
    checkAuth();
  }, [location.pathname]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const navItems = [
    {
      path: "/",
      label: t("dashboard"),
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      path: "/marketplace",
      label: t("marketplace_nav"),
      icon: <ShoppingBag className="w-5 h-5" />,
    },
    {
      path: "/price-check",
      label: t("price_check"),
      icon: <Search className="w-5 h-5" />,
    },
    {
      path: "/results",
      label: t("results"),
      icon: <FileText className="w-5 h-5" />,
    },
    {
      path: "/financing",
      label: t("financing"),
      icon: <HandCoins className="w-5 h-5" />,
    },
    {
      path: "/analytics",
      label: t("analytics"),
      icon: <BarChart3 className="w-5 h-5" />,
    },
    {
      path: "/notifications",
      label: t("notifications"),
      icon: <Bell className="w-5 h-5" />,
    },
    {
      path: "/settings",
      label: t("settings"),
      icon: <Settings className="w-5 h-5" />,
    },
    {
      path: "/help",
      label: t("help_center"),
      icon: <HelpCircle className="w-5 h-5" />,
    },
  ];

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const handleAuthAction = () => {
    if (loggedIn) {
      logout();
      navigate("/login");
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="theme-app-bg min-h-screen">
      <button
        type="button"
        onClick={() => setIsMobileMenuOpen((open) => !open)}
        className="theme-surface fixed left-4 top-4 z-50 rounded-xl p-2 theme-text-primary backdrop-blur lg:hidden"
        aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={isMobileMenuOpen}
      >
        {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <div
        className={`theme-sidebar fixed left-0 top-0 z-40 flex h-screen w-72 flex-col border-r backdrop-blur-xl transition-transform duration-300 ease-out lg:translate-x-0 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="theme-divider border-b p-6">
          <div className="flex items-center gap-3">
            <img src={logo} alt="AutoValueLK" className="h-8 object-contain" />
            <div>
              <h1 className="theme-text-primary text-lg font-bold">AutoValueLK</h1>
              <p className="theme-text-muted text-xs">Sri Lankan Market</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link ${isActive(item.path) ? "active" : ""}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
              {isActive(item.path) && <span className="ml-auto h-2 w-2 animate-pulse rounded-full bg-blue-400"></span>}
            </Link>
          ))}
        </nav>

        <div className="theme-divider flex flex-col gap-3 border-t p-4">
          {loggedIn && (
            <div className="flex items-center justify-center gap-3">
              {userInfo.avatar_url && (
                <img
                  src={userInfo.avatar_url}
                  alt="Profile"
                  className="theme-divider h-8 w-8 rounded-full border object-cover"
                  referrerPolicy="no-referrer"
                />
              )}
              <p className="theme-text-primary truncate text-sm font-bold">
                {t("welcome")}, {userInfo.username || userInfo.email}
              </p>
            </div>
          )}

          <button
            onClick={handleAuthAction}
            className={`w-full flex items-center justify-center gap-2 ${loggedIn ? "btn-secondary" : "btn-primary"}`}
          >
            {loggedIn ? (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>{t("logout")}</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>Login / Register</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="min-h-screen w-full lg:ml-72 lg:w-[calc(100%-18rem)]">
        <div className="min-h-screen pt-20 lg:pt-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
