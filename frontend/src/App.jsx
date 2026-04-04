import { BrowserRouter, Routes, Route } from "react-router-dom";

import ChatBot from "./components/ChatBot";
import MainLayout from "./layout/MainLayout";

import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Marketplace from "./pages/Marketplace";
import PriceCheck from "./pages/PriceCheck";
import Results from "./pages/Results";
import Analytics from "./pages/Analytics";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import VehicleFinancingOptions from "./pages/VehicleFinancingOptions";
import HelpCenter from "./pages/HelpCenter";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* STANDALONE PAGES - no layout */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* MAIN LAYOUT WRAP */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="marketplace" element={<Marketplace />} />
          <Route path="price-check" element={<PriceCheck />} />
          <Route path="results" element={<Results />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="settings" element={<Settings />} />
          <Route path="financing" element={<VehicleFinancingOptions />} />
          <Route path="help" element={<HelpCenter />} />
        </Route>

      </Routes>
      <ChatBot />
    </BrowserRouter>
  );
}

export default App;
