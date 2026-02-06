import Sidebar from "../layout/Sidebar"

function PriceCheck() {
  return (
    <div className="flex bg-[#0f172a] min-h-screen">

      <Sidebar />

      <div className="ml-64 w-full p-8">

        <h1 className="text-3xl font-semibold text-white mb-6">
          Vehicle Price Prediction
        </h1>

        <div className="bg-[#1e293b] p-8 rounded-xl shadow-lg border border-gray-700 max-w-3xl">

          <h2 className="text-xl text-white mb-6 font-semibold">
            Enter Vehicle Details
          </h2>

          {/* Form Grid */}
          <div className="grid grid-cols-2 gap-6">

            <input className="input" placeholder="Brand (Toyota, Honda)" />
            <input className="input" placeholder="Model (Aqua, Vezel)" />

            <input className="input" placeholder="Manufacture Year" />
            <input className="input" placeholder="Mileage (km)" />

            <select className="input">
              <option>Fuel Type</option>
              <option>Petrol</option>
              <option>Hybrid</option>
              <option>Diesel</option>
              <option>Electric</option>
            </select>

            <select className="input">
              <option>Transmission</option>
              <option>Automatic</option>
              <option>Manual</option>
            </select>

            <select className="input col-span-2">
              <option>Condition</option>
              <option>Excellent</option>
              <option>Good</option>
              <option>Average</option>
            </select>

          </div>

          {/* Button */}
          <button className="mt-8 w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-lg text-white font-semibold">
            Predict Car Price
          </button>

        </div>

      </div>
    </div>
  )
}

export default PriceCheck
