import { useState, useEffect } from 'react';
import api from '../services/api';

/**
 * Dashboard — Admin overview page with stats cards.
 * Fetches data from GET /api/admin/stats
 */
function Dashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await api.get('/api/admin/stats');
            setStats(res.data);
        } catch (err) {
            setError('Unable to load dashboard stats. Backend may be unavailable.');
            // Fallback data for UI preview
            setStats({
                total_predictions: 1248,
                r2_score: 0.9234,
                mae: 285000,
                last_training_date: '2026-02-28',
                active_loan_rate: 12.5,
            });
        } finally {
            setLoading(false);
        }
    };

    const statCards = stats
        ? [
            {
                title: 'Total Predictions',
                value: stats.total_predictions?.toLocaleString() || '—',
                icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                ),
                color: 'blue',
            },
            {
                title: 'Model R² Score',
                value: stats.r2_score != null ? stats.r2_score.toFixed(4) : '—',
                icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                ),
                color: 'emerald',
            },
            {
                title: 'Current MAE',
                value: stats.mae != null ? `LKR ${stats.mae.toLocaleString()}` : '—',
                icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                ),
                color: 'amber',
            },
            {
                title: 'Last Training Date',
                value: stats.last_training_date || '—',
                icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                ),
                color: 'purple',
            },
            {
                title: 'Active Loan Interest Rate',
                value: stats.active_loan_rate != null ? `${stats.active_loan_rate}%` : '—',
                icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                ),
                color: 'cyan',
            },
        ]
        : [];

    const colorMap = {
        blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', glow: 'shadow-blue-500/5' },
        emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', glow: 'shadow-emerald-500/5' },
        amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', glow: 'shadow-amber-500/5' },
        purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20', glow: 'shadow-purple-500/5' },
        cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20', glow: 'shadow-cyan-500/5' },
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <svg className="animate-spin h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
            </div>
        );
    }

    return (
        <div className="animate-[fade-in_0.5s_ease-out]">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                <p className="text-gray-500 text-sm mt-1">System overview and model performance metrics</p>
            </div>

            {/* Error banner */}
            {error && (
                <div className="mb-6 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400 text-sm flex items-center gap-2">
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    {error} Showing sample data.
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {statCards.map((card, i) => {
                    const colors = colorMap[card.color];
                    return (
                        <div
                            key={i}
                            className={`bg-gray-900/60 border ${colors.border} rounded-2xl p-5 
                hover:bg-gray-900/80 hover:-translate-y-1 transition-all duration-300
                shadow-lg ${colors.glow}`}
                            style={{ animationDelay: `${i * 80}ms` }}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className={`w-11 h-11 rounded-xl ${colors.bg} ${colors.text} flex items-center justify-center`}>
                                    {card.icon}
                                </div>
                            </div>
                            <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-1">{card.title}</p>
                            <p className="text-xl font-bold text-white">{card.value}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default Dashboard;
