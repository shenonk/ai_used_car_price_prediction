import { useLocation, useNavigate } from "react-router-dom"
import { useEffect, useMemo, useState } from "react"
import { useTranslation, Trans } from "react-i18next"
import {
  PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
} from "recharts"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { getCurrentUser } from "../utils/auth"
import { supabase } from "../utils/supabaseClient"
import { loadUserAlerts, upsertUserAlert } from "../utils/userAlerts"
import logoUrl from "../assets/logo/autovaluelk-logo-pdf.png"

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
  const themeStyles =
    typeof window !== "undefined"
      ? getComputedStyle(document.documentElement)
      : null
  const themeTextPrimary = themeStyles?.getPropertyValue("--text-primary")?.trim() || "#f8fafc"
  const themeTextSecondary = themeStyles?.getPropertyValue("--text-secondary")?.trim() || "#94a3b8"
  const themeSurface = themeStyles?.getPropertyValue("--bg-surface")?.trim() || "#1e293b"
  const themeBorder = themeStyles?.getPropertyValue("--border-color")?.trim() || "#334155"

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
  const colors = ["#3b82f6", "#f59e0b", "#10b981"]

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
      alert(t("results_page.pdf_failed"))
    } finally {
      setDownloading(false)
    }
  }

  const handleSetAlert = async () => {
    const user = await getCurrentUser()
    if (!user) {
      alert(t("results_page.alerts_login_required"))
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

  return (
    <div className="app-page-shell">
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

      <div className="dashboard-page-hero mb-8 animate-fade-in">
        <div className="relative z-10">
          <div className="dashboard-page-eyebrow mb-4">
            <svg className="h-3.5 w-3.5 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {t("results_page.title")}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">{t("results_page.title")}</h1>
          {vehicleSummary ? (
            <p className="mt-2 text-slate-300 text-sm mb-4">{vehicleSummary}</p>
          ) : (
            <p className="mt-2 text-slate-300 text-sm mb-4">{t("results_page.based_on_specs")}</p>
          )}

          <div className="inline-block rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur">
            <p className="text-slate-300 text-sm mb-1">{t("results_page.estimated_market_value")}</p>
            <h2 className="text-4xl md:text-5xl font-bold text-white">LKR {formattedPrice}</h2>
            <div className="flex items-center gap-2 mt-3">
              <span className="badge bg-white/20 text-white border-white/30">{t("results_page.accuracy_badge")}</span>
              <span className="badge bg-white/20 text-white border-white/30">{t("results_page.updated_today")}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="dashboard-page-panel animate-fade-in animate-delay-100">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            {t("results_page.loan_plans")}
          </h2>
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : loanPlans.length === 0 ? (
              <p className="text-center py-8 text-slate-500">{t("results_page.no_loan_plans")}</p>
            ) : (
              loanPlans.map((plan, index) => (
                <div key={index} className={`p-4 rounded-xl border transition-all duration-300 hover:translate-x-1 ${plan.recommended ? "bg-blue-500/20 border-blue-500/50" : "bg-slate-800/30 border-slate-700/50 hover:border-slate-600/50"}`}>
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold text-white">{t("results_page.years", { count: plan.years })}</span>
                      {plan.recommended && <span className="badge badge-success text-xs">{t("results_page.recommended")}</span>}
                    </div>
                    <span className="text-sm text-slate-400">{plan.interest} {t("results_page.interest_label")}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <div>
                      <p className="text-slate-400">{t("results_page.monthly_payment")}</p>
                      <p className="font-semibold text-blue-400 text-lg">LKR {plan.monthly}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-400">{t("results_page.total_amount")}</p>
                      <p className="font-semibold text-white">LKR {plan.total}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="dashboard-page-panel animate-fade-in animate-delay-200">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
            </svg>
            {t("results_page.cost_breakdown")}
          </h2>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={100} innerRadius={60} dataKey="value" strokeWidth={0}>
                {pieData.map((entry, index) => (<Cell key={index} fill={colors[index]} />))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: themeSurface, border: `1px solid ${themeBorder}`, borderRadius: "12px", color: themeTextPrimary }} />
              <Legend wrapperStyle={{ color: themeTextSecondary }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="dashboard-page-panel animate-fade-in animate-delay-300">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          {t("results_page.down_payment_options")}
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={downPaymentData}>
            <CartesianGrid strokeDasharray="3 3" stroke={themeBorder} />
            <XAxis dataKey="name" stroke={themeTextSecondary} />
            <YAxis stroke={themeTextSecondary} />
            <Tooltip contentStyle={{ backgroundColor: themeSurface, border: `1px solid ${themeBorder}`, borderRadius: "12px", color: themeTextPrimary }} />
            <Legend wrapperStyle={{ color: themeTextSecondary }} />
            <Bar dataKey="down" fill="#f59e0b" name={t("results_page.down_payment_label")} radius={[4, 4, 0, 0]} />
            <Bar dataKey="monthly" fill="#3b82f6" name={t("results_page.monthly_payment")} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mt-6 animate-fade-in animate-delay-400">
        <button
          onClick={() => navigate("/financing", { state: { vehicle, predictedPrice } })}
          className="flex-1 btn-primary py-4 flex items-center justify-center gap-2 rounded-xl font-semibold shadow-lg shadow-blue-500/20"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {t("results_page.financing_button")}
        </button>

        <button
          onClick={handleDownloadPDF}
          disabled={downloading}
          className="flex-1 py-4 flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-300 btn-secondary disabled:opacity-70"
        >
          {downloading ? (
            <>
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              {t("results_page.generating")}
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              {t("results_page.download_pdf")}
            </>
          )}
        </button>

        <button
          onClick={handleSetAlert}
          disabled={alertSet}
          className={`flex-1 py-4 flex items-center justify-center gap-2 ${alertSet ? "btn-success" : "btn-secondary"}`}
        >
          {alertSet ? (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              {t("results_page.alert_set")}
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              {t("results_page.set_price_alert")}
            </>
          )}
        </button>
      </div>
    </div>
  )
}

export default Results
