import { useState } from "react"
import { useNavigate } from "react-router-dom"
import logo from "../assets/logo/autovaluelk-logo.png"

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

function PriceCheck() {
  const navigate = useNavigate()
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

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: "" }))
  }

  const validate = () => {
    const errs = {}
    if (!form.brand.trim()) errs.brand = "Brand is required"
    if (!form.model.trim()) errs.model = "Model is required"
    if (!form.year) errs.year = "Year is required"
    if (!form.engine) errs.engine = "Engine capacity is required"
    if (!form.fuel_type) errs.fuel_type = "Select a fuel type"
    if (!form.gear_type) errs.gear_type = "Select a transmission"
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
      const response = await fetch("http://localhost:8000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      setIsLoading(false)

      navigate("/results", {
        state: {
          vehicle: {
            ...form,
            fuel: form.fuel_type,
            transmission: form.gear_type,
          },
          predictedPrice: data.predicted_price_lkr,
          predictedAt: Date.now(),
          predictionKey: `pred-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        },
      })
    } catch (error) {
      setIsLoading(false)
      if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
        alert("Server not connected. Please make sure the backend is running at http://localhost:8000")
      } else {
        alert("Prediction failed: " + error.message)
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#0f172a] p-8">

      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <span className="icon-box icon-box-blue">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          Vehicle Price Prediction
        </h1>
        <p className="text-slate-400">
          Enter your vehicle details to get an AI-powered market price estimate
        </p>
      </div>

      {/* Main Form Card */}
      <div className="max-w-4xl animate-fade-in animate-delay-100">
        <div className="card-glass p-8">

          <div className="flex items-center gap-3 mb-8">
            <div className="w-14 h-14 rounded-xl bg-white/5 backdrop-blur-md flex items-center justify-center border border-white/10 shadow-xl overflow-hidden">
              <img src={logo} alt="AutoValueLK Logo" className="w-10 h-10 object-contain" />
            </div>
            <div>
              <h2 className="text-xl text-white font-semibold">Enter Vehicle Details</h2>
              <p className="text-sm text-slate-500">All fields help improve prediction accuracy</p>
            </div>
          </div>

          {/* Form Grid */}
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Brand */}
              <div className="animate-fade-in animate-delay-100">
                <label className="label">Brand *</label>
                <input
                  className={`input ${errors.brand ? 'border-rose-500/50' : ''}`}
                  placeholder="e.g., Toyota, Honda, Nissan"
                  value={form.brand}
                  onChange={(e) => handleChange('brand', e.target.value)}
                />
                {errors.brand && <p className="text-rose-400 text-xs mt-1">{errors.brand}</p>}
              </div>

              {/* Model */}
              <div className="animate-fade-in animate-delay-200">
                <label className="label">Model *</label>
                <input
                  className={`input ${errors.model ? 'border-rose-500/50' : ''}`}
                  placeholder="e.g., Aqua, Vezel, Swift"
                  value={form.model}
                  onChange={(e) => handleChange('model', e.target.value)}
                />
                {errors.model && <p className="text-rose-400 text-xs mt-1">{errors.model}</p>}
              </div>

              {/* Year */}
              <div className="animate-fade-in animate-delay-200">
                <label className="label">Manufacture Year *</label>
                <input
                  className={`input ${errors.year ? 'border-rose-500/50' : ''}`}
                  type="number"
                  placeholder="e.g., 2020"
                  min="1990"
                  max="2025"
                  value={form.year}
                  onChange={(e) => handleChange('year', e.target.value)}
                />
                {errors.year && <p className="text-rose-400 text-xs mt-1">{errors.year}</p>}
              </div>

              {/* Engine Capacity */}
              <div className="animate-fade-in animate-delay-300">
                <label className="label">Engine Capacity (cc) *</label>
                <input
                  className={`input ${errors.engine ? 'border-rose-500/50' : ''}`}
                  type="number"
                  placeholder="e.g., 1500"
                  value={form.engine}
                  onChange={(e) => handleChange('engine', e.target.value)}
                />
                {errors.engine && <p className="text-rose-400 text-xs mt-1">{errors.engine}</p>}
              </div>

              {/* Mileage */}
              <div className="animate-fade-in animate-delay-300">
                <label className="label">Mileage (km)</label>
                <input
                  className="input"
                  type="number"
                  placeholder="e.g., 50000"
                  value={form.mileage}
                  onChange={(e) => handleChange('mileage', e.target.value)}
                />
              </div>

              {/* Fuel Type */}
              <div className="animate-fade-in animate-delay-300">
                <label className="label">Fuel Type *</label>
                <select
                  className={`input ${errors.fuel_type ? 'border-rose-500/50' : ''}`}
                  value={form.fuel_type}
                  onChange={(e) => handleChange('fuel_type', e.target.value)}
                >
                  <option value="">Select fuel type</option>
                  {FUEL_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.fuel_type && <p className="text-rose-400 text-xs mt-1">{errors.fuel_type}</p>}
              </div>

              {/* Transmission */}
              <div className="animate-fade-in animate-delay-400">
                <label className="label">Transmission *</label>
                <select
                  className={`input ${errors.gear_type ? 'border-rose-500/50' : ''}`}
                  value={form.gear_type}
                  onChange={(e) => handleChange('gear_type', e.target.value)}
                >
                  <option value="">Select transmission</option>
                  {GEAR_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.gear_type && <p className="text-rose-400 text-xs mt-1">{errors.gear_type}</p>}
              </div>

              {/* Condition */}
              <div className="animate-fade-in animate-delay-400">
                <label className="label">Vehicle Condition</label>
                <select
                  className="input"
                  value={form.condition}
                  onChange={(e) => handleChange('condition', e.target.value)}
                >
                  {CONDITION_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Town */}
              <div className="animate-fade-in animate-delay-400">
                <label className="label">Town</label>
                <input
                  className="input"
                  placeholder="e.g., Colombo"
                  value={form.town}
                  onChange={(e) => handleChange('town', e.target.value)}
                />
              </div>

              {/* Full Width Note */}
              <div className="md:col-span-2">
                <p className="text-xs text-slate-500">
                  Matching fuel type, transmission, condition, and town to the training data helps the model give more realistic estimates.
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
                    <span>Analyzing vehicle data...</span>
                  </>
                ) : (
                  <>
                    <span>Predict Car Price</span>
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
                  Our AI model is trained on <strong className="text-white">10,000+ Sri Lankan market listings</strong> to provide accurate predictions.
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
