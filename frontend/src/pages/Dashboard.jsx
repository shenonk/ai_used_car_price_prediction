import { useNavigate } from "react-router-dom"

function Dashboard() {
  const navigate = useNavigate()

  const stats = [
    {
      label: "Total Predictions",
      value: "1,245",
      change: "+12% this week",
      changeType: "positive",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      iconBg: "icon-box-blue"
    },
    {
      label: "Average Car Price",
      value: "LKR 5.2M",
      change: "Market stable",
      changeType: "neutral",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      iconBg: "icon-box-emerald"
    },
    {
      label: "Loan Calculations",
      value: "856",
      change: "+5% today",
      changeType: "positive",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      iconBg: "icon-box-amber"
    }
  ];

  const marketUpdates = [
    { icon: <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>, text: "Vehicle prices in Colombo increased by 5% this month", tag: "trending" },
    { icon: <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>, text: "Hybrid vehicles demand rising rapidly", tag: "hot" },
    { icon: <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>, text: "Bank loan interest reduced by 0.5%", tag: "finance" },
    { icon: <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>, text: "Toyota & Suzuki dominate resale market", tag: "insight" }
  ];

  const activities = [
    { icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 17h8M8 17v-4m8 4v-4m-8 0h8m-8 0l-2-4h12l-2 4M6 13l-2-4h16l-2 4" /></svg>, text: "New prediction generated — Toyota Aqua 2018", time: "2 min ago" },
    { icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>, text: "User downloaded price report", time: "15 min ago" },
    { icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>, text: "Loan calculation completed", time: "1 hour ago" },
    { icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, text: "System accuracy updated to 87%", time: "3 hours ago" }
  ];

  return (
    <div className="min-h-screen bg-[#0f172a] p-8">
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold text-white mb-2">Welcome to <span className="gradient-text">AutoValueLK</span></h1>
        <p className="text-slate-400">AI-Powered Vehicle Price Prediction for Sri Lanka</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
            <div className="flex items-start justify-between mb-4">
              <div className={`icon-box ${stat.iconBg}`}>{stat.icon}</div>
              <span className={`text-sm font-medium ${stat.changeType === 'positive' ? 'text-emerald-400' : stat.changeType === 'negative' ? 'text-rose-400' : 'text-blue-400'}`}>{stat.change}</span>
            </div>
            <p className="text-sm text-slate-400 mb-1">{stat.label}</p>
            <h2 className="text-3xl font-bold text-white">{stat.value}</h2>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6 animate-fade-in animate-delay-300">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
              Market Updates
            </h2>
            <span className="badge badge-info">Live</span>
          </div>
          <div className="space-y-4">
            {marketUpdates.map((update, index) => (
              <div key={index} className="flex items-start gap-4 p-3 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 transition-all duration-300 group cursor-pointer">
                <span className="mt-0.5 group-hover:scale-110 transition-transform duration-300">{update.icon}</span>
                <div className="flex-1"><p className="text-slate-300 text-sm">{update.text}</p></div>
                <span className={`badge ${update.tag === 'trending' ? 'badge-success' : update.tag === 'hot' ? 'badge-warning' : 'badge-info'}`}>{update.tag}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6 animate-fade-in animate-delay-400">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              Recent Activity
            </h2>
            <button onClick={() => navigate('/analytics')} className="text-sm text-blue-400 hover:text-blue-300 transition-colors">View All →</button>
          </div>
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <div key={index} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-800/30 transition-all duration-300 group">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 group-hover:scale-110 transition-transform duration-300">{activity.icon}</div>
                <div className="flex-1">
                  <p className="text-slate-300 text-sm">{activity.text}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-500/20 animate-fade-in animate-delay-500">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">Ready to predict your car's value?</h3>
            <p className="text-slate-400 text-sm">Get accurate market price predictions powered by AI</p>
          </div>
          <button onClick={() => navigate('/price-check')} className="btn-gradient whitespace-nowrap flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            Start Price Check
          </button>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
