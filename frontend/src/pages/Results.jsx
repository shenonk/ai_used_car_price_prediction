import { useLocation, useNavigate } from "react-router-dom"
import { useEffect, useMemo, useState } from "react"
import { useTranslation, Trans } from "react-i18next"
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend as ChartLegend,
  LinearScale,
  Tooltip as ChartTooltip,
} from "chart.js"
import { Bar as ChartBar, Doughnut } from "react-chartjs-2"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import {
  ArrowDown, ArrowRight, ArrowUp, BarChart2, Bookmark, Car,
  Cpu, CreditCard, Landmark, Minus, PieChart as PieChartIcon,
  Plus, RefreshCw, ShieldCheck, TrendingUp,
} from "lucide-react"
import { getCurrentUser } from "../utils/auth"
import { supabase } from "../utils/supabaseClient"
import { loadUserAlerts, upsertUserAlert } from "../utils/userAlerts"
import logoUrl from "../assets/logo/autovaluelk-logo-pdf.png"
import AppModal from "../components/AppModal"

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, ChartTooltip, ChartLegend)

function Results() {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const vehicle = location.state?.vehicle || null
  const predictedPrice = location.state?.predictedPrice || 4500000
  const predictedAt = location.state?.predictedAt || Date.now()
  const predictionKey = location.state?.predictionKey || `${vehicle?.brand || "unknown"}-${vehicle?.model || "unknown"}-${predictedAt}`
  const saveStatus = location.state?.saveStatus || "local_only"
  const saveMessage = location.state?.saveMessage || t("results_page.default_save_message")
  const [alertSet, setAlertSet] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [loanPlans, setLoanPlans] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [dialog, setDialog] = useState(null)

  const formattedPrice = predictedPrice.toLocaleString("en-LK")

  useEffect(() => {
    fetchBestRates()
  }, [])

  useEffect(() => {
    const persistPredictionForCurrentUser = async () => {
      if (!vehicle) {
        return
      }

      const user = await getCurrentUser()
      if (!user) {
        return
      }

      upsertUserAlert(user, {
        predictionKey,
        vehicle,
        price: predictedPrice,
        createdAt: predictedAt,
        source: "prediction",
      })
    }

    persistPredictionForCurrentUser()
  }, [predictionKey, predictedAt, predictedPrice, vehicle])

  const fetchBestRates = async () => {
    try {
      setIsLoading(true)
      const { data } = await supabase
        .from("financing_options")
        .select("fixed_rate")
        .eq("status", "Active")
        .eq("type", "Bank")
        .order("fixed_rate", { ascending: true })
        .limit(1)

      const bestRate = data && data.length > 0 ? data[0].fixed_rate : 8.5

      const plans = [
        {
          years: 3,
          interest: `${bestRate}%`,
          monthly: Math.round((predictedPrice * 0.9 * (1 + (bestRate / 100 * 3))) / 36).toLocaleString(),
          total: Math.round(predictedPrice * 0.9 * (1 + (bestRate / 100 * 3))).toLocaleString(),
          recommended: true,
        },
        {
          years: 5,
          interest: `${bestRate + 0.5}%`,
          monthly: Math.round((predictedPrice * 0.9 * (1 + ((bestRate + 0.5) / 100 * 5))) / 60).toLocaleString(),
          total: Math.round(predictedPrice * 0.9 * (1 + ((bestRate + 0.5) / 100 * 5))).toLocaleString(),
          recommended: false,
        },
        {
          years: 7,
          interest: `${bestRate + 1.0}%`,
          monthly: Math.round((predictedPrice * 0.9 * (1 + ((bestRate + 1.0) / 100 * 7))) / 84).toLocaleString(),
          total: Math.round(predictedPrice * 0.9 * (1 + ((bestRate + 1.0) / 100 * 7))).toLocaleString(),
          recommended: false,
        },
      ]
      setLoanPlans(plans)
    } catch (err) {
      console.error("Error fetching rates:", err)
      setLoanPlans([
        { years: 3, interest: "8.5%", monthly: "125,000", total: "4,500,000", recommended: true },
        { years: 5, interest: "9%", monthly: "85,000", total: "5,100,000", recommended: false },
        { years: 7, interest: "9.5%", monthly: "65,000", total: "5,460,000", recommended: false },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const pieData = useMemo(
    () => [
      { name: t("results_page.principal"), value: 85.4 },
      { name: t("results_page.interest"), value: 13.7 },
      { name: t("results_page.processing_fee"), value: 0.9 },
    ],
    [t]
  )
  const colors = ["#1d4ed8", "#d97706", "#059669"]

  const downPaymentData = [
    { name: "10%", down: Math.round(predictedPrice * 0.1), monthly: Math.round((predictedPrice * 0.9 * 1.085) / 36) },
    { name: "20%", down: Math.round(predictedPrice * 0.2), monthly: Math.round((predictedPrice * 0.8 * 1.085) / 36) },
    { name: "30%", down: Math.round(predictedPrice * 0.3), monthly: Math.round((predictedPrice * 0.7 * 1.085) / 36) },
    { name: "40%", down: Math.round(predictedPrice * 0.4), monthly: Math.round((predictedPrice * 0.6 * 1.085) / 36) },
  ]

  const handleDownloadPDF = async () => {
    setDownloading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 600))

      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      const user = await getCurrentUser()
      const userEmail = user ? user.username || user.email : t("results_page.guest_user")

      const logoImg = new Image()
      logoImg.src = logoUrl

      await new Promise((resolve) => {
        if (logoImg.complete) resolve()
        else {
          logoImg.onload = resolve
          logoImg.onerror = resolve
        }
      })

      if (logoImg.complete && logoImg.naturalWidth > 0) {
        doc.addImage(logoImg, "PNG", pageWidth / 2 - 15, 10, 30, 30)
      }

      doc.setFont("helvetica", "bold")
      doc.setFontSize(22)
      doc.setTextColor(15, 23, 42)
      doc.text("AutoValueLK", pageWidth / 2, 48, { align: "center" })

      doc.setFont("helvetica", "normal")
      doc.setFontSize(14)
      doc.setTextColor(100, 116, 139)
      doc.text(t("results_page.pdf_report_title"), pageWidth / 2, 56, { align: "center" })

      doc.setFontSize(10)
      doc.setTextColor(71, 85, 105)
      doc.text(`${t("results_page.pdf_generated")}: ${new Date().toLocaleString()}`, 14, 70)
      doc.text(`${t("results_page.pdf_requested_by")}: ${userEmail}`, 14, 76)

      autoTable(doc, {
        startY: 85,
        theme: "grid",
        headStyles: { fillColor: [59, 130, 246] },
        head: [[t("results_page.pdf_vehicle_specs"), t("results_page.pdf_details")]],
        body: [
          [t("results_page.pdf_brand"), vehicle?.brand || "N/A"],
          [t("results_page.pdf_model"), vehicle?.model || "N/A"],
          [t("results_page.pdf_year"), vehicle?.year || "N/A"],
          [t("results_page.pdf_engine"), vehicle?.engine ? `${vehicle.engine} cc` : "N/A"],
          [t("results_page.pdf_mileage"), vehicle?.mileage ? `${vehicle.mileage} km` : "N/A"],
          [t("results_page.pdf_fuel"), vehicle?.fuel || "N/A"],
          [t("results_page.pdf_transmission"), vehicle?.transmission || "N/A"],
          [t("results_page.pdf_condition"), vehicle?.condition || "N/A"],
        ],
      })

      const currentY = doc.lastAutoTable.finalY + 15
      doc.setFont("helvetica", "bold")
      doc.setFontSize(16)
      doc.setTextColor(15, 23, 42)
      doc.text(t("results_page.estimated_market_value"), 14, currentY)

      doc.setFontSize(28)
      doc.setTextColor(16, 185, 129)
      doc.text(`LKR ${formattedPrice}`, 14, currentY + 12)

      doc.setFontSize(10)
      doc.setTextColor(100, 116, 139)
      doc.setFont("helvetica", "italic")
      doc.text(t("results_page.pdf_accuracy_note"), 14, currentY + 20)

      autoTable(doc, {
        startY: currentY + 30,
        theme: "striped",
        headStyles: { fillColor: [15, 23, 42] },
        head: [[
          t("results_page.pdf_loan_duration"),
          t("results_page.pdf_interest_rate"),
          t("results_page.monthly_payment"),
          t("results_page.total_amount"),
        ]],
        body: loanPlans.map((plan) => [
          `${t("results_page.years", { count: plan.years })}${plan.recommended ? ` (${t("results_page.recommended")})` : ""}`,
          plan.interest,
          `LKR ${plan.monthly}`,
          `LKR ${plan.total}`,
        ]),
      })

      const totalPages = doc.internal.getNumberOfPages()
      for (let i = 1; i <= totalPages; i += 1) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(148, 163, 184)
        doc.text(t("results_page.pdf_footer"), pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: "center" })
      }

      doc.save(`AutoValueLK_${vehicle?.brand || "Report"}_${vehicle?.model || ""}.pdf`)
    } catch (err) {
      console.error("PDF generation failed", err)
      setDialog({
        tone: "warning",
        eyebrow: t("results_page.dialog_eyebrow", { defaultValue: "Results" }),
        title: t("results_page.pdf_failed_title", { defaultValue: "PDF generation failed" }),
        message: t("results_page.pdf_failed"),
      })
    } finally {
      setDownloading(false)
    }
  }

  const handleSetAlert = async () => {
    const user = await getCurrentUser()
    if (!user) {
      setDialog({
        tone: "info",
        eyebrow: t("results_page.dialog_eyebrow", { defaultValue: "Results" }),
        title: t("results_page.login_required_title", { defaultValue: "Sign in required" }),
        message: t("results_page.alerts_login_required"),
      })
      return
    }

    const existingAlerts = loadUserAlerts(user)
    const matchingAlert = existingAlerts.find((item) => item.predictionKey === predictionKey)

    upsertUserAlert(user, {
      predictionKey,
      vehicle: vehicle || { brand: "Unknown", model: "Unknown" },
      price: predictedPrice,
      createdAt: matchingAlert?.createdAt || predictedAt,
      source: "prediction",
      tracked: true,
    })

    setAlertSet(true)
    setTimeout(() => setAlertSet(false), 3000)
  }

  const vehicleSummary = vehicle
    ? `${vehicle.brand} ${vehicle.model} • ${vehicle.year} • ${vehicle.engine}cc • ${vehicle.fuel} • ${vehicle.transmission}`
    : null
  const specItems = [
    ["Brand", vehicle?.brand || "N/A"],
    ["Model", vehicle?.model || "N/A"],
    ["Year", vehicle?.year || "N/A"],
    ["Mileage", vehicle?.mileage ? `${Number(vehicle.mileage).toLocaleString()} km` : "N/A"],
    ["Fuel Type", vehicle?.fuel || "N/A"],
    ["Transmission", vehicle?.transmission || "N/A"],
    ["Condition", vehicle?.condition || "N/A"],
    ["Town", vehicle?.town || "N/A"],
  ]
  const marketLow = Math.round(predictedPrice * 0.88)
  const marketAverage = predictedPrice
  const marketHigh = Math.round(predictedPrice * 1.14)
  const marketRows = [
    { icon: ArrowDown, label: "Market low", value: `LKR ${marketLow.toLocaleString("en-LK")}`, color: "#3fb950" },
    { icon: Minus, label: "Market avg", value: `LKR ${marketAverage.toLocaleString("en-LK")}`, color: "#58a6ff" },
    { icon: ArrowUp, label: "Market high", value: `LKR ${marketHigh.toLocaleString("en-LK")}`, color: "#f85149" },
  ]
  const formatChartCurrency = (value) => {
    const numeric = Number(value) || 0
    if (numeric >= 1_000_000) return `LKR ${(numeric / 1_000_000).toFixed(1)}M`
    return `LKR ${Math.round(numeric / 1000)}k`
  }
  const totalLoanAmount = loanPlans[0]?.total ? `LKR ${loanPlans[0].total}` : `LKR ${formattedPrice}`
  const pieLegend = pieData.map((item, index) => ({
    ...item,
    color: colors[index],
    valueLabel: `${item.value}%`,
  }))
  const doughnutChartData = {
    labels: pieData.map((item) => item.name),
    datasets: [
      {
        data: pieData.map((item) => item.value),
        backgroundColor: colors,
        borderWidth: 0,
      },
    ],
  }
  const doughnutChartOptions = {
    cutout: "70%",
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#161b22",
        borderColor: "#21262d",
        borderWidth: 0.5,
        titleColor: "#e6edf3",
        bodyColor: "#7d8590",
      },
    },
  }
  const downPaymentChartData = {
    labels: downPaymentData.map((item) => item.name),
    datasets: [
      {
        label: t("results_page.down_payment_label"),
        data: downPaymentData.map((item) => item.down),
        backgroundColor: "#d97706",
        borderWidth: 0,
      },
      {
        label: t("results_page.monthly_payment"),
        data: downPaymentData.map((item) => item.monthly),
        backgroundColor: "#1d4ed8",
        borderWidth: 0,
      },
    ],
  }
  const downPaymentChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#161b22",
        borderColor: "#21262d",
        borderWidth: 0.5,
        titleColor: "#e6edf3",
        bodyColor: "#7d8590",
        callbacks: {
          label: (context) => `${context.dataset.label}: ${formatChartCurrency(context.parsed.y)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: "#21262d" },
        ticks: { color: "#7d8590" },
      },
      y: {
        grid: { color: "#21262d" },
        ticks: {
          color: "#7d8590",
          callback: (value) => formatChartCurrency(value),
        },
      },
    },
  }

  return (
    <div className="results-page">
      <AppModal
        isOpen={Boolean(dialog)}
        tone={dialog?.tone || "info"}
        eyebrow={dialog?.eyebrow || ""}
        title={dialog?.title || ""}
        message={dialog?.message || ""}
        confirmLabel={t("common.ok", { defaultValue: "OK" })}
        onConfirm={() => setDialog(null)}
      />
      {!vehicle && (
        <div className="app-inline-banner app-inline-banner-info mb-4 animate-fade-in">
          <svg className="w-5 h-5 text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <p className="text-amber-300 text-sm font-medium">{t("results_page.sample_title")}</p>
            <p className="text-slate-400 text-xs">
              <Trans
                i18nKey="results_page.sample_subtitle"
                components={{
                  1: <button onClick={() => navigate("/price-check")} className="text-blue-400 hover:underline" />,
                }}
              />
            </p>
          </div>
        </div>
      )}

      <div className={`mb-4 animate-fade-in ${saveStatus === "cloud" ? "app-inline-banner app-inline-banner-success" : "app-inline-banner app-inline-banner-warning"}`}>
        <svg className={`w-5 h-5 flex-shrink-0 ${saveStatus === "cloud" ? "text-emerald-400" : "text-amber-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {saveStatus === "cloud" ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          )}
        </svg>
        <div>
          <p className={`text-sm font-medium ${saveStatus === "cloud" ? "text-emerald-300" : "text-amber-300"}`}>
            {saveStatus === "cloud" ? t("results_page.saved_cloud") : t("results_page.saved_local")}
          </p>
          <p className="text-slate-400 text-xs">{saveMessage}</p>
        </div>
      </div>

      <header className="results-hero animate-fade-in">
        <div>
          <div className="results-eyebrow">PRICE PREDICTION RESULT</div>
          <h1>Price Prediction Result</h1>
          <p>Based on your vehicle specifications</p>
        </div>
        <div className="results-hero-actions">
          <button type="button" className="results-ghost-button" onClick={handleDownloadPDF} disabled={downloading}>
            <Bookmark className="h-[13px] w-[13px]" />
            Save Prediction
          </button>
          <button type="button" className="results-primary-button" onClick={() => navigate("/price-check")}>
            <Plus className="h-[13px] w-[13px]" />
            New Prediction
          </button>
        </div>
      </header>

      <div className="results-top-grid animate-fade-in">
        <section className="results-value-card">
          <div className="results-value-label">
            <Cpu className="h-[14px] w-[14px]" />
            Estimated Market Value
          </div>
          <div className="results-price">LKR {formattedPrice}</div>
          <div className="results-pill-row">
            <span className="results-pill results-pill--green">
              <ShieldCheck className="h-3 w-3" />
              ±5% accuracy
            </span>
            <span className="results-pill results-pill--amber">
              <RefreshCw className="h-3 w-3" />
              Updated today
            </span>
          </div>
        </section>

        <section className="results-panel">
          <div className="results-panel-heading results-panel-heading--border">
            <span className="results-panel-title"><Car className="h-[14px] w-[14px]" style={{ color: "#7d8590" }} />Vehicle Summary</span>
          </div>
          {vehicleSummary && <p className="results-vehicle-line">{vehicleSummary}</p>}
          <div className="results-spec-grid">
            {specItems.map(([label, value]) => (
              <div className="results-spec-cell" key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="results-three-grid animate-fade-in animate-delay-100">
        <section className="results-panel">
          <div className="results-panel-heading">
            <span className="results-panel-title"><CreditCard className="h-[14px] w-[14px]" style={{ color: "#a78bfa" }} />Loan Repayment Plans</span>
            <p>Estimated monthly payments by tenure</p>
          </div>
          <div>
            {isLoading ? (
              <div className="results-loading">Loading plans...</div>
            ) : loanPlans.length === 0 ? (
              <p className="results-empty-text">{t("results_page.no_loan_plans")}</p>
            ) : (
              loanPlans.map((plan, index) => (
                <div key={index} className={`results-loan-row ${plan.recommended ? "results-loan-row--recommended" : ""}`}>
                  <div className="results-loan-top">
                    <div>
                      <span className="results-loan-tenure">{t("results_page.years", { count: plan.years })}</span>
                      {plan.recommended && <span className="results-recommended-badge">{t("results_page.recommended")}</span>}
                    </div>
                    <span className="results-loan-interest">{plan.interest} {t("results_page.interest_label")}</span>
                  </div>
                  <div className="results-loan-bottom">
                    <div>
                      <span>{t("results_page.monthly_payment")}</span>
                      <strong>LKR {plan.monthly}</strong>
                    </div>
                    <div>
                      <span>{t("results_page.total_amount")}</span>
                      <strong>LKR {plan.total}</strong>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="results-panel">
          <div className="results-panel-heading">
            <span className="results-panel-title"><PieChartIcon className="h-[14px] w-[14px]" style={{ color: "#d29922" }} />Cost Breakdown</span>
            <p>Principal vs interest vs fees</p>
          </div>
          <div className="results-donut-wrap">
            <Doughnut
              data={doughnutChartData}
              options={doughnutChartOptions}
              role="img"
              aria-label="Principal, interest, and processing fee cost breakdown"
            />
            <div className="results-donut-center">
              <span>Total</span>
              <strong>{totalLoanAmount}</strong>
            </div>
          </div>
          <div className="results-chart-legend">
            {pieLegend.map((item) => (
              <div className="results-legend-row" key={item.name}>
                <span><i style={{ background: item.color }} />{item.name}</span>
                <strong>{item.valueLabel}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="results-panel">
          <div className="results-panel-heading">
            <span className="results-panel-title"><TrendingUp className="h-[14px] w-[14px]" style={{ color: "#3fb950" }} />Market Position</span>
            <p>Where your vehicle sits in the market</p>
          </div>
          <div className="results-range">
            <div className="results-range-label">Your estimate</div>
            <div className="results-range-track">
              <span className="results-range-marker results-range-marker--low" />
              <span className="results-range-marker results-range-marker--you" />
              <span className="results-range-marker results-range-marker--high" />
            </div>
            <div className="results-range-values">
              <span>LKR {marketLow.toLocaleString("en-LK")}</span>
              <span>LKR {marketHigh.toLocaleString("en-LK")}</span>
            </div>
          </div>
          <div className="results-market-list">
            {marketRows.map(({ icon: Icon, label, value, color }) => (
              <div className="results-market-row" key={label}>
                <span><Icon className="h-[13px] w-[13px]" style={{ color }} />{label}</span>
                <strong style={{ color }}>{value}</strong>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="results-panel results-down-panel animate-fade-in animate-delay-200">
        <div className="results-panel-heading">
          <span className="results-panel-title"><Landmark className="h-[14px] w-[14px]" style={{ color: "#58a6ff" }} />Down Payment Options</span>
          <p>Impact of down payment on monthly repayment</p>
        </div>
        <div className="results-bar-legend">
          <span><i style={{ background: "#d97706" }} />{t("results_page.down_payment_label")}</span>
          <span><i style={{ background: "#1d4ed8" }} />{t("results_page.monthly_payment")}</span>
        </div>
        <div className="results-bar-wrap">
          <ChartBar
            data={downPaymentChartData}
            options={downPaymentChartOptions}
            role="img"
            aria-label="Down payment and monthly payment by down payment percentage"
          />
        </div>
      </section>

      <div className="results-cta-row animate-fade-in animate-delay-300">
        <button
          onClick={() => navigate("/financing", { state: { vehicle, predictedPrice } })}
          className="results-primary-button results-cta-primary"
        >
          <CreditCard className="h-[14px] w-[14px]" />
          View Financing Options <ArrowRight className="h-[14px] w-[14px]" />
        </button>

        <button
          onClick={handleSetAlert}
          disabled={alertSet}
          className="results-ghost-button results-cta-ghost"
        >
          <BarChart2 className="h-[14px] w-[14px]" />
          {alertSet ? t("results_page.alert_set") : "Save to Analytics"}
        </button>

        <button
          onClick={() => navigate("/price-check")}
          className="results-ghost-button results-cta-ghost"
        >
          <RefreshCw className="h-[14px] w-[14px]" />
          Run New Prediction
        </button>
      </div>
    </div>
  )
}

export default Results
