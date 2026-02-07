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
  Filler
} from "chart.js"

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

function Analytics() {

  // Chart data with gradient
  const data = {
    labels: ["2020", "2021", "2022", "2023", "2024"],
    datasets: [
      {
        label: "Vehicle Value (LKR)",
        data: [5800000, 5500000, 5200000, 5000000, 4700000],
        borderColor: "#f97316",
        backgroundColor: "rgba(249, 115, 22, 0.1)",
        tension: 0.4,
        fill: true,
        pointBackgroundColor: "#f97316",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 8,
      },
    ],
  }

  const options = {
    responsive: true,
    plugins: {
      legend: {
        labels: {
          color: '#94a3b8'
        }
      },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#f8fafc',
        bodyColor: '#94a3b8',
        borderColor: '#334155',
        borderWidth: 1,
        cornerRadius: 12,
        padding: 12,
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(71, 85, 105, 0.3)'
        },
        ticks: {
          color: '#94a3b8'
        }
      },
      y: {
        grid: {
          color: 'rgba(71, 85, 105, 0.3)'
        },
        ticks: {
          color: '#94a3b8'
        }
      }
    }
  }

  const predictions = [
    { date: "2024-01-15", brand: "Toyota", model: "Aqua", year: 2020, price: "4,500,000", status: "completed" },
    { date: "2024-01-10", brand: "Honda", model: "Vezel", year: 2019, price: "5,200,000", status: "completed" },
    { date: "2024-01-05", brand: "Nissan", model: "X-Trail", year: 2018, price: "6,800,000", status: "completed" },
    { date: "2023-12-28", brand: "Suzuki", model: "Swift", year: 2021, price: "3,200,000", status: "completed" },
  ]

  return (
    <div className="min-h-screen bg-[#0f172a] p-8">

      {/* Title */}
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <span className="icon-box icon-box-amber">📈</span>
          Analytics Dashboard
        </h1>
        <p className="text-slate-400">
          Track depreciation trends and prediction history
        </p>
      </div>

      {/* Depreciation Chart */}
      <div className="card p-6 mb-8 animate-fade-in animate-delay-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <span>📉</span> Vehicle Depreciation Analysis
          </h2>
          <select className="input w-auto text-sm py-2">
            <option>Toyota Aqua 2020</option>
            <option>Honda Vezel 2019</option>
            <option>Nissan X-Trail 2018</option>
          </select>
        </div>

        {/* Chart */}
        <div className="h-72">
          <Line data={data} options={options} />
        </div>

        <div className="mt-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📊</span>
            <div>
              <p className="font-semibold text-white">
                Average Depreciation Rate: <span className="text-amber-400">8.5% per year</span>
              </p>
              <p className="text-sm text-slate-400">
                Based on market data for similar vehicles in Sri Lanka
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Prediction History */}
      <div className="card p-6 animate-fade-in animate-delay-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <span>📋</span> Prediction History
          </h2>

          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Search brand or model..."
              className="input w-48 text-sm py-2"
            />
            <select className="input w-auto text-sm py-2">
              <option>All Brands</option>
              <option>Toyota</option>
              <option>Honda</option>
              <option>Nissan</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="table-modern">
            <thead>
              <tr>
                <th>Date</th>
                <th>Brand</th>
                <th>Model</th>
                <th>Year</th>
                <th>Predicted Price</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {predictions.map((item, index) => (
                <tr key={index}>
                  <td className="text-slate-400">{item.date}</td>
                  <td className="text-white font-medium">{item.brand}</td>
                  <td className="text-slate-300">{item.model}</td>
                  <td className="text-slate-400">{item.year}</td>
                  <td className="text-blue-400 font-semibold">LKR {item.price}</td>
                  <td>
                    <span className="badge badge-success">
                      ✓ Completed
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination hint */}
        <div className="mt-6 flex justify-between items-center text-sm text-slate-500">
          <span>Showing 4 of 24 predictions</span>
          <button className="text-blue-400 hover:text-blue-300 transition-colors">
            View All →
          </button>
        </div>
      </div>

    </div>
  )
}

export default Analytics
