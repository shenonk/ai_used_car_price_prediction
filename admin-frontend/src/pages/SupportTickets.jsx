import { useCallback, useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import api from '../services/api';

function SupportTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replyingId, setReplyingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/api/admin/support-tickets');
      const resolvedTickets = res.data.tickets || [];
      setTickets(resolvedTickets);

      if (resolvedTickets.length > 0 && !selectedTicketId) {
        setSelectedTicketId(resolvedTickets[0].id);
      }
    } catch (fetchError) {
      console.error('Error fetching support tickets:', fetchError);
      setError('Unable to load contact messages right now.');
    } finally {
      setLoading(false);
    }
  }, [selectedTicketId]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  useEffect(() => {
    const selectedTicket = tickets.find((ticket) => ticket.id === selectedTicketId);
    setReplyText(selectedTicket?.admin_reply || '');
  }, [selectedTicketId, tickets]);

  const updateTicketStatus = async (ticketId, status) => {
    try {
      setUpdatingId(ticketId);
      setError('');
      setSuccess('');
      await api.put(`/api/admin/support-ticket/${ticketId}`, { status });

      setTickets((prev) =>
        prev.map((ticket) => (ticket.id === ticketId ? { ...ticket, status } : ticket))
      );
      setSuccess(`Message marked as ${status}.`);
      window.setTimeout(() => setSuccess(''), 3000);
    } catch (updateError) {
      console.error('Error updating support ticket:', updateError);
      setError('Failed to update the message status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const submitAdminReply = async () => {
    if (!selectedTicket) return;

    const adminReply = replyText.trim();
    if (!adminReply) {
      setError('Please write a reply before sending it to the user.');
      return;
    }

    try {
      setReplyingId(selectedTicket.id);
      setError('');
      setSuccess('');
      const res = await api.put(`/api/admin/support-ticket/${selectedTicket.id}`, {
        admin_reply: adminReply,
      });
      const updatedTicket = res.data.ticket;

      setTickets((prev) =>
        prev.map((ticket) => (ticket.id === selectedTicket.id ? updatedTicket : ticket))
      );
      setSuccess('Reply saved. The user can now see it in the Help Center.');
      window.setTimeout(() => setSuccess(''), 3000);
    } catch (replyError) {
      console.error('Error sending admin reply:', replyError);
      setError('Failed to save the admin reply.');
    } finally {
      setReplyingId(null);
    }
  };

  const deleteTicket = async (ticketId) => {
    if (!window.confirm('Delete this contact message from the admin inbox?')) return;

    try {
      setDeletingId(ticketId);
      setError('');
      setSuccess('');
      await api.delete(`/api/admin/support-ticket/${ticketId}`);

      const remainingTickets = tickets.filter((ticket) => ticket.id !== ticketId);
      setTickets(remainingTickets);
      if (selectedTicketId === ticketId) {
        setSelectedTicketId(remainingTickets[0]?.id ?? null);
      }

      setSuccess('Message deleted from Contact Messages.');
      window.setTimeout(() => setSuccess(''), 3000);
    } catch (deleteError) {
      console.error('Error deleting support ticket:', deleteError);
      setError(deleteError.response?.data?.error || 'Failed to delete the message.');
    } finally {
      setDeletingId(null);
    }
  };

  const selectedTicket = tickets.find((ticket) => ticket.id === selectedTicketId) || null;
  const openCount = tickets.filter((ticket) => ticket.status === 'open').length;
  const readCount = tickets.filter((ticket) => ticket.status === 'read').length;
  const closedCount = tickets.filter((ticket) => ticket.status === 'closed').length;

  const formatStatusClasses = (status) => {
    if (status === 'open') return 'bg-blue-500/15 text-blue-400 border border-blue-500/20';
    if (status === 'read') return 'bg-amber-500/15 text-amber-400 border border-amber-500/20';
    return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Contact Messages</h1>
          <p className="text-sm text-gray-400 mt-1">Review and manage messages sent from the Help Center contact form.</p>
        </div>
        <button
          onClick={fetchTickets}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-blue-500/20"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 4.5v5h5m10-5v5h-5M19.5 9.5A7.5 7.5 0 006.2 5.2M4.5 14.5v5h5m10-5v5h-5M19.8 18.8a7.5 7.5 0 01-13.3-4.3" />
          </svg>
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-sm flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Open</p>
          <p className="text-2xl font-bold text-white mt-2">{openCount}</p>
        </div>
        <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Read</p>
          <p className="text-2xl font-bold text-white mt-2">{readCount}</p>
        </div>
        <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Closed</p>
          <p className="text-2xl font-bold text-white mt-2">{closedCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.05fr_0.95fr] gap-6">
        <div className="bg-gray-900/60 border border-gray-800 rounded-2xl overflow-hidden min-h-[420px]">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-white/[0.02]">
            <h2 className="text-lg font-semibold text-white">Inbox</h2>
            <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">
              {tickets.length} total
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center min-h-[360px]">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[360px] text-gray-400 p-8 text-center">
              <svg className="w-14 h-14 mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5A2.25 2.25 0 0119.5 19.5H4.5a2.25 2.25 0 01-2.25-2.25V6.75M21.75 6.75A2.25 2.25 0 0019.5 4.5H4.5A2.25 2.25 0 002.25 6.75m19.5 0l-8.69 5.52a2 2 0 01-2.12 0L2.25 6.75" />
              </svg>
              <p className="text-lg font-medium text-white mb-1">No contact messages yet</p>
              <p className="text-sm">New Help Center submissions will appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800/80">
              {tickets.map((ticket) => (
                <button
                  key={ticket.id}
                  type="button"
                  onClick={() => setSelectedTicketId(ticket.id)}
                  className={`contact-message-row w-full text-left px-6 py-4 transition-colors ${
                    selectedTicketId === ticket.id ? 'contact-message-row-selected' : 'hover:bg-white/[0.03]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-white truncate">{ticket.user_name}</p>
                      <p className="text-sm text-gray-400 truncate">{ticket.user_email}</p>
                    </div>
                    <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold ${formatStatusClasses(ticket.status)}`}>
                      {ticket.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mt-3 line-clamp-2">{ticket.message}</p>
                  {ticket.admin_reply && (
                    <p className="mt-3 inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                      Replied by admin
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-3">
                    {ticket.created_at ? new Date(ticket.created_at).toLocaleString() : 'No timestamp'}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 min-h-[420px]">
          <div className="flex items-center justify-between gap-3 mb-6">
            <h2 className="text-lg font-semibold text-white">Message Details</h2>
            {selectedTicket && (
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${formatStatusClasses(selectedTicket.status)}`}>
                {selectedTicket.status}
              </span>
            )}
          </div>

          {!selectedTicket ? (
            <div className="flex items-center justify-center h-[320px] text-center text-gray-500">
              Select a message from the inbox to read it.
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Full Name</p>
                  <p className="text-white font-medium mt-2 break-words">{selectedTicket.user_name}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Email</p>
                  <a
                    href={`mailto:${selectedTicket.user_email}`}
                    className="text-blue-400 font-medium mt-2 break-all inline-block hover:text-blue-300"
                  >
                    {selectedTicket.user_email}
                  </a>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Received</p>
                <p className="text-white mt-2">
                  {selectedTicket.created_at ? new Date(selectedTicket.created_at).toLocaleString() : 'No timestamp'}
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Message</p>
                <p className="text-gray-300 mt-3 leading-7 whitespace-pre-wrap">{selectedTicket.message}</p>
              </div>

              {selectedTicket.admin_reply && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                  <p className="text-xs text-emerald-300 uppercase tracking-wider">Current Admin Reply</p>
                  <p className="text-emerald-50 mt-3 leading-7 whitespace-pre-wrap">{selectedTicket.admin_reply}</p>
                  <p className="text-xs text-emerald-300/70 mt-3">
                    {selectedTicket.admin_replied_at
                      ? `Sent ${new Date(selectedTicket.admin_replied_at).toLocaleString()}`
                      : 'Reply saved'}
                  </p>
                </div>
              )}

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-blue-300 uppercase tracking-wider">Reply to user</p>
                    <p className="text-sm text-slate-400 mt-2">
                      This will be shown in the user Help Center as a reply from AutoValueLK admins.
                    </p>
                  </div>
                  <span className="rounded-full bg-blue-500/15 px-3 py-1 text-xs font-semibold text-blue-200">
                    AutoValueLK Admin
                  </span>
                </div>
                <textarea
                  value={replyText}
                  onChange={(event) => setReplyText(event.target.value)}
                  rows="6"
                  className="mt-4 w-full resize-none rounded-xl border border-white/10 bg-slate-950/50 p-4 text-sm leading-6 text-white outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-400/10"
                  placeholder="Write a helpful reply to this user..."
                />
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-slate-500">
                    Sending a reply automatically marks the message as closed.
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      disabled={deletingId === selectedTicket.id || updatingId === selectedTicket.id || replyingId === selectedTicket.id}
                      onClick={() => deleteTicket(selectedTicket.id)}
                      className="inline-flex items-center gap-2 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Trash2 className="h-4 w-4" />
                      {deletingId === selectedTicket.id ? 'Deleting...' : 'Delete message'}
                    </button>
                    <button
                      type="button"
                      disabled={replyingId === selectedTicket.id || !replyText.trim() || deletingId === selectedTicket.id}
                      onClick={submitAdminReply}
                      className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {replyingId === selectedTicket.id ? 'Saving reply...' : 'Send admin reply'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-400">Update status</p>
                <div className="flex flex-wrap gap-3">
                  {['open', 'read', 'closed'].map((status) => (
                    <button
                      key={status}
                      type="button"
                      disabled={updatingId === selectedTicket.id || deletingId === selectedTicket.id || selectedTicket.status === status}
                      onClick={() => updateTicketStatus(selectedTicket.id, status)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                        selectedTicket.status === status
                          ? formatStatusClasses(status)
                          : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'
                      } disabled:opacity-60 disabled:cursor-not-allowed`}
                    >
                      {updatingId === selectedTicket.id && selectedTicket.status !== status ? 'Updating...' : `Mark as ${status}`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SupportTickets;
