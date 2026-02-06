function PriceCheck() {
  return (
    <div className="min-h-screen bg-[#0f172a] p-8">

      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <span className="icon-box icon-box-blue">🔍</span>
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
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-2xl shadow-lg shadow-blue-500/20">
              🚗
            </div>
            <div>
              <h2 className="text-xl text-white font-semibold">Enter Vehicle Details</h2>
              <p className="text-sm text-slate-500">All fields help improve prediction accuracy</p>
            </div>
          </div>

          {/* Form Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Brand */}
            <div className="animate-fade-in animate-delay-100">
              <label className="label">Brand</label>
              <input className="input" placeholder="e.g., Toyota, Honda, Nissan" />
            </div>

            {/* Model */}
            <div className="animate-fade-in animate-delay-200">
              <label className="label">Model</label>
              <input className="input" placeholder="e.g., Aqua, Vezel, Swift" />
            </div>

            {/* Year */}
            <div className="animate-fade-in animate-delay-200">
              <label className="label">Manufacture Year</label>
              <input className="input" type="number" placeholder="e.g., 2020" min="1990" max="2025" />
            </div>

            {/* Mileage */}
            <div className="animate-fade-in animate-delay-300">
              <label className="label">Mileage (km)</label>
              <input className="input" type="number" placeholder="e.g., 50000" />
            </div>

            {/* Fuel Type */}
            <div className="animate-fade-in animate-delay-300">
              <label className="label">Fuel Type</label>
              <select className="input">
                <option value="">Select fuel type</option>
                <option value="petrol">Petrol</option>
                <option value="hybrid">Hybrid</option>
                <option value="diesel">Diesel</option>
                <option value="electric">Electric</option>
              </select>
            </div>

            {/* Transmission */}
            <div className="animate-fade-in animate-delay-400">
              <label className="label">Transmission</label>
              <select className="input">
                <option value="">Select transmission</option>
                <option value="automatic">Automatic</option>
                <option value="manual">Manual</option>
              </select>
            </div>

            {/* Condition - Full Width */}
            <div className="md:col-span-2 animate-fade-in animate-delay-400">
              <label className="label">Vehicle Condition</label>
              <select className="input">
                <option value="">Select condition</option>
                <option value="excellent">Excellent - Like new</option>
                <option value="good">Good - Minor wear</option>
                <option value="average">Average - Normal wear</option>
              </select>
            </div>

          </div>

          {/* Submit Button */}
          <div className="mt-8 animate-fade-in animate-delay-500">
            <button className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-3 group">
              <span className="text-xl group-hover:animate-pulse">✨</span>
              <span>Predict Car Price</span>
              <span className="text-xl">→</span>
            </button>
          </div>

          {/* Info Note */}
          <div className="mt-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 animate-fade-in animate-delay-500">
            <div className="flex gap-3">
              <span className="text-blue-400 text-lg">💡</span>
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
