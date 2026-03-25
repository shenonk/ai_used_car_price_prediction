import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"

function Settings() {
    const { t } = useTranslation();
    const PREFS_KEY = 'carpriceai_notification_prefs';

    const defaultPrefs = {
        priceAlerts: true,
        marketUpdates: true,
        loanRates: true,
        systemUpdates: false,
    };

    const [prefs, setPrefs] = useState(defaultPrefs);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        const stored = JSON.parse(localStorage.getItem(PREFS_KEY) || 'null');
        if (stored) setPrefs(stored);
    }, []);

    const togglePref = (key) => {
        setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
        setSaved(false);
    };

    const handleSave = () => {
        localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    const settingsItems = [
        { key: 'priceAlerts', label: 'Price Alerts', desc: 'Get notified when tracked vehicle prices change' },
        { key: 'marketUpdates', label: 'Market Updates', desc: 'Receive weekly market trend reports' },
        { key: 'loanRates', label: 'Loan Rate Changes', desc: 'Alerts when bank loan rates are updated' },
        { key: 'systemUpdates', label: 'System Updates', desc: 'Notifications about new features and improvements' },
    ];

    return (
        <div className="min-h-screen bg-[#0f172a] p-8">

            {/* Header */}
            <div className="mb-8 animate-fade-in">
                <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                    <span className="icon-box icon-box-blue">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </span>
                    Settings
                </h1>
                <p className="text-slate-400">
                    Manage your notification preferences and account settings
                </p>
            </div>

            {/* Notification Preferences */}
            <div className="max-w-2xl">
                <div className="card p-6 animate-fade-in animate-delay-100">
                    <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        {t("notification_preferences")}
                    </h2>

                    <div className="space-y-4">
                        {settingsItems.map((item) => (
                            <div
                                key={item.key}
                                className="flex items-center justify-between p-4 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 transition-all duration-300"
                            >
                                <div>
                                    <p className="text-white font-medium">{item.label}</p>
                                    <p className="text-sm text-slate-400">{item.desc}</p>
                                </div>
                                <button
                                    onClick={() => togglePref(item.key)}
                                    className={`relative w-12 h-7 rounded-full transition-colors duration-300 ${prefs[item.key] ? 'bg-blue-500' : 'bg-slate-600'}`}
                                >
                                    <span
                                        className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform duration-300 ${prefs[item.key] ? 'translate-x-5' : 'translate-x-0'}`}
                                    ></span>
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 flex items-center gap-4">
                        <button onClick={handleSave} className="btn-primary flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Save Preferences
                        </button>
                        {saved && (
                            <span className="text-emerald-400 text-sm flex items-center gap-1 animate-fade-in">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Preferences saved!
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Help Center */}
            <div className="max-w-2xl mt-8">
                <div className="card p-6 animate-fade-in animate-delay-200">
                    <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                        <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {t("help_center")}
                    </h2>
                    <p className="text-slate-400 text-sm">Need assistance? Contact our support team or browse the documentation.</p>
                    <button className="mt-4 btn-secondary text-sm">Contact Support</button>
                </div>
            </div>

        </div>
    )
}

export default Settings
