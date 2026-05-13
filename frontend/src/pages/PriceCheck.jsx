import { useMemo, useState, useEffect, useRef, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { Trans, useTranslation } from "react-i18next"
import {
  BrainCircuit, Car, Fuel, Gauge, MapPin, Calendar, Cog,
  ArrowRight, Info, Sparkles, ShieldCheck, Zap, Clock,
  Settings2,
} from "lucide-react"
import logo from "../assets/logo/autovaluelk-logo.png"
import brandModelOptions from "../data/brand_model_options.json"
import { savePredictionHistoryEntry } from "../utils/predictionHistory"
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
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
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

      {/* -------- Background Effects -------- */}
      <PredictionParticles />
      <div className="pc-bg-orb pc-bg-orb--1" />
      <div className="pc-bg-orb pc-bg-orb--2" />
      <div className="pc-bg-orb pc-bg-orb--3" />

      {/* -------- Hero Header -------- */}
      <header className="pc-hero">
        <div className="pc-hero__eyebrow">
          <BrainCircuit className="h-4 w-4" />
          {t("price_check_page.title")}
        </div>
        <h1 className="pc-hero__title">
          {t("price_check_page.title")}
        </h1>
        <p className="pc-hero__sub">
          {t("price_check_page.subtitle")}
        </p>

        {/* Trust Badges */}
        <div className="pc-badges">
          <span className="pc-badge"><ShieldCheck className="h-3.5 w-3.5 text-emerald-300" /> 98% Accuracy</span>
          <span className="pc-badge"><Zap className="h-3.5 w-3.5 text-amber-300" /> Instant Results</span>
          <span className="pc-badge"><Clock className="h-3.5 w-3.5 text-cyan-300" /> Updated Daily</span>
        </div>
      </header>

      {/* -------- Progress Indicator -------- */}
      <div className="pc-progress-wrap">
        <StepIndicator step={currentStep} total={4} />
        <p className="pc-progress-label">
          {currentStep === 0 && "Start by selecting your vehicle brand"}
          {currentStep === 1 && "Great! Keep adding details..."}
          {currentStep === 2 && "Almost there — a few more fields"}
          {currentStep === 3 && "Nearly done!"}
          {currentStep >= 4 && "Ready to predict! 🚀"}
        </p>
      </div>

      {/* -------- Main Form Card -------- */}
      <div className="pc-form-card" ref={formRef}>
        {/* Card Header */}
        <div className="pc-form-header">
          <div className="pc-form-logo">
            <img src={logo} alt="AutoValueLK" className="w-9 h-9 object-contain" />
          </div>
          <div>
            <h2 className="pc-form-title">{t("price_check_page.form_title")}</h2>
            <p className="pc-form-subtitle">{t("price_check_page.form_subtitle")}</p>
          </div>
        </div>

        {/* Gradient Divider */}
        <div className="pc-divider" />

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Brand */}
            <div className="pc-field relative z-50">
              <AppDropdown
                label={t("price_check_page.brand")}
                icon={Car}
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
                icon={Settings2}
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
              <label className="pc-label"><Calendar className="pc-label-icon" /> {t("price_check_page.year")}</label>
              <input className={`pc-input ${errors.year ? 'pc-input--error' : ''}`} type="number" placeholder={t("price_check_page.year_placeholder")} min="1990" max="2025" value={form.year} onChange={(e) => handleChange('year', e.target.value)} />
              {errors.year && <p className="pc-error">{errors.year}</p>}
            </div>

            {/* Engine */}
            <div className="pc-field">
              <label className="pc-label"><Gauge className="pc-label-icon" /> {t("price_check_page.engine")}</label>
              <input className={`pc-input ${errors.engine ? 'pc-input--error' : ''}`} type="number" placeholder={t("price_check_page.engine_placeholder")} value={form.engine} onChange={(e) => handleChange('engine', e.target.value)} />
              {errors.engine && <p className="pc-error">{errors.engine}</p>}
            </div>

            {/* Mileage */}
            <div className="pc-field">
              <label className="pc-label"><Sparkles className="pc-label-icon" /> {t("price_check_page.mileage")}</label>
              <input className="pc-input" type="number" placeholder={t("price_check_page.mileage_placeholder")} value={form.mileage} onChange={(e) => handleChange('mileage', e.target.value)} />
            </div>

            {/* Fuel Type */}
            <div className="pc-field">
              <AppDropdown
                label={t("price_check_page.fuel_type")}
                icon={Fuel}
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
                icon={Cog}
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
                icon={ShieldCheck}
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

            {/* Training Note */}
            <div className="md:col-span-2">
              <p className="text-xs text-slate-500">{t("price_check_page.training_note")}</p>
            </div>
          </div>

          {/* Submit */}
          <div className="mt-8">
            <button type="submit" disabled={isLoading} className="pc-submit group">
              <span className="pc-submit__glow" />
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                  <span className="relative z-10">{t("price_check_page.analyzing")}</span>
                </>
              ) : (
                <>
                  <BrainCircuit className="h-5 w-5 relative z-10" />
                  <span className="relative z-10">{t("price_check_page.submit")}</span>
                  <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Info Note */}
        <div className="pc-info-note">
          <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-slate-300 leading-6">
            <Trans i18nKey="price_check_page.info_note" components={{ 1: <strong className="text-white" /> }} />
          </p>
        </div>
      </div>
    </div>
  )
}

export default PriceCheck
