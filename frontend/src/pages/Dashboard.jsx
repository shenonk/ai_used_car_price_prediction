import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Bar, Line } from "react-chartjs-2"
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js"
import {
  ArrowRight,
  Check,
  Activity,
  AlertCircle,
  BarChart3,
  BellRing,
  Bookmark,
  Calculator,
  CarFront,
  Clock3,
  Coins,
  Eye,
  MapPin,
  LineChart,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  X,
} from "lucide-react"
import { getCurrentUser } from "../utils/auth"
import { loadPredictionHistory } from "../utils/predictionHistory"
import { supabase } from "../utils/supabaseClient"
import { loadUserAlerts } from "../utils/userAlerts"
import analyticsTrends from "../data/analytics_trends.json"
import marketTrends from "../data/market_trends.json"
import {
  dismissNotification,
  inferNotificationType,
  loadDismissedNotificationIds,
  loadReadNotificationIds,
  markNotificationAsRead,
} from "../utils/notifications"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Filler, Tooltip)

const SRI_LANKA_DISTRICT_CITIES = [
  ["Colombo", ["Colombo", "Dehiwala-Mount Lavinia", "Moratuwa", "Sri Jayawardenepura Kotte", "Malabe", "Maharagama", "Nugegoda", "Padukka", "Avissawella"]],
  ["Gampaha", ["Gampaha", "Negombo", "Kelaniya", "Wattala", "Ja-Ela", "Minuwangoda", "Kadawatha", "Ragama", "Kiribathgoda", "Katunayaka", "Katunayake", "Seeduwa"]],
  ["Kalutara", ["Kalutara", "Panadura", "Horana", "Beruwala", "Alutgama", "Matugama", "Bandaragama"]],
  ["Kandy", ["Kandy", "Gampola", "Nawalapitiya", "Peradeniya", "Akurana", "Kadugannawa", "Kundasale"]],
  ["Matale", ["Matale", "Dambulla", "Sigiriya", "Pallepola", "Galewela", "Rattota"]],
  ["Nuwara Eliya", ["Nuwara Eliya", "Hatton", "Talawakele", "Lindula", "Ginigathena", "Walapane"]],
  ["Galle", ["Galle", "Hikkaduwa", "Ambalangoda", "Baddegama", "Bentota", "Karapitiya", "Elpitiya"]],
  ["Matara", ["Matara", "Weligama", "Akuressa", "Deniyaya", "Dikwella", "Kekanadurra"]],
  ["Hambantota", ["Hambantota", "Tangalle", "Beliatta", "Ambalantota", "Tissamaharama"]],
  ["Jaffna", ["Jaffna", "Chavakachcheri", "Point Pedro", "Valvettithurai", "Nallur"]],
  ["Kilinochchi", ["Kilinochchi", "Pallai", "Pooneryn"]],
  ["Mannar", ["Mannar", "Nanattan", "Madhu"]],
  ["Vavuniya", ["Vavuniya", "Cheddikulam", "Nedunkeni"]],
  ["Mullaitivu", ["Mullaitivu", "Puthukkudiyiruppu", "Oddusuddan"]],
  ["Trincomalee", ["Trincomalee", "Kinniya", "Muttur", "Kantale"]],
  ["Batticaloa", ["Batticaloa", "Kattankudy", "Eravur", "Valaichchenai"]],
  ["Ampara", ["Ampara", "Akkaraipattu", "Kalmunai", "Sainthamaruthu", "Pottuvil"]],
  ["Kurunegala", ["Kurunegala", "Kuliyapitiya", "Narammala", "Polgahawela", "Wariyapola", "Pannala", "Giriulla"]],
  ["Puttalam", ["Puttalam", "Chilaw", "Wennappuwa", "Marawila", "Dankotuwa", "Anamaduwa"]],
  ["Anuradhapura", ["Anuradhapura", "Kekirawa", "Tambuttegama", "Medawachchiya", "Mihintale"]],
  ["Polonnaruwa", ["Polonnaruwa", "Kaduruwela", "Medirigiriya", "Hingurakgoda"]],
  ["Badulla", ["Badulla", "Bandarawela", "Haputale", "Welimada", "Mahiyanganaya", "Diyatalawa"]],
  ["Moneragala", ["Moneragala", "Wellawaya", "Buttala", "Kataragama", "Bibile"]],
  ["Ratnapura", ["Ratnapura", "Balangoda", "Pelmadulla", "Embilipitiya", "Kuruwita"]],
  ["Kegalle", ["Kegalle", "Mawanella", "Warakapola", "Rambukkana", "Ruwanwella"]],
]

const SRI_LANKA_DISTRICT_NAMES = new Set(SRI_LANKA_DISTRICT_CITIES.map(([district]) => district.toLowerCase()))
const SRI_LANKA_CITY_TO_DISTRICT = SRI_LANKA_DISTRICT_CITIES.reduce((acc, [district, cities]) => {
  cities.forEach((city) => {
    acc[city.toLowerCase()] = district
  })
  return acc
}, {})

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

function formatListingName(listing) {
  return `${listing.brand || "Vehicle"} ${listing.model || ""}`.trim()
}

function toTimestamp(value) {
  const timestamp = new Date(value).getTime()
  return Number.isFinite(timestamp) ? timestamp : 0
}

function buildVehicleKey(brand, model) {
  return `${String(brand || "").trim().toUpperCase()}|||${String(model || "").trim().toUpperCase()}`
}

function getMonthKey(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

function getLastSixMonths() {
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date()
    date.setDate(1)
    date.setMonth(date.getMonth() - (5 - index))
    return {
      key: getMonthKey(date),
      label: date.toLocaleDateString("en-LK", { month: "short" }),
    }
  })
}

