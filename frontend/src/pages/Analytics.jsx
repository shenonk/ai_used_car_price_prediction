import { useEffect, useMemo, useState } from "react"
import { Line } from "react-chartjs-2"
import {
  BarChart2,
  Car,
  Check,
  Clock,
  Cpu,
  Database,
  Download,
  Eye,
  Plus,
  Search,
  Trash2,
  TrendingUp,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js"
import SuccessToast from "../components/auth/SuccessToast"
import AppModal from "../components/AppModal"
import AppDropdown from "../components/AppDropdown"
import { deletePredictionHistoryEntry, loadPredictionHistory } from "../utils/predictionHistory"
import { supabase } from "../utils/supabaseClient"
import analyticsTrends from "../data/analytics_trends.json"
import marketTrends from "../data/market_trends.json"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

const CURRENCY_FORMATTER = new Intl.NumberFormat("en-LK")

function normalizeSupabasePrediction(row) {
  return {
    id: `db-${row.id}`,
    sourceId: row.id,
    brand: row.brand,
    model: row.model,
    year: row.year,
    predictedPrice: Number(row.predicted_price_lkr) || 0,
    predictedAt: new Date(row.created_at).getTime(),
  }
}

async function loadAnalyticsPredictions() {
  const localHistory = loadPredictionHistory()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const currentUserId = session?.user?.id

  if (!session?.access_token || !currentUserId) {
    return {
      predictions: localHistory,
      source: "local",
    }
  }

  const { data, error } = await supabase
    .from("predictions")
    .select("id, brand, model, year, predicted_price_lkr, created_at")
    .eq("user_id", currentUserId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Failed to load Supabase prediction history:", error)
    return {
      predictions: [],
      source: "supabase",
    }
  }

  const remoteHistory = Array.isArray(data) ? data.map(normalizeSupabasePrediction) : []
  return {
    predictions: remoteHistory,
    source: "supabase",
  }
}

function buildVehicleLabel(prediction) {
  return `${prediction.brand} ${prediction.model} ${prediction.year}`
}

function buildExactTrendKey(prediction) {
  return `${prediction.brand}|||${prediction.model}|||${prediction.year}`
}

function buildFamilyTrendKey(prediction) {
  return `${prediction.brand}|||${prediction.model}`
}

function buildMarketTrendKey(prediction) {
  return `${prediction.brand}|||${prediction.model}|||${prediction.year}`
}

function isSuzukiWagonFamily(prediction) {
  return prediction.brand === "SUZUKI" && (prediction.model.includes("WAGON R") || prediction.model.includes("STINGRAY"))
}

function normalizeModelTokens(value) {
  return String(value)
    .trim()
    .toUpperCase()
    .split(/\s+/)
    .filter(Boolean)
}

function isRelatedModelVariant(selectedModel, candidateModel) {
  const selectedTokens = normalizeModelTokens(selectedModel)
  const candidateTokens = normalizeModelTokens(candidateModel)

  if (selectedTokens.length === 0 || candidateTokens.length === 0) {
    return false
  }

  const selectedPhrase = selectedTokens.join(" ")
  const candidatePhrase = candidateTokens.join(" ")

  if (candidatePhrase === selectedPhrase) {
    return true
  }

  if (candidatePhrase.startsWith(`${selectedPhrase} `) || selectedPhrase.startsWith(`${candidatePhrase} `)) {
    return true
  }

  return selectedTokens.every((token) => candidateTokens.includes(token))
}

function getAnnualDepreciationRate(vehicleAge) {
  if (vehicleAge <= 3) {
    return 0.1
  }

  if (vehicleAge <= 7) {
    return 0.07
  }

  return 0.05
}

function generateProjectionSeries(prediction) {
  const currentYear = new Date().getFullYear()
  const manufactureYear = Math.min(Number(prediction.year) || currentYear, currentYear)
  const years = []
  const values = []

  for (let year = manufactureYear; year <= currentYear; year += 1) {
    let estimatedValue = prediction.predictedPrice

    for (let referenceYear = currentYear; referenceYear > year; referenceYear -= 1) {
      const vehicleAgeAtReferenceYear = referenceYear - manufactureYear
      const depreciationRate = getAnnualDepreciationRate(vehicleAgeAtReferenceYear)
      estimatedValue = estimatedValue / (1 - depreciationRate)
    }

    years.push(String(year))
    values.push(Math.max(0, Math.round(estimatedValue)))
  }

  return { years, values }
}

function applyBackwardDepreciation(fromValue, manufactureYear, fromYear, targetYear) {
  let estimatedValue = fromValue

  for (let year = fromYear; year > targetYear; year -= 1) {
    const vehicleAgeAtYear = year - manufactureYear
    const depreciationRate = getAnnualDepreciationRate(vehicleAgeAtYear)
    estimatedValue = estimatedValue / (1 - depreciationRate)
  }

  return estimatedValue
}

function buildFullAnnualTrend(prediction, basePoints, sourceLabel, baseNote) {
  const currentYear = new Date().getFullYear()
  const manufactureYear = Math.min(Number(prediction.year) || currentYear, currentYear)
  const pointMap = new Map(basePoints.map((point) => [Number(point.listingYear), Number(point.medianPrice)]))

  if (!pointMap.has(currentYear)) {
    pointMap.set(currentYear, Number(prediction.predictedPrice))
  }

  const anchorYears = [...pointMap.keys()].sort((a, b) => a - b)
  const firstAnchorYear = anchorYears[0]
  const firstAnchorValue = pointMap.get(firstAnchorYear)
  const labels = []
  const values = []

  for (let year = manufactureYear; year <= currentYear; year += 1) {
    let value

    if (pointMap.has(year)) {
      value = pointMap.get(year)
    } else if (year < firstAnchorYear) {
      value = applyBackwardDepreciation(firstAnchorValue, manufactureYear, firstAnchorYear, year)
    } else {
      const previousYear = [...pointMap.keys()].filter((anchorYear) => anchorYear < year).sort((a, b) => b - a)[0]
      const nextYear = [...pointMap.keys()].filter((anchorYear) => anchorYear > year).sort((a, b) => a - b)[0]

      if (previousYear && nextYear) {
        const previousValue = pointMap.get(previousYear)
        const nextValue = pointMap.get(nextYear)
        const progress = (year - previousYear) / (nextYear - previousYear)
        value = previousValue + (nextValue - previousValue) * progress
      } else if (previousYear) {
        const previousValue = pointMap.get(previousYear)
        const vehicleAgeAtYear = year - manufactureYear
        value = previousValue * (1 - getAnnualDepreciationRate(vehicleAgeAtYear))
      } else {
        value = Number(prediction.predictedPrice)
      }
    }

    labels.push(String(year))
    values.push(Math.max(0, Math.round(value)))
  }

  return {
    labels,
    values,
    source: sourceLabel,
    note: `${baseNote} Missing years are filled to show a complete ${manufactureYear}-${currentYear} annual trend.`,
  }
}

function anchorCurrentYearToPrediction(prediction, series) {
  const currentYear = new Date().getFullYear()
  const predictedPrice = Math.round(Number(prediction.predictedPrice) || 0)
  const points = series.labels.map((label, index) => ({
    year: Number(label),
    value: Number(series.values[index]) || 0,
  }))
  const currentYearPoint = points.find((point) => point.year === currentYear)

  if (currentYearPoint) {
    currentYearPoint.value = predictedPrice
  } else {
    points.push({ year: currentYear, value: predictedPrice })
  }

  const sortedPoints = points
    .filter((point) => Number.isFinite(point.year))
    .sort((a, b) => a.year - b.year)

  return {
    ...series,
    labels: sortedPoints.map((point) => String(point.year)),
    values: sortedPoints.map((point) => Math.round(point.value)),
    note: `${series.note} The ${currentYear} chart point is anchored to the saved predicted price so the analytics current value matches the prediction result.`,
  }
}

function filterPlausibleMarketPoints(prediction, points) {
  if (!isSuzukiWagonFamily(prediction)) {
    return points
  }

  return points.filter((point) => {
    const value = Number(point.marketValueLkr ?? point.medianPrice ?? 0)
    return value >= 1_000_000 && value <= 20_000_000
  })
}

function roundToTwo(value) {
  return Math.round(value * 100) / 100
}

function buildVariantMarketTrendSeries(prediction) {
  const prefix = `${prediction.brand}|||`
  const targetYear = Number(prediction.year)
  const candidateEntries = Object.entries(marketTrends.exactTrends || {}).filter(([key, points]) => {
    if (!key.startsWith(prefix)) {
      return false
    }

    const [, candidateModel, candidateYear] = key.split("|||")
    const manufactureYear = Number(candidateYear)
    const yearMatches = isSuzukiWagonFamily(prediction)
      ? Math.abs(manufactureYear - targetYear) <= 2
      : manufactureYear === targetYear

    if (!yearMatches) {
      return false
    }

    if (isSuzukiWagonFamily(prediction)) {
      const familyMatch = candidateModel.includes("WAGON R") || candidateModel.includes("STINGRAY")
      return familyMatch && filterPlausibleMarketPoints(prediction, points).length > 0
    }

    return isRelatedModelVariant(prediction.model, candidateModel)
  })

  if (candidateEntries.length === 0) {
    return null
  }

  const aggregated = new Map()

  candidateEntries.forEach(([, points]) => {
    filterPlausibleMarketPoints(prediction, points).forEach((point) => {
      const year = Number(point.trendYear)
      const value = Number(point.marketValueLkr)
      const yearValues = aggregated.get(year) || []
      yearValues.push(value)
      aggregated.set(year, yearValues)
    })
  })

  const combinedPoints = [...aggregated.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([trendYear, values]) => {
      const sortedValues = [...values].sort((a, b) => a - b)
      const middleIndex = Math.floor(sortedValues.length / 2)
      const median =
        sortedValues.length % 2 === 0
          ? (sortedValues[middleIndex - 1] + sortedValues[middleIndex]) / 2
          : sortedValues[middleIndex]

      return {
        trendYear,
        marketValueLkr: roundToTwo(median),
      }
    })

  return {
    labels: combinedPoints.map((point) => String(point.trendYear)),
    values: combinedPoints.map((point) => Math.round(point.marketValueLkr)),
    source: isSuzukiWagonFamily(prediction) ? "market_family" : "market_variant",
    note: isSuzukiWagonFamily(prediction)
      ? `Based on plausible ${prediction.brand} Wagon R / Stingray family trend rows from the market trends dataset, using nearby manufacture years where needed.`
      : `Based on related ${prediction.brand} ${prediction.model} variant rows from the market trends dataset for manufacture year ${prediction.year}.`,
  }
}

function getDatasetTrendSeries(prediction) {
  const marketTrend = filterPlausibleMarketPoints(
    prediction,
    marketTrends.exactTrends?.[buildMarketTrendKey(prediction)] || []
  )
  if (marketTrend.length >= 1) {
    return anchorCurrentYearToPrediction(prediction, {
      labels: marketTrend.map((point) => String(point.trendYear)),
      values: marketTrend.map((point) => Math.round(point.marketValueLkr)),
      source: "market",
      note: "Based on the market trends dataset for the same brand, model, and manufacture year.",
    })
  }

  const variantMarketTrend = buildVariantMarketTrendSeries(prediction)
  if (variantMarketTrend) {
    return anchorCurrentYearToPrediction(prediction, variantMarketTrend)
  }

  const exactTrend = analyticsTrends.exactYearTrends?.[buildExactTrendKey(prediction)] || []
  if (exactTrend.length >= 1) {
    return anchorCurrentYearToPrediction(
      prediction,
      buildFullAnnualTrend(
        prediction,
        exactTrend,
        "exact",
        "Based on matching dataset rows for the same brand, model, and manufacture year."
      )
    )
  }

  const familyTrend = analyticsTrends.modelFamilyTrends?.[buildFamilyTrendKey(prediction)] || []
  if (familyTrend.length >= 1) {
    return anchorCurrentYearToPrediction(
      prediction,
      buildFullAnnualTrend(
        prediction,
        familyTrend,
        "family",
        "Based on matching dataset rows for the same brand and model, aggregated across available manufacture years."
      )
    )
  }

  const projection = generateProjectionSeries(prediction)
  return {
    labels: projection.years,
    values: projection.values,
    source: "projection",
    note: "Generated from the saved prediction and a simplified staged depreciation assumption because matching dataset history is too sparse.",
  }
}

function Analytics() {
  const { t, i18n } = useTranslation()
  const [search, setSearch] = useState("")
  const [brandFilter, setBrandFilter] = useState("")
  const [showAll, setShowAll] = useState(false)
  const [savedPredictions, setSavedPredictions] = useState([])
  const [selectedPredictionId, setSelectedPredictionId] = useState("")
  const [historySource, setHistorySource] = useState("local")
  const [isHistoryLoading, setIsHistoryLoading] = useState(true)
  const [deletingPredictionId, setDeletingPredictionId] = useState("")
  const [pendingDeletePrediction, setPendingDeletePrediction] = useState(null)
  const [toast, setToast] = useState({
    isOpen: false,
    type: "success",
    message: "",
    subMessage: "",
  })
  const depreciationAssumptionLabel = t("dashboard_page.depreciation_assumption_value")

  const showToast = (type, message, subMessage = "") => {
    setToast({ isOpen: true, type, message, subMessage })
    window.clearTimeout(window.__analyticsToastTimeout)
    window.__analyticsToastTimeout = window.setTimeout(() => {
      setToast((prev) => ({ ...prev, isOpen: false }))
    }, 3000)
  }

  useEffect(() => {
    let isActive = true

    const refreshPredictions = async () => {
      setIsHistoryLoading(true)
      const { predictions, source } = await loadAnalyticsPredictions()

      if (!isActive) {
        return
      }

      setSavedPredictions(predictions)
      setHistorySource(source)
      setSelectedPredictionId((currentId) => {
        if (predictions.some((prediction) => prediction.id === currentId)) {
          return currentId
        }
        return predictions[0]?.id || ""
      })
      setIsHistoryLoading(false)
    }

    refreshPredictions()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      refreshPredictions()
    })

    return () => {
      isActive = false
      subscription.unsubscribe()
    }
  }, [])

  const selectedPrediction = useMemo(
    () => savedPredictions.find((prediction) => prediction.id === selectedPredictionId) || savedPredictions[0] || null,
    [savedPredictions, selectedPredictionId]
  )

  const chartSeries = useMemo(
    () => (selectedPrediction ? getDatasetTrendSeries(selectedPrediction) : { labels: [], values: [], source: "none", note: "" }),
    [selectedPrediction]
  )

  const displayCurrentValue = useMemo(() => {
    if (!selectedPrediction) {
      return 0
    }

    if (chartSeries.values.length > 0 && chartSeries.source !== "projection") {
      return chartSeries.values[chartSeries.values.length - 1]
    }

    return Math.round(selectedPrediction.predictedPrice)
  }, [chartSeries.source, chartSeries.values, selectedPrediction])

  const trendSourceMeta = useMemo(() => {
    if (!selectedPrediction) {
      return {
        label: t("analytics_page.no_trend_source", { defaultValue: "Waiting for a prediction" }),
        tone: "border-slate-700/70 bg-slate-800/50 text-slate-300",
        title: t("analytics_page.no_trend_title", { defaultValue: "No trend to chart yet" }),
        summary: t("analytics_page.no_trend_summary", {
          defaultValue: "Run Price Check first. Analytics will build a trend view as soon as a prediction is saved.",
        }),
      }
    }

    if (chartSeries.source === "projection") {
      return {
        label: t("analytics_page.projection_badge", { defaultValue: "Projection" }),
        tone: "border-amber-400/25 bg-amber-400/10 text-amber-200",
        title: t("analytics_page.approximate_projection"),
        summary: t("analytics_page.projection_summary", {
          defaultValue:
            "Matching market history is limited, so this line is estimated from the saved prediction and staged depreciation assumptions.",
        }),
      }
    }

    if (chartSeries.source === "market" || chartSeries.source === "market_family" || chartSeries.source === "market_variant") {
      return {
        label: t("analytics_page.market_data_badge", { defaultValue: "Market data" }),
        tone: "border-emerald-400/25 bg-emerald-400/10 text-emerald-200",
        title: t("analytics_page.dataset_market_trend"),
        summary: t("analytics_page.market_data_summary", {
          defaultValue:
            "This trend uses matching or related marketplace rows for the selected vehicle, so it is closer to observed market movement.",
        }),
      }
    }

    return {
      label: t("analytics_page.dataset_badge", { defaultValue: "Dataset trend" }),
      tone: "border-blue-400/25 bg-blue-400/10 text-blue-200",
      title: t("analytics_page.dataset_market_trend"),
      summary: t("analytics_page.dataset_summary", {
        defaultValue:
          "This trend uses matching dataset rows and fills missing years so you can compare a complete annual value path.",
      }),
    }
  }, [chartSeries.source, selectedPrediction, t])

  const data = {
    labels: chartSeries.labels,
    datasets: [
      {
        label: t("analytics_page.vehicle_value_label"),
        data: chartSeries.values,
        borderColor: "#d97706",
        backgroundColor: "rgba(217, 119, 6, 0.08)",
        tension: 0.4,
        fill: true,
        pointBackgroundColor: "#d97706",
        pointBorderColor: "#0d1117",
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: "index",
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#161b22",
        titleColor: "#e6edf3",
        bodyColor: "#7d8590",
        borderColor: "#21262d",
        borderWidth: 0.5,
        cornerRadius: 8,
        padding: 12,
        callbacks: {
          label: (context) => `LKR ${CURRENCY_FORMATTER.format(context.parsed.y)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: "#21262d" },
        ticks: {
          color: "#7d8590",
          font: { size: 11 },
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 6,
        },
      },
      y: {
        grid: { color: "#21262d" },
        ticks: {
          color: "#7d8590",
          font: { size: 11 },
          maxTicksLimit: 5,
          callback: (value) => `LKR ${CURRENCY_FORMATTER.format(value)}`,
        },
      },
    },
  }

  const allPredictions = savedPredictions.map((item) => ({
    ...item,
    date: new Date(item.predictedAt).toLocaleDateString(
      i18n.language === "si" ? "si-LK" : i18n.language === "ta" ? "ta-LK" : "en-LK"
    ),
    price: CURRENCY_FORMATTER.format(Math.round(item.predictedPrice)),
    status: "completed",
  }))

  const brandOptions = [...new Set(savedPredictions.map((item) => item.brand))].sort()

  const filteredPredictions = allPredictions.filter((item) => {
    const matchesSearch =
      search === "" ||
      item.brand.toLowerCase().includes(search.toLowerCase()) ||
      item.model.toLowerCase().includes(search.toLowerCase())
    const matchesBrand = brandFilter === "" || item.brand === brandFilter
    return matchesSearch && matchesBrand
  })

  const displayedPredictions = showAll ? filteredPredictions : filteredPredictions.slice(0, 4)

  const requestDeletePrediction = (prediction) => {
    setPendingDeletePrediction(prediction)
  }

  const cancelDeletePrediction = () => {
    if (deletingPredictionId) {
      return
    }
    setPendingDeletePrediction(null)
  }

  const confirmDeletePrediction = async () => {
    const prediction = pendingDeletePrediction
    if (!prediction) {
      return
    }
    setDeletingPredictionId(prediction.id)

    try {
      if (historySource === "supabase") {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        const currentUserId = session?.user?.id

        if (!currentUserId || !prediction.sourceId) {
          throw new Error(t("analytics_page.missing_record_error"))
        }

        const { error } = await supabase
          .from("predictions")
          .delete()
          .eq("id", prediction.sourceId)
          .eq("user_id", currentUserId)

        if (error) {
          throw error
        }
      } else {
        deletePredictionHistoryEntry(prediction.id)
      }

      setSavedPredictions((current) => current.filter((item) => item.id !== prediction.id))
      setSelectedPredictionId((currentId) => (currentId === prediction.id ? "" : currentId))
      showToast(
        "success",
        t("analytics_page.delete_success_title"),
        t("analytics_page.delete_success_subtitle")
      )
      setPendingDeletePrediction(null)
    } catch (error) {
      console.error("Failed to delete prediction:", error)
      showToast(
        "error",
        t("analytics_page.delete_failed_title"),
        error?.message || t("analytics_page.delete_failed_subtitle")
      )
    } finally {
      setDeletingPredictionId("")
    }
  }

  return (
    <div className="analytics-page">
      <SuccessToast
        isOpen={toast.isOpen && toast.type === "success"}
        message={toast.message}
        subMessage={toast.subMessage}
      />
      <AppModal
        isOpen={Boolean(pendingDeletePrediction)}
        tone="danger"
        eyebrow={t("analytics_page.delete_modal_eyebrow", { defaultValue: "Delete prediction" })}
        title={t("analytics_page.delete_modal_title", { defaultValue: "Remove saved record?" })}
        message={
          pendingDeletePrediction
            ? t("analytics_page.delete_modal_message", {
                label: buildVehicleLabel(pendingDeletePrediction),
                defaultValue: "This will permanently remove {{label}} from your prediction history.",
              })
            : ""
        }
        confirmLabel={
          deletingPredictionId
            ? t("analytics_page.delete_modal_deleting", { defaultValue: "Deleting..." })
            : t("analytics_page.delete_modal_confirm", { defaultValue: "Delete prediction" })
        }
        cancelLabel={t("analytics_page.delete_modal_cancel", { defaultValue: "Cancel" })}
        closeLabel={t("analytics_page.delete_modal_close", { defaultValue: "Close delete dialog" })}
        showCancel
        isBusy={Boolean(deletingPredictionId)}
        onCancel={cancelDeletePrediction}
        onConfirm={confirmDeletePrediction}
      >
        {pendingDeletePrediction && (
          <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-sm font-semibold text-white">{buildVehicleLabel(pendingDeletePrediction)}</p>
            <p className="mt-1 text-sm text-slate-400">
              LKR {CURRENCY_FORMATTER.format(Math.round(pendingDeletePrediction.predictedPrice))}
            </p>
          </div>
        )}
      </AppModal>
      {toast.isOpen && toast.type === "error" && (
        <div className="fixed top-6 right-6 z-50 animate-slide-in-right">
          <div className="theme-surface rounded-r-xl border-l-4 border-rose-500 p-4 min-w-[300px] flex items-start gap-4">
            <div className="bg-rose-500/10 rounded-full p-2">
              <svg className="w-6 h-6 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h4 className="theme-text-primary font-semibold text-lg">{toast.message}</h4>
              {toast.subMessage && <p className="theme-text-secondary text-sm mt-1">{toast.subMessage}</p>}
            </div>
          </div>
        </div>
      )}

      <header className="analytics-hero animate-fade-in">
        <div>
          <div className="analytics-eyebrow">ANALYTICS DASHBOARD</div>
          <h1>Analytics Dashboard</h1>
          <p>Track depreciation trends and prediction history</p>
        </div>
        <div className="analytics-hero-actions">
          <button type="button" className="analytics-ghost-button">
            <Download className="h-[13px] w-[13px]" />
            Export Data
          </button>
          <Link to="/price-check" className="analytics-primary-button">
            <Plus className="h-[13px] w-[13px]" />
            New Prediction
          </Link>
        </div>
      </header>

      <section className="analytics-summary-grid animate-fade-in">
        <article className="analytics-summary-card">
          <Cpu className="analytics-summary-icon analytics-summary-icon--blue" />
          <span>Total Predictions</span>
          <strong>{savedPredictions.length}</strong>
          <p>{historySource === "supabase" ? "Synced from cloud" : "Local browser history"}</p>
        </article>
        <article className="analytics-summary-card analytics-summary-card--blue">
          <TrendingUp className="analytics-summary-icon analytics-summary-icon--green" />
          <span>Estimated Current Value</span>
          <strong>LKR {CURRENCY_FORMATTER.format(displayCurrentValue)}</strong>
          <p>Selected vehicle</p>
        </article>
        <article className="analytics-summary-card">
          <Car className="analytics-summary-icon analytics-summary-icon--purple" />
          <span>Selected Vehicle</span>
          <strong className="analytics-summary-vehicle">{selectedPrediction ? buildVehicleLabel(selectedPrediction) : "No vehicle selected"}</strong>
          <p>From prediction history</p>
        </article>
      </section>

      <section className="analytics-trend-panel animate-fade-in animate-delay-100">
        <div className="analytics-trend-header">
          <div>
            <div className="analytics-trend-title-row">
              <TrendingUp className="h-[14px] w-[14px]" />
              <h2>Market Value Trend</h2>
              <span>{trendSourceMeta.label}</span>
            </div>
            <p>{trendSourceMeta.summary}</p>
          </div>
          <AppDropdown
            value={selectedPrediction?.id || ""}
            onChange={setSelectedPredictionId}
            disabled={savedPredictions.length === 0}
            placeholder={t("analytics_page.no_saved_predictions")}
            options={savedPredictions.map((prediction) => ({
              value: prediction.id,
              label: buildVehicleLabel(prediction),
            }))}
            className="analytics-vehicle-select"
          />
        </div>
        {selectedPrediction ? (
          <>
            <div className="analytics-chart-shell">
              <div className="analytics-chart-legend">
                <span />
                <p>Vehicle Value (LKR)</p>
              </div>
              <Line data={data} options={options} />
            </div>
            <div className="analytics-trend-info-grid">
              <article>
                <span>Selected Vehicle</span>
                <strong>{buildVehicleLabel(selectedPrediction)}</strong>
              </article>
              <article>
                <span>Estimated Current Value</span>
                <strong className="analytics-info-blue">LKR {CURRENCY_FORMATTER.format(displayCurrentValue)}</strong>
              </article>
              <article>
                <span>Depreciation Assumption</span>
                <strong className="analytics-info-muted">
                  {chartSeries.source === "projection" ? depreciationAssumptionLabel : t("analytics_page.dataset_backed_market_values")}
                </strong>
              </article>
            </div>
          </>
        ) : (
          <div className="analytics-empty-state">
            <BarChart2 className="h-8 w-8" />
            <p>No predictions yet</p>
            <span>Run a price check to save your first prediction</span>
            <Link to="/price-check" className="analytics-ghost-button">Start Price Check →</Link>
          </div>
        )}
        <div className="analytics-dataset-banner">
          <Database className="h-[14px] w-[14px]" />
          <div>
            <p>{trendSourceMeta.title}</p>
            <span>{chartSeries.note || t("analytics_page.chart_guidance")}</span>
          </div>
        </div>
      </section>

      <section className="analytics-history-section animate-fade-in animate-delay-200">
        <div className="analytics-history-header">
          <div>
            <div className="analytics-history-title">
              <Clock className="h-[14px] w-[14px]" />
              <h2>Prediction History</h2>
            </div>
            <p>
              {isHistoryLoading
                ? t("analytics_page.loading_saved_predictions")
                : historySource === "supabase"
                  ? "Showing your synced cloud history"
                  : t("analytics_page.local_browser_history")}
            </p>
          </div>
          <div className="analytics-filter-row">
            <label className="analytics-search-wrap">
              <Search className="h-[13px] w-[13px]" />
              <input
                type="text"
                placeholder={t("analytics_page.search_placeholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <AppDropdown
              value={brandFilter}
              onChange={setBrandFilter}
              placeholder={t("analytics_page.all_brands")}
              options={[
                { value: "", label: t("analytics_page.all_brands") },
                ...brandOptions.map((brand) => ({ value: brand, label: brand })),
              ]}
              className="analytics-brand-select"
            />
          </div>
        </div>

        <div className="analytics-table-shell">
          {displayedPredictions.length > 0 ? (
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Brand</th>
                  <th>Model</th>
                  <th>Year</th>
                  <th>Predicted Price</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedPredictions.map((item) => (
                  <tr key={item.id}>
                    <td className="analytics-date-cell">{item.date}</td>
                    <td className="analytics-brand-cell">{item.brand}</td>
                    <td className="analytics-model-cell">{item.model}</td>
                    <td className="analytics-year-cell">{item.year}</td>
                    <td className="analytics-price-cell">LKR {item.price}</td>
                    <td>
                      <span className="analytics-status-badge">
                        <Check className="h-[11px] w-[11px]" />
                        Completed
                      </span>
                    </td>
                    <td>
                      <div className="analytics-actions-cell">
                        <button
                          type="button"
                          onClick={() => setSelectedPredictionId(item.id)}
                          className="analytics-view-button"
                        >
                          <Eye className="h-3 w-3" />
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => requestDeletePrediction(item)}
                          disabled={deletingPredictionId === item.id}
                          className="analytics-delete-button"
                          aria-label={t("analytics_page.delete_aria_label", {
                            label: `${item.brand} ${item.model} ${item.year}`,
                          })}
                          title={t("analytics_page.delete_title")}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="analytics-empty-state analytics-empty-state--table">
              <BarChart2 className="h-8 w-8" />
              <p>No predictions yet</p>
              <span>Run a price check to save your first prediction</span>
              <Link to="/price-check" className="analytics-ghost-button">Start Price Check →</Link>
            </div>
          )}
        </div>

        <div className="analytics-history-footer">
          <span>{t("analytics_page.showing_count", { shown: displayedPredictions.length, total: filteredPredictions.length })}</span>
          {!showAll && filteredPredictions.length > 4 && (
            <button onClick={() => setShowAll(true)} className="analytics-text-button">{t("analytics_page.view_all")}</button>
          )}
          {showAll && (
            <button onClick={() => setShowAll(false)} className="analytics-text-button">{t("analytics_page.show_less")}</button>
          )}
        </div>
      </section>
    </div>
  )
}

export default Analytics
