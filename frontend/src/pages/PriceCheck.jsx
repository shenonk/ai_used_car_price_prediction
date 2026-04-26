import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Trans, useTranslation } from "react-i18next"
import logo from "../assets/logo/autovaluelk-logo.png"
import brandModelOptions from "../data/brand_model_options.json"
import { savePredictionHistoryEntry } from "../utils/predictionHistory"
import { supabase } from "../utils/supabaseClient"

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

function PriceCheck() {
  const navigate = useNavigate()
  const { t } = useTranslation()
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
  const availableModels = useMemo(
    () => (form.brand ? (brandModelOptions[form.brand] || []) : []),
    [form.brand]
  )

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
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    setIsLoading(true)

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const response = await fetch(`${API_BASE_URL}/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token
            ? {
                Authorization: `Bearer ${session.access_token}`,
              }
            : {}),
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

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`)
      }

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
          vehicle: {
            ...form,
            fuel: form.fuel_type,
            transmission: form.gear_type,
          },
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
        alert(t("price_check_page.errors.server_not_connected", { url: API_BASE_URL }))
      } else {
        alert(t("price_check_page.errors.prediction_failed", { message: error.message }))
      }
    }
  }

  return (
    <div className="app-page-shell">
      <div className="dashboard-page-hero mb-8 animate-fade-in">
        <div className="dashboard-page-eyebrow mb-4">
          <svg className="h-3.5 w-3.5 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {t("price_check_page.title")}
        </div>
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white">{t("price_check_page.title")}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
          {t("price_check_page.subtitle")}
        </p>
      </div>

      {/* Main Form Card */}
      <div className="max-w-4xl animate-fade-in animate-delay-100">
        <div className="dashboard-page-panel">

          <div className="flex items-center gap-3 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-white/5 backdrop-blur-md flex items-center justify-center border border-white/10 overflow-hidden">
              <img src={logo} alt="AutoValueLK Logo" className="w-10 h-10 object-contain" />
            </div>
            <div>
              <h2 className="text-xl text-white font-semibold">{t("price_check_page.form_title")}</h2>
              <p className="text-sm text-slate-500">{t("price_check_page.form_subtitle")}</p>
            </div>
          </div>

          {/* Form Grid */}
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Brand */}
              <div className="animate-fade-in animate-delay-100">
                <label className="label">{t("price_check_page.brand")}</label>
                <select
                  className={`input ${errors.brand ? 'border-rose-500/50' : ''}`}
                  value={form.brand}
                  onChange={(e) => handleChange('brand', e.target.value)}
                >
                  <option value="">{t("price_check_page.select_brand")}</option>
                  {BRAND_OPTIONS.map((brand) => (
                    <option key={brand} value={brand}>
                      {brand}
                    </option>
                  ))}
                </select>
                {errors.brand && <p className="text-rose-400 text-xs mt-1">{errors.brand}</p>}
              </div>

              {/* Model */}
              <div className="animate-fade-in animate-delay-200">
                <label className="label">{t("price_check_page.model")}</label>
                <input
                  list="price-check-model-options"
                  className={`input ${errors.model ? 'border-rose-500/50' : ''}`}
                  placeholder={form.brand ? t("price_check_page.select_model_or_search") : t("price_check_page.select_brand_first")}
                  value={form.model}
                  onChange={(e) => handleChange('model', e.target.value)}
                  disabled={!form.brand}
                />
                <datalist id="price-check-model-options">
                  {availableModels.map((model) => (
                    <option key={model} value={model} />
                  ))}
                </datalist>
                {errors.model && <p className="text-rose-400 text-xs mt-1">{errors.model}</p>}
              </div>

              {/* Year */}
              <div className="animate-fade-in animate-delay-200">
                <label className="label">{t("price_check_page.year")}</label>
                <input
                  className={`input ${errors.year ? 'border-rose-500/50' : ''}`}
                  type="number"
                  placeholder={t("price_check_page.year_placeholder")}
                  min="1990"
                  max="2025"
                  value={form.year}
                  onChange={(e) => handleChange('year', e.target.value)}
                />
                {errors.year && <p className="text-rose-400 text-xs mt-1">{errors.year}</p>}
              </div>

              {/* Engine Capacity */}
              <div className="animate-fade-in animate-delay-300">
                <label className="label">{t("price_check_page.engine")}</label>
                <input
                  className={`input ${errors.engine ? 'border-rose-500/50' : ''}`}
                  type="number"
                  placeholder={t("price_check_page.engine_placeholder")}
                  value={form.engine}
                  onChange={(e) => handleChange('engine', e.target.value)}
                />
                {errors.engine && <p className="text-rose-400 text-xs mt-1">{errors.engine}</p>}
              </div>

              {/* Mileage */}
              <div className="animate-fade-in animate-delay-300">
                <label className="label">{t("price_check_page.mileage")}</label>
                <input
                  className="input"
                  type="number"
                  placeholder={t("price_check_page.mileage_placeholder")}
                  value={form.mileage}
                  onChange={(e) => handleChange('mileage', e.target.value)}
                />
              </div>

              {/* Fuel Type */}
              <div className="animate-fade-in animate-delay-300">
                <label className="label">{t("price_check_page.fuel_type")}</label>
                <select
                  className={`input ${errors.fuel_type ? 'border-rose-500/50' : ''}`}
                  value={form.fuel_type}
                  onChange={(e) => handleChange('fuel_type', e.target.value)}
                >
                  <option value="">{t("price_check_page.select_fuel_type")}</option>
                  {fuelTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.fuel_type && <p className="text-rose-400 text-xs mt-1">{errors.fuel_type}</p>}
              </div>

              {/* Transmission */}
              <div className="animate-fade-in animate-delay-400">
                <label className="label">{t("price_check_page.transmission")}</label>
                <select
                  className={`input ${errors.gear_type ? 'border-rose-500/50' : ''}`}
                  value={form.gear_type}
                  onChange={(e) => handleChange('gear_type', e.target.value)}
                >
                  <option value="">{t("price_check_page.select_transmission")}</option>
                  {gearTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.gear_type && <p className="text-rose-400 text-xs mt-1">{errors.gear_type}</p>}
              </div>

              {/* Condition */}
              <div className="animate-fade-in animate-delay-400">
                <label className="label">{t("price_check_page.condition")}</label>
                <select
                  className="input"
                  value={form.condition}
                  onChange={(e) => handleChange('condition', e.target.value)}
                >
                  {conditionOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Town */}
              <div className="animate-fade-in animate-delay-400">
                <label className="label">{t("price_check_page.town")}</label>
                <input
                  className="input"
                  placeholder={t("price_check_page.town_placeholder")}
                  value={form.town}
                  onChange={(e) => handleChange('town', e.target.value)}
                />
              </div>

              {/* Full Width Note */}
              <div className="md:col-span-2">
                <p className="text-xs text-slate-500">
                  {t("price_check_page.training_note")}
                </p>
              </div>

            </div>

            {/* Submit Button */}
            <div className="mt-8 animate-fade-in animate-delay-500">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-3 group disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>{t("price_check_page.analyzing")}</span>
                  </>
                ) : (
                  <>
                    <span>{t("price_check_page.submit")}</span>
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Info Note */}
          <div className="mt-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 animate-fade-in animate-delay-500">
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm text-slate-300">
                  <Trans
                    i18nKey="price_check_page.info_note"
                    components={{ 1: <strong className="text-white" /> }}
                  />
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  )
}

export default PriceCheck
