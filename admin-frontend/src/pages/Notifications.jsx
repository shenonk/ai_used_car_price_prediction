import { useState, useEffect } from 'react';
import api from '../services/api';

/**
 * Notifications — Create, view, and delete admin notifications.
 * GET    /api/admin/notifications
 * POST   /api/admin/create-notification
 * DELETE /api/admin/delete-notification/:id
 */
function Notifications() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Form fields
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [active, setActive] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/api/admin/notifications');
            setNotifications(res.data.notifications || res.data);
        } catch (err) {
            setError('Unable to load notifications.');
            // Fallback data for UI preview
            setNotifications([
                { id: 1, title: 'System Maintenance', message: 'Scheduled maintenance on March 5th.', active: true, created_at: '2026-02-28' },
                { id: 2, title: 'New Model Deployed', message: 'Updated ML model with improved accuracy.', active: true, created_at: '2026-02-25' },
                { id: 3, title: 'Holiday Notice', message: 'Service hours may vary during holidays.', active: false, created_at: '2026-02-20' },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setSaving(true);

        try {
            await api.post('/api/admin/create-notification', { title, message, active });
            setSuccess('Notification created successfully!');
            setTitle('');
            setMessage('');
            setActive(true);
            fetchNotifications();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create notification.');
        } finally {
            setSaving(false);
            setTimeout(() => setSuccess(''), 4000);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this notification?')) return;

        try {
            await api.delete(`/api/admin/delete-notification/${id}`);
            setNotifications(notifications.filter((n) => n.id !== id));
            setSuccess('Notification deleted.');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to delete notification.');
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
                <h1 className="text-2xl font-bold text-white">Notification Management</h1>
                <p className="text-gray-500 text-sm mt-1">Create and manage system notifications</p>
            </div>

            {/* Messages */}
            {error && (
                <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm flex items-center gap-2">
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                </div>
            )}
            {success && (
                <div className="mb-6 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-sm flex items-center gap-2">
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {success}
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* Create Form */}
                <div className="xl:col-span-1 bg-gray-900/60 border border-gray-800 rounded-2xl p-6 h-fit">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4v16m8-8H4" />
                        </svg>
                        Create Notification
                    </h2>

                    <form onSubmit={handleCreate} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                className="w-full bg-gray-800/60 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm outline-none
                  focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200
                  placeholder:text-gray-600"
                                placeholder="Notification title"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Message</label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                required
                                rows={3}
                                className="w-full bg-gray-800/60 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm outline-none
                  focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200
                  placeholder:text-gray-600 resize-none"
                                placeholder="Notification message"
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-gray-400">Active</label>
                            <button
                                type="button"
                                onClick={() => setActive(!active)}
                                className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${active ? 'bg-blue-500' : 'bg-gray-700'
                                    }`}
                            >
                                <div
                                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${active ? 'translate-x-5' : 'translate-x-0'
                                        }`}
                                />
                            </button>
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
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Create Notification
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Notifications Table */}
                <div className="xl:col-span-2 bg-gray-900/60 border border-gray-800 rounded-2xl p-6">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        Existing Notifications
                        <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full ml-auto">
                            {notifications.length}
                        </span>
                    </h2>

                    {notifications.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            <p className="text-sm">No notifications yet</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-gray-500 border-b border-gray-800">
                                        <th className="text-left py-3 px-4 font-medium uppercase text-xs tracking-wider">Title</th>
                                        <th className="text-left py-3 px-4 font-medium uppercase text-xs tracking-wider hidden sm:table-cell">Message</th>
                                        <th className="text-center py-3 px-4 font-medium uppercase text-xs tracking-wider">Status</th>
                                        <th className="text-right py-3 px-4 font-medium uppercase text-xs tracking-wider">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {notifications.map((n) => (
                                        <tr key={n.id} className="border-b border-gray-800/50 hover:bg-white/[0.02] transition-colors">
                                            <td className="py-3.5 px-4 text-white font-medium">{n.title}</td>
                                            <td className="py-3.5 px-4 text-gray-400 hidden sm:table-cell max-w-xs truncate">{n.message}</td>
                                            <td className="py-3.5 px-4 text-center">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${n.active
                                                        ? 'bg-emerald-500/15 text-emerald-400'
                                                        : 'bg-gray-500/15 text-gray-400'
                                                    }`}>
                                                    {n.active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-right">
                                                <button
                                                    onClick={() => handleDelete(n.id)}
                                                    className="text-gray-500 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-500/10"
                                                >
                                                    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Notifications;
