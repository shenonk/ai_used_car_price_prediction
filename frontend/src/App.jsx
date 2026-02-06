import { BrowserRouter, Routes, Route } from "react-router-dom"
import Dashboard from "./pages/Dashboard"
import PriceCheck from "./pages/PriceCheck"
import Results from "./pages/Results"
import Analytics from "./pages/Analytics"
import Notifications from "./pages/Notifications"
import Login from "./pages/Login"

function App() {
  return (
    <BrowserRouter>

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Dashboard />} />
        <Route path="/price" element={<PriceCheck />} />
        <Route path="/results" element={<Results />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/notifications" element={<Notifications />} />
      </Routes>

    </BrowserRouter>
  )
}

export default App
