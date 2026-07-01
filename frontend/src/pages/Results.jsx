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
  ArrowDown, ArrowRight, ArrowUp, BarChart2, Car,
  Cpu, CreditCard, Download, Landmark, Minus, PieChart as PieChartIcon,
  Plus, RefreshCw, ShieldCheck, TrendingUp,
} from "lucide-react"
import { getCurrentUser } from "../utils/auth"
import { supabase } from "../utils/supabaseClient"
import { loadUserAlerts, upsertUserAlert } from "../utils/userAlerts"
import {
  FINANCE_PRODUCTS,
  VEHICLE_CONDITIONS,
  calculateMoneyDraft,
  calculateStandardAmortization,
  getStandardMaxLtv,
} from "../utils/vehicleFinanceEngine"
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
  const [isLightTheme, setIsLightTheme] = useState(() => (
    typeof document !== "undefined" && document.documentElement.dataset.theme === "light"
  ))

  const formattedPrice = predictedPrice.toLocaleString("en-LK")
  const resultVehicleCondition = String(vehicle?.condition || "").toLowerCase().includes("new")
    ? VEHICLE_CONDITIONS.BRAND_NEW
    : VEHICLE_CONDITIONS.USED

  useEffect(() => {
    fetchBestRates()
  }, [])

  useEffect(() => {
    if (typeof document === "undefined") return undefined

    const syncTheme = () => {
      setIsLightTheme(document.documentElement.dataset.theme === "light")
    }

    syncTheme()
    const observer = new MutationObserver(syncTheme)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] })

    return () => observer.disconnect()
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
      const { data, error } = await supabase
        .from("financing_options")
        .select("id,name,type,fixed_rate,floating_rate,max_ltv")
        .eq("status", "Active")

      if (error) throw error

      setLoanPlans(buildCheapestFinanceOptions(data || []))
    } catch (err) {
      console.error("Error fetching rates:", err)
      setLoanPlans(buildCheapestFinanceOptions([
        { id: "sample-loan", name: "Sample Bank", type: "Bank", fixed_rate: 8.5, max_ltv: 60 },
        { id: "sample-leasing", name: "Sample Leasing", type: "Leasing", fixed_rate: 9, max_ltv: 60 },
        { id: "sample-draft", name: "Sample Draft Provider", type: "Draft", fixed_rate: 15.5, max_ltv: 55 },
      ]))
    } finally {
      setIsLoading(false)
    }
  }

  const buildCheapestFinanceOptions = (options) => {
    const productConfig = [
      {
        key: FINANCE_PRODUCTS.VEHICLE_LOAN,
        label: "Vehicle Loan",
        types: ["Personal Loan", "Bank", "Loan"],
        tenureYears: 3,
      },
      {
        key: FINANCE_PRODUCTS.LEASING,
        label: "Leasing",
        types: ["Leasing"],
        tenureYears: 3,
      },
      {
        key: FINANCE_PRODUCTS.MONEY_DRAFT,
        label: "Money Draft",
        types: ["Draft"],
        tenureYears: 2,
      },
    ]

    const plans = productConfig
      .map((product) => {
        const candidates = options
          .filter((item) => product.types.includes(item.type))
          .map((item) => buildFinancePreviewPlan(item, product))
          .filter(Boolean)
          .sort((a, b) => a.monthlyValue - b.monthlyValue)

        return candidates[0] || null
      })
      .filter(Boolean)

    return plans.map((plan) => ({ ...plan, recommended: true }))
  }

  const buildFinancePreviewPlan = (option, product) => {
    const annualRate = Number(option.fixed_rate || option.floating_rate || 0)
    if (!annualRate) return null

    const maxLtv = product.key === FINANCE_PRODUCTS.MONEY_DRAFT
      ? 0.55
      : getStandardMaxLtv(resultVehicleCondition)
    const minDownFromLtv = Math.ceil((1 - maxLtv) * 100)
    const minDownFromBank = option.max_ltv ? Math.ceil(100 - Number(option.max_ltv)) : 20
    const downPaymentPercent = Math.max(20, minDownFromLtv, minDownFromBank)
    const downPayment = Math.round(predictedPrice * (downPaymentPercent / 100))

    const result = product.key === FINANCE_PRODUCTS.MONEY_DRAFT
      ? calculateMoneyDraft({
        vehicleValue: predictedPrice,
        downPayment,
        annualRate,
      })
      : calculateStandardAmortization({
        vehicleValue: predictedPrice,
        downPayment,
        annualRate,
        tenureYears: product.tenureYears,
        vehicleCondition: resultVehicleCondition,
        productType: product.key,
      })

    const totalPayable = result.principal + result.totalInterestPaid

    return {
      productType: product.key,
      productLabel: product.label,
      institution: option.name || "Finance Provider",
      interest: `${annualRate}%`,
      monthly: Math.round(result.monthlyInstallment).toLocaleString("en-LK"),
      monthlyValue: Math.round(result.monthlyInstallment),
      total: Math.round(totalPayable).toLocaleString("en-LK"),
      loanValue: Math.round(result.principal).toLocaleString("en-LK"),
      downPaymentPercent,
      tenureLabel: product.key === FINANCE_PRODUCTS.MONEY_DRAFT ? "24 months" : `${product.tenureYears} years`,
      note: product.key === FINANCE_PRODUCTS.MONEY_DRAFT ? "Interest only" : "Amortized",
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
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = 14
      const user = await getCurrentUser()
      const userEmail = user ? user.username || user.email : t("results_page.guest_user")
      const generatedAt = new Date().toLocaleString("en-LK", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
      const valuationRef = `AVL-${new Date(predictedAt).getFullYear()}-${String(predictedAt).slice(-6)}`
      const vehicleTitle = vehicle
        ? `${vehicle.brand || "Vehicle"} ${vehicle.model || ""} ${vehicle.year || ""}`.replace(/\s+/g, " ").trim()
        : "Sample Vehicle Valuation"
      const fileVehicleName = vehicleTitle.replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "") || "Vehicle"

      const logoImg = new Image()
      logoImg.src = logoUrl

      await new Promise((resolve) => {
        if (logoImg.complete) resolve()
        else {
          logoImg.onload = resolve
          logoImg.onerror = resolve
        }
      })

      doc.setFillColor(13, 17, 23)
      doc.rect(0, 0, pageWidth, 52, "F")
      doc.setFillColor(88, 166, 255)
      doc.rect(0, 50, pageWidth, 2, "F")

      if (logoImg.complete && logoImg.naturalWidth > 0) {
        doc.setFillColor(12, 42, 74)
        doc.roundedRect(margin, 12, 24, 24, 4, 4, "F")
        doc.addImage(logoImg, "PNG", margin + 3, 15, 18, 18)
      }

      doc.setFont("helvetica", "bold")
      doc.setFontSize(20)
      doc.setTextColor(230, 237, 243)
      doc.text("AutoValueLK", margin + 31, 22)

      doc.setFont("helvetica", "normal")
      doc.setFontSize(9)
      doc.setTextColor(125, 133, 144)
      doc.text("Sri Lankan Vehicle Intelligence", margin + 31, 29)

      doc.setFont("helvetica", "bold")
      doc.setFontSize(12)
      doc.setTextColor(230, 237, 243)
      doc.text("Vehicle Valuation Certificate", pageWidth - margin, 20, { align: "right" })
      doc.setFont("helvetica", "normal")
      doc.setFontSize(8)
      doc.setTextColor(125, 133, 144)
      doc.text(`Reference: ${valuationRef}`, pageWidth - margin, 27, { align: "right" })
      doc.text(`Generated: ${generatedAt}`, pageWidth - margin, 33, { align: "right" })

      doc.setFillColor(248, 250, 252)
      doc.roundedRect(margin, 62, pageWidth - margin * 2, 38, 4, 4, "F")
      doc.setDrawColor(226, 232, 240)
      doc.roundedRect(margin, 62, pageWidth - margin * 2, 38, 4, 4, "S")

      doc.setFont("helvetica", "normal")
      doc.setFontSize(9)
      doc.setTextColor(100, 116, 139)
      doc.text("Estimated Market Value", margin + 8, 75)
      doc.setFont("helvetica", "bold")
      doc.setFontSize(26)
      doc.setTextColor(15, 23, 42)
      doc.text(`LKR ${formattedPrice}`, margin + 8, 91)

      doc.setFont("helvetica", "bold")
      doc.setFontSize(11)
      doc.setTextColor(15, 23, 42)
      doc.text(vehicleTitle, pageWidth - margin - 8, 77, { align: "right" })
      doc.setFont("helvetica", "normal")
      doc.setFontSize(9)
      doc.setTextColor(100, 116, 139)
      doc.text("Machine-learning valuation for the Sri Lankan vehicle market", pageWidth - margin - 8, 85, { align: "right" })
      doc.text("Indicative accuracy: +/-5%", pageWidth - margin - 8, 93, { align: "right" })

      autoTable(doc, {
        startY: 110,
        theme: "plain",
        margin: { left: margin, right: margin },
        styles: {
          font: "helvetica",
          fontSize: 9,
          cellPadding: { top: 3.5, right: 4, bottom: 3.5, left: 4 },
          lineColor: [226, 232, 240],
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: [248, 250, 252],
          fontStyle: "bold",
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        head: [["Vehicle Details", "Value"]],
        body: [
          [t("results_page.pdf_brand"), vehicle?.brand || "N/A"],
          [t("results_page.pdf_model"), vehicle?.model || "N/A"],
          [t("results_page.pdf_year"), vehicle?.year || "N/A"],
          [t("results_page.pdf_engine"), vehicle?.engine ? `${vehicle.engine} cc` : "N/A"],
          [t("results_page.pdf_mileage"), vehicle?.mileage ? `${Number(vehicle.mileage).toLocaleString("en-LK")} km` : "N/A"],
          [t("results_page.pdf_fuel"), vehicle?.fuel || "N/A"],
          [t("results_page.pdf_transmission"), vehicle?.transmission || "N/A"],
          [t("results_page.pdf_condition"), vehicle?.condition || "N/A"],
          ["Town / Location", vehicle?.town || "N/A"],
        ],
        columnStyles: {
          0: { cellWidth: 58, textColor: [71, 85, 105], fontStyle: "bold" },
          1: { cellWidth: "auto", textColor: [15, 23, 42] },
        },
      })

      const summaryY = doc.lastAutoTable.finalY + 10
      autoTable(doc, {
        startY: summaryY,
        theme: "grid",
        margin: { left: margin, right: margin },
        styles: {
          font: "helvetica",
          fontSize: 9,
          cellPadding: 4,
          lineColor: [226, 232, 240],
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: [29, 78, 216],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        bodyStyles: { textColor: [15, 23, 42] },
        head: [["Valuation Summary", "Amount"]],
        body: [
          ["Estimated market value", `LKR ${formattedPrice}`],
          ["Market low estimate", `LKR ${marketLow.toLocaleString("en-LK")}`],
          ["Market high estimate", `LKR ${marketHigh.toLocaleString("en-LK")}`],
          ["Prediction status", saveStatus === "cloud" ? "Saved to AutoValueLK account" : "Saved locally on this device"],
        ],
        columnStyles: {
          0: { cellWidth: 72, fontStyle: "bold" },
          1: { cellWidth: "auto" },
        },
      })

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 10,
        theme: "striped",
        margin: { left: margin, right: margin },
        styles: { font: "helvetica", fontSize: 8.5, cellPadding: 3.5 },
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        head: [[
          "Product",
          "Provider",
          t("results_page.pdf_interest_rate"),
          t("results_page.monthly_payment"),
          "Loan Value",
        ]],
        body: loanPlans.map((plan) => [
          `${plan.productLabel}${plan.recommended ? ` (${t("results_page.recommended")})` : ""}`,
          plan.institution,
          plan.interest,
          `LKR ${plan.monthly}`,
          `LKR ${plan.loanValue}`,
        ]),
      })

      const noteY = doc.lastAutoTable.finalY + 10
      doc.setFillColor(239, 246, 255)
      doc.roundedRect(margin, noteY, pageWidth - margin * 2, 25, 3, 3, "F")
      doc.setFont("helvetica", "bold")
      doc.setFontSize(9)
      doc.setTextColor(29, 78, 216)
      doc.text("Valuation Note", margin + 6, noteY + 8)
      doc.setFont("helvetica", "normal")
      doc.setFontSize(8)
      doc.setTextColor(71, 85, 105)
      doc.text(
        "This certificate is an AI-assisted indicative valuation based on supplied vehicle details and market patterns. It is intended for guidance and should be reviewed alongside inspection, documentation, and current market conditions.",
        margin + 6,
        noteY + 15,
        { maxWidth: pageWidth - margin * 2 - 12 }
      )

      const totalPages = doc.internal.getNumberOfPages()
      for (let i = 1; i <= totalPages; i += 1) {
        doc.setPage(i)
        doc.setDrawColor(226, 232, 240)
        doc.line(margin, pageHeight - 18, pageWidth - margin, pageHeight - 18)
        doc.setFont("helvetica", "normal")
        doc.setFontSize(8)
        doc.setTextColor(100, 116, 139)
        doc.text("AutoValueLK Vehicle Valuation Certificate", margin, pageHeight - 11)
        doc.text(`Prepared for: ${userEmail}`, pageWidth / 2, pageHeight - 11, { align: "center" })
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 11, { align: "right" })
      }

      doc.save(`AutoValueLK_Valuation_${fileVehicleName}_${valuationRef}.pdf`)
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
  const chartTheme = isLightTheme
    ? {
        tooltipBg: "#ffffff",
        tooltipBorder: "rgba(148, 163, 184, 0.34)",
        title: "#0f172a",
        body: "#475569",
        grid: "rgba(148, 163, 184, 0.28)",
        tick: "#64748b",
      }
    : {
        tooltipBg: "#161b22",
        tooltipBorder: "#21262d",
        title: "#e6edf3",
        body: "#7d8590",
        grid: "#21262d",
        tick: "#7d8590",
      }
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
        backgroundColor: chartTheme.tooltipBg,
        borderColor: chartTheme.tooltipBorder,
        borderWidth: 0.5,
        titleColor: chartTheme.title,
        bodyColor: chartTheme.body,
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
        backgroundColor: chartTheme.tooltipBg,
        borderColor: chartTheme.tooltipBorder,
        borderWidth: 0.5,
        titleColor: chartTheme.title,
        bodyColor: chartTheme.body,
        callbacks: {
          label: (context) => `${context.dataset.label}: ${formatChartCurrency(context.parsed.y)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: chartTheme.grid },
        ticks: { color: chartTheme.tick },
      },
      y: {
        grid: { color: chartTheme.grid },
        ticks: {
          color: chartTheme.tick,
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
          <div className="results-eyebrow">{t("results_page.price_result_eyebrow")}</div>
          <h1>{t("results_page.title")}</h1>
          <p>{t("results_page.based_on_specs")}</p>
        </div>
        <div className="results-hero-actions">
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
          <button
            type="button"
            className="results-valuation-pdf-button"
            onClick={handleDownloadPDF}
            disabled={downloading}
          >
            <Download className={downloading ? "h-[14px] w-[14px] spin" : "h-[14px] w-[14px]"} />
            {downloading ? "Preparing PDF..." : "Download Valuation PDF"}
          </button>
        </section>

        <section className="results-panel">
          <div className="results-panel-heading results-panel-heading--border">
            <span className="results-panel-title"><Car className="h-[14px] w-[14px]" style={{ color: "#7d8590" }} />{t("results_page.vehicle_summary")}</span>
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
            <span className="results-panel-title"><CreditCard className="h-[14px] w-[14px]" style={{ color: "#a78bfa" }} />{t("results_page.best_finance_estimates")}</span>
            <p>{t("results_page.cheapest_by_product")}</p>
          </div>
          <div>
            {isLoading ? (
              <div className="results-loading">{t("results_page.loading_finance")}</div>
            ) : loanPlans.length === 0 ? (
              <p className="results-empty-text">{t("results_page.no_loan_plans")}</p>
            ) : (
              loanPlans.map((plan, index) => (
                <div key={index} className={`results-loan-row ${plan.recommended ? "results-loan-row--recommended" : ""}`}>
                  <div className="results-loan-top">
                    <div>
                      <span className="results-loan-tenure">{plan.productLabel}</span>
                      <span className="results-recommended-badge">{t("results_page.lowest")}</span>
                    </div>
                    <span className="results-loan-interest">{plan.interest} {t("results_page.interest_label")}</span>
                  </div>
                  <p className="results-finance-provider">{plan.institution}</p>
                  <div className="results-loan-bottom">
                    <div>
                      <span>{t("results_page.monthly_payment")}</span>
                      <strong>LKR {plan.monthly}</strong>
                    </div>
                    <div>
                      <span>{t("results_page.loan_value")}</span>
                      <strong>LKR {plan.loanValue}</strong>
                    </div>
                  </div>
                  <div className="results-finance-meta">
                    <span>{plan.tenureLabel}</span>
                    <span>{plan.downPaymentPercent}% down</span>
                    <span>{plan.note}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="results-panel">
          <div className="results-panel-heading">
            <span className="results-panel-title"><PieChartIcon className="h-[14px] w-[14px]" style={{ color: "#d29922" }} />{t("results_page.cost_breakdown")}</span>
            <p>{t("results_page.principal_vs_interest")}</p>
          </div>
          <div className="results-donut-wrap">
            <Doughnut
              data={doughnutChartData}
              options={doughnutChartOptions}
              role="img"
              aria-label="Principal, interest, and processing fee cost breakdown"
            />
            <div className="results-donut-center">
              <span>{t("results_page.total")}</span>
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
            <span className="results-panel-title"><TrendingUp className="h-[14px] w-[14px]" style={{ color: "#3fb950" }} />{t("results_page.market_position")}</span>
            <p>{t("results_page.market_position_subtitle")}</p>
          </div>
          <div className="results-range">
            <div className="results-range-label">{t("results_page.your_estimate")}</div>
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
          <span className="results-panel-title"><Landmark className="h-[14px] w-[14px]" style={{ color: "#58a6ff" }} />{t("results_page.down_payment_options")}</span>
          <p>{t("results_page.down_payment_impact")}</p>
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
          {alertSet ? t("results_page.alert_set") : t("results_page.save_to_analytics")}
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
