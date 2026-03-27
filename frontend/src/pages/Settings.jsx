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
  Moon
} from "lucide-react";
import { getCurrentUser, logout } from "../utils/auth";
import { useNavigate } from "react-router-dom";

function Settings() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const PREFS_KEY = 'carpriceai_notification_prefs';
  const ALERTS_KEY = 'carpriceai_alerts';

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

  useEffect(() => {
    const initSettings = async () => {
      setIsLoading(true);
      // Fetch user info
      const user = await getCurrentUser();
      setUserInfo(user || { email: 'guest@example.com', username: 'Guest' });

      // Fetch prefs
      const storedPrefs = JSON.parse(localStorage.getItem(PREFS_KEY) || 'null');
      if (storedPrefs) setPrefs(storedPrefs);

      // Fetch alerts
      const storedAlerts = JSON.parse(localStorage.getItem(ALERTS_KEY) || '[]');
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
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const deleteAlert = (index) => {
    const newAlerts = alerts.filter((_, i) => i !== index);
    setAlerts(newAlerts);
    localStorage.setItem(ALERTS_KEY, JSON.stringify(newAlerts));
  };

  const clearAllData = () => {
    if (window.confirm("Are you sure you want to clear all local data? This includes your price alerts and preferences.")) {
      localStorage.removeItem(PREFS_KEY);
      localStorage.removeItem(ALERTS_KEY);
      setAlerts([]);
      setPrefs({
        priceAlerts: true,
        marketUpdates: true,
        loanRates: true,
        systemUpdates: false,
      });
      alert("Local data cleared successfully.");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const tabs = [
    { id: "profile", label: t("profile"), icon: <User size={20} /> },
    { id: "notifications", label: t("notification_preferences"), icon: <Bell size={20} /> },
    { id: "alerts", label: t("manage_alerts"), icon: <Zap size={20} /> },
    { id: "general", label: t("language_preferences"), icon: <Globe size={20} /> },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] p-4 md:p-8 animate-fade-in">
      <div className="max-w-5xl mx-auto">
        
        {/* Page Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-white mb-2">{t("settings")}</h1>
          <p className="text-slate-400">Manage your account, preferences, and data security.</p>
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
                    ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.1)]' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                {tab.icon}
                <span className="font-semibold">{tab.label}</span>
                {activeTab === tab.id && <ChevronRight size={16} className="ml-auto" />}
              </button>
            ))}
            
            <div className="pt-4 mt-4 border-t border-slate-800/50">
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
            <div className="card-glass p-8 min-h-[500px]">
              
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
                          key={idx}
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
                            onClick={() => deleteAlert(idx)}
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

              {/* General Settings Tab */}
              {activeTab === "general" && (
                <div className="space-y-8 animate-slide-up">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">{t("language_preferences")}</h2>
                    <p className="text-slate-400">Configure your interface language and preferences.</p>
                  </div>

                  <div className="space-y-6">
                    {/* Language Selector */}
                    <div className="p-6 rounded-2xl bg-slate-800/20 border border-slate-700/30">
                        <label className="text-white font-semibold mb-4 block flex items-center gap-2">
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
                                            ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20' 
                                            : 'bg-slate-800/40 text-slate-400 border-slate-700 hover:border-slate-600'
                                    }`}
                                >
                                    <span className="text-xs opacity-50">{lang.code}</span>
                                    {lang.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Appearance */}
                    <div className="p-6 rounded-2xl bg-slate-800/20 border border-slate-700/30">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white font-semibold mb-1 flex items-center gap-2">
                                    <Moon size={18} className="text-amber-400" />
                                    {t("appearance")}
                                </p>
                                <p className="text-sm text-slate-400">Application theme (Dark mode fixed for now)</p>
                            </div>
                            <span className="badge badge-info uppercase">Dark Only</span>
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="pt-8 border-t border-slate-800/50">
                        <h3 className="text-rose-500 font-bold mb-4 flex items-center gap-2 uppercase tracking-wider text-sm">
                            <Trash2 size={16} />
                            {t("danger_zone")}
                        </h3>
                        <div className="p-6 rounded-2xl bg-rose-500/5 border border-rose-500/20 space-y-4">
                            <p className="text-sm text-slate-400">Once you clear your local data, there is no going back. This includes preferences and alerts.</p>
                            <button 
                                onClick={clearAllData}
                                className="px-6 py-3 rounded-xl bg-transparent border border-rose-500/30 text-rose-400 hover:bg-rose-500 hover:text-white transition-all duration-300 font-semibold"
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
