import { useEffect, useMemo, useState } from "react"
import { Line } from "react-chartjs-2"
import { BarChart3, Search, Sparkles, Trash2 } from "lucide-react"
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
    return {
      labels: marketTrend.map((point) => String(point.trendYear)),
      values: marketTrend.map((point) => Math.round(point.marketValueLkr)),
      source: "market",
      note: "Based on the market trends dataset for the same brand, model, and manufacture year.",
    }
  }

  const variantMarketTrend = buildVariantMarketTrendSeries(prediction)
  if (variantMarketTrend) {
    return variantMarketTrend
  }

  const exactTrend = analyticsTrends.exactYearTrends?.[buildExactTrendKey(prediction)] || []
  if (exactTrend.length >= 1) {
    return buildFullAnnualTrend(
      prediction,
      exactTrend,
      "exact",
      "Based on matching dataset rows for the same brand, model, and manufacture year."
    )
  }

  const familyTrend = analyticsTrends.modelFamilyTrends?.[buildFamilyTrendKey(prediction)] || []
  if (familyTrend.length >= 1) {
    return buildFullAnnualTrend(
      prediction,
      familyTrend,
      "family",
      "Based on matching dataset rows for the same brand and model, aggregated across available manufacture years."
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
  const [toast, setToast] = useState({
    isOpen: false,
    type: "success",
    message: "",
    subMessage: "",
  })
  const themeStyles =
    typeof window !== "undefined"
      ? getComputedStyle(document.documentElement)
      : null
  const themeTextPrimary = themeStyles?.getPropertyValue("--text-primary")?.trim() || "#f8fafc"
  const themeTextSecondary = themeStyles?.getPropertyValue("--text-secondary")?.trim() || "#94a3b8"
  const themeSurface = themeStyles?.getPropertyValue("--bg-surface")?.trim() || "#1e293b"
  const themeBorder = themeStyles?.getPropertyValue("--border-color")?.trim() || "#334155"
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
        borderColor: "#f97316",
        backgroundColor: "rgba(249, 115, 22, 0.1)",
        tension: 0.4,
        fill: true,
        pointBackgroundColor: "#f97316",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 8,
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
      legend: { labels: { color: themeTextSecondary } },
      tooltip: {
        backgroundColor: themeSurface,
        titleColor: themeTextPrimary,
        bodyColor: themeTextSecondary,
        borderColor: themeBorder,
        borderWidth: 1,
        cornerRadius: 12,
        padding: 12,
        callbacks: {
          label: (context) => `LKR ${CURRENCY_FORMATTER.format(context.parsed.y)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: themeBorder },
        ticks: {
          color: themeTextSecondary,
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 6,
        },
      },
      y: {
        grid: { color: themeBorder },
        ticks: {
          color: themeTextSecondary,
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

  const handleDeletePrediction = async (prediction) => {
    const confirmed = window.confirm(
      t("analytics_page.delete_confirm", {
        label: `${prediction.brand} ${prediction.model} ${prediction.year}`,
      })
    )

    if (!confirmed) {
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
    <div className="app-page-shell">
      <SuccessToast
        isOpen={toast.isOpen && toast.type === "success"}
        message={toast.message}
        subMessage={toast.subMessage}
      />
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

      <div className="dashboard-page-hero mb-8 animate-fade-in">
        <div className="dashboard-page-eyebrow mb-4">
          <svg className="h-3.5 w-3.5 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          {t("analytics_page.title")}
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">{t("analytics_page.title")}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">{t("analytics_page.subtitle")}</p>
      </div>

      <div className="dashboard-page-panel mb-8 animate-fade-in animate-delay-100">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>
                {t("analytics_page.market_value_trend")}
              </h2>
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${trendSourceMeta.tone}`}>
                {trendSourceMeta.label}
              </span>
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">{trendSourceMeta.summary}</p>
          </div>
          <select
            className="input w-full text-sm py-2 sm:w-auto sm:min-w-64"
            value={selectedPrediction?.id || ""}
            onChange={(e) => setSelectedPredictionId(e.target.value)}
            disabled={savedPredictions.length === 0}
          >
            {savedPredictions.length === 0 ? (
              <option value="">{t("analytics_page.no_saved_predictions")}</option>
            ) : (
              savedPredictions.map((prediction) => (
                <option key={prediction.id} value={prediction.id}>
                  {buildVehicleLabel(prediction)}
                </option>
              ))
            )}
          </select>
        </div>
        {selectedPrediction ? (
          <>
            <div className="h-[22rem] min-h-72 overflow-hidden rounded-2xl border border-slate-800/70 bg-slate-950/25 p-3 sm:p-4">
              <Line data={data} options={options} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="rounded-xl border border-slate-700/60 bg-slate-900/40 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{t("analytics_page.selected_vehicle")}</p>
                <p className="mt-2 text-lg font-semibold text-white">{buildVehicleLabel(selectedPrediction)}</p>
              </div>
              <div className="rounded-xl border border-slate-700/60 bg-slate-900/40 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{t("analytics_page.estimated_current_value")}</p>
                <p className="mt-2 text-lg font-semibold text-amber-400">
                  LKR {CURRENCY_FORMATTER.format(displayCurrentValue)}
                </p>
              </div>
              <div className="rounded-xl border border-slate-700/60 bg-slate-900/40 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{t("analytics_page.depreciation_assumption")}</p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {chartSeries.source === "projection" ? depreciationAssumptionLabel : t("analytics_page.dataset_backed_market_values")}
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-700/70 bg-slate-900/30 px-6 py-14 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-400/20 bg-amber-400/10 text-amber-300">
              <BarChart3 className="h-6 w-6" />
            </div>
            <p className="mt-5 text-lg font-semibold text-white">{t("analytics_page.no_saved_predictions")}</p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
              {t("analytics_page.run_prediction_hint")}
            </p>
            <Link
              to="/price-check"
              className="mt-6 inline-flex items-center justify-center rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-400"
            >
              {t("analytics_page.run_price_check", { defaultValue: "Run Price Check" })}
            </Link>
          </div>
        )}
        <div className={`mt-6 rounded-xl border p-4 ${trendSourceMeta.tone}`}>
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-white">{trendSourceMeta.title}</p>
              <p className="mt-1 text-sm leading-6 text-slate-300">
                {chartSeries.note || t("analytics_page.chart_guidance")}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-page-panel animate-fade-in animate-delay-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
              {t("analytics_page.prediction_history")}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              {isHistoryLoading
                ? t("analytics_page.loading_saved_predictions")
                : historySource === "supabase"
                  ? t("analytics_page.synced_cloud_history")
                  : t("analytics_page.local_browser_history")}
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <input
              type="text"
              placeholder={t("analytics_page.search_placeholder")}
              className="input w-full text-sm py-2 sm:w-52"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="input w-full text-sm py-2 sm:w-auto"
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
            >
              <option value="">{t("analytics_page.all_brands")}</option>
              {brandOptions.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="table-modern">
            <thead>
              <tr>
                <th>{t("analytics_page.date")}</th>
                <th>{t("analytics_page.brand")}</th>
                <th>{t("analytics_page.model")}</th>
                <th>{t("analytics_page.year")}</th>
                <th>{t("analytics_page.predicted_price")}</th>
                <th>{t("analytics_page.status")}</th>
                <th className="text-right">{t("analytics_page.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {displayedPredictions.length > 0 ? (
                displayedPredictions.map((item) => (
                  <tr key={item.id}>
                    <td className="text-slate-400">{item.date}</td>
                    <td className="text-white font-medium">{item.brand}</td>
                    <td className="text-slate-300">{item.model}</td>
                    <td className="text-slate-400">{item.year}</td>
                    <td className="text-blue-400 font-semibold">LKR {item.price}</td>
                    <td>
                      <span className="badge badge-success">
                        <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                        {t("analytics_page.completed")}
                      </span>
                    </td>
                    <td className="text-right">
                      <button
                        type="button"
                        onClick={() => handleDeletePrediction(item)}
                        disabled={deletingPredictionId === item.id}
                        className="btn-danger p-2 disabled:cursor-not-allowed disabled:opacity-60"
                        aria-label={t("analytics_page.delete_aria_label", {
                          label: `${item.brand} ${item.model} ${item.year}`,
                        })}
                        title={t("analytics_page.delete_title")}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-12">
                    <div className="flex flex-col items-center text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-700/70 bg-slate-900/60 text-slate-400">
                        <Search className="h-5 w-5" />
                      </div>
                      <p className="mt-4 font-medium text-white">{t("analytics_page.no_matching_predictions")}</p>
                      <p className="mt-1 max-w-sm text-sm text-slate-500">
                        {t("analytics_page.no_matching_predictions_hint", {
                          defaultValue: "Try clearing the search term or choosing All Brands.",
                        })}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex justify-between items-center text-sm text-slate-500">
          <span>{t("analytics_page.showing_count", { shown: displayedPredictions.length, total: filteredPredictions.length })}</span>
          {!showAll && filteredPredictions.length > 4 && (
            <button onClick={() => setShowAll(true)} className="btn-text">{t("analytics_page.view_all")}</button>
          )}
          {showAll && (
            <button onClick={() => setShowAll(false)} className="btn-text">{t("analytics_page.show_less")}</button>
          )}
        </div>
      </div>
    </div>
  )
}

export default Analytics