function buildExactTrendKey(prediction) {
  return `${prediction.brand}|||${prediction.model}|||${prediction.year}`
}

function buildMarketTrendKey(prediction) {
  return `${prediction.brand}|||${prediction.model}|||${prediction.year}`
}

function buildFamilyTrendKey(prediction) {
  return `${prediction.brand}|||${prediction.model}`
}

function normalizeTrendPrediction(prediction) {
  return {
    ...prediction,
    brand: String(prediction?.brand || "TOYOTA").trim().toUpperCase(),
    model: String(prediction?.model || "AQUA").trim().toUpperCase(),
    year: Number(prediction?.year || new Date().getFullYear()),
    predictedPrice: Number(prediction?.predictedPrice || 4_500_000),
  }
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

  if (selectedTokens.length === 0 || candidateTokens.length === 0) return false

  const selectedPhrase = selectedTokens.join(" ")
  const candidatePhrase = candidateTokens.join(" ")

  if (candidatePhrase === selectedPhrase) return true
  if (candidatePhrase.startsWith(`${selectedPhrase} `) || selectedPhrase.startsWith(`${candidatePhrase} `)) return true

  return selectedTokens.every((token) => candidateTokens.includes(token))
}

function roundToTwo(value) {
  return Math.round(value * 100) / 100
}

function getAnnualDepreciationRate(vehicleAge) {
  if (vehicleAge <= 3) return 0.1
  if (vehicleAge <= 7) return 0.07
  return 0.05
}

function applyBackwardDepreciation(fromValue, manufactureYear, fromYear, targetYear) {
  let estimatedValue = fromValue

  for (let year = fromYear; year > targetYear; year -= 1) {
    const vehicleAgeAtYear = year - manufactureYear
    estimatedValue = estimatedValue / (1 - getAnnualDepreciationRate(vehicleAgeAtYear))
  }

  return estimatedValue
}

function buildFullAnnualTrend(prediction, basePoints, sourceLabel) {
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
        const progress = (year - previousYear) / (nextYear - previousYear)
        value = pointMap.get(previousYear) + (pointMap.get(nextYear) - pointMap.get(previousYear)) * progress
      } else if (previousYear) {
        value = pointMap.get(previousYear) * (1 - getAnnualDepreciationRate(year - manufactureYear))
      } else {
        value = Number(prediction.predictedPrice)
      }
    }

    labels.push(String(year))
    values.push(Math.max(0, Math.round(value)))
  }

  return { labels, values, source: sourceLabel }
}

