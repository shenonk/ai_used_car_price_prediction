import { useMemo, useState, useEffect, useRef, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  Car, Gauge, MapPin, Calendar,
  ArrowRight, Info, ShieldCheck, Zap,
  Settings2,
  Activity,
  BarChart2,
  Check,
  Clock,
  Cpu,
  Lightbulb,
  List,
  Loader,
  RefreshCw,
  Search,
  Shield,
  SlidersHorizontal,
  Tag,
  TrendingUp,
  Trophy,
} from "lucide-react"
import brandModelOptions from "../data/brand_model_options.json"
import { loadPredictionHistory, savePredictionHistoryEntry } from "../utils/predictionHistory"
import { supabase } from "../utils/supabaseClient"
import AppModal from "../components/AppModal"
import AppDropdown from "../components/AppDropdown"

const GEAR_TYPE_OPTIONS = [
  { label: "Automatic", value: "automatic" },
  { label: "Manual", value: "manual" },
]

const FUEL_TYPE_OPTIONS = [
  { label: "Petrol", value: "petrol" },
  { label: "Hybrid", value: "hybrid" },
  { label: "Diesel", value: "diesel" },
  { label: "Electric", value: "electric" },
]

const CONDITION_OPTIONS = [
  { label: "Used", value: "USED" },
  { label: "Brand New", value: "BRAND NEW" },
  { label: "Reconditioned", value: "RECONDITIONED" },
]

const MODEL_REFERENCE_LISTING_MONTH = 1
const MODEL_REFERENCE_LISTING_YEAR = 2025
const BRAND_OPTIONS = Object.keys(brandModelOptions).sort()
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"
const MAX_BRAND_SUGGESTIONS = 80
const MAX_MODEL_SUGGESTIONS = 80

function normalizeModelSearch(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "")
}

