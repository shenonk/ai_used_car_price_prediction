import { BrowserRouter, Routes, Route } from "react-router-dom";

import ChatBot from "./components/ChatBot";
import MainLayout from "./layout/MainLayout";

import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Marketplace from "./pages/Marketplace";
import MySubmittedAds from "./pages/MySubmittedAds";
import PriceCheck from "./pages/PriceCheck";
import Results from "./pages/Results";
import Analytics from "./pages/Analytics";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import VehicleFinancingOptions from "./pages/VehicleFinancingOptions";
import HelpCenter from "./pages/HelpCenter";
import ProtectedRoute from "./components/auth/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* STANDALONE PAGES - no layout */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/" element={<Home />} />

        {/* MAIN LAYOUT WRAP */}
        <Route element={<MainLayout />}>
          <Route
            path="dashboard"
            element={
              <ProtectedRoute
                authMessage="Sign in to open your dashboard."
                authSubMessage="Dashboard, saved activity, and account insights are available only for logged-in users."
              >
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="marketplace" element={<Marketplace />} />
          <Route
            path="marketplace/my-ads"
            element={
              <ProtectedRoute
                authMessage="Sign in to view your submitted ads."
                authSubMessage="Your listing status and seller activity are available only in your account."
              >
                <MySubmittedAds />
              </ProtectedRoute>
            }
          />
          <Route path="price-check" element={<PriceCheck />} />
          <Route path="results" element={<Results />} />
          <Route
            path="analytics"
            element={
              <ProtectedRoute
                authMessage="Sign in to view analytics."
                authSubMessage="Saved prediction trends and deeper account analytics are available only for logged-in users."
              >
                <Analytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="notifications"
            element={
              <ProtectedRoute
                authMessage="Sign in to view notifications."
                authSubMessage="Personal notifications and alert activity are available only for logged-in users."
              >
                <Notifications />
              </ProtectedRoute>
            }
          />
          <Route
            path="settings"
            element={
              <ProtectedRoute
                authMessage="Sign in to open settings."
                authSubMessage="Profile, password, alerts, and notification settings are available only for logged-in users."
              >
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route path="financing" element={<VehicleFinancingOptions />} />
          <Route path="help" element={<HelpCenter />} />
        </Route>

      </Routes>
      <ChatBot />
    </BrowserRouter>
  );
}

export default App;
