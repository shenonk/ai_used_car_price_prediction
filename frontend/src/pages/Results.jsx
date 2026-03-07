import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer
} from "recharts";

function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const vehicle = location.state?.vehicle || null;
  const predictedPrice = location.state?.predictedPrice || 4500000;
  const [alertSet, setAlertSet] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const formattedPrice = predictedPrice.toLocaleString('en-LK');

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

  const loanPlans = [
    { years: 3, interest: "8.5%", monthly: Math.round((predictedPrice * 0.9 * 1.085) / 36).toLocaleString(), total: Math.round(predictedPrice * 0.9 * 1.085).toLocaleString(), recommended: true },
    { years: 5, interest: "9%", monthly: Math.round((predictedPrice * 0.9 * 1.09) / 60).toLocaleString(), total: Math.round(predictedPrice * 0.9 * 1.09).toLocaleString(), recommended: false },
    { years: 7, interest: "9.5%", monthly: Math.round((predictedPrice * 0.9 * 1.095) / 84).toLocaleString(), total: Math.round(predictedPrice * 0.9 * 1.095).toLocaleString(), recommended: false },
  ];

  const handleDownloadPDF = async () => {
    setDownloading(true);
    await new Promise(r => setTimeout(r, 800));

    const content = [
      "═══════════════════════════════════════════",
      "        CARPRICE AI — PRICE REPORT         ",
      "═══════════════════════════════════════════",
      "",
      `Generated: ${new Date().toLocaleString()}`,
      "",
      "─── VEHICLE DETAILS ───",
      `Brand:        ${vehicle?.brand || 'N/A'}`,
      `Model:        ${vehicle?.model || 'N/A'}`,
      `Year:         ${vehicle?.year || 'N/A'}`,
      `Engine:       ${vehicle?.engine ? vehicle.engine + ' cc' : 'N/A'}`,
      `Mileage:      ${vehicle?.mileage ? vehicle.mileage + ' km' : 'N/A'}`,
      `Fuel Type:    ${vehicle?.fuel || 'N/A'}`,
      `Transmission: ${vehicle?.transmission || 'N/A'}`,
      `Condition:    ${vehicle?.condition || 'N/A'}`,
      "",
      "─── PREDICTED PRICE ───",
      `Estimated Market Value:  LKR ${formattedPrice}`,
      `Accuracy:               ±5%`,
      "",
      "─── LOAN OPTIONS ───",
      ...loanPlans.map(p => `${p.years} Years @ ${p.interest}  →  LKR ${p.monthly}/month  (Total: LKR ${p.total})`),
      "",
      "═══════════════════════════════════════════",
      "        © 2026 CarPrice AI                 ",
      "═══════════════════════════════════════════",
    ].join("\n");

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `CarPriceAI_Report_${vehicle?.brand || 'Vehicle'}_${vehicle?.model || ''}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloading(false);
  };

  const handleSetAlert = () => {
    const alerts = JSON.parse(localStorage.getItem('carpriceai_alerts') || '[]');
    alerts.push({
      vehicle: vehicle || { brand: 'Unknown', model: 'Unknown' },
      price: predictedPrice,
      createdAt: Date.now()
    });
    localStorage.setItem('carpriceai_alerts', JSON.stringify(alerts));
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
            {loanPlans.map((plan, index) => (
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
            ))}
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
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#f8fafc' }} />
              <Legend wrapperStyle={{ color: '#94a3b8' }} />
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
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="name" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#f8fafc' }} />
            <Legend wrapperStyle={{ color: '#94a3b8' }} />
            <Bar dataKey="down" fill="#f59e0b" name="Down Payment" radius={[4, 4, 0, 0]} />
            <Bar dataKey="monthly" fill="#3b82f6" name="Monthly Payment" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* BUTTONS */}
      <div className="flex flex-col sm:flex-row gap-4 mt-6 animate-fade-in animate-delay-400">
        <button
          onClick={handleDownloadPDF}
          disabled={downloading}
          className="flex-1 btn-primary py-4 flex items-center justify-center gap-2 disabled:opacity-70"
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
          className={`flex-1 py-4 flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-300 ${alertSet ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-400' : 'btn-secondary bg-amber-500/20 border-amber-500/50 text-amber-400 hover:bg-amber-500/30'}`}
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
