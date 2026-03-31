import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import api from '../services/api';
import { supabaseAdmin } from '../utils/supabaseClient';

const formatDate = (dateStr) => {
    if (!dateStr) return '-';

    return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
};

const formatRelativeTime = (dateStr) => {
    if (!dateStr) return 'Never';

    const num = Math.floor((new Date() - new Date(dateStr)) / 60000);

    if (num < 1) return 'Just now';
    if (num < 60) return `${num} minute${num !== 1 ? 's' : ''} ago`;

    const hours = Math.floor(num / 60);
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;

    const days = Math.floor(hours / 24);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
};

function Dashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [dauCount, setDauCount] = useState(0);
    const [dauLoading, setDauLoading] = useState(true);
    const [recentUsers, setRecentUsers] = useState([]);
    const [usersLoading, setUsersLoading] = useState(true);

    useEffect(() => {
        fetchStats();
        fetchDAU();
        fetchRecentUsers();
    }, []);

    const fetchDAU = async () => {
        const now = new Date();
        const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        try {
            setDauLoading(true);

            if (!supabaseAdmin) {
                throw new Error('No service role key found.');
            }

            const { data, error: usersError } = await supabaseAdmin.auth.admin.listUsers({
                page: 1,
                perPage: 1000,
            });

            if (!usersError) {
                const activeUsers = (data?.users || []).filter((user) => {
                    if (!user.last_sign_in_at) return false;
                    return new Date(user.last_sign_in_at) >= last24Hours;
                });

                setDauCount(activeUsers.length);
                return;
            }

            const authListBlocked = /not admin|permission|service role|unauthorized|forbidden/i.test(usersError?.message || '');

            if (authListBlocked) {
                const { count: updatedCount, error: updatedError } = await supabaseAdmin
                    .from('profiles')
                    .select('id', { count: 'exact', head: true })
                    .gte('updated_at', last24Hours.toISOString());

                if (!updatedError) {
                    setDauCount(typeof updatedCount === 'number' ? updatedCount : 0);
                    return;
                }

                throw updatedError || new Error('Unable to fetch fallback DAU from profiles.updated_at.');
            }

            throw usersError || new Error('Unable to fetch DAU from auth.users.');
        } catch (err) {
            console.warn('DAU fetch issue:', err.message);
            setDauCount(0);
        } finally {
            setDauLoading(false);
        }
    };

    const fetchRecentUsers = async () => {
        try {
            if (!supabaseAdmin) {
                throw new Error('No service role key found. Using mock users.');
            }

            const { data, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
            if (usersError) throw usersError;

            const sorted = data.users
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .slice(0, 15);

            setRecentUsers(sorted);
        } catch (err) {
            console.warn('Admin users fetch issue:', err.message);
            setRecentUsers([
                {
                    id: '1',
                    email: 'kushantha@example.com',
                    user_metadata: { username: 'Kushantha' },
                    email_confirmed_at: '2026-03-24T10:00:00Z',
                    created_at: '2026-03-24T09:00:00Z',
                    last_sign_in_at: new Date(Date.now() - 7200000).toISOString(),
                },
                {
                    id: '2',
                    email: 'guest_user@example.com',
                    user_metadata: { username: 'GuestUser123' },
                    email_confirmed_at: null,
                    created_at: '2026-03-23T14:30:00Z',
                    last_sign_in_at: new Date(Date.now() - 86400000).toISOString(),
                },
                {
                    id: '3',
                    email: 'dev_test@example.com',
                    user_metadata: { username: 'Developer' },
                    email_confirmed_at: '2026-03-20T11:20:00Z',
                    created_at: '2026-03-20T11:00:00Z',
                    last_sign_in_at: new Date(Date.now() - 172800000).toISOString(),
                },
            ]);
        } finally {
            setUsersLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await api.get('/api/admin/stats');
            setStats(res.data);
        } catch {
            setError('Unable to load dashboard stats. Backend may be unavailable.');
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
                value: stats.total_predictions?.toLocaleString() || '-',
                icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                ),
                color: 'blue',
            },
            {
                title: 'Daily Active Users (DAU)',
                value: dauLoading ? (
                    <span className="inline-flex items-center gap-2">
                        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>0</span>
                    </span>
                ) : (
                    dauCount.toLocaleString()
                ),
                subtext: 'Unique logins in the last 24 hours',
                icon: <Users className="w-6 h-6" strokeWidth={1.8} />,
                color: 'emerald',
            },
            {
                title: 'Model R2 Score',
                value: stats.r2_score != null ? stats.r2_score.toFixed(4) : '-',
                icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                ),
                color: 'emerald',
            },
            {
                title: 'Current MAE',
                value: stats.mae != null ? `LKR ${stats.mae.toLocaleString()}` : '-',
                icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                ),
                color: 'amber',
            },
            {
                title: 'Last Training Date',
                value: stats.last_training_date || '-',
                icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                ),
                color: 'purple',
            },
            {
                title: 'Active Loan Interest Rate',
                value: stats.active_loan_rate != null ? `${stats.active_loan_rate}%` : '-',
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
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                <p className="text-gray-500 text-sm mt-1">System overview and model performance metrics</p>
            </div>

            {error && (
                <div className="mb-6 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400 text-sm flex items-center gap-2">
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    {error} Showing sample data.
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {statCards.map((card, i) => {
                    const colors = colorMap[card.color];

                    return (
                        <div
                            key={i}
                            className={`bg-gray-900/60 border ${colors.border} rounded-2xl p-5 hover:bg-gray-900/80 hover:-translate-y-1 transition-all duration-300 shadow-lg ${colors.glow}`}
                            style={{ animationDelay: `${i * 80}ms` }}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className={`w-11 h-11 rounded-xl ${colors.bg} ${colors.text} flex items-center justify-center`}>
                                    {card.icon}
                                </div>
                            </div>
                            <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-1">{card.title}</p>
                            <p className={`text-xl font-bold ${card.color === 'emerald' || card.color === 'cyan' ? colors.text : 'text-white'}`}>
                                {card.value}
                            </p>
                            {card.subtext && <p className="text-slate-500 text-xs mt-1">{card.subtext}</p>}
                        </div>
                    );
                })}
            </div>

            <div className="mt-10 animate-[fade-in_0.6s_ease-out]">
                <h2 className="text-xl font-bold text-white mb-4">Recent Registrations</h2>
                <div className="bg-[#1e293b] border border-cyan-500/20 rounded-2xl overflow-hidden shadow-lg shadow-cyan-500/5">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-300">
                            <thead className="bg-slate-900/50 text-xs uppercase text-slate-400 border-b border-cyan-500/10">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">User</th>
                                    <th className="px-6 py-4 font-semibold">Status</th>
                                    <th className="px-6 py-4 font-semibold">Joined</th>
                                    <th className="px-6 py-4 font-semibold">Last Active</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-cyan-500/10">
                                {usersLoading ? (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-8 text-center text-slate-500">
                                            <div className="flex justify-center flex-col items-center">
                                                <svg className="animate-spin h-6 w-6 text-cyan-500 mb-2" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                </svg>
                                                Loading users...
                                            </div>
                                        </td>
                                    </tr>
                                ) : recentUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-8 text-center text-slate-500">
                                            No recent registrations found.
                                        </td>
                                    </tr>
                                ) : (
                                    recentUsers.map((user) => (
                                        <tr key={user.id} className="hover:bg-slate-800/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-white mb-0.5">
                                                    {user.user_metadata?.username || 'Unknown User'}
                                                </div>
                                                <div className="text-xs text-slate-400 truncate max-w-[200px]">
                                                    {user.email}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {user.email_confirmed_at ? (
                                                    <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-inner shadow-emerald-500/10">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                                        Confirmed
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-inner shadow-amber-500/10">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                                                        Pending
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-slate-300">
                                                {formatDate(user.created_at)}
                                            </td>
                                            <td className="px-6 py-4 text-slate-400">
                                                {formatRelativeTime(user.last_sign_in_at)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {!usersLoading && recentUsers.length > 0 && !import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY && (
                    <p className="text-xs text-amber-500/50 mt-3 text-center">
                        Viewing mock records. Add <code className="bg-slate-800 px-1 py-0.5 rounded text-amber-400 tracking-wider">VITE_SUPABASE_SERVICE_ROLE_KEY</code> to your .env to see secure live data.
                    </p>
                )}
            </div>
        </div>
    );
}

export default Dashboard;
