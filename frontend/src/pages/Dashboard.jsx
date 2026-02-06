function Dashboard() {
  const stats = [
    {
      label: "Total Predictions",
      value: "1,245",
      change: "+12% this week",
      changeType: "positive",
      icon: "🎯",
      iconBg: "icon-box-blue"
    },
    {
      label: "Average Car Price",
      value: "LKR 5.2M",
      change: "Market stable",
      changeType: "neutral",
      icon: "💰",
      iconBg: "icon-box-emerald"
    },
    {
      label: "Loan Calculations",
      value: "856",
      change: "+5% today",
      changeType: "positive",
      icon: "🏦",
      iconBg: "icon-box-amber"
    }
  ];

  const marketUpdates = [
    { icon: "📈", text: "Vehicle prices in Colombo increased by 5% this month", tag: "trending" },
    { icon: "⚡", text: "Hybrid vehicles demand rising rapidly", tag: "hot" },
    { icon: "💳", text: "Bank loan interest reduced by 0.5%", tag: "finance" },
    { icon: "🏆", text: "Toyota & Suzuki dominate resale market", tag: "insight" }
  ];

  const activities = [
    { icon: "🚗", text: "New prediction generated — Toyota Aqua 2018", time: "2 min ago" },
    { icon: "📄", text: "User downloaded price report", time: "15 min ago" },
    { icon: "💳", text: "Loan calculation completed", time: "1 hour ago" },
    { icon: "🎯", text: "System accuracy updated to 87%", time: "3 hours ago" }
  ];

  return (
    <div className="min-h-screen bg-[#0f172a] p-8">

      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold text-white mb-2">
          Welcome to <span className="gradient-text">CarPrice AI</span>
        </h1>
        <p className="text-slate-400">
          Sri Lankan market intelligence dashboard • Real-time analytics
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="stat-card animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`icon-box ${stat.iconBg}`}>
                {stat.icon}
              </div>
              <span className={`text-sm font-medium ${stat.changeType === 'positive' ? 'text-emerald-400' :
                  stat.changeType === 'negative' ? 'text-rose-400' : 'text-blue-400'
                }`}>
                {stat.change}
              </span>
            </div>
            <p className="text-sm text-slate-400 mb-1">{stat.label}</p>
            <h2 className="text-3xl font-bold text-white">{stat.value}</h2>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Market Updates */}
        <div className="card p-6 animate-fade-in animate-delay-300">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <span className="text-2xl">📰</span> Market Updates
            </h2>
            <span className="badge badge-info">Live</span>
          </div>

          <div className="space-y-4">
            {marketUpdates.map((update, index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-3 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 transition-all duration-300 group cursor-pointer"
              >
                <span className="text-xl group-hover:scale-110 transition-transform duration-300">
                  {update.icon}
                </span>
                <div className="flex-1">
                  <p className="text-slate-300 text-sm">{update.text}</p>
                </div>
                <span className={`badge ${update.tag === 'trending' ? 'badge-success' :
                    update.tag === 'hot' ? 'badge-warning' :
                      update.tag === 'finance' ? 'badge-info' : 'badge-info'
                  }`}>
                  {update.tag}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* System Activity */}
        <div className="card p-6 animate-fade-in animate-delay-400">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <span className="text-2xl">⚡</span> Recent Activity
            </h2>
            <button className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
              View All →
            </button>
          </div>

          <div className="space-y-4">
            {activities.map((activity, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-800/30 transition-all duration-300 group"
              >
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-lg group-hover:scale-110 transition-transform duration-300">
                  {activity.icon}
                </div>
                <div className="flex-1">
                  <p className="text-slate-300 text-sm">{activity.text}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Quick Actions */}
      <div className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-500/20 animate-fade-in animate-delay-500">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">Ready to predict your car's value?</h3>
            <p className="text-slate-400 text-sm">Get accurate market price predictions powered by AI</p>
          </div>
          <button className="btn-gradient whitespace-nowrap">
            🚗 Start Price Check
          </button>
        </div>
      </div>

    </div>
  )
}

export default Dashboard
