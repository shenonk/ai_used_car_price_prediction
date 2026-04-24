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
      <div className="mb-10 animate-fade-in">
        <h1 className="heading-display text-4xl font-bold text-white mb-3">Welcome to <span className="gradient-text">AutoValueLK</span></h1>
        <p className="text-slate-400 text-base max-w-lg">AI-Powered Vehicle Price Prediction for Sri Lanka — real-time market intelligence at your fingertips.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card group animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
            <div className="flex items-start justify-between mb-5">
              <div className={`icon-box ${stat.iconBg}`}>{stat.icon}</div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${stat.changeType === 'positive' ? 'text-emerald-400 bg-emerald-400/10' : stat.changeType === 'negative' ? 'text-rose-400 bg-rose-400/10' : 'text-blue-400 bg-blue-400/10'}`}>{stat.change}</span>
            </div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-[0.08em] mb-1.5">{stat.label}</p>
            <h2 className="heading-display text-3xl font-bold text-white tracking-tight">{stat.value}</h2>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6 animate-fade-in animate-delay-300">
          <div className="flex items-center justify-between mb-6">
            <h2 className="heading-display text-lg font-bold text-white flex items-center gap-2.5">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
              Market Updates
            </h2>
            <span className="badge badge-info relative">
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
              Live
            </span>
          </div>
          <div className="space-y-3">
            {marketUpdates.map((update, index) => (
              <div key={index} className="flex items-start gap-4 p-3.5 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 border border-transparent hover:border-slate-700/50 transition-all duration-300 group cursor-pointer">
                <span className="mt-0.5 group-hover:scale-110 transition-transform duration-300">{update.icon}</span>
                <div className="flex-1"><p className="text-slate-300 text-sm leading-relaxed">{update.text}</p></div>
                <span className={`badge ${update.tag === 'trending' ? 'badge-success' : update.tag === 'hot' ? 'badge-warning' : 'badge-info'}`}>{update.tag}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6 animate-fade-in animate-delay-400">
          <div className="flex items-center justify-between mb-6">
            <h2 className="heading-display text-lg font-bold text-white flex items-center gap-2.5">
              <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              Recent Activity
            </h2>
            <button onClick={() => navigate('/analytics')} className="text-sm text-blue-400 hover:text-blue-300 transition-colors font-medium">View All →</button>
          </div>
          <div className="space-y-3">
            {activities.map((activity, index) => (
              <div key={index} className="flex items-center gap-4 p-3.5 rounded-xl hover:bg-slate-800/30 border border-transparent hover:border-slate-700/50 transition-all duration-300 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700/50 to-slate-800/80 flex items-center justify-center text-slate-400 group-hover:text-blue-400 group-hover:scale-105 transition-all duration-300 border border-slate-700/30">{activity.icon}</div>
                <div className="flex-1">
                  <p className="text-slate-300 text-sm">{activity.text}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="relative mt-10 p-8 rounded-2xl overflow-hidden animate-fade-in animate-delay-500" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(6,182,212,0.15) 50%, rgba(139,92,246,0.1) 100%)' }}>
        <div className="absolute inset-0 border border-blue-500/20 rounded-2xl"></div>
        <div className="absolute top-0 right-0 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="heading-display text-xl font-bold text-white mb-2">Ready to predict your car's value?</h3>
            <p className="text-slate-400 text-sm max-w-md">Get accurate market price predictions powered by our advanced AI model trained on real Sri Lankan vehicle data.</p>
          </div>
          <button onClick={() => navigate('/price-check')} className="btn-gradient whitespace-nowrap flex items-center gap-2 shadow-lg shadow-blue-500/20">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            Start Price Check
          </button>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
