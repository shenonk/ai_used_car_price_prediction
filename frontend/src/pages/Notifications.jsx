import Sidebar from "../layout/Sidebar"

function Notifications() {
  return (
    <div className="flex bg-gray-100 min-h-screen">

      <Sidebar />

      <div className="ml-64 w-full p-10">

        {/* Page title */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-semibold">Notifications</h1>

          <button className="secondary-btn flex gap-2 items-center">
            ⚙ Settings
          </button>
        </div>

        {/* Notifications list */}
        <div className="card space-y-4">

          {/* Item */}
          <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg flex justify-between">
            <div>
              <p className="font-semibold">Price Alert: Toyota Aqua</p>
              <p className="text-sm text-gray-600">
                The average price for Toyota Aqua 2020 has increased by 5%.
              </p>
            </div>
            <span className="text-xs text-gray-500">2 hours ago</span>
          </div>

          <div className="p-4 border border-green-200 bg-green-50 rounded-lg flex justify-between">
            <div>
              <p className="font-semibold">New Loan Rates Available</p>
              <p className="text-sm text-gray-600">
                Bank of Ceylon offering special loan rates at 7.5%.
              </p>
            </div>
            <span className="text-xs text-gray-500">5 hours ago</span>
          </div>

          <div className="p-4 border border-gray-200 bg-white rounded-lg flex justify-between">
            <div>
              <p className="font-semibold">Market Update</p>
              <p className="text-sm text-gray-600">
                SUV demand increased by 15% in Colombo region.
              </p>
            </div>
            <span className="text-xs text-gray-500">1 day ago</span>
          </div>

          <div className="p-4 border border-gray-200 bg-white rounded-lg flex justify-between">
            <div>
              <p className="font-semibold">Prediction Completed</p>
              <p className="text-sm text-gray-600">
                Your prediction for Honda Vezel 2019 is ready.
              </p>
            </div>
            <span className="text-xs text-gray-500">2 days ago</span>
          </div>

          <div className="p-4 border border-gray-200 bg-white rounded-lg flex justify-between">
            <div>
              <p className="font-semibold">System Update</p>
              <p className="text-sm text-gray-600">
                Enhanced analytics and comparison tools added.
              </p>
            </div>
            <span className="text-xs text-gray-500">3 days ago</span>
          </div>

        </div>

        {/* Bottom banner */}
        <div className="mt-8 bg-gradient-to-r from-orange-400 to-blue-600 text-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-2">Stay Updated</h2>
          <p className="text-sm mb-4">
            Enable notifications to receive real-time updates on market trends and loan offers.
          </p>
          <button className="bg-white text-blue-600 px-5 py-2 rounded-lg font-semibold">
            Enable All Notifications
          </button>
        </div>

      </div>
    </div>
  )
}

export default Notifications
