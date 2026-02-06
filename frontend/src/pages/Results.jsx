import Sidebar from "../layout/Sidebar"

function Results() {
  return (
    <div className="flex">

      <Sidebar />

      <div className="ml-64 p-10 bg-gray-100 min-h-screen w-full">

        <div className="bg-white p-8 rounded-xl shadow">

          <h1 className="text-2xl font-bold mb-4">Prediction Result</h1>

          <p className="text-gray-500">Estimated Market Price</p>
          <h2 className="text-4xl font-bold mb-6">LKR 4,500,000</h2>

          <h3 className="text-xl font-semibold mb-4">Loan Plans</h3>

          <div className="grid grid-cols-3 gap-4">

            <div className="bg-gray-100 p-4 rounded">
              <p className="font-semibold">3 Years</p>
              <p>Monthly: LKR 145,000</p>
            </div>

            <div className="bg-gray-100 p-4 rounded">
              <p className="font-semibold">5 Years</p>
              <p>Monthly: LKR 95,000</p>
            </div>

            <div className="bg-gray-100 p-4 rounded">
              <p className="font-semibold">7 Years</p>
              <p>Monthly: LKR 75,000</p>
            </div>

          </div>

        </div>

      </div>
    </div>
  )
}

export default Results
