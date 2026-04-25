import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getCurrentUser } from "../utils/auth";
import { supabase } from "../utils/supabaseClient";
import { loadUserAlerts, upsertUserAlert } from "../utils/userAlerts";
import logoUrl from "../assets/logo/autovaluelk-logo-pdf.png";

function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const vehicle = location.state?.vehicle || null;
  const predictedPrice = location.state?.predictedPrice || 4500000;
  const predictedAt = location.state?.predictedAt || Date.now();
  const predictionKey = location.state?.predictionKey || `${vehicle?.brand || "unknown"}-${vehicle?.model || "unknown"}-${predictedAt}`;
  const saveStatus = location.state?.saveStatus || "local_only";
  const saveMessage = location.state?.saveMessage || "Prediction saved only on this device.";
  const [alertSet, setAlertSet] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [loanPlans, setLoanPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const themeStyles =
    typeof window !== "undefined"
      ? getComputedStyle(document.documentElement)
      : null;
  const themeTextPrimary = themeStyles?.getPropertyValue("--text-primary")?.trim() || "#f8fafc";
  const themeTextSecondary = themeStyles?.getPropertyValue("--text-secondary")?.trim() || "#94a3b8";
  const themeSurface = themeStyles?.getPropertyValue("--bg-surface")?.trim() || "#1e293b";
  const themeBorder = themeStyles?.getPropertyValue("--border-color")?.trim() || "#334155";

  const formattedPrice = predictedPrice.toLocaleString('en-LK');

  useEffect(() => {
    fetchBestRates();
  }, []);

  useEffect(() => {
    const persistPredictionForCurrentUser = async () => {
      if (!vehicle) {
        return;
      }

      const user = await getCurrentUser();
      if (!user) {
        return;
      }

      upsertUserAlert(user, {
        predictionKey,
        vehicle,
        price: predictedPrice,
        createdAt: predictedAt,
        source: "prediction",
      });
    };

    persistPredictionForCurrentUser();
  }, [predictionKey, predictedAt, predictedPrice, vehicle]);

  const fetchBestRates = async () => {
    try {
      setIsLoading(true);
      // Fetch the lowest available bank rate for the results preview
      const { data, error } = await supabase
        .from('financing_options')
        .select('fixed_rate')
        .eq('status', 'Active')
        .eq('type', 'Bank')
        .order('fixed_rate', { ascending: true })
        .limit(1);

      const bestRate = data && data.length > 0 ? data[0].fixed_rate : 8.5;

      const plans = [
        { 
            years: 3, 
            interest: `${bestRate}%`, 
            monthly: Math.round((predictedPrice * 0.9 * (1 + (bestRate/100 * 3))) / 36).toLocaleString(), 
            total: Math.round(predictedPrice * 0.9 * (1 + (bestRate/100 * 3))).toLocaleString(), 
            recommended: true 
        },
        { 
            years: 5, 
            interest: `${(bestRate + 0.5)}%`, 
            monthly: Math.round((predictedPrice * 0.9 * (1 + ((bestRate+0.5)/100 * 5))) / 60).toLocaleString(), 
            total: Math.round(predictedPrice * 0.9 * (1 + ((bestRate+0.5)/100 * 5))).toLocaleString(), 
            recommended: false 
        },
        { 
            years: 7, 
            interest: `${(bestRate + 1.0)}%`, 
            monthly: Math.round((predictedPrice * 0.9 * (1 + ((bestRate+1.0)/100 * 7))) / 84).toLocaleString(), 
            total: Math.round(predictedPrice * 0.9 * (1 + ((bestRate+1.0)/100 * 7))).toLocaleString(), 
            recommended: false 
        },
      ];
      setLoanPlans(plans);
    } catch (err) {
      console.error("Error fetching rates:", err);
      // Fallback plans if fetch fails
      setLoanPlans([
        { years: 3, interest: "8.5%", monthly: "125,000", total: "4,500,000", recommended: true },
        { years: 5, interest: "9%", monthly: "85,000", total: "5,100,000", recommended: false },
        { years: 7, interest: "9.5%", monthly: "65,000", total: "5,460,000", recommended: false },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const pieData = [
    { name: "Principal", value: 85.4 },
    { name: "Interest", value: 13.7 },
    { name: "Processing Fee", value: 0.9 }
  ];
  const COLORS = ["#3b82f6", "#f59e0b", "#10b981"];

  const downPaymentData = [
    { name: "10%", down: Math.round(predictedPrice * 0.1), monthly: Math.round((predictedPrice * 0.9 * 1.085) / 36) },
    { name: "20%", down: Math.round(predictedPrice * 0.2), monthly: Math.round((predictedPrice * 0.8 * 1.085) / 36) },
    { name: "30%", down: Math.round(predictedPrice * 0.3), monthly: Math.round((predictedPrice * 0.7 * 1.085) / 36) },
    { name: "40%", down: Math.round(predictedPrice * 0.4), monthly: Math.round((predictedPrice * 0.6 * 1.085) / 36) },
  ];

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      // Simulate slight delay for UX
      await new Promise(r => setTimeout(r, 600));

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const user = await getCurrentUser();
      const userEmail = user ? (user.username || user.email) : "Guest User";

      // 1. Draw Logo
      const logoImg = new Image();
      logoImg.src = logoUrl;
      
      await new Promise((resolve) => {
        if (logoImg.complete) resolve();
        else {
          logoImg.onload = resolve;
          logoImg.onerror = resolve; // Continue even if logo fails
        }
      });

      if (logoImg.complete && logoImg.naturalWidth > 0) {
        doc.addImage(logoImg, 'PNG', pageWidth / 2 - 15, 10, 30, 30);
      }

      // 2. Header Texts
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text("AutoValueLK", pageWidth / 2, 48, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(14);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text("Vehicle Price Prediction Report", pageWidth / 2, 56, { align: "center" });

      // 3. Document Meta Info
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 70);
      doc.text(`Requested By: ${userEmail}`, 14, 76);

      // 4. Vehicle Details Table
      autoTable(doc, {
        startY: 85,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] }, // blue-500
        head: [['Vehicle Specifications', 'Details']],
        body: [
          ['Brand', vehicle?.brand || 'N/A'],
          ['Model', vehicle?.model || 'N/A'],
          ['Manufacture Year', vehicle?.year || 'N/A'],
          ['Engine Capacity', vehicle?.engine ? `${vehicle.engine} cc` : 'N/A'],
          ['Mileage', vehicle?.mileage ? `${vehicle.mileage} km` : 'N/A'],
          ['Fuel Type', vehicle?.fuel || 'N/A'],
          ['Transmission', vehicle?.transmission || 'N/A'],
          ['Condition', vehicle?.condition || 'N/A'],
        ],
      });

      // 5. Predicted Price Block
      const currentY = doc.lastAutoTable.finalY + 15;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(15, 23, 42);
      doc.text("Estimated Market Value", 14, currentY);

      doc.setFontSize(28);
      doc.setTextColor(16, 185, 129); // emerald-500
      doc.text(`LKR ${formattedPrice}`, 14, currentY + 12);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.setFont("helvetica", "italic");
      doc.text("* Prediction accuracy is approximately ±5%", 14, currentY + 20);

      // 6. Loan Options Table
      autoTable(doc, {
        startY: currentY + 30,
        theme: 'striped',
        headStyles: { fillColor: [15, 23, 42] }, // slate-900
        head: [['Loan Duration', 'Interest Rate', 'Monthly Payment', 'Total Amount']],
        body: loanPlans.map(p => [
          `${p.years} Years${p.recommended ? ' (Recommended)' : ''}`,
          p.interest,
          `LKR ${p.monthly}`,
          `LKR ${p.total}`
        ]),
      });

      // 7. Footer
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184); // slate-400
        doc.text(
          "© 2026 AutoValueLK. All rights reserved. This report is machine-generated.",
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }

      // Download PDF
      doc.save(`AutoValueLK_${vehicle?.brand || 'Report'}_${vehicle?.model || ''}.pdf`);

    } catch (err) {
      console.error("PDF generation failed", err);
      alert("Failed to generate PDF report.");
    } finally {
      setDownloading(false);
    }
  };

  const handleSetAlert = async () => {
    const user = await getCurrentUser();
    if (!user) {
      alert("Please log in to save price alerts.");
      return;
    }

    const existingAlerts = loadUserAlerts(user);
    const matchingAlert = existingAlerts.find((item) => item.predictionKey === predictionKey);

    upsertUserAlert(user, {
      predictionKey,
      vehicle: vehicle || { brand: 'Unknown', model: 'Unknown' },
      price: predictedPrice,
      createdAt: matchingAlert?.createdAt || predictedAt,
      source: "prediction",
      tracked: true,
    });

    setAlertSet(true);
    setTimeout(() => setAlertSet(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] p-8">

      {/* No vehicle data warning */}
      {!vehicle && (
        <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3 animate-fade-in">
          <svg className="w-5 h-5 text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <p className="text-amber-300 text-sm font-medium">Sample data shown</p>
            <p className="text-slate-400 text-xs">Go to <button onClick={() => navigate('/price-check')} className="text-blue-400 hover:underline">Price Check</button> to get a personalized prediction.</p>
          </div>
        </div>
      )}

      <div className={`mb-6 p-4 rounded-xl border flex items-start gap-3 animate-fade-in ${
        saveStatus === "cloud"
          ? "bg-emerald-500/10 border-emerald-500/30"
          : "bg-amber-500/10 border-amber-500/30"
      }`}>
        <svg className={`w-5 h-5 flex-shrink-0 ${saveStatus === "cloud" ? "text-emerald-400" : "text-amber-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {saveStatus === "cloud" ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          )}
        </svg>
        <div>
          <p className={`text-sm font-medium ${saveStatus === "cloud" ? "text-emerald-300" : "text-amber-300"}`}>
            {saveStatus === "cloud" ? "Saved to your account" : "Saved locally only"}
          </p>
          <p className="text-slate-400 text-xs">{saveMessage}</p>
        </div>
      </div>

      {/* HEADER - Price Result */}
      <div className="relative overflow-hidden rounded-2xl p-8 mb-8 animate-fade-in" style={{
        background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 50%, #10b981 100%)'
      }}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h1 className="text-2xl font-bold text-white">Price Prediction Result</h1>
          </div>
          {vehicle && (
            <p className="text-white/80 text-sm mb-6">
              {vehicle.brand} {vehicle.model} • {vehicle.year} • {vehicle.engine}cc • {vehicle.fuel} • {vehicle.transmission}
            </p>
          )}
          {!vehicle && <p className="text-white/80 text-sm mb-6">Based on your vehicle specifications</p>}

          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 inline-block">
            <p className="text-white/80 text-sm mb-1">Estimated Market Value</p>
            <h2 className="text-5xl font-bold text-white">LKR {formattedPrice}</h2>
            <div className="flex items-center gap-2 mt-3">
              <span className="badge bg-white/20 text-white border-white/30">±5% accuracy</span>
              <span className="badge bg-white/20 text-white border-white/30">Updated today</span>
            </div>
          </div>
        </div>
      </div>

      {/* LOAN PLANS + PIE CHART */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card p-6 animate-fade-in animate-delay-100">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            Loan Repayment Plans
          </h2>
          <div className="space-y-4">
            {isLoading ? (
                <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            ) : loanPlans.length === 0 ? (
                <p className="text-center py-8 text-slate-500">No loan plans available.</p>
            ) : (
                loanPlans.map((plan, index) => (
                <div key={index} className={`p-4 rounded-xl border transition-all duration-300 hover:translate-x-1 ${plan.recommended ? 'bg-blue-500/20 border-blue-500/50' : 'bg-slate-800/30 border-slate-700/50 hover:border-slate-600/50'}`}>
                    <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold text-white">{plan.years} Years</span>
                        {plan.recommended && <span className="badge badge-success text-xs">Recommended</span>}
                    </div>
                    <span className="text-sm text-slate-400">{plan.interest} Interest</span>
                    </div>
                    <div className="flex justify-between text-sm">
                    <div>
                        <p className="text-slate-400">Monthly Payment</p>
                        <p className="font-semibold text-blue-400 text-lg">LKR {plan.monthly}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-slate-400">Total Amount</p>
                        <p className="font-semibold text-white">LKR {plan.total}</p>
                    </div>
                    </div>
                </div>
                ))
            )}
          </div>
        </div>

        <div className="card p-6 animate-fade-in animate-delay-200">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
            </svg>
            Cost Breakdown
          </h2>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={100} innerRadius={60} dataKey="value" strokeWidth={0}>
                {pieData.map((entry, index) => (<Cell key={index} fill={COLORS[index]} />))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: themeSurface, border: `1px solid ${themeBorder}`, borderRadius: '12px', color: themeTextPrimary }} />
              <Legend wrapperStyle={{ color: themeTextSecondary }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* DOWN PAYMENT BAR CHART */}
      <div className="card p-6 animate-fade-in animate-delay-300">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Down Payment Options
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={downPaymentData}>
            <CartesianGrid strokeDasharray="3 3" stroke={themeBorder} />
            <XAxis dataKey="name" stroke={themeTextSecondary} />
            <YAxis stroke={themeTextSecondary} />
            <Tooltip contentStyle={{ backgroundColor: themeSurface, border: `1px solid ${themeBorder}`, borderRadius: '12px', color: themeTextPrimary }} />
            <Legend wrapperStyle={{ color: themeTextSecondary }} />
            <Bar dataKey="down" fill="#f59e0b" name="Down Payment" radius={[4, 4, 0, 0]} />
            <Bar dataKey="monthly" fill="#3b82f6" name="Monthly Payment" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* BUTTONS */}
      <div className="flex flex-col sm:flex-row gap-4 mt-6 animate-fade-in animate-delay-400">
        <button
          onClick={() => navigate('/financing', { state: { vehicle, predictedPrice } })}
          className="flex-1 btn-primary py-4 flex items-center justify-center gap-2 rounded-xl font-semibold shadow-lg shadow-blue-500/20"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          View Financing Options
        </button>

        <button
          onClick={handleDownloadPDF}
          disabled={downloading}
          className="flex-1 py-4 flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-300 btn-secondary disabled:opacity-70"
        >
          {downloading ? (
            <>
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              Generating...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Download PDF Report
            </>
          )}
        </button>

        <button
          onClick={handleSetAlert}
          disabled={alertSet}
          className={`flex-1 py-4 flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-300 ${alertSet ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-400' : 'bg-amber-500/20 border border-amber-500/50 text-amber-400 hover:bg-amber-500/30'}`}
        >
          {alertSet ? (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              Alert Set!
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              Set Price Alert
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default Results;