function buildVariantMarketTrendSeries(prediction) {
  const prefix = `${prediction.brand}|||`
  const targetYear = Number(prediction.year)
  const candidateEntries = Object.entries(marketTrends.exactTrends || {}).filter(([key]) => {
    if (!key.startsWith(prefix)) return false

    const [, candidateModel, candidateYear] = key.split("|||")
    return Number(candidateYear) === targetYear && isRelatedModelVariant(prediction.model, candidateModel)
  })

  if (candidateEntries.length === 0) return null

  const aggregated = new Map()
  candidateEntries.forEach(([, points]) => {
    points.forEach((point) => {
      const year = Number(point.trendYear)
      const value = Number(point.marketValueLkr)
      if (!Number.isFinite(year) || !Number.isFinite(value) || value <= 0) return
      const values = aggregated.get(year) || []
      values.push(value)
      aggregated.set(year, values)
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

  if (combinedPoints.length === 0) return null

  return {
    labels: combinedPoints.map((point) => String(point.trendYear)),
    values: combinedPoints.map((point) => Math.round(point.marketValueLkr)),
    source: "market_variant",
  }
}

function anchorCurrentYearToPrediction(prediction, series) {
  const currentYear = new Date().getFullYear()
  const points = series.labels.map((label, index) => ({
    year: Number(label),
    value: Number(series.values[index]) || 0,
  }))
  const currentYearPoint = points.find((point) => point.year === currentYear)

  if (currentYearPoint) {
    currentYearPoint.value = Number(prediction.predictedPrice)
  } else {
    points.push({ year: currentYear, value: Number(prediction.predictedPrice) })
  }

  const sortedPoints = points.filter((point) => Number.isFinite(point.year)).sort((a, b) => a.year - b.year)
  return {
    ...series,
    labels: sortedPoints.map((point) => String(point.year)),
    values: sortedPoints.map((point) => Math.round(point.value)),
  }
}

function generateProjectionSeries(prediction) {
  const currentYear = new Date().getFullYear()
  const manufactureYear = Math.min(Number(prediction.year) || currentYear, currentYear)
  const labels = []
  const values = []

  for (let year = manufactureYear; year <= currentYear; year += 1) {
    let estimatedValue = Number(prediction.predictedPrice)
    for (let referenceYear = currentYear; referenceYear > year; referenceYear -= 1) {
      estimatedValue = estimatedValue / (1 - getAnnualDepreciationRate(referenceYear - manufactureYear))
    }
    labels.push(String(year))
    values.push(Math.max(0, Math.round(estimatedValue)))
  }

  return { labels, values, source: "projection" }
}

function getDashboardTrendSeries(predictionInput) {
  const prediction = normalizeTrendPrediction(predictionInput)
  const marketTrend = marketTrends.exactTrends?.[buildMarketTrendKey(prediction)] || []

  if (marketTrend.length > 0) {
    return anchorCurrentYearToPrediction(prediction, {
      labels: marketTrend.map((point) => String(point.trendYear)),
      values: marketTrend.map((point) => Math.round(Number(point.marketValueLkr) || 0)),
      source: "market",
    })
  }

  const variantMarketTrend = buildVariantMarketTrendSeries(prediction)
  if (variantMarketTrend) {
    return anchorCurrentYearToPrediction(prediction, variantMarketTrend)
  }

  const exactTrend = analyticsTrends.exactYearTrends?.[buildExactTrendKey(prediction)] || []
  if (exactTrend.length > 0) {
    return anchorCurrentYearToPrediction(prediction, buildFullAnnualTrend(prediction, exactTrend, "dataset"))
  }

  const familyTrend = analyticsTrends.modelFamilyTrends?.[buildFamilyTrendKey(prediction)] || []
  if (familyTrend.length > 0) {
    return anchorCurrentYearToPrediction(prediction, buildFullAnnualTrend(prediction, familyTrend, "family"))
  }

  return null
}

function average(values) {
  const validValues = values.map(Number).filter((value) => Number.isFinite(value) && value > 0)
  if (validValues.length === 0) return 0
  return validValues.reduce((sum, value) => sum + value, 0) / validValues.length
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
    updatedAt: row.updated_at,
    status: row.status,
    vehicleLocation: row.vehicle_location || "",
    isSpotlight: Boolean(row.is_spotlight),
    isUrgent: Boolean(row.is_urgent),
    isBumped: Boolean(row.is_bumped),
  }
}

function extractDistrictFromLocation(value) {
  const location = String(value || "").trim()
  if (!location) return ""
  if (/not\s+(provided|listed)|unknown/i.test(location)) return ""

  const parts = location
    .split(",")
    .map((part) => part.replace(/\s+district$/i, "").trim())
    .filter(Boolean)

  for (const part of parts) {
    const key = part.toLowerCase()
    if (SRI_LANKA_DISTRICT_NAMES.has(key)) {
      return SRI_LANKA_DISTRICT_CITIES.find(([district]) => district.toLowerCase() === key)?.[0] || part
    }
  }

  for (const part of parts) {
    const district = SRI_LANKA_CITY_TO_DISTRICT[part.toLowerCase()]
    if (district) return district
  }

  return ""
}

function buildDistrictDistribution(listings) {
  const counts = listings.reduce((acc, listing) => {
    const district = extractDistrictFromLocation(listing.vehicleLocation)
    if (!district) return acc

    acc[district] = (acc[district] || 0) + 1
    return acc
  }, {})

  const sortedCounts = Object.entries(counts).sort((a, b) => b[1] - a[1])
  const total = sortedCounts.reduce((sum, [, count]) => sum + count, 0)
  if (!total) return []

  return sortedCounts.map(([label, count]) => ({
    label,
    count,
    percent: Math.round((count / total) * 100),
  }))
}

function alertMatchesListing(alert, listing) {
  const alertVehicle = alert?.vehicle || {}
  const alertBrand = String(alertVehicle.brand || "").trim().toUpperCase()
  const alertModel = String(alertVehicle.model || "").trim().toUpperCase()
  const listingBrand = String(listing.brand || "").trim().toUpperCase()
  const listingModel = String(listing.model || "").trim().toUpperCase()

  if (!alertBrand || alertBrand !== listingBrand) return false
  return !alertModel || !listingModel || listingModel.includes(alertModel) || alertModel.includes(listingModel)
}

function buildLivePriceAlerts(userAlerts, listings) {
  const trackedAlerts = userAlerts.filter((alert) => alert?.tracked !== false && alert?.vehicle)
  if (!trackedAlerts.length) return []

  const now = Date.now()
  const recentWindow = now - 7 * 24 * 60 * 60 * 1000
  const activeListings = listings.filter((listing) => listing.status === "approved")
  const soldListings = listings.filter((listing) => listing.status === "sold")
  const liveAlerts = []

  trackedAlerts.forEach((alert) => {
    const targetPrice = Number(alert.price || 0)
    const matchingListings = activeListings.filter((listing) => alertMatchesListing(alert, listing))
    const cheaperListing = matchingListings
      .filter((listing) => targetPrice > 0 && listing.price > 0 && listing.price <= targetPrice * 0.95)
      .sort((a, b) => a.price - b.price)[0]

    if (cheaperListing) {
      const discount = Math.round(((targetPrice - cheaperListing.price) / targetPrice) * 100)
      liveAlerts.push({
        type: "amber",
        text: `${formatListingName(cheaperListing)} is ${discount}% below your saved estimate`,
        time: formatRelativeDate(cheaperListing.updatedAt || cheaperListing.createdAt),
        timestamp: toTimestamp(cheaperListing.updatedAt || cheaperListing.createdAt),
      })
    }

    const recentMatch = matchingListings
      .filter((listing) => toTimestamp(listing.createdAt) >= recentWindow)
      .sort((a, b) => toTimestamp(b.createdAt) - toTimestamp(a.createdAt))[0]

    if (recentMatch) {
      liveAlerts.push({
        type: "blue",
        text: `New ${formatListingName(recentMatch)} listing matched your alert`,
        time: formatRelativeDate(recentMatch.createdAt),
        timestamp: toTimestamp(recentMatch.createdAt),
      })
    }

    const soldMatch = soldListings
      .filter((listing) => alertMatchesListing(alert, listing))
      .sort((a, b) => toTimestamp(b.updatedAt || b.createdAt) - toTimestamp(a.updatedAt || a.createdAt))[0]

    if (soldMatch) {
      liveAlerts.push({
        type: "green",
        text: `${formatListingName(soldMatch)} was marked sold in the marketplace`,
        time: formatRelativeDate(soldMatch.updatedAt || soldMatch.createdAt),
        timestamp: toTimestamp(soldMatch.updatedAt || soldMatch.createdAt),
      })
    }
  })

  const uniqueAlerts = Array.from(
    new Map(liveAlerts.map((alert) => [`${alert.type}-${alert.text}`, alert])).values()
  )

  return uniqueAlerts.sort((a, b) => b.timestamp - a.timestamp).slice(0, 3)
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

function buildNotificationTimeLabel(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ""
  }

  return date.toLocaleDateString("en-LK", {
    month: "short",
    day: "numeric",
  })
}

async function loadPlatformBrandActivity() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/dashboard/brand-activity?limit=8`)
    if (!response.ok) return []

    const payload = await response.json()
    const topBrands = Array.isArray(payload?.top_brands) ? payload.top_brands : []
    return topBrands
      .map((item) => ({
        label: String(item.label || "").trim(),
        count: Number(item.count || 0),
      }))
      .filter((item) => item.label && item.count > 0)
  } catch (error) {
    console.error("Unable to load platform brand activity", error)
    return []
  }
}

function Dashboard() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(true)
  const [dashboardNotifications, setDashboardNotifications] = useState([])
  const [dashboardData, setDashboardData] = useState({
    user: null,
    predictions: [],
    listings: [],
    financingOptions: [],
    platformBrandActivity: [],
    userAlerts: [],
    alertsCount: 0,
    source: "local",
  })
  const [financeProduct, setFinanceProduct] = useState("loan")
  const [activeTheme, setActiveTheme] = useState(() => {
    if (typeof document === "undefined") return "dark"
    return document.documentElement.dataset.theme === "light" ? "light" : "dark"
  })

  useEffect(() => {
    const syncTheme = (event) => {
      const nextTheme = event?.detail || document.documentElement.dataset.theme
      setActiveTheme(nextTheme === "light" ? "light" : "dark")
    }

    syncTheme()
    window.addEventListener("carpriceai-theme-change", syncTheme)
    return () => window.removeEventListener("carpriceai-theme-change", syncTheme)
  }, [])

  useEffect(() => {
    let isActive = true

    const loadDashboard = async ({ showLoading = true } = {}) => {
      if (showLoading) {
        setIsLoading(true)
      }

      try {
        const user = await getCurrentUser()
        const alerts = loadUserAlerts(user || { email: "guest@example.com", username: "Guest" })
        let predictions = []
        let listings = []
        let financingOptions = []
        let platformBrandActivity = []
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
          .select("id, brand, model, price, created_at, updated_at, status, vehicle_location, is_spotlight, is_urgent, is_bumped")
          .in("status", ["approved", "sold"])
          .order("created_at", { ascending: false })

        if (Array.isArray(marketplaceData)) {
          listings = marketplaceData.map(normalizeMarketplaceListing)
        }

        const { data: financingData } = await supabase
          .from("financing_options")
          .select("id, name, type, fixed_rate, floating_rate, status")
          .eq("status", "Active")
          .order("fixed_rate", { ascending: true })

        if (Array.isArray(financingData)) {
          financingOptions = financingData
            .map((item) => ({
              id: String(item.id || item.name || ""),
              name: String(item.name || "Finance Provider"),
              type: String(item.type || ""),
              rate: Number(item.fixed_rate || item.floating_rate || 0),
            }))
            .filter((item) => item.name && item.rate > 0)
        }

        platformBrandActivity = await loadPlatformBrandActivity()

        if (!isActive) return

        setDashboardData({
          user,
          predictions,
          listings,
          financingOptions,
          platformBrandActivity,
          userAlerts: alerts,
          alertsCount: alerts.length,
          source,
        })
      } catch (error) {
        console.error("Unable to load dashboard data", error)
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    loadDashboard()
    const liveRefreshTimer = window.setInterval(() => {
      loadDashboard({ showLoading: false })
    }, 15000)

    let realtimeChannel = null
    if (typeof supabase.channel === "function") {
      realtimeChannel = supabase
        .channel("dashboard-live-data")
        .on("postgres_changes", { event: "*", schema: "public", table: "marketplace_listings" }, () => {
          loadDashboard({ showLoading: false })
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "predictions" }, () => {
          loadDashboard({ showLoading: false })
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "financing_options" }, () => {
          loadDashboard({ showLoading: false })
        })
        .subscribe()
    }

    return () => {
      isActive = false
      window.clearInterval(liveRefreshTimer)
      if (realtimeChannel && typeof supabase.removeChannel === "function") {
        supabase.removeChannel(realtimeChannel)
      }
    }
  }, [])

  useEffect(() => {
    let isActive = true

    const loadUnreadNotifications = async () => {
      try {
        const user = await getCurrentUser()
        if (!user) {
          if (isActive) {
            setDashboardNotifications([])
          }
          return
        }

        const { data: sessionData } = await supabase.auth.getSession()
        const accessToken = sessionData?.session?.access_token
        const response = await fetch(`${API_BASE_URL}/api/notifications`, {
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        })
        if (!response.ok) {
          throw new Error("Failed to load notifications")
        }

        const data = await response.json()
        const readIds = loadReadNotificationIds(user)
        const dismissedIds = loadDismissedNotificationIds(user)
        const unreadItems = (data.notifications || [])
          .filter((item) => !readIds.includes(item.id) && !dismissedIds.includes(item.id))
          .sort((a, b) => toTimestamp(b.created_at) - toTimestamp(a.created_at))
          .slice(0, 3)
          .map((item) => ({
            id: item.id,
            title: item.title,
            message: item.message,
            type: inferNotificationType(item.title),
            createdAt: item.created_at,
            timeLabel: buildNotificationTimeLabel(item.created_at),
          }))

        if (!isActive) {
          return
        }

        setDashboardNotifications(unreadItems)
      } catch (error) {
        if (isActive) {
          setDashboardNotifications([])
        }
      }
    }

    loadUnreadNotifications()

    const handleVisibilityRefresh = () => {
      if (document.visibilityState === "visible") {
        loadUnreadNotifications()
      }
    }

    const handleWindowFocus = () => {
      loadUnreadNotifications()
    }

    const intervalId = window.setInterval(() => {
      loadUnreadNotifications()
    }, 30000)

    window.addEventListener("focus", handleWindowFocus)
    document.addEventListener("visibilitychange", handleVisibilityRefresh)

    return () => {
      isActive = false
      window.clearInterval(intervalId)
      window.removeEventListener("focus", handleWindowFocus)
      document.removeEventListener("visibilitychange", handleVisibilityRefresh)
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

  const dashboardView = useMemo(() => {
    const months = getLastSixMonths()
    const predictions = dashboardData.predictions
    const listings = dashboardData.listings
    const activeListings = listings.filter((listing) => listing.status === "approved")
    const latestPrediction = predictions[0] || null
    const previousAverage = average(predictions.slice(4, 8).map((item) => item.predictedPrice))
    const currentAverage = average(predictions.slice(0, 4).map((item) => item.predictedPrice))
    const avgChange = previousAverage > 0 ? ((currentAverage - previousAverage) / previousAverage) * 100 : 6.4

    const modelCounts = predictions.reduce((acc, item) => {
      const key = buildVehicleKey(item.brand, item.model)
      if (!key.trim()) return acc
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})
    const [topVehicleKey] = Object.entries(modelCounts).sort((a, b) => b[1] - a[1])[0] || []
    const [topBrand = latestPrediction?.brand || "User", topModel = latestPrediction?.model || "Vehicle"] =
      topVehicleKey?.split("|||") || []

    const trendPrediction = latestPrediction || {
      brand: topBrand,
      model: topModel,
      year: new Date().getFullYear(),
      predictedPrice: currentAverage || 4_500_000,
    }
    const datasetTrend = getDashboardTrendSeries(trendPrediction)
    const userTrend = datasetTrend?.values || []

    const marketBase = average(activeListings.map((item) => item.price)) || average(userTrend) || 0

    const topBrands = dashboardData.platformBrandActivity

    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)
    const todayTimestamp = startOfToday.getTime()
    const weekTimestamp = Date.now() - 7 * 24 * 60 * 60 * 1000
    const predictionsToday = predictions.filter((item) => toTimestamp(item.predictedAt) >= todayTimestamp).length
    const listingsToday = activeListings.filter((item) => toTimestamp(item.createdAt) >= todayTimestamp).length
    const priceDrops = activeListings.filter((item) => toTimestamp(item.createdAt) >= weekTimestamp && item.price < marketBase).length
    const totalAdViews = activeListings.reduce((sum, item) => sum + Number(item.view_count || item.views || 0), 0)

    const districtDistribution = buildDistrictDistribution(activeListings)
    const mostActiveDistrict = districtDistribution[0]?.label || "No listings"
    const liveAlerts = buildLivePriceAlerts(dashboardData.userAlerts, listings)

    const recentVehicle = latestPrediction || {
      brand: "Vehicle",
      model: "Estimate",
      predictedPrice: currentAverage || 4_500_000,
    }
    const depreciationValues = Array.from({ length: 5 }, (_, index) =>
      Number(recentVehicle.predictedPrice || 0) * Math.pow(0.88, index)
    )

    return {
      months,
      trendLabels: datasetTrend?.labels || [],
      trendSource: datasetTrend?.source || "none",
      avgChange,
      totalAdViews,
      todayAdViews: Math.max(listingsToday, 0),
      topVehicleName: `${topBrand} ${topModel}`.trim(),
      userTrend,
      hasDatasetTrend: Boolean(datasetTrend),
      topBrands,
      pulse: [
        { label: "Listings today", value: listingsToday || activeListings.length, color: "#3fb950" },
        { label: "Predictions today", value: predictionsToday || predictions.length, color: "#58a6ff" },
        { label: "Avg days to sell", value: "18 days", color: "#d29922" },
        { label: "Most active district", value: mostActiveDistrict, color: "#a371f7" },
        { label: "Price drops this week", value: priceDrops, color: "#f85149" },
      ],
      districts: districtDistribution,
      alerts: liveAlerts,
      depreciationLabels: ["Year 1", "Year 2", "Year 3", "Year 4", "Year 5"],
      depreciationValues,
    }
  }, [dashboardData.listings, dashboardData.platformBrandActivity, dashboardData.predictions, dashboardData.userAlerts])

  const isLightDashboard = activeTheme === "light"
  const chartTheme = useMemo(
    () => (
      isLightDashboard
        ? {
            text: "#475569",
            muted: "#64748b",
            grid: "rgba(148, 163, 184, 0.3)",
            tooltipBg: "#ffffff",
            tooltipTitle: "#0f172a",
            tooltipBody: "#475569",
            tooltipBorder: "rgba(148, 163, 184, 0.32)",
            financeGrid: "rgba(217, 119, 6, 0.16)",
            financeText: "#92400e",
            financePointBorder: "#ffffff",
          }
        : {
            text: "#7d8590",
            muted: "#c9d1d9",
            grid: "#21262d",
            tooltipBg: "#161b22",
            tooltipTitle: "#f0f6fc",
            tooltipBody: "#c9d1d9",
            tooltipBorder: "#21262d",
            financeGrid: "rgba(210, 153, 34, 0.12)",
            financeText: "#c9a45f",
            financePointBorder: "#0d1117",
          }
    ),
    [isLightDashboard]
  )

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: chartTheme.text,
            boxWidth: 10,
            boxHeight: 10,
            font: { size: 10 },
          },
        },
        tooltip: {
          backgroundColor: chartTheme.tooltipBg,
          titleColor: chartTheme.tooltipTitle,
          bodyColor: chartTheme.tooltipBody,
          borderColor: chartTheme.tooltipBorder,
          borderWidth: 0.5,
          displayColors: false,
        },
      },
      scales: {
        x: {
          grid: { color: chartTheme.grid },
          ticks: { color: chartTheme.text, font: { size: 10 } },
        },
        y: {
          grid: { color: chartTheme.grid },
          ticks: {
            color: chartTheme.text,
            font: { size: 10 },
            callback: (value) => `${Number(value) / 1_000_000}M`,
          },
        },
      },
    }),
    [chartTheme]
  )

  const priceTrendData = useMemo(
    () => ({
      labels: dashboardView.trendLabels,
      datasets: [
        {
          label: `${dashboardView.topVehicleName} value trend`,
          data: dashboardView.userTrend,
          borderColor: "#58a6ff",
          backgroundColor: "rgba(88, 166, 255, 0.12)",
          fill: true,
          tension: 0.4,
          pointRadius: 2,
          pointBackgroundColor: "#58a6ff",
        },
      ],
    }),
    [dashboardView]
  )

  const financeProducts = [
    { id: "loan", label: t("dashboard_page.finance.loan", { defaultValue: "Loan" }), types: ["Personal Loan", "Bank", "Loan"] },
    { id: "leasing", label: t("dashboard_page.finance.leasing", { defaultValue: "Leasing" }), types: ["Leasing"] },
    { id: "draft", label: t("dashboard_page.finance.draft", { defaultValue: "Draft" }), types: ["Draft"] },
  ]

  const selectedFinanceProduct = financeProducts.find((item) => item.id === financeProduct) || financeProducts[0]

  const financeRateRows = useMemo(() => {
    return dashboardData.financingOptions
      .filter((item) => selectedFinanceProduct.types.includes(item.type))
      .sort((a, b) => a.rate - b.rate)
      .slice(0, 10)
  }, [dashboardData.financingOptions, selectedFinanceProduct])

  const financeRateSummary = useMemo(() => {
    if (!financeRateRows.length) {
      return { lowest: null, highest: null, average: 0 }
    }

    const lowest = financeRateRows[0]
    const highest = financeRateRows[financeRateRows.length - 1]
    const averageRate = financeRateRows.reduce((sum, item) => sum + item.rate, 0) / financeRateRows.length
    return { lowest, highest, average: averageRate }
  }, [financeRateRows])

  const financeRateData = useMemo(
    () => ({
      labels: financeRateRows.map((item) => item.name),
      datasets: [
        {
          label: `${selectedFinanceProduct.label} interest rate`,
          data: financeRateRows.map((item) => item.rate),
          borderColor: "#d29922",
          backgroundColor: "rgba(210, 153, 34, 0.12)",
          fill: true,
          tension: 0.32,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: financeRateRows.map((item) => {
            if (financeRateSummary.lowest?.id === item.id) return "#3fb950"
            if (financeRateSummary.highest?.id === item.id) return "#f85149"
            return "#d29922"
          }),
          pointBorderColor: chartTheme.financePointBorder,
          pointBorderWidth: 2,
        },
      ],
    }),
    [chartTheme.financePointBorder, financeRateRows, financeRateSummary.highest, financeRateSummary.lowest, selectedFinanceProduct]
  )

  const financeRateOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: chartTheme.tooltipBg,
          titleColor: chartTheme.tooltipTitle,
          bodyColor: chartTheme.tooltipBody,
          borderColor: "#d29922",
          borderWidth: 0.5,
          displayColors: false,
          callbacks: {
            label: (context) => `Interest rate: ${Number(context.parsed.y || 0).toFixed(2)}%`,
          },
        },
      },
      scales: {
        x: {
          grid: { color: chartTheme.financeGrid },
          ticks: {
            color: chartTheme.financeText,
            font: { size: 9 },
            maxRotation: 0,
            minRotation: 0,
            callback(value) {
              const label = this.getLabelForValue(value)
              return label.length > 12 ? `${label.slice(0, 12)}...` : label
            },
          },
        },
        y: {
          grid: { color: chartTheme.financeGrid },
          ticks: {
            color: chartTheme.financeText,
            font: { size: 10 },
            callback: (value) => `${Number(value).toFixed(1)}%`,
          },
        },
      },
    }),
    [chartTheme]
  )

  const depreciationData = useMemo(
    () => ({
      labels: dashboardView.depreciationLabels,
      datasets: [
        {
          data: dashboardView.depreciationValues,
          backgroundColor: ["#58a6ff", "#4694e8", "#388bfd", "#1f6feb", "#1158c7"],
          borderWidth: 0,
          borderRadius: 4,
        },
      ],
    }),
    [dashboardView]
  )

  const username = dashboardData.user?.username || dashboardData.user?.email?.split("@")[0] || t("dashboard_page.default_driver")

  const handleMarkNotificationRead = (id) => {
    markNotificationAsRead(dashboardData.user, id)
    setDashboardNotifications((current) => current.filter((item) => item.id !== id))
  }

  const handleDismissNotification = (event, id) => {
    event.stopPropagation()
    dismissNotification(dashboardData.user, id)
    setDashboardNotifications((current) => current.filter((item) => item.id !== id))
  }

  const notificationToneClasses = {
    info: "border-blue-400/20 bg-blue-500/10 text-blue-100",
    success: "border-emerald-400/20 bg-emerald-500/10 text-emerald-100",
    default: "border-white/10 bg-white/8 text-slate-100",
  }

  return (
    <div className="page-dashboard dashboard-page animate-fade-in min-h-screen bg-[#0d1117] p-5 text-[#f0f6fc] md:p-8">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Saved Predictions" value={summary.totalPredictions} subLabel={dashboardData.source === "supabase" ? "Cloud history" : "Local history"} icon={<Bookmark className="h-4 w-4" />} />
        <MetricCard label="Avg Estimate" value={summary.totalPredictions > 0 ? formatCompactCurrency(summary.averagePrice) : "LKR 0"} subLabel="Recent saved valuations" trend={dashboardView.avgChange} icon={<Coins className="h-4 w-4" />} />
        <MetricCard label="Total Ad Views" value={dashboardView.totalAdViews.toLocaleString("en-LK")} subLabel={`+${dashboardView.todayAdViews} today`} icon={<Eye className="h-4 w-4" />} />
        <MetricCard label="Active Alerts" value={dashboardData.alertsCount} subLabel="Price alert rules" icon={<BellRing className="h-4 w-4 text-[#d29922]" />} accent="#d29922" />
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <Panel icon={<LineChart className="h-4 w-4" />} title="LKR Price Trend" subtitle={`${dashboardView.topVehicleName} using ${dashboardView.trendSource === "none" ? "available saved data" : "market analytics dataset"}`}>
          {dashboardView.hasDatasetTrend ? (
            <div className="relative h-[280px]">
              <Line data={priceTrendData} options={chartOptions} />
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-[#21262d] bg-[#0d1117] px-4 py-10 text-center">
              <p className="text-xs font-medium text-[#7d8590]">{t("dashboard_page.no_verified_trend")}</p>
              <p className="mt-1 text-[11px] text-[#484f58]">{t("dashboard_page.trend_waiting")}</p>
            </div>
          )}
        </Panel>

        <Panel icon={<TrendingUp className="h-4 w-4" />} title="Top Searched Brands" subtitle="Live platform-wide prediction searches">
          <HorizontalList items={dashboardView.topBrands} colors={["#58a6ff", "#a371f7", "#39c5cf", "#3fb950", "#d29922", "#f85149"]} />
        </Panel>
      </section>

      <section className="mt-4">
        <Panel
          icon={<Calculator className="h-4 w-4" />}
          title="Financing Rate Analytics"
          subtitle="Live bank and leasing interest-rate comparison"
          action={
            <div className="dashboard-finance-toggle">
              {financeProducts.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={financeProduct === item.id ? "is-active" : ""}
                  onClick={() => setFinanceProduct(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          }
        >
          {financeRateRows.length > 0 ? (
            <div className="dashboard-finance-panel">
              <div className="dashboard-finance-chart">
                <Line data={financeRateData} options={financeRateOptions} />
              </div>
              <div className="dashboard-finance-stats">
                <article>
                  <span>{t("dashboard_page.lowest_rate")}</span>
                  <strong>{financeRateSummary.lowest?.rate.toFixed(2)}%</strong>
                  <p>{financeRateSummary.lowest?.name}</p>
                </article>
                <article>
                  <span>{t("dashboard_page.average_rate")}</span>
                  <strong>{financeRateSummary.average.toFixed(2)}%</strong>
                  <p>{financeRateRows.length} active providers</p>
                </article>
                <article>
                  <span>{t("dashboard_page.highest_rate")}</span>
                  <strong>{financeRateSummary.highest?.rate.toFixed(2)}%</strong>
                  <p>{financeRateSummary.highest?.name}</p>
                </article>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-[#3d2a0a] bg-[#130f08] px-4 py-10 text-center">
              <p className="text-xs font-medium text-[#d29922]">{t("dashboard_page.no_finance_rates", { product: selectedFinanceProduct.label.toLowerCase() })}</p>
              <p className="mt-1 text-[11px] text-[#7d8590]">{t("dashboard_page.add_finance_rates")}</p>
            </div>
          )}
        </Panel>
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-3">
        <Panel
          icon={<Activity className="h-4 w-4" />}
          title="Market Pulse"
          subtitle="Live marketplace and prediction signals"
          action={<span className="rounded-full bg-[#238636] px-2 py-0.5 text-[10px] font-medium text-white">{t("dashboard_page.live")}</span>}
        >
          <div className="space-y-3">
            {dashboardView.pulse.map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-3 text-sm">
                <span className="flex items-center gap-2 text-[#c9d1d9]">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.label}
                </span>
                <span className="font-medium text-[#f0f6fc]">{item.value}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel icon={<MapPin className="h-4 w-4" />} title="Listings by District" subtitle="Marketplace distribution">
          <PercentList items={dashboardView.districts} />
        </Panel>

        <Panel icon={<AlertCircle className="h-4 w-4" />} title="Price Alerts" subtitle="Recent alert activity">
          <div className="space-y-3">
            {dashboardView.alerts.length > 0 ? (
              dashboardView.alerts.map((alert) => (
                <div
                  key={`${alert.type}-${alert.text}`}
                  className={`border-l-2 bg-[#0d1117] px-3 py-2 ${alert.type === "amber" ? "border-[#d29922]" : alert.type === "blue" ? "border-[#58a6ff]" : "border-[#3fb950]"}`}
                >
                  <p className="text-xs font-medium text-[#c9d1d9]">{alert.text}</p>
                  <p className="mt-1 text-[10px] text-[#7d8590]">{alert.time}</p>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-[#21262d] bg-[#0d1117] px-4 py-8 text-center">
                <p className="text-xs font-medium text-[#7d8590]">{t("dashboard_page.no_live_alerts")}</p>
                <p className="mt-1 text-[11px] text-[#484f58]">{t("dashboard_page.save_prediction_alert_hint")}</p>
              </div>
            )}
          </div>
        </Panel>
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Panel
          icon={<CarFront className="h-4 w-4" />}
          title="Recent Predictions"
          subtitle="Latest saved vehicle valuations"
          action={
            <button type="button" onClick={() => navigate("/analytics")} className="btn-ghost btn-compact">
              View all
            </button>
          }
        >
          <div className="space-y-3">
            {isLoading ? (
              <p className="py-8 text-center text-xs text-[#7d8590]">{t("dashboard_page.loading")}</p>
            ) : recentPredictions.length > 0 ? (
              recentPredictions.map((item, index) => (
                <button key={item.id} type="button" onClick={() => navigate("/analytics")} className="panel panel-interactive flex w-full items-center gap-3 px-3 py-3 text-left">
                  <span className="flex h-9 w-9 items-center justify-center rounded-md" style={{ backgroundColor: ["#1f6feb", "#8957e5", "#0891b2", "#238636"][index % 4] }}>
                    <CarFront className="h-4 w-4 text-white" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-[#f0f6fc]">{item.brand} {item.model}</span>
                    <span className="mt-0.5 block text-[10px] text-[#7d8590]">{item.year} · {formatRelativeDate(item.predictedAt)}</span>
                  </span>
                  <span className="text-right text-sm font-medium text-[#f0f6fc]">{formatCurrency(item.predictedPrice)}</span>
                </button>
              ))
            ) : (
              <p className="py-8 text-center text-xs text-[#7d8590]">{t("dashboard_page.no_predictions_yet")}</p>
            )}
          </div>
        </Panel>

        <Panel icon={<BarChart3 className="h-4 w-4" />} title="Depreciation Insight" subtitle="Projected value over 5 years">
          <div className="relative h-[280px]">
            <Bar
              data={depreciationData}
              options={{
                ...chartOptions,
                plugins: { ...chartOptions.plugins, legend: { display: false } },
              }}
            />
          </div>
        </Panel>
      </section>
    </div>
  )
}

function Panel({ icon, title, subtitle, action, children }) {
  return (
    <section className="dashboard-page-panel panel">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-[13px] font-medium text-[#f0f6fc]">
            <span className="text-[#58a6ff]">{icon}</span>
            {title}
          </h2>
          <p className="mt-1 text-[10px] text-[#7d8590]">{subtitle}</p>
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

function MetricCard({ label, value, subLabel, trend, icon, accent = "#58a6ff" }) {
  const isNegative = Number(trend) < 0
  return (
    <section className="dashboard-page-panel metric-card blue">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#7d8590]">{label}</p>
          <p className="mt-2 text-[20px] font-medium leading-tight text-[#f0f6fc]">{value}</p>
          <p className="mt-1 text-[10px] text-[#7d8590]">{subLabel}</p>
        </div>
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#0d1117]" style={{ color: accent }}>
          {icon}
        </span>
      </div>
      {typeof trend === "number" && (
        <p className={`mt-3 text-[10px] font-medium ${isNegative ? "text-[#f85149]" : "text-[#3fb950]"}`}>
          {isNegative ? "↓" : "↑"} {Math.abs(trend).toFixed(1)}% this week
        </p>
      )}
    </section>
  )
}

function HorizontalList({ items, colors }) {
  const { t } = useTranslation()
  const max = Math.max(...items.map((item) => item.count), 1)
  const total = items.reduce((sum, item) => sum + Number(item.count || 0), 0)
  if (!items.length) {
    return <p className="py-8 text-center text-xs text-[#7d8590]">{t("dashboard_page.no_platform_search_activity")}</p>
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const color = colors[index % colors.length]
        return (
          <div key={item.label}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-medium text-[#c9d1d9]">{item.label}</span>
              <span className="text-[#7d8590]">
                {item.count} · {total ? Math.round((Number(item.count || 0) / total) * 100) : 0}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-[#0d1117]">
              <div className="h-2 rounded-full" style={{ width: `${Math.max(6, (item.count / max) * 100)}%`, backgroundColor: color }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function PercentList({ items }) {
  const { t } = useTranslation()
  const [showAll, setShowAll] = useState(false)
  const colors = ["#58a6ff", "#4694e8", "#388bfd", "#1f6feb", "#1158c7", "#0d419d"]
  if (!items.length) {
    return (
      <div className="rounded-lg border border-dashed border-[#21262d] bg-[#0d1117] px-4 py-8 text-center">
        <p className="text-xs font-medium text-[#7d8590]">{t("dashboard_page.no_district_data")}</p>
        <p className="mt-1 text-[11px] text-[#484f58]">{t("dashboard_page.district_waiting")}</p>
      </div>
    )
  }

  const visibleItems = showAll ? items : items.slice(0, 5)

  return (
    <div className="space-y-3">
      {visibleItems.map((item, index) => (
        <div key={item.label}>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="font-medium text-[#c9d1d9]">{item.label}</span>
            <span className="text-[#7d8590]">{item.percent}%</span>
          </div>
          <div className="h-2 rounded-full bg-[#0d1117]">
            <div className="h-2 rounded-full" style={{ width: `${item.percent}%`, backgroundColor: colors[index % colors.length] }} />
          </div>
        </div>
      ))}
      {items.length > 5 && (
        <button type="button" className="btn-ghost mt-1 w-full justify-center !py-2 !text-[11px]" onClick={() => setShowAll((value) => !value)}>
          {showAll ? t("dashboard_page.show_less") : t("dashboard_page.show_all_districts", { count: items.length })}
        </button>
      )}
    </div>
  )
}

export default Dashboard
