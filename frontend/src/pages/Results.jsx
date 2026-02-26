import {
  PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer
} from "recharts";

function Results() {

  // Pie chart data
  const pieData = [
    { name: "Principal", value: 85.4 },
    { name: "Interest", value: 13.7 },
    { name: "Processing Fee", value: 0.9 }
  ];

  const COLORS = ["#3b82f6", "#f59e0b", "#10b981"];

  // Bar chart data
  const downPaymentData = [
    { name: "10%", down: 450000, monthly: 145000 },
    { name: "20%", down: 900000, monthly: 120000 },
    { name: "30%", down: 1350000, monthly: 95000 },
    { name: "40%", down: 1800000, monthly: 75000 },
  ];

  const loanPlans = [
    { years: 3, interest: "8.5%", monthly: "145,000", total: "5,220,000", recommended: true },
    { years: 5, interest: "9%", monthly: "95,000", total: "5,700,000", recommended: false },
    { years: 7, interest: "9.5%", monthly: "75,000", total: "6,300,000", recommended: false },
  ];

  return (
    <div className="min-h-screen bg-[#0f172a] p-8">

      {/* HEADER - Price Result */}
      <div className="relative overflow-hidden rounded-2xl p-8 mb-8 animate-fade-in" style={{
        background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 50%, #10b981 100%)'
      }}>
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h1 className="text-2xl font-bold text-white">Price Prediction Result</h1>
          </div>
          <p className="text-white/80 text-sm mb-6">Based on your vehicle specifications</p>

          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 inline-block">
            <p className="text-white/80 text-sm mb-1">Estimated Market Value</p>
            <h2 className="text-5xl font-bold text-white">LKR 4,500,000</h2>
            <div className="flex items-center gap-2 mt-3">
              <span className="badge bg-white/20 text-white border-white/30">±5% accuracy</span>
              <span className="badge bg-white/20 text-white border-white/30">Updated today</span>
            </div>
          </div>
        </div>
      </div>

      {/* LOAN PLANS + PIE CHART */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* Loan Plans */}
        <div className="card p-6 animate-fade-in animate-delay-100">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            Loan Repayment Plans
          </h2>

          <div className="space-y-4">
            {loanPlans.map((plan, index) => (
              <div
                key={index}
                className={`p-4 rounded-xl border transition-all duration-300 hover:translate-x-1
                  ${plan.recommended
                    ? 'bg-blue-500/20 border-blue-500/50'
                    : 'bg-slate-800/30 border-slate-700/50 hover:border-slate-600/50'
                  }`}
              >
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-white">{plan.years} Years</span>
                    {plan.recommended && (
                      <span className="badge badge-success text-xs">Recommended</span>
                    )}
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

        {/* PIE CHART */}
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
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                innerRadius={60}
                dataKey="value"
                strokeWidth={0}
              >
                {pieData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '12px',
                  color: '#f8fafc'
                }}
              />
              <Legend
                wrapperStyle={{ color: '#94a3b8' }}
              />
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
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '12px',
                color: '#f8fafc'
              }}
            />
            <Legend wrapperStyle={{ color: '#94a3b8' }} />
            <Bar dataKey="down" fill="#f59e0b" name="Down Payment" radius={[4, 4, 0, 0]} />
            <Bar dataKey="monthly" fill="#3b82f6" name="Monthly Payment" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* BUTTONS */}
      <div className="flex flex-col sm:flex-row gap-4 mt-6 animate-fade-in animate-delay-400">
        <button className="flex-1 btn-primary py-4 flex items-center justify-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Download PDF Report
        </button>

        <button className="flex-1 btn-secondary py-4 flex items-center justify-center gap-2 bg-amber-500/20 border-amber-500/50 text-amber-400 hover:bg-amber-500/30">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          Set Price Alert
        </button>
      </div>

    </div>
  );
}

export default Results;
