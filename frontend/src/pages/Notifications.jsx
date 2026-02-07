function Notifications() {
  const notifications = [
    {
      type: "info",
      icon: "💰",
      title: "Price Alert: Toyota Aqua",
      message: "The average price for Toyota Aqua 2020 has increased by 5%.",
      time: "2 hours ago",
      unread: true
    },
    {
      type: "success",
      icon: "🏦",
      title: "New Loan Rates Available",
      message: "Bank of Ceylon offering special loan rates at 7.5%.",
      time: "5 hours ago",
      unread: true
    },
    {
      type: "default",
      icon: "📈",
      title: "Market Update",
      message: "SUV demand increased by 15% in Colombo region.",
      time: "1 day ago",
      unread: false
    },
    {
      type: "default",
      icon: "✅",
      title: "Prediction Completed",
      message: "Your prediction for Honda Vezel 2019 is ready.",
      time: "2 days ago",
      unread: false
    },
    {
      type: "default",
      icon: "⚙️",
      title: "System Update",
      message: "Enhanced analytics and comparison tools added.",
      time: "3 days ago",
      unread: false
    }
  ];

  return (
    <div className="min-h-screen bg-[#0f172a] p-8">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <span className="icon-box icon-box-rose">🔔</span>
            Notifications
          </h1>
          <p className="text-slate-400">
            Stay updated with market trends and price alerts
          </p>
        </div>

        <button className="btn-secondary flex items-center gap-2">
          <span>⚙️</span> Settings
        </button>
      </div>

      {/* Notification Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 animate-fade-in animate-delay-100">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="icon-box icon-box-blue">📬</div>
            <div>
              <p className="text-2xl font-bold text-white">5</p>
              <p className="text-sm text-slate-400">Total</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="icon-box icon-box-emerald">🔵</div>
            <div>
              <p className="text-2xl font-bold text-white">2</p>
              <p className="text-sm text-slate-400">Unread</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="icon-box icon-box-amber">💰</div>
            <div>
              <p className="text-2xl font-bold text-white">1</p>
              <p className="text-sm text-slate-400">Price Alerts</p>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="card p-6 mb-8 animate-fade-in animate-delay-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Recent Notifications</h2>
          <button className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
            Mark all as read
          </button>
        </div>

        <div className="space-y-3">
          {notifications.map((notification, index) => (
            <div
              key={index}
              className={`notification-item ${notification.type} flex items-start gap-4 cursor-pointer`}
            >
              <div className="text-2xl">{notification.icon}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-white">{notification.title}</p>
                  {notification.unread && (
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  )}
                </div>
                <p className="text-sm text-slate-400">{notification.message}</p>
              </div>
              <span className="text-xs text-slate-500 whitespace-nowrap">{notification.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Banner */}
      <div className="relative overflow-hidden rounded-2xl p-8 animate-fade-in animate-delay-300" style={{
        background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)'
      }}>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-1/2 w-32 h-32 bg-white/10 rounded-full translate-y-1/2"></div>

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="text-4xl">🔔</div>
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Stay Updated</h2>
              <p className="text-white/80 text-sm max-w-md">
                Enable notifications to receive real-time updates on market trends, price changes, and loan offers.
              </p>
            </div>
          </div>

          <button className="bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold hover:bg-white/90 transition-all duration-300 shadow-lg whitespace-nowrap">
            Enable All Notifications
          </button>
        </div>
      </div>

    </div>
  )
}

export default Notifications
