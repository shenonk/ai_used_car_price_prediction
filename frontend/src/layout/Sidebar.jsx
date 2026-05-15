import { Link } from "react-router-dom"
import logo from "../../assets/logo/autovaluelk-logo.png"
import { useTranslation } from "react-i18next"
import { HelpCircle } from "lucide-react"

const Sidebar = () => {
  const { t, i18n } = useTranslation();
  return (
    <div className="w-64 h-screen bg-[#020617] border-r border-gray-800/50 text-gray-300 fixed flex flex-col justify-between">
      {/* Top */}
      <div>
        <div className="px-6 py-5 border-b border-gray-800/50">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/40">
              <img src={logo} alt="AutoValueLK" className="h-6 object-contain" />
            </div>
            <div>
              <h1 className="heading-display text-lg font-bold text-white tracking-tight">
                AutoValueLK
              </h1>
              <p className="text-[0.65rem] text-gray-500 uppercase tracking-[0.15em]">{t("app.sidebar_market")}</p>
            </div>
          </div>
        </div>

        <nav className="flex flex-col px-3 py-3 gap-1 text-[0.8125rem]">
          <Link to="/" className="p-2.5 px-4 rounded-xl hover:bg-gray-800/60 transition-colors duration-200">{t("dashboard")}</Link>
          <Link to="/price" className="p-2.5 px-4 rounded-xl hover:bg-gray-800/60 transition-colors duration-200">{t("price_check")}</Link>
          <Link to="/results" className="p-2.5 px-4 rounded-xl hover:bg-gray-800/60 transition-colors duration-200">{t("results")}</Link>
          <Link to="/financing" className="p-2.5 px-4 rounded-xl hover:bg-gray-800/60 transition-colors duration-200">{t("financing")}</Link>
          <Link to="/analytics" className="p-2.5 px-4 rounded-xl hover:bg-gray-800/60 transition-colors duration-200">{t("analytics")}</Link>
          <Link to="/notifications" className="p-2.5 px-4 rounded-xl hover:bg-gray-800/60 transition-colors duration-200">{t("notifications")}</Link>
          <Link to="/help" className="flex items-center gap-3 p-2.5 px-4 rounded-xl hover:bg-gray-800/60 transition-colors duration-200">
            <HelpCircle size={16} />
            {t("help_center")}
          </Link>
        </nav>
      </div>


      {/* Bottom login */}
      <div className="px-3 py-4 border-t border-gray-800/50 flex flex-col gap-3">
        {/* Language Switcher */}
        <div className="flex items-center justify-center gap-1.5 bg-gray-900/80 p-1 rounded-xl border border-gray-800/60">
          <button 
            onClick={() => i18n.changeLanguage('en')} 
            className={`text-xs px-3 py-1.5 rounded-lg transition-all duration-250 font-bold ${i18n.resolvedLanguage === 'en' ? 'bg-gradient-to-r from-[#06b6d4]/15 to-[#3b82f6]/15 bg-clip-text text-transparent bg-gradient-to-r from-[#06b6d4] to-[#3b82f6] border border-cyan-500/20' : 'text-gray-500 hover:text-gray-300'}`}
          >
            EN
          </button>
          <span className="text-gray-800 text-xs">·</span>
          <button 
            onClick={() => i18n.changeLanguage('si')} 
            className={`text-xs px-3 py-1.5 rounded-lg transition-all duration-250 font-bold ${i18n.resolvedLanguage === 'si' ? 'bg-gradient-to-r from-[#06b6d4]/15 to-[#3b82f6]/15 bg-clip-text text-transparent bg-gradient-to-r from-[#06b6d4] to-[#3b82f6] border border-cyan-500/20' : 'text-gray-500 hover:text-gray-300'}`}
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
          >
            සිං
          </button>
          <span className="text-gray-800 text-xs">·</span>
          <button 
            onClick={() => i18n.changeLanguage('ta')} 
            className={`text-xs px-3 py-1.5 rounded-lg transition-all duration-250 font-bold ${i18n.resolvedLanguage === 'ta' ? 'bg-gradient-to-r from-[#06b6d4]/15 to-[#3b82f6]/15 bg-clip-text text-transparent bg-gradient-to-r from-[#06b6d4] to-[#3b82f6] border border-cyan-500/20' : 'text-gray-500 hover:text-gray-300'}`}
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
          >
            தமிழ்
          </button>
        </div>
        <button className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-xl text-sm font-medium transition-colors duration-200">
          {t("logout")}
        </button>
      </div>

    </div>
  )
}

export default Sidebar
