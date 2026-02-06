import { useNavigate } from "react-router-dom"

function Login() {
  const navigate = useNavigate()

  const handleLogin = () => {
    // fake login
    navigate("/")
  }

  return (
    <div className="flex items-center justify-center h-screen bg-gray-900">

      <div className="bg-white p-8 rounded-xl shadow-lg w-96">

        <h1 className="text-2xl font-bold mb-6 text-center">
          AI Car Price System Login
        </h1>

        <input
          type="text"
          placeholder="Username"
          className="w-full border p-3 mb-4 rounded-lg"
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full border p-3 mb-4 rounded-lg"
        />

        <button
          onClick={handleLogin}
          className="w-full bg-black text-white p-3 rounded-lg hover:bg-gray-800"
        >
          Login
        </button>

        <p className="text-center text-sm text-gray-500 mt-4">
          AI Powered Used Car Price Predictor
        </p>

      </div>
    </div>
  )
}

export default Login
