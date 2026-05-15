import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  Bell,
  BellRing,
  Check,
  DollarSign,
  Inbox,
  MessageSquare,
  Settings,
  ShieldAlert,
  Sparkles,
} from "lucide-react"
import { getCurrentUser } from "../utils/auth"
import { supabase } from "../utils/supabaseClient"
import {
  inferNotificationType,
  loadReadNotificationIds,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../utils/notifications"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"

function Notifications() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notificationUser, setNotificationUser] = useState(null)

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      setError(null)
      const user = await getCurrentUser()
      setNotificationUser(user)
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData?.session?.access_token
      const res = await fetch(`${API_BASE_URL}/api/notifications`, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      })
      if (!res.ok) throw new Error(t("notifications_page.errors.fetch_failed"))
      const data = await res.json()
      
      const readIds = loadReadNotificationIds(user)
      const formattedNotifs = (data.notifications || []).map(n => ({
        id: n.id,
        type: inferNotificationType(n.title),
        icon: getIconForType(n.title),
        title: n.title,
        message: n.message,
        time: new Date(n.created_at).toLocaleDateString(),
        unread: !readIds.includes(n.id)
      }))

      setNotifications(formattedNotifs)
    } catch (err) {
      setError(t("notifications_page.errors.load_failed"))
    } finally {
      setLoading(false)
    }
  }

  const getIconForType = (title) => {
    const t = title.toLowerCase();
    if (t.includes('alert')) {
      return <DollarSign className="h-[15px] w-[15px]" />
    } else if (t.includes('rate') || t.includes('new')) {
      return <Sparkles className="h-[15px] w-[15px]" />
    }
    return <MessageSquare className="h-[15px] w-[15px]" />
  }

  const unreadCount = notifications.filter(n => n.unread).length;
  const alertCount = notifications.filter(n => n.type === 'info').length;

  const markAllRead = () => {
    markAllNotificationsAsRead(notificationUser, notifications.map((n) => n.id))
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const markAsRead = (id) => {
    markNotificationAsRead(notificationUser, id)
    setNotifications(prev => prev.map((n) => n.id === id ? { ...n, unread: false } : n));
  };

  const handleEnableAll = () => {
    setNotificationsEnabled(true);
    const prefs = { priceAlerts: true, marketUpdates: true, loanRates: true, systemUpdates: true };
    localStorage.setItem('carpriceai_notification_prefs', JSON.stringify(prefs));
    setTimeout(() => setNotificationsEnabled(false), 3000);
  };

  return (
    <div className="notifications-page">

      {/* Page Header */}
      <header className="notifications-hero animate-fade-in">
        <div>
          <div className="notifications-eyebrow">{t("notifications")}</div>
          <h1>{t("notifications_page.title")}</h1>
          <p>{t("notifications_page.subtitle")}</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/settings')}
          className="notifications-ghost-button"
        >
            <Settings className="h-[13px] w-[13px]" />
            {t("notifications_page.settings")}
        </button>
      </header>

      {/* Notification Stats */}
      <section className="notifications-summary-grid animate-fade-in animate-delay-100">
        <article className="notifications-summary-card">
          <Inbox className="notifications-summary-icon notifications-summary-icon--blue" />
          <span>{t("notifications_page.total")}</span>
          <strong>{notifications.length}</strong>
          <p>{t("notifications_page.all_messages", { defaultValue: "All system messages" })}</p>
        </article>
        <article className="notifications-summary-card notifications-summary-card--blue">
          <BellRing className="notifications-summary-icon notifications-summary-icon--green" />
          <span>{t("notifications_page.unread")}</span>
          <strong>{unreadCount}</strong>
          <p>{t("notifications_page.needs_attention", { defaultValue: "Needs your attention" })}</p>
        </article>
        <article className="notifications-summary-card">
          <ShieldAlert className="notifications-summary-icon notifications-summary-icon--amber" />
          <span>{t("notifications_page.price_alerts")}</span>
          <strong>{alertCount}</strong>
          <p>{t("notifications_page.pricing_alerts_subtitle", { defaultValue: "Pricing and market alerts" })}</p>
        </article>
      </section>

      {/* Notifications List */}
      <section className="notifications-panel animate-fade-in animate-delay-200">
        <div className="notifications-panel-header">
          <div>
            <div className="notifications-panel-title">
              <ClockIcon />
              <h2>{t("notifications_page.recent")}</h2>
            </div>
            <p>{t("notifications_page.recent_subtitle", { defaultValue: "Latest updates, price alerts, and system messages" })}</p>
          </div>
          {notifications.some(n => n.unread) && (
            <button type="button" onClick={markAllRead} className="notifications-ghost-button">
              <Check className="h-[13px] w-[13px]" />
              {t("notifications_page.mark_all_read")}
            </button>
          )}
        </div>
        
        {loading ? (
            <div className="notifications-empty">{t("notifications_page.loading")}</div>
        ) : error ? (
            <div className="notifications-empty notifications-empty--error">{error}</div>
        ) : notifications.length === 0 ? (
            <div className="notifications-empty">
              <Bell className="h-8 w-8" />
              <p>{t("notifications_page.empty")}</p>
              <span>{t("notifications_page.caught_up", { defaultValue: "You are all caught up." })}</span>
            </div>
        ) : (
            <div className="notifications-list">
            {notifications.map((notification, index) => (
                <div
                key={notification.id}
                onClick={() => markAsRead(notification.id)}
                className={`notifications-item notifications-item--${notification.type} ${notification.unread ? "is-unread" : ""}`}
                >
                <div className="notifications-item-icon">{notification.icon}</div>
                <div className="notifications-item-main">
                    <div className="notifications-item-title-row">
                    <p>{notification.title}</p>
                    {notification.unread && <span />}
                    </div>
                    <p>{notification.message}</p>
                </div>
                <span className="notifications-item-time">{notification.time}</span>
                </div>
            ))}
            </div>
        )}
      </section>

      {/* Bottom Banner */}
      <section className="notifications-enable-panel animate-fade-in animate-delay-300">
          <div className="notifications-enable-copy">
            <span><Bell className="h-5 w-5" /></span>
            <div>
              <h2>{t("notifications_page.banner_title")}</h2>
              <p>{t("notifications_page.banner_subtitle")}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleEnableAll}
            className={notificationsEnabled ? "notifications-success-button" : "notifications-primary-button"}
          >
            {notificationsEnabled && <Check className="h-[13px] w-[13px]" />}
            {notificationsEnabled ? t("notifications_page.enabled") : t("notifications_page.enable_all")}
          </button>
      </section>
    </div>
  )
}

function ClockIcon() {
  return (
    <svg className="h-[14px] w-[14px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8v4l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

export default Notifications
