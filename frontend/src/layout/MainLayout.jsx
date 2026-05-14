import { useState, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Home, LayoutDashboard, ShoppingBag, Search, FileText, HandCoins, BarChart3, Bell, BellRing, Settings, HelpCircle, Menu, X, LogIn, LogOut } from "lucide-react";
import { isLoggedIn, logout, getCurrentUser } from "../utils/auth";
import logo from "../assets/logo/autovaluelk-logo.png";
import { useTranslation } from "react-i18next";
import { applyTheme, getStoredTheme } from "../utils/theme";
import AppRouteBoundary from "../components/AppRouteBoundary";
import { supabase } from "../utils/supabaseClient";
import {
  inferNotificationType,
  loadDismissedNotificationIds,
  loadReadNotificationIds,
  markNotificationAsRead,
} from "../utils/notifications";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const SESSION_SHOWN_NOTIFICATIONS_KEY = "autovaluelk_session_shown_notifications";

function toTimestamp(value) {
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function loadSessionShownNotificationIds(user) {
  try {
    const key = `${SESSION_SHOWN_NOTIFICATIONS_KEY}_${user?.id || user?.email || "guest"}`;
    const value = JSON.parse(window.sessionStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function saveSessionShownNotificationIds(user, ids) {
  try {
    const key = `${SESSION_SHOWN_NOTIFICATIONS_KEY}_${user?.id || user?.email || "guest"}`;
    window.sessionStorage.setItem(key, JSON.stringify([...new Set(ids)]));
  } catch {
    // Session storage is best-effort only; notifications still render without it.
  }
}

const MainLayout = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [loggedIn, setLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState({ email: null, username: null });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notificationPopups, setNotificationPopups] = useState([]);

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
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(Boolean(session));
      if (session?.user) {
        setUserInfo({
          id: session.user.id,
          email: session.user.email,
          username: session.user.user_metadata?.username,
          avatar_url: session.user.user_metadata?.avatar_url,
        });
      } else {
        setUserInfo({ email: null, username: null });
        setNotificationPopups([]);
      }
    });

    return () => {
      data?.subscription?.unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    const loadUnreadNotificationPopups = async () => {
      if (!loggedIn) {
        setNotificationPopups([]);
        return;
      }

      try {
        const user = await getCurrentUser();
        if (!user) {
          if (isActive) setNotificationPopups([]);
          return;
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();
        const accessToken = session?.access_token;
        const response = await fetch(`${API_BASE_URL}/api/notifications`, {
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        });

        if (!response.ok) {
          throw new Error("Failed to load notifications");
        }

        const payload = await response.json();
        const readIds = loadReadNotificationIds(user);
        const dismissedIds = loadDismissedNotificationIds(user);
        const shownIds = loadSessionShownNotificationIds(user);

        const unreadItems = (payload.notifications || [])
          .filter((item) => !readIds.includes(item.id) && !dismissedIds.includes(item.id) && !shownIds.includes(item.id))
          .sort((a, b) => toTimestamp(b.created_at) - toTimestamp(a.created_at))
          .slice(0, 3)
          .map((item) => ({
            id: item.id,
            title: item.title,
            message: item.message,
            type: inferNotificationType(item.title),
            createdAt: item.created_at,
          }));

        if (!isActive) return;

        if (unreadItems.length > 0) {
          saveSessionShownNotificationIds(user, [...shownIds, ...unreadItems.map((item) => item.id)]);
        }
        setNotificationPopups(unreadItems);
      } catch (error) {
        if (isActive) {
          console.error("Unable to load unread notification popups:", error);
          setNotificationPopups([]);
        }
      }
    };

    loadUnreadNotificationPopups();

    const intervalId = window.setInterval(loadUnreadNotificationPopups, 30000);
    window.addEventListener("focus", loadUnreadNotificationPopups);

    return () => {
      isActive = false;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", loadUnreadNotificationPopups);
    };
  }, [loggedIn]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const navItems = [
    {
      path: "/",
      label: "Home",
      icon: <Home className="w-5 h-5" />,
    },
    {
      path: "/dashboard",
      label: t("dashboard"),
      icon: <LayoutDashboard className="w-5 h-5" />,
      requiresAuth: true,
      authMessage: "Please log in to access this page.",
      authSubMessage: "Dashboard, saved activity, and account insights are available only for logged-in users.",
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
      requiresAuth: true,
      authMessage: "Please log in to access this page.",
      authSubMessage: "Saved prediction trends and deeper account analytics are available only for logged-in users.",
    },
    {
      path: "/notifications",
      label: t("notifications"),
      icon: <Bell className="w-5 h-5" />,
      requiresAuth: true,
      authMessage: "Please log in to access this page.",
      authSubMessage: "Personal notifications and alert activity are available only for logged-in users.",
    },
    {
      path: "/settings",
      label: t("settings"),
      icon: <Settings className="w-5 h-5" />,
      requiresAuth: true,
      authMessage: "Please log in to access this page.",
      authSubMessage: "Profile, password, alerts, and notification settings are available only for logged-in users.",
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

  const closeNotificationPopup = async (id, markAsRead = false) => {
    const user = await getCurrentUser();
    if (markAsRead && user) {
      markNotificationAsRead(user, id);
    }
    setNotificationPopups((current) => current.filter((item) => item.id !== id));
  };

  const openNotificationPopup = async (id) => {
    await closeNotificationPopup(id, true);
    navigate("/notifications");
  };

  const handleNavClick = (event, item) => {
    setIsMobileMenuOpen(false);

    if (!item.requiresAuth || loggedIn) {
      return;
    }

    event.preventDefault();
    navigate("/login", {
      state: {
        authMessage: item.authMessage || "Please sign in to continue.",
        authSubMessage: item.authSubMessage || "This feature is available only for logged-in users.",
      },
    });
  };

  return (
    <div className="theme-app-bg min-h-screen">
      <button
        type="button"
        onClick={() => setIsMobileMenuOpen((open) => !open)}
        className="theme-surface fixed left-4 top-4 z-50 rounded-2xl p-2.5 theme-text-primary backdrop-blur lg:hidden"
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
        className={`theme-sidebar sidebar fixed left-0 top-0 z-40 flex h-screen w-[200px] flex-col border-r transition-transform duration-300 ease-out lg:translate-x-0 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="theme-divider sidebar-logo border-b px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="sidebar-brand-logo sidebar-logo-icon flex h-9 w-9 items-center justify-center rounded-lg">
              <img src={logo} alt="AutoValueLK" className="h-7 object-contain" />
            </div>
            <div className="sidebar-logo-text">
              <h1 className="heading-display theme-text-primary sidebar-logo-name text-[13px] font-medium tracking-normal">AutoValueLK</h1>
              <p className="theme-text-muted sidebar-logo-sub text-[10px] uppercase tracking-[0.05em]">Sri Lankan Market</p>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav flex-1 space-y-0.5 px-0 pb-3 pt-2">
          <div className="sidebar-section-label">Navigation</div>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link nav-item ${isActive(item.path) ? "active" : ""}`}
              onClick={(event) => handleNavClick(event, item)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="flex-1 font-medium">{item.label}</span>
              <span className="nav-chevron" aria-hidden="true">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 6l6 6-6 6" />
                </svg>
              </span>
              {isActive(item.path) && <span className="nav-active-dot" aria-hidden="true" />}
            </Link>
          ))}
        </nav>

        <div className="theme-divider sidebar-user-area border-t p-3">
          <button
            onClick={handleAuthAction}
            className="sidebar-account-card sidebar-user flex w-full items-center gap-2 rounded-md px-2 py-2 text-left transition-all duration-150"
          >
            {loggedIn && userInfo.avatar_url ? (
              <img
                src={userInfo.avatar_url}
                alt="Profile"
                className="theme-divider sidebar-avatar h-8 w-8 rounded-full border object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="sidebar-account-avatar sidebar-avatar flex h-8 w-8 items-center justify-center rounded-full">
                <span className="text-xs font-medium">
                  {loggedIn
                    ? (userInfo.username || userInfo.email || "U").trim().charAt(0).toUpperCase()
                    : "A"}
                </span>
              </div>
            )}

            <div className="min-w-0 flex-1">
              <p className="theme-text-primary sidebar-user-name truncate text-xs font-medium">
                {loggedIn ? userInfo.username || "Account" : "Account access"}
              </p>
              <p className="theme-text-muted sidebar-user-email truncate text-[11px]">
                {loggedIn ? userInfo.email || "Signed in" : "Login / Register"}
              </p>
            </div>

            <span className="sidebar-account-action sidebar-logout flex h-7 w-7 items-center justify-center rounded-md" aria-hidden="true">
              {loggedIn ? <LogOut className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
            </span>
          </button>
        </div>
        <div className="sidebar-bottom-glow" aria-hidden="true" />
        <div className="sidebar-edge" aria-hidden="true" />
      </div>

      <div className="min-h-screen w-full lg:ml-[200px] lg:w-[calc(100%-200px)]">
        <div className="app-main-content min-h-screen pt-20 lg:pt-0">
          <AppRouteBoundary locationKey={location.key}>
            <Outlet />
          </AppRouteBoundary>
        </div>
      </div>

      {notificationPopups.length > 0 && (
        <div className="fixed bottom-24 right-5 z-[80] flex w-[min(360px,calc(100vw-24px))] flex-col gap-3">
          {notificationPopups.map((notification) => (
            <article
              key={notification.id}
              className={`notification-popup notification-popup--${notification.type}`}
              role="status"
              aria-live="polite"
            >
              <button
                type="button"
                className="notification-popup__body"
                onClick={() => openNotificationPopup(notification.id)}
              >
                <span className="notification-popup__icon">
                  <BellRing className="h-4 w-4" />
                </span>
                <span className="notification-popup__copy">
                  <strong>{notification.title}</strong>
                  <span>{notification.message}</span>
                </span>
              </button>
              <button
                type="button"
                className="notification-popup__close"
                aria-label="Mark notification as read"
                onClick={() => closeNotificationPopup(notification.id, true)}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default MainLayout;
