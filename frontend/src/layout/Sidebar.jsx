import { Link } from "react-router-dom"

function Sidebar() {
  return (
    <div className="w-64 h-screen bg-[#020617] border-r border-gray-800 text-gray-300 fixed flex flex-col justify-between">

      {/* Top */}
      <div>
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-xl font-semibold text-white">
            AI Car Analytics
          </h1>
          <p className="text-xs text-gray-500">Prediction System</p>
        </div>

        <nav className="flex flex-col p-4 gap-2 text-sm">

          <Link to="/" className="p-3 rounded-lg hover:bg-gray-800">Dashboard</Link>
          <Link to="/price" className="p-3 rounded-lg hover:bg-gray-800">Price Check</Link>
          <Link to="/results" className="p-3 rounded-lg hover:bg-gray-800">Results</Link>
          <Link to="/financing" className="p-3 rounded-lg hover:bg-gray-800">Financing</Link>
          <Link to="/analytics" className="p-3 rounded-lg hover:bg-gray-800">Analytics</Link>
          <Link to="/notifications" className="p-3 rounded-lg hover:bg-gray-800">Notifications</Link>

        </nav>
      </div>

      {/* Bottom login */}
      <div className="p-4 border-t border-gray-800">
        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg">
          User Login
        </button>
      </div>

    </div>
  )
}

export default Sidebar
