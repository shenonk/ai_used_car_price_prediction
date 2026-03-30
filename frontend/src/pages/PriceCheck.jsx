import { useState } from "react"
import { useNavigate } from "react-router-dom"

function PriceCheck() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    brand: "",
    model: "",
    year: "",
    engine: "",
    mileage: "",
    fuel: "",
    transmission: "",
    condition: "",
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
    if (!form.fuel) errs.fuel = "Select a fuel type"
    if (!form.transmission) errs.transmission = "Select a transmission"
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
      const response = await fetch("http://localhost:5000/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: form.brand,
          model: form.model,
          year: parseInt(form.year),
          engine: parseInt(form.engine),
          mileage: parseInt(form.mileage) || 0,
        }),
      })

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`)
      }

      const data = await response.json()
      setIsLoading(false)

      navigate("/results", {
        state: {
          vehicle: form,
          predictedPrice: data.predicted_price,
          predictedAt: Date.now(),
          predictionKey: `pred-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        },
      })
    } catch (error) {
      setIsLoading(false)
      if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
        alert("Server not connected. Please make sure the backend is running at http://localhost:5000")
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
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 17h8M8 17v-4m8 4v-4m-8 0h8m-8 0l-2-4h12l-2 4M6 13l-2-4h16l-2 4" />
              </svg>
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
                  className={`input ${errors.fuel ? 'border-rose-500/50' : ''}`}
                  value={form.fuel}
                  onChange={(e) => handleChange('fuel', e.target.value)}
                >
                  <option value="">Select fuel type</option>
                  <option value="petrol">Petrol</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="diesel">Diesel</option>
                  <option value="electric">Electric</option>
                </select>
                {errors.fuel && <p className="text-rose-400 text-xs mt-1">{errors.fuel}</p>}
              </div>

              {/* Transmission */}
              <div className="animate-fade-in animate-delay-400">
                <label className="label">Transmission *</label>
                <select
                  className={`input ${errors.transmission ? 'border-rose-500/50' : ''}`}
                  value={form.transmission}
                  onChange={(e) => handleChange('transmission', e.target.value)}
                >
                  <option value="">Select transmission</option>
                  <option value="automatic">Automatic</option>
                  <option value="manual">Manual</option>
                </select>
                {errors.transmission && <p className="text-rose-400 text-xs mt-1">{errors.transmission}</p>}
              </div>

              {/* Condition - Full Width */}
              <div className="md:col-span-2 animate-fade-in animate-delay-400">
                <label className="label">Vehicle Condition</label>
                <select
                  className="input"
                  value={form.condition}
                  onChange={(e) => handleChange('condition', e.target.value)}
                >
                  <option value="">Select condition</option>
                  <option value="excellent">Excellent - Like new</option>
                  <option value="good">Good - Minor wear</option>
                  <option value="average">Average - Normal wear</option>
                </select>
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