/* ------------------------------------------------------------------ */
/*  Floating Particles                                                 */
/* ------------------------------------------------------------------ */
function PredictionParticles() {
  return (
    <div className="pc-particles" aria-hidden="true">
      {Array.from({ length: 14 }).map((_, i) => (
        <span
          key={i}
          className="pc-particle"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 6}s`,
            animationDuration: `${6 + Math.random() * 8}s`,
            width: `${3 + Math.random() * 5}px`,
            height: `${3 + Math.random() * 5}px`,
            background: ['rgba(59,130,246,0.4)', 'rgba(6,182,212,0.35)', 'rgba(16,185,129,0.3)', 'rgba(139,92,246,0.3)'][i % 4],
          }}
        />
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Step Indicator                                                     */
/* ------------------------------------------------------------------ */
function StepIndicator({ step, total }) {
  return (
    <div className="pc-steps">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={`pc-step ${i < step ? 'pc-step--done' : ''} ${i === step ? 'pc-step--active' : ''}`}>
          <div className="pc-step__dot">
            {i < step ? (
              <Check className="h-3 w-3" />
            ) : (
              <span className="pc-step__num">{i + 1}</span>
            )}
          </div>
          {i < total - 1 && <div className={`pc-step__line ${i < step ? 'pc-step__line--done' : ''}`} />}
        </div>
      ))}
    </div>
  )
}

const FUEL_BAR_COLORS = {
  Petrol: "#1d4ed8",
  Hybrid: "#059669",
  Diesel: "#d97706",
  Electric: "#7c3aed",
}

const EMPTY_PRICE_CHECK_INSIGHTS = {
  marketSnapshotRows: [
    { icon: List, label: "Active listings", value: "0", color: "#e6edf3" },
    { icon: TrendingUp, label: "Avg price this week", value: "No data", color: "#58a6ff" },
    { icon: Clock, label: "Avg days to sell", value: "No data", color: "#d29922" },
    { icon: Zap, label: "Most searched", value: "No data", color: "#3fb950" },
  ],
  fuelPriceRanges: [],
  trendingModels: [],
}

function formatRecentPrice(value) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric) || numeric <= 0) return "LKR 0"
  if (numeric >= 1_000_000) return `LKR ${(numeric / 1_000_000).toFixed(1)}M`
  return `LKR ${Math.round(numeric).toLocaleString()}`
}

function formatCompactPrice(value) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric) || numeric <= 0) return "No data"
  if (numeric >= 1_000_000) return `LKR ${(numeric / 1_000_000).toFixed(1)}M`
  if (numeric >= 1_000) return `LKR ${(numeric / 1_000).toFixed(0)}K`
  return `LKR ${Math.round(numeric).toLocaleString("en-LK")}`
}

function formatPredictionAge(timestamp) {
  const time = Number(timestamp)
  if (!Number.isFinite(time)) return "recently"
  const days = Math.max(0, Math.floor((Date.now() - time) / 86_400_000))
  if (days === 0) return "today"
  if (days === 1) return "1 day ago"
  return `${days} days ago`
}

function toTimestamp(value) {
  const timestamp = new Date(value).getTime()
  return Number.isFinite(timestamp) ? timestamp : 0
}

function average(values) {
  const valid = values.map(Number).filter((value) => Number.isFinite(value) && value > 0)
  if (!valid.length) return 0
  return valid.reduce((sum, value) => sum + value, 0) / valid.length
}

function normalizeRecentPrediction(row) {
  return {
    id: `db-${row.id}`,
    brand: row.brand,
    model: row.model,
    year: row.year,
    predictedPrice: Number(row.predicted_price_lkr) || 0,
    predictedAt: new Date(row.created_at).getTime(),
  }
}

async function loadRecentPredictions() {
  const localPredictions = loadPredictionHistory().slice(0, 3)
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.access_token || !session?.user?.id) {
    return localPredictions
  }

  const { data, error } = await supabase
    .from("predictions")
    .select("id, brand, model, year, predicted_price_lkr, created_at")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(3)

  if (error) {
    console.error("Failed to load recent cloud predictions:", error)
    return localPredictions
  }

  return Array.isArray(data) ? data.map(normalizeRecentPrediction) : localPredictions
}

async function loadPriceCheckInsights() {
  const [listingsResult, predictionInsightsResult] = await Promise.allSettled([
    supabase
      .from("marketplace_listings")
      .select("id, price, status, created_at, updated_at")
      .in("status", ["approved", "sold"]),
    fetch(`${API_BASE_URL}/api/price-check/insights?limit=5`),
  ])

  const listingsPayload = listingsResult.status === "fulfilled" ? listingsResult.value : {}
  const listings = Array.isArray(listingsPayload?.data) ? listingsPayload.data : []
  const approvedListings = listings.filter((listing) => listing.status === "approved")
  const soldListings = listings.filter((listing) => listing.status === "sold")
  const weekTimestamp = Date.now() - 7 * 24 * 60 * 60 * 1000
  const weeklyApproved = approvedListings.filter((listing) => toTimestamp(listing.created_at) >= weekTimestamp)
  const avgPriceThisWeek = average((weeklyApproved.length ? weeklyApproved : approvedListings).map((listing) => listing.price))
  const soldDurations = soldListings
    .map((listing) => {
      const start = toTimestamp(listing.created_at)
      const end = toTimestamp(listing.updated_at)
      return start && end && end >= start ? Math.max(1, Math.round((end - start) / 86_400_000)) : 0
    })
    .filter(Boolean)
  const avgDaysToSell = average(soldDurations)

  let predictionInsights = {}
  if (predictionInsightsResult.status === "fulfilled" && predictionInsightsResult.value.ok) {
    predictionInsights = await predictionInsightsResult.value.json()
  }

  const rawFuelRanges = Array.isArray(predictionInsights?.fuel_price_ranges) ? predictionInsights.fuel_price_ranges : []
  const maxFuelMedian = Math.max(...rawFuelRanges.map((item) => Number(item.median_price_lkr || 0)), 1)
  const fuelPriceRanges = rawFuelRanges.map((item) => {
    const median = Number(item.median_price_lkr || 0)
    return {
      label: item.label,
      width: `${Math.max(8, Math.round((median / maxFuelMedian) * 100))}%`,
      color: FUEL_BAR_COLORS[item.label] || "#58a6ff",
      value: formatCompactPrice(median),
    }
  })

  const trendingModels = Array.isArray(predictionInsights?.trending_models)
    ? predictionInsights.trending_models.map((item) => ({
        model: item.model,
        brand: item.brand,
        count: `${Number(item.count || 0).toLocaleString("en-LK")} prediction${Number(item.count || 0) === 1 ? "" : "s"}`,
      }))
    : []

  return {
    marketSnapshotRows: [
      { icon: List, label: "Active listings", value: approvedListings.length.toLocaleString("en-LK"), color: "#e6edf3" },
      { icon: TrendingUp, label: "Avg price this week", value: formatCompactPrice(avgPriceThisWeek), color: "#58a6ff" },
      { icon: Clock, label: "Avg days to sell", value: avgDaysToSell ? `${Math.round(avgDaysToSell)} days` : "No data", color: "#d29922" },
      { icon: Zap, label: "Most searched", value: predictionInsights?.top_brand || "No data", color: "#3fb950" },
    ],
    fuelPriceRanges,
    trendingModels,
  }
}

function PriceCheckPanelHeader({ icon: Icon, iconColor, title, subtitle, action }) {
  return (
    <div className="pc-insight-header">
      <div className="pc-insight-header__main">
        <div className="pc-insight-title-row">
          <Icon className="pc-insight-title-icon" style={{ color: iconColor }} />
          <h3>{title}</h3>
        </div>
        <p>{subtitle}</p>
      </div>
      {action}
    </div>
  )
}

function PriceCheckInsights({ insights, recentPredictions, onViewAnalytics }) {
  const { t } = useTranslation()
  return (
    <aside className="pc-insights" aria-label="Live price insights">
      <section className="pc-insight-panel">
        <PriceCheckPanelHeader
          icon={Activity}
          iconColor="#3fb950"
          title="Market Snapshot"
          subtitle="Sri Lankan used car market - today"
        />
        <div className="pc-market-list">
          {insights.marketSnapshotRows.map(({ icon: Icon, label, value, color }) => (
            <div className="pc-market-row" key={label}>
              <span className="pc-market-label"><Icon />{label}</span>
              <span className="pc-market-value" style={{ color }}>{value}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="pc-insight-panel">
        <PriceCheckPanelHeader
          icon={BarChart2}
          iconColor="#58a6ff"
          title="Price Range by Fuel Type"
          subtitle="Median estimates from saved predictions"
        />
        <div className="pc-fuel-bars">
          {insights.fuelPriceRanges.length > 0 ? (
            insights.fuelPriceRanges.map((item) => (
              <div className="pc-fuel-row" key={item.label}>
                <span className="pc-fuel-label">{item.label}</span>
                <span className="pc-fuel-track">
                  <span className="pc-fuel-fill" style={{ width: item.width, background: item.color }} />
                </span>
                <span className="pc-fuel-value">{item.value}</span>
              </div>
            ))
          ) : (
            <div className="pc-empty-state">
              <Search />
              <p>{t("price_check_page.no_fuel_data")}</p>
              <span>{t("price_check_page.fuel_data_waiting")}</span>
            </div>
          )}
        </div>
      </section>

      <section className="pc-insight-panel">
        <PriceCheckPanelHeader
          icon={Trophy}
          iconColor="#d29922"
          title="Trending Models"
          subtitle="Most predicted on AutoValueLK this week"
        />
        <div className="pc-trending-list">
          {insights.trendingModels.length > 0 ? (
            insights.trendingModels.map((item, index) => (
              <div className="pc-trending-row" key={`${item.brand}-${item.model}`}>
                <span className={`pc-rank pc-rank--${Math.min(index + 1, 4)}`}>{index + 1}</span>
                <span className="pc-trending-model">{item.model}</span>
                <span className="pc-trending-brand">{item.brand}</span>
                <span className="pc-count-badge">{item.count}</span>
              </div>
            ))
          ) : (
            <div className="pc-empty-state">
              <Search />
              <p>{t("price_check_page.no_weekly_trends")}</p>
              <span>{t("price_check_page.weekly_trends_waiting")}</span>
            </div>
          )}
        </div>
      </section>

      <section className="pc-insight-panel">
        <PriceCheckPanelHeader
          icon={Clock}
          iconColor="#a78bfa"
          title="Your Recent Predictions"
          subtitle="Your last 3 saved estimates"
          action={<button type="button" className="pc-view-all" onClick={onViewAnalytics}>{t("price_check_page.view_all")} →</button>}
        />
        {recentPredictions.length > 0 ? (
          <div className="pc-recent-list">
            {recentPredictions.map((item) => (
              <div className="pc-recent-row" key={item.id || `${item.brand}-${item.model}-${item.predictedAt}`}>
                <span className="pc-recent-icon"><Car /></span>
                <span className="pc-recent-main">
                  <span className="pc-recent-name">{[item.brand, item.model].filter(Boolean).join(" ") || "Saved vehicle"}</span>
                  <span className="pc-recent-meta">{item.year || "Year"} · {formatPredictionAge(item.predictedAt)}</span>
                </span>
                <span className="pc-recent-price">{formatRecentPrice(item.predictedPrice)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="pc-empty-state">
            <Search />
            <p>{t("price_check_page.no_predictions")}</p>
            <span>{t("price_check_page.first_prediction_hint")}</span>
          </div>
        )}
      </section>

      <section className="pc-tip-card">
        <div className="pc-tip-title"><Lightbulb /> <h3>{t("price_check_page.pro_tip")}</h3></div>
        <p>{t("price_check_page.pro_tip_body")}</p>
      </section>
    </aside>
  )
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */
function PriceCheck() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const formRef = useRef(null)
  const [form, setForm] = useState({
    brand: "",
    model: "",
    year: "",
    engine: "",
    mileage: "",
    fuel_type: "",
    gear_type: "",
    condition: "USED",
    town: "Colombo",
  })
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [dialog, setDialog] = useState(null)
  const [recentPredictions, setRecentPredictions] = useState([])
  const [insights, setInsights] = useState(EMPTY_PRICE_CHECK_INSIGHTS)

  const refreshInsights = useCallback(async () => {
    const [nextInsights, nextRecentPredictions] = await Promise.all([
      loadPriceCheckInsights().catch((error) => {
        console.error("Failed to load live price check insights:", error)
        return EMPTY_PRICE_CHECK_INSIGHTS
      }),
      loadRecentPredictions().catch((error) => {
        console.error("Failed to load recent predictions:", error)
        return loadPredictionHistory().slice(0, 3)
      }),
    ])

    setInsights(nextInsights)
    setRecentPredictions(nextRecentPredictions)
  }, [])

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      if (!isMounted) return
      await refreshInsights()
    }

    load()
    const refreshTimer = window.setInterval(load, 15000)

    let realtimeChannel = null
    if (typeof supabase.channel === "function") {
      realtimeChannel = supabase
        .channel("price-check-live-insights")
        .on("postgres_changes", { event: "*", schema: "public", table: "marketplace_listings" }, load)
        .on("postgres_changes", { event: "*", schema: "public", table: "predictions" }, load)
        .subscribe()
    }

    return () => {
      isMounted = false
      window.clearInterval(refreshTimer)
      if (realtimeChannel && typeof supabase.removeChannel === "function") {
        supabase.removeChannel(realtimeChannel)
      }
    }
  }, [refreshInsights])

  const gearTypeOptions = useMemo(() => ([
    { label: t("price_check_page.options.automatic"), value: "automatic" },
    { label: t("price_check_page.options.manual"), value: "manual" },
  ]), [t])
  const fuelTypeOptions = useMemo(() => ([
    { label: t("price_check_page.options.petrol"), value: "petrol" },
    { label: t("price_check_page.options.hybrid"), value: "hybrid" },
    { label: t("price_check_page.options.diesel"), value: "diesel" },
    { label: t("price_check_page.options.electric"), value: "electric" },
  ]), [t])
  const conditionOptions = useMemo(() => ([
    { label: t("price_check_page.options.used"), value: "USED" },
    { label: t("price_check_page.options.brand_new"), value: "BRAND NEW" },
    { label: t("price_check_page.options.reconditioned"), value: "RECONDITIONED" },
  ]), [t])

  const brandSuggestions = useMemo(() => {
    const query = form.brand.trim()
    const normalizedQuery = normalizeModelSearch(query)
    if (!normalizedQuery) return BRAND_OPTIONS.slice(0, MAX_BRAND_SUGGESTIONS)
    return BRAND_OPTIONS
      .filter((brand) => {
        const normalizedBrand = normalizeModelSearch(brand)
        return brand.toLowerCase().includes(query.toLowerCase()) || normalizedBrand.includes(normalizedQuery)
      })
      .slice(0, MAX_BRAND_SUGGESTIONS)
  }, [form.brand])

  const availableModels = useMemo(
    () => (form.brand ? (brandModelOptions[form.brand] || []) : []),
    [form.brand]
  )
  const modelSuggestions = useMemo(() => {
    const query = form.model.trim()
    const normalizedQuery = normalizeModelSearch(query)
    if (!normalizedQuery) return availableModels.slice(0, MAX_MODEL_SUGGESTIONS)
    return availableModels
      .filter((model) => {
        const normalizedModel = normalizeModelSearch(model)
        return model.toLowerCase().includes(query.toLowerCase()) || normalizedModel.includes(normalizedQuery)
      })
      .slice(0, MAX_MODEL_SUGGESTIONS)
  }, [availableModels, form.model])

  // Compute progress step
  const completedFields = [form.brand, form.model, form.year, form.engine, form.fuel_type, form.gear_type].filter(Boolean).length
  const currentStep = Math.min(completedFields, 4)

  const handleChange = (field, value) => {
    setForm(prev => {
      if (field === "brand") {
        return { ...prev, brand: value, model: "" }
      }
      return { ...prev, [field]: value }
    })
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: "" }))
    if (field === "brand" && errors.model) {
      setErrors(prev => ({ ...prev, model: "" }))
    }
  }

  const validate = () => {
    const errs = {}
    if (!form.brand.trim()) errs.brand = t("price_check_page.errors.brand_required")
    if (!form.model.trim()) errs.model = t("price_check_page.errors.model_required")
    if (!form.year) errs.year = t("price_check_page.errors.year_required")
    if (!form.engine) errs.engine = t("price_check_page.errors.engine_required")
    if (!form.fuel_type) errs.fuel_type = t("price_check_page.errors.fuel_required")
    if (!form.gear_type) errs.gear_type = t("price_check_page.errors.transmission_required")
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setIsLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(`${API_BASE_URL}/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          brand: form.brand.trim().toUpperCase(),
          model: form.model.trim().toUpperCase(),
          year: parseInt(form.year),
          engine_cc: parseFloat(form.engine),
          mileage_km: parseFloat(form.mileage) || 0,
          fuel_type: form.fuel_type,
          gear_type: form.gear_type,
          condition: form.condition,
          town: form.town.trim(),
          listing_month: MODEL_REFERENCE_LISTING_MONTH,
          listing_year: MODEL_REFERENCE_LISTING_YEAR,
        }),
      })
      if (!response.ok) throw new Error(`Server error: ${response.status}`)
      const data = await response.json()
      const predictedAt = Date.now()
      const predictionKey = `pred-${predictedAt}-${Math.random().toString(36).slice(2, 8)}`
      savePredictionHistoryEntry({
        id: predictionKey,
        brand: form.brand.trim().toUpperCase(),
        model: form.model.trim().toUpperCase(),
        year: parseInt(form.year),
        predictedPrice: data.predicted_price_lkr,
        predictedAt,
      })
      setIsLoading(false)
      navigate("/results", {
        state: {
          vehicle: { ...form, fuel: form.fuel_type, transmission: form.gear_type },
          predictedPrice: data.predicted_price_lkr,
          predictedAt,
          predictionKey,
          saveStatus: data.save_status || "local_only",
          saveMessage: data.save_message || "Prediction saved only on this device.",
        },
      })
    } catch (error) {
      setIsLoading(false)
      if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
        setDialog({
          title: t("price_check_page.errors.connection_title", { defaultValue: "Backend unavailable" }),
          message: t("price_check_page.errors.server_not_connected", { url: API_BASE_URL }),
        })
      } else {
        setDialog({
          title: t("price_check_page.errors.prediction_failed_title", { defaultValue: "Prediction failed" }),
          message: t("price_check_page.errors.prediction_failed", { message: error.message }),
        })
      }
    }
  }

  // ================================================================
  // RENDER
  // ================================================================
  return (
    <div className="pc-page">
      <AppModal
        isOpen={Boolean(dialog)}
        tone="warning"
        eyebrow={t("price_check_page.errors.dialog_eyebrow", { defaultValue: "Price Check" })}
        title={dialog?.title || ""}
        message={dialog?.message || ""}
        confirmLabel={t("common.ok", { defaultValue: "OK" })}
        onConfirm={() => setDialog(null)}
      />

      <div className="pc-layout">
        <div className="pc-main-column">
          {/* -------- Hero Header -------- */}
          <header className="pc-hero">
            <div>
              <div className="pc-hero__eyebrow">{t("price_check_page.hero_badge")}</div>
              <h1 className="pc-hero__title">{t("price_check_page.title")}</h1>
              <p className="pc-hero__sub">{t("price_check_page.hero_subtitle")}</p>
            </div>
            <div className="pc-badges">
              <span className="pc-badge pc-badge--green"><ShieldCheck className="h-[13px] w-[13px]" /> {t("price_check_page.accuracy_badge")}</span>
              <span className="pc-badge pc-badge--amber"><Zap className="h-[13px] w-[13px]" /> {t("price_check_page.instant_results")}</span>
              <span className="pc-badge pc-badge--blue"><RefreshCw className="h-[13px] w-[13px]" /> {t("price_check_page.updated_daily")}</span>
            </div>
          </header>

          {/* -------- Progress Indicator -------- */}
          <div className="pc-progress-wrap">
            <StepIndicator step={currentStep} total={4} />
            <p className="pc-progress-label">
              {currentStep === 0 && "Start by selecting your vehicle brand"}
              {currentStep === 1 && "Great! Keep adding details..."}
              {currentStep === 2 && "Almost there - a few more fields"}
              {currentStep === 3 && "Nearly done!"}
              {currentStep >= 4 && "Ready to predict!"}
            </p>
          </div>

          {/* -------- Main Form Card -------- */}
          <div className="pc-form-card" ref={formRef}>
            {/* Card Header */}
            <div className="pc-form-header">
              <div className="pc-form-logo">
                <Cpu className="h-[18px] w-[18px]" />
              </div>
              <div>
                <h2 className="pc-form-title">{t("price_check_page.form_title")}</h2>
                <p className="pc-form-subtitle">{t("price_check_page.form_subtitle")}</p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div className="pc-form-grid">
                {/* Brand */}
                <div className="pc-field relative z-50">
                  <AppDropdown
                    label={t("price_check_page.brand")}
                    icon={Tag}
                    value={form.brand}
                    options={brandSuggestions}
                    onChange={(value) => handleChange('brand', value)}
                    placeholder={t("price_check_page.select_brand")}
                    searchable
                    error={Boolean(errors.brand)}
                  />
                  {errors.brand && <p className="pc-error">{errors.brand}</p>}
                </div>

                {/* Model */}
                <div className="pc-field relative z-40">
                  <AppDropdown
                    label={t("price_check_page.model")}
                    icon={Car}
                    value={form.model}
                    options={modelSuggestions}
                    onChange={(value) => handleChange('model', value)}
                    placeholder={form.brand ? t("price_check_page.select_model_or_search") : t("price_check_page.select_brand_first")}
                    searchable
                    disabled={!form.brand}
                    error={Boolean(errors.model)}
                  />
                  {errors.model && <p className="pc-error">{errors.model}</p>}
                </div>

                {/* Year */}
                <div className="pc-field">
                  <label className="pc-label"><Calendar className="pc-label-icon" /> {t("price_check_page.year")}<span>*</span></label>
                  <input className={`pc-input ${errors.year ? 'pc-input--error' : ''}`} type="number" placeholder={t("price_check_page.year_placeholder")} min="1990" max="2025" value={form.year} onChange={(e) => handleChange('year', e.target.value)} />
                  {errors.year && <p className="pc-error">{errors.year}</p>}
                </div>

                {/* Engine */}
                <div className="pc-field">
                  <label className="pc-label"><Settings2 className="pc-label-icon" /> {t("price_check_page.engine")}<span>*</span></label>
                  <input className={`pc-input ${errors.engine ? 'pc-input--error' : ''}`} type="number" placeholder={t("price_check_page.engine_placeholder")} value={form.engine} onChange={(e) => handleChange('engine', e.target.value)} />
                  {errors.engine && <p className="pc-error">{errors.engine}</p>}
                </div>

                {/* Mileage */}
                <div className="pc-field">
                  <label className="pc-label"><Gauge className="pc-label-icon" /> {t("price_check_page.mileage")}</label>
                  <input className="pc-input" type="number" placeholder={t("price_check_page.mileage_placeholder")} value={form.mileage} onChange={(e) => handleChange('mileage', e.target.value)} />
                </div>

                {/* Fuel Type */}
                <div className="pc-field">
                  <AppDropdown
                    label={t("price_check_page.fuel_type")}
                    icon={Zap}
                    value={form.fuel_type}
                    options={fuelTypeOptions}
                    onChange={(value) => handleChange('fuel_type', value)}
                    placeholder={t("price_check_page.select_fuel_type")}
                    error={Boolean(errors.fuel_type)}
                  />
                  {errors.fuel_type && <p className="pc-error">{errors.fuel_type}</p>}
                </div>

                {/* Transmission */}
                <div className="pc-field">
                  <AppDropdown
                    label={t("price_check_page.transmission")}
                    icon={SlidersHorizontal}
                    value={form.gear_type}
                    options={gearTypeOptions}
                    onChange={(value) => handleChange('gear_type', value)}
                    placeholder={t("price_check_page.select_transmission")}
                    error={Boolean(errors.gear_type)}
                  />
                  {errors.gear_type && <p className="pc-error">{errors.gear_type}</p>}
                </div>

                {/* Condition */}
                <div className="pc-field">
                  <AppDropdown
                    label={t("price_check_page.condition")}
                    icon={Shield}
                    value={form.condition}
                    options={conditionOptions}
                    onChange={(value) => handleChange('condition', value)}
                  />
                </div>

                {/* Town */}
                <div className="pc-field md:col-span-2">
                  <label className="pc-label"><MapPin className="pc-label-icon" /> {t("price_check_page.town")}</label>
                  <input className="pc-input" placeholder={t("price_check_page.town_placeholder")} value={form.town} onChange={(e) => handleChange('town', e.target.value)} />
                </div>

                <div className="pc-helper-note md:col-span-2">
                  <Info className="h-[13px] w-[13px]" />
                  <p>{t("price_check_page.training_note")}</p>
                </div>
              </div>

              {/* Submit */}
              <div>
                <button type="submit" disabled={isLoading} className="pc-submit group">
                  {isLoading ? (
                    <>
                      <Loader className="h-[15px] w-[15px] animate-spin" />
                      <span>{t("price_check_page.analyzing")}</span>
                    </>
                  ) : (
                    <>
                      <Cpu className="h-[15px] w-[15px]" />
                      <span>{t("price_check_page.submit")}</span>
                      <ArrowRight className="h-[15px] w-[15px]" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
        <PriceCheckInsights insights={insights} recentPredictions={recentPredictions} onViewAnalytics={() => navigate("/analytics")} />
      </div>
    </div>
  )
}

export default PriceCheck
