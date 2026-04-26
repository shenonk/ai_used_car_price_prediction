import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  ArrowRight,
  BellRing,
  Bookmark,
  Calculator,
  CarFront,
  Clock3,
  Coins,
  Eye,
  LineChart,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react"
import { getCurrentUser } from "../utils/auth"
import { loadPredictionHistory } from "../utils/predictionHistory"
import { supabase } from "../utils/supabaseClient"
import { loadUserAlerts } from "../utils/userAlerts"

function formatCurrency(value) {
  return `LKR ${Math.round(Number(value || 0)).toLocaleString("en-LK")}`
}

function formatCompactCurrency(value) {
  const amount = Number(value || 0)
  if (amount >= 1_000_000) {
    return `LKR ${(amount / 1_000_000).toFixed(1)}M`
  }
  if (amount >= 1_000) {
    return `LKR ${(amount / 1_000).toFixed(0)}K`
  }
  return `LKR ${amount.toLocaleString("en-LK")}`
}

function formatRelativeDate(value) {
  const timestamp = new Date(value).getTime()
  if (!timestamp) {
    return "No recent activity"
  }

  const diffMinutes = Math.round((Date.now() - timestamp) / 60000)
  if (diffMinutes < 1) return "Just now"
  if (diffMinutes < 60) return `${diffMinutes} min ago`

  const diffHours = Math.round(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours} hr ago`

  const diffDays = Math.round(diffHours / 24)
  if (diffDays < 30) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`

  return new Date(value).toLocaleDateString("en-LK")
}

function toTimestamp(value) {
  const timestamp = new Date(value).getTime()
  return Number.isFinite(timestamp) ? timestamp : 0
}

function buildVehicleKey(brand, model) {
  return `${String(brand || "").trim().toUpperCase()}|||${String(model || "").trim().toUpperCase()}`
}

function normalizeCloudPrediction(row) {
  return {
    id: `db-${row.id}`,
    brand: row.brand,
    model: row.model,
    year: row.year,
    predictedPrice: Number(row.predicted_price_lkr) || 0,
    predictedAt: row.created_at,
  }
}

function normalizeMarketplaceListing(row) {
  return {
    id: String(row.id || ""),
    brand: row.brand,
    model: row.model,
    price: Number(row.price || 0),
    createdAt: row.created_at,
    status: row.status,
    isSpotlight: Boolean(row.is_spotlight),
    isUrgent: Boolean(row.is_urgent),
    isBumped: Boolean(row.is_bumped),
  }
}

function normalizeLocalPrediction(row) {
  return {
    id: row.id,
    brand: row.brand,
    model: row.model,
    year: row.year,
    predictedPrice: Number(row.predictedPrice) || 0,
    predictedAt: new Date(row.predictedAt || Date.now()).toISOString(),
  }
}

