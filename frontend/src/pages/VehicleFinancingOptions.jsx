import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// ============================================
// MOCK DATA — Sri Lankan financial institutions
// ============================================
const institutions = [
    {
        id: 1,
        name: "Commercial Bank",
        type: "Bank",
        interestRate: 8.5,
        maxTenure: 60,
        minDownPayment: 20,
        logo: "🏦",
        color: "blue",
    },
    {
        id: 2,
        name: "Sampath Bank",
        type: "Bank",
        interestRate: 9.0,
        maxTenure: 72,
        minDownPayment: 15,
        logo: "🏦",
        color: "cyan",
    },
    {
        id: 3,
        name: "People's Bank",
        type: "Bank",
        interestRate: 7.5,
        maxTenure: 60,
        minDownPayment: 20,
        logo: "🏛️",
        color: "emerald",
    },
    {
        id: 4,
        name: "Vallibel Finance",
        type: "Leasing",
        interestRate: 10.5,
        maxTenure: 48,
        minDownPayment: 25,
        logo: "💰",
        color: "amber",
    },
    {
        id: 5,
        name: "LB Finance",
        type: "Leasing",
        interestRate: 11.0,
        maxTenure: 48,
        minDownPayment: 20,
        logo: "💳",
        color: "rose",
    },
    {
        id: 6,
        name: "HNB Finance",
        type: "Bank",
        interestRate: 8.0,
        maxTenure: 60,
        minDownPayment: 15,
        logo: "🏦",
        color: "purple",
    },
    {
        id: 7,
        name: "Vallibel Finance",
        type: "Auto Draft",
        category: "Draft",
        interestRate: 21.0,
        maxTenure: 12,
        minDownPayment: 10,
        logo: "💸",
        color: "amber",
    },
    {
        id: 8,
        name: "LB Finance",
        type: "Power Draft",
        category: "Draft",
        interestRate: 19.5,
        maxTenure: 12,
        minDownPayment: 10,
        logo: "💸",
        color: "rose",
    },
    {
        id: 9,
        name: "Union Bank",
        type: "Turbo-Draft",
        category: "Draft",
        interestRate: 16.5,
        maxTenure: 12,
        minDownPayment: 10,
        logo: "💸",
        color: "emerald",
    },
    {
        id: 10,
        name: "CDB",
        type: "Smart Draft",
        category: "Draft",
        interestRate: 18.0,
        maxTenure: 12,
        minDownPayment: 10,
        logo: "💸",
        color: "blue",
    },
    {
        id: 11,
        name: "Singer Finance",
        type: "Quick Draft",
        category: "Draft",
        interestRate: 20.5,
        maxTenure: 12,
        minDownPayment: 10,
        logo: "💸",
        color: "cyan",
    },
];

