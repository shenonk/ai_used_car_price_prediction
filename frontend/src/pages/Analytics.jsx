import { useEffect, useMemo, useState } from "react"
import { Line } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from "chart.js"
import { loadPredictionHistory } from "../utils/predictionHistory"
import analyticsTrends from "../data/analytics_trends.json"
import marketTrends from "../data/market_trends.json"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

const CURRENCY_FORMATTER = new Intl.NumberFormat("en-LK")
const DEPRECIATION_ASSUMPTION_LABEL = "10% (0-3 yrs), 7% (4-7 yrs), 5% (8+ yrs)"

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
  const pointMap = new Map(
    basePoints.map((point) => [Number(point.listingYear), Number(point.medianPrice)])
  )

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

function roundToTwo(value) {
  return Math.round(value * 100) / 100
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
  const [search, setSearch] = useState("")
  const [brandFilter, setBrandFilter] = useState("")
  const [showAll, setShowAll] = useState(false)
  const [savedPredictions, setSavedPredictions] = useState([])
  const [selectedPredictionId, setSelectedPredictionId] = useState("")
  const themeStyles =
    typeof window !== "undefined"
      ? getComputedStyle(document.documentElement)
      : null
  const themeTextPrimary = themeStyles?.getPropertyValue("--text-primary")?.trim() || "#f8fafc"
  const themeTextSecondary = themeStyles?.getPropertyValue("--text-secondary")?.trim() || "#94a3b8"
  const themeSurface = themeStyles?.getPropertyValue("--bg-surface")?.trim() || "#1e293b"
  const themeBorder = themeStyles?.getPropertyValue("--border-color")?.trim() || "#334155"

  useEffect(() => {
    const history = loadPredictionHistory()
    setSavedPredictions(history)
    if (history.length > 0) {
      setSelectedPredictionId(history[0].id)
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

  const data = {
    labels: chartSeries.labels,
    datasets: [{
      label: "Vehicle Value (LKR)",
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
    }],
  }

  const options = {
    responsive: true,
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
      }
    },
    scales: {
      x: { grid: { color: themeBorder }, ticks: { color: themeTextSecondary } },
      y: {
        grid: { color: themeBorder },
        ticks: {
          color: themeTextSecondary,
          callback: (value) => `LKR ${CURRENCY_FORMATTER.format(value)}`,
        },
      }
    }
  }

  const allPredictions = savedPredictions.map((item) => ({
    ...item,
    date: new Date(item.predictedAt).toLocaleDateString("en-LK"),
    price: CURRENCY_FORMATTER.format(Math.round(item.predictedPrice)),
    status: "completed",
  }))

  const brandOptions = [...new Set(savedPredictions.map((item) => item.brand))].sort()

  const filteredPredictions = allPredictions.filter(item => {
    const matchesSearch = search === "" ||
      item.brand.toLowerCase().includes(search.toLowerCase()) ||
      item.model.toLowerCase().includes(search.toLowerCase())
    const matchesBrand = brandFilter === "" || item.brand === brandFilter
    return matchesSearch && matchesBrand
  })

  const displayedPredictions = showAll ? filteredPredictions : filteredPredictions.slice(0, 4)

  return (
    <div className="min-h-screen bg-[#0f172a] p-8">

      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <span className="icon-box icon-box-amber">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </span>
          Analytics Dashboard
        </h1>
        <p className="text-slate-400">Track depreciation trends and prediction history</p>
      </div>

      {/* Depreciation Chart */}
      <div className="card p-6 mb-8 animate-fade-in animate-delay-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>
            Market Value Trend
          </h2>
          <select
            className="input w-auto max-w-full text-sm py-2"
            value={selectedPrediction?.id || ""}
            onChange={(e) => setSelectedPredictionId(e.target.value)}
            disabled={savedPredictions.length === 0}
          >
            {savedPredictions.length === 0 ? (
              <option value="">No saved predictions yet</option>
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
            <div className="h-72"><Line data={data} options={options} /></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="rounded-xl border border-slate-700/60 bg-slate-900/40 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Selected Vehicle</p>
                <p className="mt-2 text-lg font-semibold text-white">{buildVehicleLabel(selectedPrediction)}</p>
              </div>
              <div className="rounded-xl border border-slate-700/60 bg-slate-900/40 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Estimated Current Value</p>
                <p className="mt-2 text-lg font-semibold text-amber-400">
                  LKR {CURRENCY_FORMATTER.format(displayCurrentValue)}
                </p>
              </div>
              <div className="rounded-xl border border-slate-700/60 bg-slate-900/40 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Approximate Annual Depreciation Assumption</p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {chartSeries.source === "projection" ? DEPRECIATION_ASSUMPTION_LABEL : "Dataset-backed market values"}
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-700/60 bg-slate-900/30 px-6 py-14 text-center">
            <p className="text-lg font-medium text-white">No saved predictions yet</p>
            <p className="mt-2 text-sm text-slate-400">
              Run a vehicle price prediction first, and it will appear here automatically for analytics.
            </p>
          </div>
        )}
        <div className="mt-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            <div>
              <p className="font-semibold text-white">
                {chartSeries.source === "projection" ? "Approximate Value Projection" : "Dataset-Based Market Trend"}
              </p>
              <p className="text-sm text-slate-400">
                {chartSeries.note || "This chart is shown for analytical guidance only."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Prediction History */}
      <div className="card p-6 animate-fade-in animate-delay-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
            Prediction History
          </h2>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Search brand or model..."
              className="input w-48 text-sm py-2"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="input w-auto text-sm py-2"
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
            >
              <option value="">All Brands</option>
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
                <th>Date</th>
                <th>Brand</th>
                <th>Model</th>
                <th>Year</th>
                <th>Predicted Price</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {displayedPredictions.length > 0 ? (
                displayedPredictions.map((item, index) => (
                  <tr key={index}>
                    <td className="text-slate-400">{item.date}</td>
                    <td className="text-white font-medium">{item.brand}</td>
                    <td className="text-slate-300">{item.model}</td>
                    <td className="text-slate-400">{item.year}</td>
                    <td className="text-blue-400 font-semibold">LKR {item.price}</td>
                    <td>
                      <span className="badge badge-success">
                        <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                        Completed
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center text-slate-500 py-8">No predictions found matching your search.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex justify-between items-center text-sm text-slate-500">
          <span>Showing {displayedPredictions.length} of {filteredPredictions.length} predictions</span>
          {!showAll && filteredPredictions.length > 4 && (
            <button onClick={() => setShowAll(true)} className="text-blue-400 hover:text-blue-300 transition-colors">View All →</button>
          )}
          {showAll && (
            <button onClick={() => setShowAll(false)} className="text-blue-400 hover:text-blue-300 transition-colors">Show Less ←</button>
          )}
        </div>
      </div>
    </div>
  )
}

export default Analytics