function Dashboard() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState({
    user: null,
    predictions: [],
    listings: [],
    alertsCount: 0,
    source: "local",
  })

  useEffect(() => {
    let isActive = true

    const loadDashboard = async () => {
      setIsLoading(true)

      const user = await getCurrentUser()
      const alerts = loadUserAlerts(user || { email: "guest@example.com", username: "Guest" })
      let predictions = []
      let listings = []
      let source = "local"

      if (user?.id) {
        const { data, error } = await supabase
          .from("predictions")
          .select("id, brand, model, year, predicted_price_lkr, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(12)

        if (!error && Array.isArray(data)) {
          predictions = data.map(normalizeCloudPrediction)
          source = "supabase"
        }
      }

      if (!user && predictions.length === 0) {
        predictions = loadPredictionHistory().map(normalizeLocalPrediction).slice(0, 12)
        source = "local"
      }

      const { data: marketplaceData } = await supabase
        .from("marketplace_listings")
        .select("id, brand, model, price, created_at, status, is_spotlight, is_urgent, is_bumped")
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(24)

      if (Array.isArray(marketplaceData)) {
        listings = marketplaceData.map(normalizeMarketplaceListing)
      }

      if (!isActive) return

      setDashboardData({
        user,
        predictions,
        listings,
        alertsCount: alerts.length,
        source,
      })
      setIsLoading(false)
    }

    loadDashboard()
    return () => {
      isActive = false
    }
  }, [])

  const recentPredictions = useMemo(
    () => dashboardData.predictions.slice(0, 4),
    [dashboardData.predictions]
  )

  const summary = useMemo(() => {
    const predictions = dashboardData.predictions
    const totalPredictions = predictions.length
    const averagePrice =
      totalPredictions > 0
        ? predictions.reduce((sum, item) => sum + Number(item.predictedPrice || 0), 0) / totalPredictions
        : 0

    const brandCounts = predictions.reduce((acc, item) => {
      const key = String(item.brand || "").trim()
      if (!key) return acc
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})

    const topBrand = Object.entries(brandCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || t("dashboard_page.default_brand")
    const latestPrediction = predictions[0]

    return {
      totalPredictions,
      averagePrice,
      topBrand,
      latestPredictionTime: latestPrediction?.predictedAt || "",
      latestPredictionValue: latestPrediction?.predictedPrice || 0,
    }
  }, [dashboardData.predictions, t])

  const sparklineData = useMemo(() => {
    const values = dashboardData.predictions
      .slice(0, 6)
      .map((item) => Number(item.predictedPrice || 0))
      .reverse()

    const max = Math.max(...values, 1)
    return values.map((value) => ({
      value,
      height: `${Math.max(22, (value / max) * 100)}%`,
    }))
  }, [dashboardData.predictions])

  const trendingSummary = useMemo(() => {
    const now = Date.now()
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)
    const todayTimestamp = startOfToday.getTime()
    const lastWeekTimestamp = now - (7 * 24 * 60 * 60 * 1000)
    const lastMonthTimestamp = now - (30 * 24 * 60 * 60 * 1000)

    const topEntryFromMap = (counts) => {
      const [key, count] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0] || []
      if (!key) return null
      const [brand, model] = key.split("|||")
      return { brand, model, count }
    }

    const combinedCounts = {}
    dashboardData.predictions.forEach((item) => {
      if (toTimestamp(item.predictedAt) < lastMonthTimestamp) return
      const key = buildVehicleKey(item.brand, item.model)
      if (!key.trim()) return
      combinedCounts[key] = (combinedCounts[key] || 0) + 1
    })
    dashboardData.listings.forEach((item) => {
      if (toTimestamp(item.createdAt) < lastMonthTimestamp) return
      const key = buildVehicleKey(item.brand, item.model)
      if (!key.trim()) return
      combinedCounts[key] = (combinedCounts[key] || 0) + 1
    })

    const todayPredictionCounts = {}
    dashboardData.predictions.forEach((item) => {
      if (toTimestamp(item.predictedAt) < todayTimestamp) return
      const key = buildVehicleKey(item.brand, item.model)
      if (!key.trim()) return
      todayPredictionCounts[key] = (todayPredictionCounts[key] || 0) + 1
    })

    const weeklyBrandCounts = {}
    dashboardData.listings.forEach((item) => {
      if (toTimestamp(item.createdAt) < lastWeekTimestamp) return
      const brand = String(item.brand || "").trim()
      if (!brand) return
      weeklyBrandCounts[brand] = (weeklyBrandCounts[brand] || 0) + 1
    })
    if (Object.keys(weeklyBrandCounts).length === 0) {
      dashboardData.predictions.forEach((item) => {
        if (toTimestamp(item.predictedAt) < lastWeekTimestamp) return
        const brand = String(item.brand || "").trim()
        if (!brand) return
        weeklyBrandCounts[brand] = (weeklyBrandCounts[brand] || 0) + 1
      })
    }

    const featuredListing = [...dashboardData.listings]
      .sort((a, b) => {
        const scoreA = (a.isSpotlight ? 3 : 0) + (a.isUrgent ? 2 : 0) + (a.isBumped ? 1 : 0)
        const scoreB = (b.isSpotlight ? 3 : 0) + (b.isUrgent ? 2 : 0) + (b.isBumped ? 1 : 0)
        if (scoreB !== scoreA) return scoreB - scoreA
        return toTimestamp(b.createdAt) - toTimestamp(a.createdAt)
      })[0] || null

    const trendingVehicle = topEntryFromMap(combinedCounts)
    const mostPredictedToday = topEntryFromMap(todayPredictionCounts)
    const [activeBrand, activeBrandCount] = Object.entries(weeklyBrandCounts).sort((a, b) => b[1] - a[1])[0] || []

    return {
      trendingVehicle,
      mostPredictedToday,
      featuredListing,
      activeBrand: activeBrand ? { brand: activeBrand, count: activeBrandCount } : null,
    }
  }, [dashboardData.listings, dashboardData.predictions])

  const quickActions = useMemo(() => ([
    {
      title: t("dashboard_page.quick_actions.new_prediction_title"),
      note: t("dashboard_page.quick_actions.new_prediction_note"),
      icon: <Sparkles className="h-5 w-5" />,
      accent: "from-blue-500/25 to-cyan-400/10 border-blue-500/20 text-blue-300",
      onClick: () => navigate("/price-check"),
    },
    {
      title: t("dashboard_page.quick_actions.analytics_title"),
      note: t("dashboard_page.quick_actions.analytics_note"),
      icon: <LineChart className="h-5 w-5" />,
      accent: "from-amber-500/25 to-orange-400/10 border-amber-500/20 text-amber-300",
      onClick: () => navigate("/analytics"),
    },
    {
      title: t("dashboard_page.quick_actions.marketplace_title"),
      note: t("dashboard_page.quick_actions.marketplace_note"),
      icon: <CarFront className="h-5 w-5" />,
      accent: "from-emerald-500/25 to-teal-400/10 border-emerald-500/20 text-emerald-300",
      onClick: () => navigate("/marketplace"),
    },
    {
      title: t("dashboard_page.quick_actions.financing_title"),
      note: t("dashboard_page.quick_actions.financing_note"),
      icon: <Calculator className="h-5 w-5" />,
      accent: "from-fuchsia-500/20 to-pink-400/10 border-fuchsia-500/20 text-fuchsia-300",
      onClick: () => navigate("/financing"),
    },
  ]), [navigate, t])

  const statCards = [
    {
      label: t("dashboard_page.stats.saved_predictions"),
      value: `${summary.totalPredictions}`,
      meta: dashboardData.source === "supabase" ? t("dashboard_page.stats.cloud_history") : t("dashboard_page.stats.local_history"),
      icon: <Bookmark className="h-5 w-5" />,
      iconBg: "bg-blue-500/15 text-blue-300",
    },
    {
      label: t("dashboard_page.stats.average_estimate"),
      value: summary.totalPredictions > 0 ? formatCompactCurrency(summary.averagePrice) : t("dashboard_page.no_data"),
      meta: summary.totalPredictions > 0 ? t("dashboard_page.stats.recent_saves") : t("dashboard_page.stats.first_prediction"),
      icon: <Coins className="h-5 w-5" />,
      iconBg: "bg-emerald-500/15 text-emerald-300",
    },
    {
      label: t("dashboard_page.stats.active_alerts"),
      value: `${dashboardData.alertsCount}`,
      meta: dashboardData.alertsCount > 0 ? t("dashboard_page.stats.alerts_ready") : t("dashboard_page.stats.no_alerts"),
      icon: <BellRing className="h-5 w-5" />,
      iconBg: "bg-amber-500/15 text-amber-300",
    },
    {
      label: t("dashboard_page.stats.top_brand"),
      value: summary.topBrand,
      meta: summary.latestPredictionTime ? formatRelativeDate(summary.latestPredictionTime) : t("dashboard_page.stats.waiting_activity"),
      icon: <TrendingUp className="h-5 w-5" />,
      iconBg: "bg-cyan-500/15 text-cyan-300",
    },
  ]

  const trendingCards = [
    {
      label: t("dashboard_page.trending_now"),
      value: trendingSummary.trendingVehicle
        ? `${trendingSummary.trendingVehicle.brand} ${trendingSummary.trendingVehicle.model}`
        : t("dashboard_page.no_trend_data"),
      meta: trendingSummary.trendingVehicle
        ? t("dashboard_page.trending_now_meta", { count: trendingSummary.trendingVehicle.count })
        : t("dashboard_page.trending_empty"),
      tone: "text-cyan-300",
      icon: <TrendingUp className="h-4 w-4 text-cyan-400" />,
    },
    {
      label: t("dashboard_page.most_predicted_today"),
      value: trendingSummary.mostPredictedToday
        ? `${trendingSummary.mostPredictedToday.brand} ${trendingSummary.mostPredictedToday.model}`
        : t("dashboard_page.no_trend_data"),
      meta: trendingSummary.mostPredictedToday
        ? t("dashboard_page.most_predicted_today_meta", { count: trendingSummary.mostPredictedToday.count })
        : t("dashboard_page.predictions_waiting"),
      tone: "text-emerald-300",
      icon: <Sparkles className="h-4 w-4 text-emerald-400" />,
    },
    {
      label: t("dashboard_page.most_viewed_listing"),
      value: trendingSummary.featuredListing
        ? `${trendingSummary.featuredListing.brand} ${trendingSummary.featuredListing.model}`
        : t("dashboard_page.no_trend_data"),
      meta: trendingSummary.featuredListing
        ? t("dashboard_page.most_viewed_listing_meta")
        : t("dashboard_page.listing_tracking_waiting"),
      tone: "text-amber-300",
      icon: <Eye className="h-4 w-4 text-amber-400" />,
    },
    {
      label: t("dashboard_page.most_active_brand_week"),
      value: trendingSummary.activeBrand
        ? trendingSummary.activeBrand.brand
        : t("dashboard_page.no_trend_data"),
      meta: trendingSummary.activeBrand
        ? t("dashboard_page.most_active_brand_week_meta", { count: trendingSummary.activeBrand.count })
        : t("dashboard_page.brand_waiting"),
      tone: "text-blue-300",
      icon: <CarFront className="h-4 w-4 text-blue-400" />,
    },
  ]

  const username = dashboardData.user?.username || dashboardData.user?.email?.split("@")[0] || t("dashboard_page.default_driver")

  return (
    <div className="min-h-screen bg-[#0f172a] p-5 md:p-8">
      <section className="relative overflow-hidden rounded-[32px] border border-slate-700/50 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.25),_transparent_34%),radial-gradient(circle_at_80%_20%,_rgba(16,185,129,0.18),_transparent_28%),linear-gradient(135deg,_rgba(15,23,42,0.96),_rgba(15,23,42,0.85))] px-6 py-7 md:px-8 md:py-8">
        <div className="absolute inset-y-0 right-0 hidden w-[38%] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0))] md:block" />
        <div className="absolute -right-16 top-8 h-44 w-44 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute -bottom-10 left-10 h-28 w-28 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="relative z-10 grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-slate-300">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              {t("dashboard_page.badge")}
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white md:text-5xl">
              {t("dashboard_page.greeting", { name: username }).replace(username, "")}
              <span className="bg-gradient-to-r from-white to-cyan-300 bg-clip-text text-transparent">{username}</span>
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
              {t("dashboard_page.subtitle")}
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => navigate("/price-check")}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition-transform duration-300 hover:-translate-y-0.5"
              >
                {t("dashboard_page.start_prediction")}
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => navigate("/analytics")}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition-colors duration-300 hover:bg-white/10"
              >
                {t("dashboard_page.open_analytics")}
                <LineChart className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{t("dashboard_page.latest_estimate")}</p>
              <p className="mt-3 text-3xl font-bold text-amber-300">
                {summary.latestPredictionValue ? formatCompactCurrency(summary.latestPredictionValue) : t("dashboard_page.no_data")}
              </p>
              <p className="mt-2 text-sm text-slate-400">
                {summary.latestPredictionTime ? formatRelativeDate(summary.latestPredictionTime) : t("dashboard_page.create_prediction_hint")}
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-950/30 p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{t("dashboard_page.price_rhythm")}</p>
                <Clock3 className="h-4 w-4 text-slate-500" />
              </div>
              <div className="mt-5 flex h-24 items-end gap-2">
                {sparklineData.length > 0 ? (
                  sparklineData.map((item, index) => (
                    <div
                      key={`${item.value}-${index}`}
                      className="flex-1 rounded-t-2xl bg-gradient-to-t from-blue-500 to-cyan-300/90"
                      style={{ height: item.height }}
                    />
                  ))
                ) : (
                  <div className="flex h-full w-full items-center justify-center rounded-2xl border border-dashed border-slate-700/70 text-sm text-slate-500">
                    {t("dashboard_page.no_recent_data")}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {quickActions.map((item) => (
          <button
            key={item.title}
            onClick={item.onClick}
            className={`group rounded-[28px] border bg-gradient-to-br p-5 text-left transition-all duration-300 hover:-translate-y-1 ${item.accent}`}
          >
            <div className="flex items-start justify-between">
              <span className="inline-flex rounded-2xl bg-white/10 p-3">{item.icon}</span>
              <ArrowRight className="h-4 w-4 text-slate-400 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-white" />
            </div>
            <h2 className="mt-5 text-lg font-semibold text-white">{item.title}</h2>
            <p className="mt-1 text-sm text-slate-400">{item.note}</p>
          </button>
        ))}
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((item) => (
          <div key={item.label} className="rounded-[28px] border border-slate-700/60 bg-slate-900/55 p-5">
            <div className="flex items-center justify-between">
              <span className={`inline-flex rounded-2xl p-3 ${item.iconBg}`}>{item.icon}</span>
            </div>
            <p className="mt-5 text-xs uppercase tracking-[0.22em] text-slate-500">{item.label}</p>
            <p className="mt-2 text-2xl font-bold text-white">{item.value}</p>
            <p className="mt-1 text-sm text-slate-400">{item.meta}</p>
          </div>
        ))}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
        <div className="rounded-[30px] border border-slate-700/60 bg-slate-900/55 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">{t("dashboard_page.recent_predictions")}</h2>
              <p className="mt-1 text-sm text-slate-400">{t("dashboard_page.latest_saved_estimates")}</p>
            </div>
            <button
              onClick={() => navigate("/analytics")}
              className="inline-flex items-center gap-2 self-start rounded-2xl border border-slate-700/70 px-4 py-2 text-sm font-medium text-blue-300 transition-colors duration-300 hover:border-blue-400/40 hover:text-blue-200"
            >
              {t("dashboard_page.view_all")}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-6 space-y-3">
            {isLoading ? (
              <div className="rounded-3xl border border-dashed border-slate-700/70 px-6 py-12 text-center text-slate-500">
                {t("dashboard_page.loading")}
              </div>
            ) : recentPredictions.length > 0 ? (
              recentPredictions.map((item) => (
                <button
                  key={item.id}
                  onClick={() => navigate("/analytics")}
                  className="flex w-full items-center gap-4 rounded-[24px] border border-slate-800/80 bg-slate-950/30 px-4 py-4 text-left transition-all duration-300 hover:border-slate-600/60 hover:bg-slate-800/40"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-300">
                    <CarFront className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-semibold text-white">
                      {item.brand} {item.model}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      {item.year} - {formatRelativeDate(item.predictedAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-cyan-300">{formatCurrency(item.predictedPrice)}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">{t("dashboard_page.saved")}</p>
                  </div>
                </button>
              ))
            ) : (
              <div className="rounded-[28px] border border-dashed border-slate-700/70 bg-slate-950/20 px-6 py-14 text-center">
                <p className="text-lg font-medium text-white">{t("dashboard_page.no_predictions_yet")}</p>
                <p className="mt-2 text-sm text-slate-400">{t("dashboard_page.start_dashboard")}</p>
                <button
                  onClick={() => navigate("/price-check")}
                  className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition-colors duration-300 hover:bg-blue-400"
                >
                  {t("dashboard_page.create_first_prediction")}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[30px] border border-slate-700/60 bg-slate-900/55 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">{t("dashboard_page.trending_section_title")}</h2>
                <p className="mt-1 text-sm text-slate-400">{t("dashboard_page.trending_section_subtitle")}</p>
              </div>
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
                {t("dashboard_page.trending_live")}
              </span>
            </div>

            <div className="mt-6 grid gap-3">
              {trendingCards.map((item) => (
                <div key={item.label} className="rounded-[22px] border border-slate-800/80 bg-slate-950/35 p-4">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-500">
                    {item.icon}
                    {item.label}
                  </div>
                  <p className={`mt-3 text-lg font-semibold ${item.tone}`}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[30px] border border-slate-700/60 bg-[linear-gradient(160deg,rgba(14,165,233,0.08),rgba(15,23,42,0.88))] p-6">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{t("dashboard_page.ready_now")}</p>
            <h2 className="mt-3 text-2xl font-bold text-white">{t("dashboard_page.move_to_action")}</h2>
            <div className="mt-5 space-y-3 text-sm text-slate-300">
              <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 px-4 py-3">
                <span>{t("dashboard_page.fresh_valuation")}</span>
                <span className="text-cyan-300">{t("price_check")}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 px-4 py-3">
                <span>{t("dashboard_page.compare_plans")}</span>
                <span className="text-emerald-300">{t("financing")}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Dashboard
