import { Line } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

function Analytics() {

  // 🔵 Dummy chart data
  const data = {
    labels: ["2020", "2021", "2022", "2023", "2024"],
    datasets: [
      {
        label: "Vehicle Value (LKR)",
        data: [5800000, 5500000, 5200000, 5000000, 4700000],
        borderColor: "#f97316",
        backgroundColor: "rgba(249,115,22,0.2)",
        tension: 0.4,
      },
    ],
  }

  return (
    <div className="p-8 bg-gray-100 min-h-screen">

      {/* Title */}
      <h1 className="text-3xl font-bold mb-6">Analytics Dashboard</h1>

      {/* ===== Depreciation Chart ===== */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">
          Vehicle Depreciation Analysis
        </h2>

        {/* Chart */}
        <Line data={data} />

        <div className="mt-6 bg-orange-50 p-4 rounded-lg">
          <p className="font-semibold">
            Average Depreciation Rate: 8.5% per year
          </p>
          <p className="text-sm text-gray-600">
            Based on market data for similar vehicles in Sri Lanka
          </p>
        </div>
      </div>

      {/* ===== Prediction History ===== */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Prediction History</h2>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search brand or model..."
              className="border rounded-lg px-3 py-2"
            />
            <select className="border rounded-lg px-3 py-2">
              <option>All Brands</option>
              <option>Toyota</option>
              <option>Honda</option>
              <option>Nissan</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <table className="w-full">
          <thead>
            <tr className="text-left border-b">
              <th className="py-3">DATE</th>
              <th>BRAND</th>
              <th>MODEL</th>
              <th>YEAR</th>
              <th>PREDICTED PRICE</th>
              <th>STATUS</th>
            </tr>
          </thead>

          <tbody className="text-gray-700">
            <tr className="border-b">
              <td className="py-3">2024-01-15</td>
              <td>Toyota</td>
              <td>Aqua</td>
              <td>2020</td>
              <td className="text-blue-600 font-semibold">
                LKR 4,500,000
              </td>
              <td>
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
                  Completed
                </span>
              </td>
            </tr>

            <tr className="border-b">
              <td className="py-3">2024-01-10</td>
              <td>Honda</td>
              <td>Vezel</td>
              <td>2019</td>
              <td className="text-blue-600 font-semibold">
                LKR 5,200,000
              </td>
              <td>
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
                  Completed
                </span>
              </td>
            </tr>

            <tr className="border-b">
              <td className="py-3">2024-01-05</td>
              <td>Nissan</td>
              <td>X-Trail</td>
              <td>2018</td>
              <td className="text-blue-600 font-semibold">
                LKR 6,800,000
              </td>
              <td>
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
                  Completed
                </span>
              </td>
            </tr>

            <tr className="border-b">
              <td className="py-3">2023-12-28</td>
              <td>Suzuki</td>
              <td>Swift</td>
              <td>2021</td>
              <td className="text-blue-600 font-semibold">
                LKR 3,200,000
              </td>
              <td>
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
                  Completed
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Analytics