// ============================================
// COMPONENT
// ============================================
function VehicleFinancingOptions() {
    const location = useLocation();
    const navigate = useNavigate();

    // Get predicted price from navigation state or use default
    const predictedPrice = location.state?.predictedPrice || 3450000;
    const vehicle = location.state?.vehicle || null;
    const formattedPrice = predictedPrice.toLocaleString("en-LK");

    const [financingType, setFinancingType] = useState("loan"); // 'loan' or 'leasing'
    const [selectedInstitution, setSelectedInstitution] = useState(null);
    const [downPaymentPercent, setDownPaymentPercent] = useState(20);
    const [tenure, setTenure] = useState(36); // months

    // Derived calculations
    const downPayment = Math.round(predictedPrice * (downPaymentPercent / 100));
    const loanAmount = predictedPrice - downPayment;
    const interestRate = selectedInstitution?.interestRate || 8.5;
    const monthlyRate = interestRate / 100 / 12;
    const emi = financingType === "draft"
        ? Math.round((loanAmount * (interestRate / 100)) / 12)
        : monthlyRate > 0
            ? Math.round(
                (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, tenure)) /
                (Math.pow(1 + monthlyRate, tenure) - 1)
            )
            : Math.round(loanAmount / tenure);
    const totalPayable = financingType === "draft" ? (emi * tenure) + loanAmount : emi * tenure;
    const totalInterest = totalPayable - loanAmount;

    // Filter institutions by financing type
    const filteredInstitutions = institutions.filter((inst) =>
        financingType === "loan" ? inst.type === "Bank" : financingType === "leasing" ? inst.type === "Leasing" : inst.category === "Draft"
    );

    // Color maps for institution cards
    const colorMap = {
        blue: { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-400", hover: "hover:border-blue-500/60" },
        cyan: { bg: "bg-cyan-500/10", border: "border-cyan-500/30", text: "text-cyan-400", hover: "hover:border-cyan-500/60" },
        emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400", hover: "hover:border-emerald-500/60" },
        amber: { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400", hover: "hover:border-amber-500/60" },
        rose: { bg: "bg-rose-500/10", border: "border-rose-500/30", text: "text-rose-400", hover: "hover:border-rose-500/60" },
        purple: { bg: "bg-purple-500/10", border: "border-purple-500/30", text: "text-purple-400", hover: "hover:border-purple-500/60" },
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
                        <p className="text-slate-400 text-xs">
                            Go to{" "}
                            <button onClick={() => navigate("/price-check")} className="text-blue-400 hover:underline">
                                Price Check
                            </button>{" "}
                            to get a personalized prediction.
                        </p>
                    </div>
                </div>
            )}

            {/* =========================================
          1️⃣ VEHICLE PRICE SUMMARY CARD
          ========================================= */}
            <div
                className="relative overflow-hidden rounded-2xl p-8 mb-8 animate-fade-in"
                style={{
                    background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #06b6d4 100%)",
                }}
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h1 className="text-2xl font-bold text-white">Vehicle Financing Options</h1>
                    </div>
                    {vehicle && (
                        <p className="text-white/80 text-sm mb-6">
                            {vehicle.brand} {vehicle.model} • {vehicle.year} • {vehicle.engine}cc
                        </p>
                    )}
                    {!vehicle && <p className="text-white/80 text-sm mb-6">Explore loan and leasing options for your vehicle</p>}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-5">
                            <p className="text-white/70 text-xs mb-1 uppercase tracking-wide font-medium">Predicted Price</p>
                            <h2 className="text-3xl font-bold text-white">LKR {formattedPrice}</h2>
                        </div>
                        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-5">
                            <p className="text-white/70 text-xs mb-1 uppercase tracking-wide font-medium">Down Payment ({downPaymentPercent}%)</p>
                            <h2 className="text-3xl font-bold text-white">LKR {downPayment.toLocaleString("en-LK")}</h2>
                        </div>
                        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-5">
                            <p className="text-white/70 text-xs mb-1 uppercase tracking-wide font-medium">Loan Amount</p>
                            <h2 className="text-3xl font-bold text-white">LKR {loanAmount.toLocaleString("en-LK")}</h2>
                        </div>
                    </div>
                </div>
            </div>

            {/* =========================================
          2️⃣ FINANCING TYPE SELECTOR
          ========================================= */}
            <div className="card p-6 mb-6 animate-fade-in animate-delay-100">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    Select Financing Type
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                        onClick={() => { setFinancingType("loan"); setSelectedInstitution(null); }}
                        className={`p-5 rounded-xl border-2 transition-all duration-300 text-left ${financingType === "loan"
                                ? "border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/10"
                                : "border-slate-700 bg-slate-800/30 hover:border-slate-600"
                            }`}
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${financingType === "loan" ? "bg-blue-500/20 text-blue-400" : "bg-slate-700 text-slate-400"
                                }`}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                </svg>
                            </div>
                            <div>
                                <p className={`font-semibold ${financingType === "loan" ? "text-blue-400" : "text-white"}`}>Vehicle Loan</p>
                                <p className="text-xs text-slate-400">Bank financing with fixed EMIs</p>
                            </div>
                        </div>
                        {financingType === "loan" && (
                            <div className="mt-2 flex items-center gap-1 text-xs text-blue-400">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Selected
                            </div>
                        )}
                    </button>
                    <button
                        onClick={() => { setFinancingType("leasing"); setSelectedInstitution(null); }}
                        className={`p-5 rounded-xl border-2 transition-all duration-300 text-left ${financingType === "leasing"
                                ? "border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/10"
                                : "border-slate-700 bg-slate-800/30 hover:border-slate-600"
                            }`}
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${financingType === "leasing" ? "bg-amber-500/20 text-amber-400" : "bg-slate-700 text-slate-400"
                                }`}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <div>
                                <p className={`font-semibold ${financingType === "leasing" ? "text-amber-400" : "text-white"}`}>Vehicle Leasing</p>
                                <p className="text-xs text-slate-400">Leasing company financing</p>
                            </div>
                        </div>
                        {financingType === "leasing" && (
                            <div className="mt-2 flex items-center gap-1 text-xs text-amber-400">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Selected
                            </div>
                        )}
                    </button>
                    <button
                        onClick={() => { setFinancingType("draft"); setSelectedInstitution(null); }}
                        className={`p-5 rounded-xl border-2 transition-all duration-300 text-left ${financingType === "draft"
                                ? "border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/10"
                                : "border-slate-700 bg-slate-800/30 hover:border-slate-600"
                            }`}
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${financingType === "draft" ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-700 text-slate-400"
                                }`}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className={`font-semibold ${financingType === "draft" ? "text-emerald-400" : "text-white"}`}>Vehicle Draft</p>
                                <p className="text-xs text-slate-400">Flexible credit line against your vehicle. Pay interest monthly, principal at maturity.</p>
                            </div>
                        </div>
                        {financingType === "draft" && (
                            <div className="mt-2 flex items-center gap-1 text-xs text-emerald-400">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Selected
                            </div>
                        )}
                    </button>
                </div>
            </div>

            {/* =========================================
          3️⃣ FINANCIAL INSTITUTION SELECTION
          ========================================= */}
            <div className="card p-6 mb-6 animate-fade-in animate-delay-200">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    {financingType === "loan" ? "Select a Bank" : financingType === "leasing" ? "Select a Leasing Company" : "Select a Draft Provider"}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredInstitutions.map((inst) => {
                        const colors = colorMap[inst.color];
                        const isSelected = selectedInstitution?.id === inst.id;
                        return (
                            <button
                                key={inst.id}
                                onClick={() => { setSelectedInstitution(inst); setTenure(Math.min(tenure, inst.maxTenure)); }}
                                className={`p-5 rounded-xl border-2 transition-all duration-300 text-left ${colors.hover} ${isSelected
                                        ? `${colors.border} ${colors.bg} shadow-lg`
                                        : "border-slate-700/50 bg-slate-800/30 hover:bg-slate-800/50"
                                    }`}
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${isSelected ? colors.bg : "bg-slate-700/50"
                                        }`}>
                                        {inst.logo}
                                    </div>
                                    <div>
                                        <p className={`font-semibold text-sm ${isSelected ? colors.text : "text-white"}`}>{inst.name}</p>
                                        <p className="text-xs text-slate-500">{inst.type}</p>
                                    </div>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <div>
                                        <p className="text-slate-500">Interest Rate</p>
                                        <p className={`font-semibold ${isSelected ? colors.text : "text-white"}`}>{inst.interestRate}%</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-slate-500">Max Tenure</p>
                                        <p className={`font-semibold ${isSelected ? colors.text : "text-white"}`}>{inst.maxTenure} months</p>
                                    </div>
                                </div>
                                {isSelected && (
                                    <div className="mt-3 flex items-center gap-1 text-xs" style={{ color: "inherit" }}>
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            Selected
                                        </span>
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* =========================================
          4️⃣ LOAN / LEASING CALCULATION PANEL
          ========================================= */}
            {selectedInstitution && (
                <div className="card p-6 mb-6 animate-fade-in">
                    <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        {financingType === "loan" ? "Loan" : financingType === "leasing" ? "Leasing" : "Draft"} Calculation — {selectedInstitution.name}
                    </h2>

                    {/* Sliders */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">
                                Down Payment: <span className="text-white font-semibold">{downPaymentPercent}%</span>
                                <span className="text-slate-500 ml-2">(LKR {downPayment.toLocaleString("en-LK")})</span>
                            </label>
                            <input
                                type="range"
                                min={selectedInstitution.minDownPayment}
                                max="70"
                                value={downPaymentPercent}
                                onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
                                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                            <div className="flex justify-between text-xs text-slate-500 mt-1">
                                <span>{selectedInstitution.minDownPayment}%</span>
                                <span>70%</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">
                                Tenure: <span className="text-white font-semibold">{tenure} months</span>
                                <span className="text-slate-500 ml-2">({(tenure / 12).toFixed(1)} years)</span>
                            </label>
                            <input
                                type="range"
                                min="12"
                                max={selectedInstitution.maxTenure}
                                step="6"
                                value={tenure}
                                onChange={(e) => setTenure(Number(e.target.value))}
                                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                            <div className="flex justify-between text-xs text-slate-500 mt-1">
                                <span>12 months</span>
                                <span>{selectedInstitution.maxTenure} months</span>
                            </div>
                        </div>
                    </div>

                    {/* Calculation Results */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                        {[
                            { label: "Down Payment", value: `LKR ${downPayment.toLocaleString("en-LK")}`, icon: "💵", color: "text-emerald-400" },
                            { label: "Loan Amount", value: `LKR ${loanAmount.toLocaleString("en-LK")}`, icon: "🏦", color: "text-blue-400" },
                            { label: "Interest Rate", value: `${interestRate}%`, icon: "📊", color: "text-amber-400" },
                            { label: "Tenure", value: `${tenure} months`, icon: "📅", color: "text-cyan-400" },
                            { label: "Monthly Installment", value: `LKR ${emi.toLocaleString("en-LK")}`, icon: "💰", color: "text-purple-400" },
                            { label: "Total Payable", value: `LKR ${totalPayable.toLocaleString("en-LK")}`, icon: "🧾", color: "text-rose-400" },
                        ].map((item, i) => (
                            <div key={i} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 hover:border-slate-600/50 transition-all duration-300">
                                <div className="text-xl mb-2">{item.icon}</div>
                                <p className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-1">{item.label}</p>
                                <p className={`text-sm font-bold ${item.color}`}>{item.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Total Interest */}
                    <div className="mt-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm text-slate-300">Total Interest Payable</span>
                        </div>
                        <span className="text-lg font-bold text-blue-400">LKR {totalInterest.toLocaleString("en-LK")}</span>
                    </div>

                    {financingType === "draft" && (
                        <p className="text-xs text-slate-400 mt-4 text-center">
                            (facility can be renewed for another 12 months)
                        </p>
                    )}
                </div>
            )}

            {/* =========================================
          5️⃣ FINANCING COMPARISON TABLE
          ========================================= */}
            <div className="card p-6 animate-fade-in animate-delay-300">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Financing Comparison
                    <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full ml-auto font-normal">
                        {financingType === "loan" ? "Banks" : financingType === "leasing" ? "Leasing Companies" : "Draft Providers"}
                    </span>
                </h2>

                <div className="overflow-x-auto">
                    <table className="table-modern">
                        <thead>
                            <tr>
                                <th>Institution</th>
                                <th>Interest Rate</th>
                                <th>Max Tenure</th>
                                <th>Min Down Payment</th>
                                <th>Est. Monthly Payment *</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredInstitutions.map((inst) => {
                                const instMonthlyRate = inst.interestRate / 100 / 12;
                                const actualDownPayment = Math.max(downPaymentPercent, inst.minDownPayment);
                                const instLoan = predictedPrice * (1 - actualDownPayment / 100);
                                const actualTenure = Math.min(tenure, inst.maxTenure);
                                const instEmi = inst.category === "Draft"
                                    ? Math.round((instLoan * (inst.interestRate / 100)) / 12)
                                    : Math.round(
                                        (instLoan * instMonthlyRate * Math.pow(1 + instMonthlyRate, actualTenure)) /
                                        (Math.pow(1 + instMonthlyRate, actualTenure) - 1)
                                    );
                                const colors = colorMap[inst.color];
                                const isSelected = selectedInstitution?.id === inst.id;

                                return (
                                    <tr
                                        key={inst.id}
                                        className={`cursor-pointer ${isSelected ? "bg-blue-500/5" : ""}`}
                                        onClick={() => { setSelectedInstitution(inst); setTenure(Math.min(tenure, inst.maxTenure)); }}
                                    >
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <span className="text-lg">{inst.logo}</span>
                                                <div>
                                                    <p className="font-medium text-white">{inst.name}</p>
                                                    <p className="text-xs text-slate-500">{inst.type}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${colors.bg} ${colors.text}`}>
                                                {inst.interestRate}%
                                            </span>
                                        </td>
                                        <td className="text-slate-300">{inst.maxTenure} months</td>
                                        <td className="text-slate-300">{inst.minDownPayment}%</td>
                                        <td>
                                            <span className="font-semibold text-white">LKR {instEmi.toLocaleString("en-LK")}</span>
                                            <p className="text-xs text-slate-500">for {actualTenure} months</p>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <p className="text-xs text-slate-600 mt-4">
                    * Estimated monthly payment based on down payment ({downPaymentPercent}%) and tenure ({tenure} months), adjusted for institution limits.
                </p>
            </div>

            {/* BACK TO RESULTS BUTTON */}
            <div className="mt-6 animate-fade-in animate-delay-400">
                <button
                    onClick={() => navigate("/results", { state: { vehicle, predictedPrice } })}
                    className="btn-secondary flex items-center gap-2 py-3 px-6"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Results
                </button>
            </div>
        </div>
    );
}

export default VehicleFinancingOptions;
