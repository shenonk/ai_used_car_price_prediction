import { useState, useEffect } from 'react';
import api from '../services/api';

/**
 * LoanRates — View and update loan rate configuration.
 * GET /api/admin/loan-rate  |  POST /api/admin/update-loan-rate
 */
function LoanRates() {
    const [currentRate, setCurrentRate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Form fields
    const [interestRate, setInterestRate] = useState('');
    const [minDownPayment, setMinDownPayment] = useState('');
    const [maxDuration, setMaxDuration] = useState('');

    useEffect(() => {
        fetchLoanRate();
    }, []);

    const fetchLoanRate = async () => {
        try {
            const res = await api.get('/api/admin/loan-rate');
            const data = res.data;
            setCurrentRate(data);
            setInterestRate(data.interest_rate?.toString() || '');
            setMinDownPayment(data.min_down_payment?.toString() || '');
            setMaxDuration(data.max_duration?.toString() || '');
        } catch (err) {
            setError('Unable to load loan rate data.');
            // Fallback for UI preview
            const fallback = { interest_rate: 12.5, min_down_payment: 20, max_duration: 60 };
            setCurrentRate(fallback);
            setInterestRate('12.5');
            setMinDownPayment('20');
            setMaxDuration('60');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setSaving(true);

        try {
            await api.post('/api/admin/update-loan-rate', {
                interest_rate: parseFloat(interestRate),
                min_down_payment: parseFloat(minDownPayment),
                max_duration: parseInt(maxDuration, 10),
            });
            setSuccess('Loan rate updated successfully!');
            setCurrentRate({
                interest_rate: parseFloat(interestRate),
                min_down_payment: parseFloat(minDownPayment),
                max_duration: parseInt(maxDuration, 10),
            });
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to update loan rate.');
        } finally {
            setSaving(false);
            setTimeout(() => setSuccess(''), 4000);
        }
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
                <h1 className="text-2xl font-bold text-white">Loan Rate Management</h1>
                <p className="text-gray-500 text-sm mt-1">Configure interest rates and loan parameters</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                {/* Current Rates Table */}
                <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Current Rates
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-gray-500 border-b border-gray-800">
                                    <th className="text-left py-3 px-4 font-medium uppercase text-xs tracking-wider">Parameter</th>
                                    <th className="text-left py-3 px-4 font-medium uppercase text-xs tracking-wider">Value</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-300">
                                <tr className="border-b border-gray-800/50 hover:bg-white/[0.02] transition-colors">
                                    <td className="py-3.5 px-4">Interest Rate</td>
                                    <td className="py-3.5 px-4">
                                        <span className="bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded-lg text-xs font-semibold">
                                            {currentRate?.interest_rate}%
                                        </span>
                                    </td>
                                </tr>
                                <tr className="border-b border-gray-800/50 hover:bg-white/[0.02] transition-colors">
                                    <td className="py-3.5 px-4">Min Down Payment</td>
                                    <td className="py-3.5 px-4">
                                        <span className="bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-lg text-xs font-semibold">
                                            {currentRate?.min_down_payment}%
                                        </span>
                                    </td>
                                </tr>
                                <tr className="hover:bg-white/[0.02] transition-colors">
                                    <td className="py-3.5 px-4">Max Loan Duration</td>
                                    <td className="py-3.5 px-4">
                                        <span className="bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-lg text-xs font-semibold">
                                            {currentRate?.max_duration} months
                                        </span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Update Form */}
                <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Update Rates
                    </h2>

                    {/* Messages */}
                    {error && (
                        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm flex items-center gap-2">
                            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-sm flex items-center gap-2">
                            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                Interest Rate (%)
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                min="0"
                                value={interestRate}
                                onChange={(e) => setInterestRate(e.target.value)}
                                required
                                className="w-full bg-gray-800/60 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm outline-none
                  focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200
                  placeholder:text-gray-600"
                                placeholder="e.g. 12.5"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                Minimum Down Payment (%)
                            </label>
                            <input
                                type="number"
                                step="1"
                                min="0"
                                max="100"
                                value={minDownPayment}
                                onChange={(e) => setMinDownPayment(e.target.value)}
                                required
                                className="w-full bg-gray-800/60 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm outline-none
                  focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200
                  placeholder:text-gray-600"
                                placeholder="e.g. 20"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                Maximum Loan Duration (months)
                            </label>
                            <input
                                type="number"
                                step="1"
                                min="1"
                                value={maxDuration}
                                onChange={(e) => setMaxDuration(e.target.value)}
                                required
                                className="w-full bg-gray-800/60 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm outline-none
                  focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200
                  placeholder:text-gray-600"
                                placeholder="e.g. 60"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full py-3 rounded-xl font-semibold text-white text-sm
                bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg shadow-blue-500/25
                hover:shadow-blue-500/40 hover:-translate-y-0.5
                disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0
                transition-all duration-200 flex items-center justify-center gap-2"
                        >
                            {saving ? (
                                <>
                                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Update Loan Rate
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default LoanRates;
