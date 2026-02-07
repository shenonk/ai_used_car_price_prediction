import { BrowserRouter, Routes, Route } from "react-router-dom";

import MainLayout from "./layout/MainLayout";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import PriceCheck from "./pages/PriceCheck";
import Results from "./pages/Results";
import Analytics from "./pages/Analytics";
import Notifications from "./pages/Notifications";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* LOGIN PAGE - Full screen, no layout */}
        <Route path="/login" element={<Login />} />

        {/* MAIN LAYOUT WRAP */}
        <Route path="/" element={<MainLayout />}>

          <Route index element={<Dashboard />} />
          <Route path="price-check" element={<PriceCheck />} />
          <Route path="results" element={<Results />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="notifications" element={<Notifications />} />

        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;
