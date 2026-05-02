import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  User, 
  Bell, 
  Zap, 
  Globe, 
  Trash2, 
  Save, 
  CheckCircle,
  ChevronRight,
  Shield,
  Clock,
  LogOut,
  Moon,
  Lock
} from "lucide-react";
import { getCurrentUser, logout, updatePassword } from "../utils/auth";
import { useNavigate } from "react-router-dom";
import { getAlertsStorageKey, getPrefsStorageKey, loadUserAlerts, saveUserAlerts } from "../utils/userAlerts";
import SuccessToast from "../components/auth/SuccessToast";
import { getStoredTheme, saveTheme } from "../utils/theme";
import AppModal from "../components/AppModal";

function Settings() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("profile");
  const [userInfo, setUserInfo] = useState({ email: null, username: null });
  const [prefs, setPrefs] = useState({
    priceAlerts: true,
    marketUpdates: true,
    loanRates: true,
    systemUpdates: false,
  });
  const [alerts, setAlerts] = useState([]);
  const [saved, setSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [theme, setTheme] = useState(getStoredTheme());
  const [toast, setToast] = useState({
    isOpen: false,
    type: "success",
    message: "",
    subMessage: "",
  });
  const [isClearDataModalOpen, setIsClearDataModalOpen] = useState(false);

  const showToast = (type, message, subMessage = "") => {
    setToast({ isOpen: true, type, message, subMessage });
    window.clearTimeout(window.__settingsToastTimeout);
    window.__settingsToastTimeout = window.setTimeout(() => {
      setToast((prev) => ({ ...prev, isOpen: false }));
    }, 3000);
  };

  const isLightTheme = theme === "light";

  useEffect(() => {
    const initSettings = async () => {
      setIsLoading(true);
      // Fetch user info
      const user = await getCurrentUser();
      const resolvedUser = user || { email: 'guest@example.com', username: 'Guest' };
      setUserInfo(resolvedUser);

      // Fetch prefs
      const storedPrefs = JSON.parse(localStorage.getItem(getPrefsStorageKey(resolvedUser)) || 'null');
      if (storedPrefs) setPrefs(storedPrefs);

      // Fetch alerts
      const storedAlerts = loadUserAlerts(resolvedUser);
      setAlerts(storedAlerts);
      
      setIsLoading(false);
    };
    initSettings();
  }, []);

  const togglePref = (key) => {
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  };

  const handleSavePrefs = () => {
    localStorage.setItem(getPrefsStorageKey(userInfo), JSON.stringify(prefs));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handlePasswordFieldChange = (field, value) => {
    setPasswordForm((prev) => ({ ...prev, [field]: value }));
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();

    if (!passwordForm.currentPassword.trim()) {
      showToast(
        "error",
        t("settings_page.security.errors.current_required"),
        t("settings_page.security.errors.current_required_hint")
      );
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      showToast(
        "error",
        t("settings_page.security.errors.too_short"),
        t("settings_page.security.errors.too_short_hint")
      );
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast(
        "error",
        t("settings_page.security.errors.no_match"),
        t("settings_page.security.errors.no_match_hint")
      );
      return;
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      showToast(
        "error",
        t("settings_page.security.errors.same_password"),
        t("settings_page.security.errors.same_password_hint")
      );
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const result = await updatePassword(passwordForm.newPassword);

      if (!result.success) {
        if (result.isSessionMissing || result.requiresRelogin) {
          showToast(
            "error",
            t("settings_page.security.errors.session_expired"),
            result.error || t("settings_page.security.errors.session_expired_hint")
          );
          return;
        }

        showToast("error", t("settings_page.security.errors.update_failed"), result.error);
        return;
      }

      if (result.user) {
        setUserInfo((prev) => ({
          ...prev,
          id: result.user.id,
          email: result.user.email ?? prev.email,
          username: result.user.user_metadata?.username ?? prev.username,
          avatar_url: result.user.user_metadata?.avatar_url ?? prev.avatar_url,
        }));
      }

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      if (result.requiresRelogin) {
        navigate("/login", {
          replace: true,
          state: {
            authMessage: "Password updated, please log in again.",
            authSubMessage: t("settings_page.security.relogin_hint"),
          },
        });
        return;
      }

      showToast(
        "success",
        t("settings_page.security.success_title"),
        t("settings_page.security.success_subtitle")
      );
    } catch (error) {
      const message =
        typeof error?.message === "string" && error.message.toLowerCase().includes("auth session missing")
          ? t("settings_page.security.errors.session_expired_hint")
          : t("settings_page.security.errors.generic");
      showToast("error", t("settings_page.security.errors.update_failed"), message);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const deleteAlert = (predictionKey, alertIndex) => {
    const newAlerts = alerts.filter((alert, index) => {
      if (predictionKey) {
        return alert.predictionKey !== predictionKey;
      }

      return index !== alertIndex;
    });
    setAlerts(newAlerts);
    saveUserAlerts(userInfo, newAlerts);
  };

  const clearAllData = () => {
    setIsClearDataModalOpen(true);
  };

  const confirmClearAllData = () => {
    localStorage.removeItem(getPrefsStorageKey(userInfo));
    localStorage.removeItem(getAlertsStorageKey(userInfo));
    setAlerts([]);
    setPrefs({
      priceAlerts: true,
      marketUpdates: true,
      loanRates: true,
      systemUpdates: false,
    });
    setIsClearDataModalOpen(false);
    showToast("success", "Local data cleared.", "Your price alerts and local preferences were removed.");
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleThemeToggle = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    saveTheme(nextTheme);
  };

  const tabs = [
    { id: "profile", label: t("profile"), icon: <User size={20} /> },
    { id: "notifications", label: t("notification_preferences"), icon: <Bell size={20} /> },
    { id: "alerts", label: t("manage_alerts"), icon: <Zap size={20} /> },
    { id: "security", label: t("settings_page.security.tab"), icon: <Lock size={20} /> },
    { id: "general", label: t("language_preferences"), icon: <Globe size={20} /> },
  ];

  if (isLoading) {
    return (
      <div className="theme-app-bg min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="app-page-shell animate-fade-in">
      <SuccessToast
        isOpen={toast.isOpen && toast.type === "success"}
        message={toast.message}
        subMessage={toast.subMessage}
      />
      <AppModal
        isOpen={isClearDataModalOpen}
        tone="danger"
        eyebrow="Clear local data"
        title="Remove local preferences and alerts?"
        message="This will clear local price alerts and saved preferences from this browser. This action cannot be undone."
        confirmLabel="Clear local data"
        cancelLabel="Cancel"
        showCancel
        onCancel={() => setIsClearDataModalOpen(false)}
        onConfirm={confirmClearAllData}
      />
      {toast.isOpen && toast.type === "error" && (
        <div className="fixed top-6 right-6 z-50 animate-slide-in-right">
          <div className="theme-surface rounded-r-xl border-l-4 border-rose-500 p-4 min-w-[300px] flex items-start gap-4">
            <div className="bg-rose-500/10 rounded-full p-2">
              <svg className="w-6 h-6 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h4 className="theme-text-primary font-semibold text-lg">{toast.message}</h4>
              {toast.subMessage && <p className="theme-text-secondary text-sm mt-1">{toast.subMessage}</p>}
            </div>
          </div>
        </div>
      )}
      <div className="max-w-5xl mx-auto">
        <div className="dashboard-page-hero mb-10">
          <div className="dashboard-page-eyebrow mb-4">{t("settings")}</div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-2">{t("settings")}</h1>
          <p className="text-sm text-slate-300 max-w-2xl">{t("settings_page.subtitle")}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar Tabs */}
          <div className="lg:col-span-1 space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl transition-all duration-300 ${
                  activeTab === tab.id 
                    ? 'settings-tab-button active border' 
                    : 'settings-tab-button'
                }`}
              >
                {tab.icon}
                <span className="font-semibold">{tab.label}</span>
                {activeTab === tab.id && <ChevronRight size={16} className="ml-auto" />}
              </button>
            ))}
            
            <div className="theme-divider pt-4 mt-4 border-t">
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-rose-400 hover:bg-rose-500/10 transition-all duration-300"
                >
                  <LogOut size={20} />
                  <span className="font-semibold">{t("logout")}</span>
                </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            <div className="dashboard-page-panel min-h-[500px]">
              
              {/* Profile Tab */}
              {activeTab === "profile" && (
                <div className="space-y-8 animate-slide-up">
                  <div className="flex items-center gap-6 pb-8 border-b border-slate-800/50">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 p-1">
                      <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden border-4 border-slate-900">
                        {userInfo.avatar_url ? (
                            <img src={userInfo.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <User size={40} className="text-slate-500" />
                        )}
                      </div>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-1">{userInfo.username || "Guest User"}</h2>
                      <p className="text-slate-400">{userInfo.email}</p>
                      <span className="badge badge-info mt-2">Personal Account</span>
                    </div>
                  </div>

                  <div className="grid gap-6">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Shield size={18} className="text-emerald-400" />
                      {t("acc_info")}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-800/50">
                        <p className="text-xs text-slate-500 uppercase font-bold mb-1">Username</p>
                        <p className="text-white">{userInfo.username || "Not set"}</p>
                      </div>
                      <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-800/50">
                        <p className="text-xs text-slate-500 uppercase font-bold mb-1">Email Address</p>
                        <p className="text-white">{userInfo.email}</p>
                      </div>
                    </div>
                    
                    <div className="p-6 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex items-start gap-4">
                        <Clock className="text-blue-400 mt-1" size={20} />
                        <div>
                            <p className="font-semibold text-white">Member since 2026</p>
                            <p className="text-sm text-slate-400">You joined AutoValueLK on March 27, 2026. Keep track of your car price history here.</p>
                        </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === "notifications" && (
                <div className="space-y-8 animate-slide-up">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">{t("notification_preferences")}</h2>
                    <p className="text-slate-400">Choose how you want to be notified about market changes.</p>
                  </div>

                  <div className="space-y-4">
                    {[
                      { key: 'priceAlerts', label: 'Price Alerts', desc: 'Get notified when tracked vehicle prices change' },
                      { key: 'marketUpdates', label: 'Market Updates', desc: 'Receive weekly market trend reports' },
                      { key: 'loanRates', label: 'Loan Rate Changes', desc: 'Alerts when bank loan rates are updated' },
                      { key: 'systemUpdates', label: 'System Updates', desc: 'Notifications about new features and improvements' },
                    ].map((item) => (
                      <div
                        key={item.key}
                        className="flex items-center justify-between p-5 rounded-2xl bg-slate-800/20 hover:bg-slate-800/40 border border-slate-700/30 transition-all duration-300"
                      >
                        <div>
                          <p className="text-white font-semibold mb-1">{item.label}</p>
                          <p className="text-sm text-slate-400 max-w-xs">{item.desc}</p>
                        </div>
                        <button
                          onClick={() => togglePref(item.key)}
                          className={`relative w-14 h-8 rounded-full transition-all duration-500 ${prefs[item.key] ? 'bg-blue-600' : 'bg-slate-700'}`}
                        >
                          <span
                            className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white shadow-lg transition-transform duration-300 ${prefs[item.key] ? 'translate-x-6' : 'translate-x-0'}`}
                          ></span>
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="pt-6 border-t border-slate-800/50 flex items-center gap-4">
                    <button 
                      onClick={handleSavePrefs}
                      className="btn-primary flex items-center gap-2 px-8"
                    >
                      <Save size={18} />
                      {t("save_prefs")}
                    </button>
                    {saved && (
                      <span className="flex items-center gap-2 text-emerald-400 animate-fade-in">
                        <CheckCircle size={18} />
                        Preferences saved!
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Price Alerts Tab */}
              {activeTab === "alerts" && (
                <div className="space-y-8 animate-slide-up">
                  <div className="flex justify-between items-end">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-2">{t("manage_alerts")}</h2>
                        <p className="text-slate-400">Track and manage your saved price alerts.</p>
                    </div>
                    {alerts.length > 0 && (
                        <span className="badge badge-warning">{alerts.length} Active Alerts</span>
                    )}
                  </div>

                  {alerts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-slate-800/10 rounded-3xl border border-dashed border-slate-700">
                      <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center text-slate-500">
                        <Zap size={30} />
                      </div>
                      <p className="text-slate-400">{t("no_alerts")}</p>
                      <button onClick={() => navigate('/price-check')} className="text-blue-400 hover:underline text-sm font-semibold">Start tracking now</button>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {alerts.map((alert, idx) => (
                        <div 
                          key={alert.predictionKey || idx}
                          className="flex items-center justify-between p-5 rounded-2xl bg-[#1e293b]/40 border border-slate-700/50 hover:border-blue-500/30 transition-all duration-300"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                                <Zap size={22} />
                            </div>
                            <div>
                              <p className="text-white font-bold">{alert.vehicle.brand} {alert.vehicle.model}</p>
                              <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                                <span>Target: LKR {alert.price.toLocaleString()}</span>
                                <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                                <span>{new Date(alert.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                          <button 
                            onClick={() => deleteAlert(alert.predictionKey, idx)}
                            className="p-3 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Security Tab */}
              {activeTab === "security" && (
                <div className="space-y-8 animate-slide-up">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">{t("settings_page.security.title")}</h2>
                    <p className="text-slate-400">{t("settings_page.security.subtitle")}</p>
                  </div>

                  <div className="p-6 rounded-2xl bg-slate-800/20 border border-slate-700/30">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                        <Shield size={22} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-1">{t("settings_page.security.change_title")}</h3>
                        <p className="text-sm text-slate-400">{t("settings_page.security.change_hint")}</p>
                      </div>
                    </div>

                    <form onSubmit={handlePasswordUpdate} className="mt-8 space-y-5">
                      <div className="space-y-2">
                        <label className="label">{t("settings_page.security.current_password")}</label>
                        <div className="relative group">
                          <input
                            type={showPassword ? "text" : "password"}
                            value={passwordForm.currentPassword}
                            onChange={(e) => handlePasswordFieldChange("currentPassword", e.target.value)}
                            placeholder={t("settings_page.security.current_placeholder")}
                            className="input pl-12 pr-12"
                            autoComplete="current-password"
                            required
                          />
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors">
                            <Lock size={18} />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <label className="label">{t("settings_page.security.new_password")}</label>
                          <div className="relative group">
                            <input
                              type={showPassword ? "text" : "password"}
                              value={passwordForm.newPassword}
                              onChange={(e) => handlePasswordFieldChange("newPassword", e.target.value)}
                              placeholder={t("settings_page.security.new_placeholder")}
                              className="input pl-12 pr-12"
                              autoComplete="new-password"
                              required
                            />
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors">
                              <Shield size={18} />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="label">{t("settings_page.security.confirm_password")}</label>
                          <div className="relative group">
                            <input
                              type={showPassword ? "text" : "password"}
                              value={passwordForm.confirmPassword}
                              onChange={(e) => handlePasswordFieldChange("confirmPassword", e.target.value)}
                              placeholder={t("settings_page.security.confirm_placeholder")}
                              className="input pl-12 pr-12"
                              autoComplete="new-password"
                              required
                            />
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors">
                              <CheckCircle size={18} />
                            </div>
                            <button
                              type="button"
                              onClick={() => setShowPassword((prev) => !prev)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                              aria-label={showPassword ? t("settings_page.security.hide_passwords") : t("settings_page.security.show_passwords")}
                            >
                              {showPassword ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                </svg>
                              ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                        <p className="text-sm text-blue-200">{t("settings_page.security.password_rule")}</p>
                      </div>

                      <div className="pt-4 border-t border-slate-800/50">
                        <button
                          type="submit"
                          disabled={isUpdatingPassword}
                          className="btn-primary flex items-center gap-2 px-8 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                          {isUpdatingPassword ? (
                            <>
                              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              {t("settings_page.security.updating")}
                            </>
                          ) : (
                            <>
                              <Save size={18} />
                              {t("settings_page.security.update_button")}
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* General Settings Tab */}
              {activeTab === "general" && (
                <div className="space-y-8 animate-slide-up">
                  <div>
                    <h2 className="theme-text-primary text-2xl font-bold mb-2">{t("language_preferences")}</h2>
                    <p className="theme-text-secondary">Configure your interface language and preferences.</p>
                  </div>

                  <div className="space-y-6">
                    {/* Language Selector */}
                    <div className="theme-surface-soft rounded-2xl p-6">
                        <label className="theme-text-primary font-semibold mb-4 block flex items-center gap-2">
                             <Globe size={18} className="text-blue-400" />
                             Select Application Language
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {[
                                { id: 'en', label: 'English', code: 'EN' },
                                { id: 'si', label: 'සිංහල', code: 'සිං' },
                                { id: 'ta', label: 'தமிழ்', code: 'த' }
                            ].map((lang) => (
                                <button
                                    key={lang.id}
                                    onClick={() => i18n.changeLanguage(lang.id)}
                                    className={`p-4 rounded-xl border font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
                                        i18n.resolvedLanguage === lang.id 
                                            ? 'btn-primary' 
                                            : 'theme-pill theme-text-secondary hover:border-slate-400'
                                    }`}
                                >
                                    <span className="text-xs opacity-50">{lang.code}</span>
                                    {lang.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Appearance */}
                    <div className="theme-surface-soft rounded-2xl p-6">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="theme-text-primary font-semibold mb-1 flex items-center gap-2">
                                    <Moon size={18} className="text-amber-400" />
                                    {t("appearance")}
                                </p>
                                <p className="theme-text-secondary text-sm">
                                  {isLightTheme
                                    ? "Light mode uses a bright white surface with softer slate text."
                                    : "Dark mode keeps the current AutoValueLK midnight palette."}
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`text-sm font-semibold ${isLightTheme ? "theme-text-secondary" : "text-blue-400"}`}>
                                {isLightTheme ? "Light" : "Dark"}
                              </span>
                              <button
                                type="button"
                                onClick={handleThemeToggle}
                                className={`relative h-8 w-16 rounded-full transition-all duration-300 ${
                                  isLightTheme ? "bg-amber-400/80" : "bg-slate-700"
                                }`}
                                aria-label={`Switch to ${isLightTheme ? "dark" : "light"} mode`}
                                aria-pressed={isLightTheme}
                              >
                                <span
                                  className={`absolute top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-md transition-transform duration-300 ${
                                    isLightTheme ? "translate-x-9" : "translate-x-1"
                                  }`}
                                >
                                  {isLightTheme ? (
                                    <svg className="h-3.5 w-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M10 2.5a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0V3.25A.75.75 0 0110 2.5zm0 10.25a2.75 2.75 0 100-5.5 2.75 2.75 0 000 5.5zm6.75-3.5a.75.75 0 010 1.5h-1.5a.75.75 0 010-1.5h1.5zM5.25 10a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h1.5a.75.75 0 01.75.75zm8.864-4.614a.75.75 0 011.06 1.06l-1.06 1.061a.75.75 0 01-1.06-1.06l1.06-1.061zm-8.228 8.228a.75.75 0 011.06 1.06l-1.06 1.061a.75.75 0 01-1.06-1.06l1.06-1.061zm9.289 1.061a.75.75 0 01-1.06 1.06l-1.061-1.06a.75.75 0 011.06-1.061l1.061 1.06zm-8.228-8.228a.75.75 0 01-1.06 1.06L4.826 6.447a.75.75 0 011.06-1.06l1.061 1.06zM10 15.25a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0V16a.75.75 0 01.75-.75z" />
                                    </svg>
                                  ) : (
                                    <Moon className="h-3.5 w-3.5 text-slate-700" />
                                  )}
                                </span>
                              </button>
                            </div>
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="theme-divider pt-8 border-t">
                        <h3 className="text-rose-500 font-bold mb-4 flex items-center gap-2 uppercase tracking-wider text-sm">
                            <Trash2 size={16} />
                            {t("danger_zone")}
                        </h3>
                        <div className="space-y-4 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-6">
                            <p className="theme-text-secondary text-sm">Once you clear your local data, there is no going back. This includes preferences and alerts.</p>
                            <button 
                                onClick={clearAllData}
                                className="btn-danger"
                            >
                                {t("clear_data")}
                            </button>
                        </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
