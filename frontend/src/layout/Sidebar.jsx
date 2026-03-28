import { Link } from "react-router-dom"
import logo from "../../assets/logo/autovaluelk-logo.png"
import { useTranslation } from "react-i18next"
import { HelpCircle } from "lucide-react"

const Sidebar = () => {
  const { t, i18n } = useTranslation();
  return (
    <div className="w-64 h-screen bg-[#020617] border-r border-gray-800 text-gray-300 fixed flex flex-col justify-between">
      {/* Top */}
      <div>
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <img src={logo} alt="AutoValueLK" className="h-8 object-contain" />
            <div>
              <h1 className="text-xl font-semibold text-white">
                AutoValueLK
              </h1>
              <p className="text-xs text-gray-500">Sri Lankan Market</p>
            </div>
          </div>
        </div>

        <nav className="flex flex-col p-4 gap-2 text-sm">
          <Link to="/" className="p-3 rounded-lg hover:bg-gray-800">{t("dashboard")}</Link>
          <Link to="/price" className="p-3 rounded-lg hover:bg-gray-800">{t("price_check")}</Link>
          <Link to="/results" className="p-3 rounded-lg hover:bg-gray-800">{t("results")}</Link>
          <Link to="/financing" className="p-3 rounded-lg hover:bg-gray-800">{t("financing")}</Link>
          <Link to="/analytics" className="p-3 rounded-lg hover:bg-gray-800">{t("analytics")}</Link>
          <Link to="/notifications" className="p-3 rounded-lg hover:bg-gray-800">{t("notifications")}</Link>
          <Link to="/help" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800">
            <HelpCircle size={18} />
            {t("help_center")}
          </Link>
        </nav>
      </div>


      {/* Bottom login */}
      <div className="p-4 border-t border-gray-800 flex flex-col gap-3">
        {/* Language Switcher */}
        <div className="flex items-center justify-center gap-2 bg-gray-900 p-1.5 rounded-xl border border-gray-800">
          <button 
            onClick={() => i18n.changeLanguage('en')} 
            className={`text-xs px-2 py-1.5 rounded transition-all font-bold ${i18n.resolvedLanguage === 'en' ? 'bg-clip-text text-transparent bg-gradient-to-r from-[#06b6d4] to-[#3b82f6]' : 'text-gray-400 hover:text-white'}`}
          >
            EN
          </button>
          <span className="text-gray-700 text-xs">|</span>
          <button 
            onClick={() => i18n.changeLanguage('si')} 
            className={`text-xs px-2 py-1.5 rounded transition-all font-bold ${i18n.resolvedLanguage === 'si' ? 'bg-clip-text text-transparent bg-gradient-to-r from-[#06b6d4] to-[#3b82f6]' : 'text-gray-400 hover:text-white'}`}
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
          >
            සිං
          </button>
          <span className="text-gray-700 text-xs">|</span>
          <button 
            onClick={() => i18n.changeLanguage('ta')} 
            className={`text-xs px-2 py-1.5 rounded transition-all font-bold ${i18n.resolvedLanguage === 'ta' ? 'bg-clip-text text-transparent bg-gradient-to-r from-[#06b6d4] to-[#3b82f6]' : 'text-gray-400 hover:text-white'}`}
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
          >
            தமிழ்
          </button>
        </div>
        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg">
          {t("logout")}
        </button>
      </div>

    </div>
  )
}

export default Sidebar
