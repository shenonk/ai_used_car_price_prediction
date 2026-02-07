export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* Navbar */}
      <nav className="flex justify-between items-center px-10 py-5 bg-slate-900 shadow-lg">
        <h1 className="text-2xl font-bold text-blue-400">AI Car Price Predictor</h1>
        <div className="space-x-6 text-gray-300">
          <a href="/" className="hover:text-white">Dashboard</a>
          <a href="/price-check" className="hover:text-white">Price Check</a>
          <a href="/analytics" className="hover:text-white">Analytics</a>
          <a href="/notifications" className="hover:text-white">Alerts</a>
        </div>
      </nav>

      {/* Hero */}
      <div className="text-center mt-24">
        <h2 className="text-5xl font-bold mb-6">
          AI-Powered Used Car Price Prediction
        </h2>
        <p className="text-gray-400 text-lg mb-8">
          Predict accurate car prices and vehicle loan estimates instantly for Sri Lanka
        </p>

        <a href="/price-check">
          <button className="bg-blue-600 hover:bg-blue-700 px-8 py-4 rounded-xl text-lg font-semibold shadow-lg">
            Start Price Prediction →
          </button>
        </a>
      </div>

      {/* Features */}
      <div className="grid grid-cols-3 gap-8 px-20 mt-24">
        
        <div className="bg-slate-900 p-8 rounded-2xl shadow-lg">
          <h3 className="text-xl font-bold mb-2 text-blue-400">AI Price Prediction</h3>
          <p className="text-gray-400">Machine learning predicts accurate market values.</p>
        </div>

        <div className="bg-slate-900 p-8 rounded-2xl shadow-lg">
          <h3 className="text-xl font-bold mb-2 text-blue-400">Loan Estimation</h3>
          <p className="text-gray-400">Instant EMI and loan repayment calculations.</p>
        </div>

        <div className="bg-slate-900 p-8 rounded-2xl shadow-lg">
          <h3 className="text-xl font-bold mb-2 text-blue-400">Market Insights</h3>
          <p className="text-gray-400">Track trends and price changes in Sri Lanka.</p>
        </div>

      </div>

    </div>
  )
}
