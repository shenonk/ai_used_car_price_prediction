import Sidebar from "../layout/Sidebar"

function Dashboard() {
  return (
    <div className="flex bg-[#0f172a] min-h-screen">

      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="ml-64 w-full p-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-white">
            AI Used Car Price Prediction System
          </h1>
          <p className="text-gray-400 mt-1">
            Sri Lankan market intelligence dashboard
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-6 mb-8">

          <div className="bg-[#1e293b] p-6 rounded-xl shadow-lg border border-gray-700">
            <p className="text-gray-400 text-sm">Total Predictions</p>
            <h2 className="text-3xl font-bold text-white mt-2">1,245</h2>
            <p className="text-green-400 text-sm mt-1">+12% this week</p>
          </div>

          <div className="bg-[#1e293b] p-6 rounded-xl shadow-lg border border-gray-700">
            <p className="text-gray-400 text-sm">Average Car Price</p>
            <h2 className="text-3xl font-bold text-white mt-2">LKR 5.2M</h2>
            <p className="text-blue-400 text-sm mt-1">Market stable</p>
          </div>

          <div className="bg-[#1e293b] p-6 rounded-xl shadow-lg border border-gray-700">
            <p className="text-gray-400 text-sm">Loan Calculations</p>
            <h2 className="text-3xl font-bold text-white mt-2">856</h2>
            <p className="text-yellow-400 text-sm mt-1">+5% today</p>
          </div>

        </div>

        {/* Market Overview */}
        <div className="grid grid-cols-2 gap-6">

          {/* Market updates */}
          <div className="bg-[#1e293b] p-6 rounded-xl shadow-lg border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">
              Market Updates
            </h2>

            <ul className="text-gray-300 space-y-2 text-sm">
              <li>• Vehicle prices in Colombo increased by 5% this month</li>
              <li>• Hybrid vehicles demand rising rapidly</li>
              <li>• Bank loan interest reduced by 0.5%</li>
              <li>• Toyota & Suzuki dominate resale market</li>
            </ul>
          </div>

          {/* System activity */}
          <div className="bg-[#1e293b] p-6 rounded-xl shadow-lg border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">
              System Activity
            </h2>

            <div className="space-y-3 text-sm text-gray-300">
              <p>New prediction generated — Toyota Aqua 2018</p>
              <p>User downloaded price report</p>
              <p>Loan calculation completed</p>
              <p>System accuracy updated to 87%</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}

export default Dashboard
