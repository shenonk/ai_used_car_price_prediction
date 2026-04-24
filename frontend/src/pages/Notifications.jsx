import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"

function Notifications() {
  const navigate = useNavigate()
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`${API_BASE_URL}/api/notifications`)
      if (!res.ok) throw new Error('Failed to fetch notifications')
      const data = await res.json()
      
      const readIds = JSON.parse(localStorage.getItem('carpriceai_read_notifications') || '[]')
      const formattedNotifs = (data.notifications || []).map(n => ({
        id: n.id,
        // we can guess icon/type based on some keywords or default it
        type: n.title.toLowerCase().includes('alert') ? 'info' : 
              n.title.toLowerCase().includes('rate') ? 'success' : 'default',
        icon: getIconForType(n.title),
        title: n.title,
        message: n.message,
        time: new Date(n.created_at).toLocaleDateString(),
        unread: !readIds.includes(n.id)
      }))

      setNotifications(formattedNotifs)
    } catch (err) {
      setError('Unable to load notifications at this time.')
    } finally {
      setLoading(false)
    }
  }

  const getIconForType = (title) => {
    const t = title.toLowerCase();
    if (t.includes('alert')) {
      return <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    } else if (t.includes('rate') || t.includes('new')) {
      return <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
    }
    return <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
  }

  const unreadCount = notifications.filter(n => n.unread).length;
  const alertCount = notifications.filter(n => n.type === 'info').length;

  const markAllRead = () => {
    const readIds = notifications.map(n => n.id)
    localStorage.setItem('carpriceai_read_notifications', JSON.stringify(readIds))
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const markAsRead = (id) => {
    const readIds = JSON.parse(localStorage.getItem('carpriceai_read_notifications') || '[]')
    if (!readIds.includes(id)) {
      readIds.push(id)
      localStorage.setItem('carpriceai_read_notifications', JSON.stringify(readIds))
    }
    setNotifications(prev => prev.map((n) => n.id === id ? { ...n, unread: false } : n));
  };

  const handleEnableAll = () => {
    setNotificationsEnabled(true);
    const prefs = { priceAlerts: true, marketUpdates: true, loanRates: true, systemUpdates: true };
    localStorage.setItem('carpriceai_notification_prefs', JSON.stringify(prefs));
    setTimeout(() => setNotificationsEnabled(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] p-8">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <span className="icon-box icon-box-rose">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </span>
            Notifications
          </h1>
          <p className="text-slate-400">Stay updated with market trends and price alerts</p>
        </div>
        <button onClick={() => navigate('/settings')} className="btn-secondary flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Settings
        </button>
      </div>

      {/* Notification Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 animate-fade-in animate-delay-100">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="icon-box icon-box-blue">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{notifications.length}</p>
              <p className="text-sm text-slate-400">Total</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="icon-box icon-box-emerald">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{unreadCount}</p>
              <p className="text-sm text-slate-400">Unread</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="icon-box icon-box-amber">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{alertCount}</p>
              <p className="text-sm text-slate-400">Price Alerts</p>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="card p-6 mb-8 animate-fade-in animate-delay-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Recent Notifications</h2>
          {notifications.some(n => n.unread) && (
            <button onClick={markAllRead} className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
              Mark all as read
            </button>
          )}
        </div>
        
        {loading ? (
            <div className="text-center py-8 text-slate-400">Loading notifications...</div>
        ) : error ? (
            <div className="text-center py-8 text-rose-400">{error}</div>
        ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-slate-400">You have no notifications.</div>
        ) : (
            <div className="space-y-3">
            {notifications.map((notification, index) => (
                <div
                key={notification.id}
                onClick={() => markAsRead(notification.id)}
                className={`notification-item ${notification.type} flex items-start gap-4 cursor-pointer`}
                >
                <div className="flex-shrink-0 mt-0.5">{notification.icon}</div>
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-white">{notification.title}</p>
                    {notification.unread && <span className="w-2 h-2 rounded-full bg-blue-500"></span>}
                    </div>
                    <p className="text-sm text-slate-400">{notification.message}</p>
                </div>
                <span className="text-xs text-slate-500 whitespace-nowrap">{notification.time}</span>
                </div>
            ))}
            </div>
        )}
      </div>

      {/* Bottom Banner */}
      <div className="relative overflow-hidden rounded-2xl p-8 animate-fade-in animate-delay-300" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)' }}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-1/2 w-32 h-32 bg-white/10 rounded-full translate-y-1/2"></div>
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <svg className="w-10 h-10 text-white flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Stay Updated</h2>
              <p className="text-white/80 text-sm max-w-md">Enable notifications to receive real-time updates on market trends, price changes, and loan offers.</p>
            </div>
          </div>
          <button
            onClick={handleEnableAll}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg whitespace-nowrap ${notificationsEnabled ? 'bg-emerald-500 text-white' : 'bg-white text-blue-600 hover:bg-white/90'}`}
          >
            {notificationsEnabled ? 'Notifications Enabled!' : 'Enable All Notifications'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Notifications
