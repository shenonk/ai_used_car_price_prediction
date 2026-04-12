import { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  BadgeDollarSign,
  CheckCircle2,
  CircleDashed,
  CreditCard,
  ReceiptText,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  UserRound,
  Zap,
} from 'lucide-react';
import api from '../services/api';

const fallbackPayments = [
  {
    id: 'pi_mock_01',
    payer_name: 'Nadeesha Perera',
    login_name: 'nadeesha_p',
    ad_title: 'Toyota Aqua 2018',
    boost_option: 'Spotlight',
    amount: 4500,
    currency: 'LKR',
    payment_status: 'confirmed',
    stripe_status: 'succeeded',
    payment_method: 'Visa ending 4242',
    confirmed_at: '2026-04-12T08:20:00Z',
    ad_reference: 'AD-24018',
    notes: 'Ad boost activated after Stripe confirmation.',
  },
  {
    id: 'pi_mock_02',
    payer_name: 'Tharindu Silva',
    login_name: 'tharindu_s',
    ad_title: 'Honda Vezel Hybrid 2020',
    boost_option: 'Urgent',
    amount: 3000,
    currency: 'LKR',
    payment_status: 'confirmed',
    stripe_status: 'succeeded',
    payment_method: 'Mastercard ending 5555',
    confirmed_at: '2026-04-11T16:45:00Z',
    ad_reference: 'AD-23974',
    notes: 'Urgent badge requested for weekend push.',
  },
  {
    id: 'pi_mock_03',
    payer_name: 'Kavishka Fernando',
    login_name: 'kavishka_f',
    ad_title: 'BMW 320d 2019',
    boost_option: 'Bump Up',
    amount: 2000,
    currency: 'LKR',
    payment_status: 'pending',
    stripe_status: 'processing',
    payment_method: 'Card verification in progress',
    confirmed_at: null,
    ad_reference: 'AD-23921',
    notes: 'Waiting for Stripe webhook confirmation.',
  },
];

const statusStyles = {
  confirmed: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200',
  pending: 'border-amber-500/20 bg-amber-500/10 text-amber-200',
  failed: 'border-rose-500/20 bg-rose-500/10 text-rose-200',
};

const boostStyles = {
  Spotlight: {
    icon: Star,
    className: 'border-amber-500/20 bg-amber-500/10 text-amber-200',
  },
  Urgent: {
    icon: Zap,
    className: 'border-rose-500/20 bg-rose-500/10 text-rose-200',
  },
  'Bump Up': {
    icon: ArrowUpRight,
    className: 'border-cyan-500/20 bg-cyan-500/10 text-cyan-200',
  },
};

const formatCurrency = (value, currency = 'LKR') =>
  new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatDateTime = (value) => {
  if (!value) return 'Awaiting confirmation';

  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

function Payments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState('');

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/api/admin/payments');
      const nextPayments = response.data?.payments || response.data || [];
      setPayments(nextPayments);
      setSelectedId((current) => current || nextPayments[0]?.id || '');
    } catch {
      setError('Live payment records are not available yet. Showing a preview layout for Stripe-connected payments.');
      setPayments(fallbackPayments);
      setSelectedId((current) => current || fallbackPayments[0]?.id || '');
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return payments.filter((payment) => {
      const haystack = [
        payment.payer_name,
        payment.login_name,
        payment.ad_title,
        payment.boost_option,
        payment.ad_reference,
        payment.payment_status,
        payment.stripe_status,
        payment.id,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return !query || haystack.includes(query);
    });
  }, [payments, search]);

  const selectedPayment = useMemo(
    () => filteredPayments.find((payment) => payment.id === selectedId) || filteredPayments[0] || null,
    [filteredPayments, selectedId]
  );

  useEffect(() => {
    if (!selectedPayment && filteredPayments.length > 0) {
      setSelectedId(filteredPayments[0].id);
    }
  }, [filteredPayments, selectedPayment]);

  const summary = useMemo(
    () => ({
      total: payments.length,
      confirmed: payments.filter((payment) => payment.payment_status === 'confirmed').length,
      pending: payments.filter((payment) => payment.payment_status === 'pending').length,
      revenue: payments
        .filter((payment) => payment.payment_status === 'confirmed')
        .reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
    }),
    [payments]
  );

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl border border-cyan-500/15 bg-slate-900/70 px-5 py-4 text-sm text-slate-300">
          <CircleDashed className="h-4 w-4 animate-spin text-cyan-300" />
          Loading payments...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-[fade-in_0.45s_ease-out]">
      <section className="relative overflow-hidden rounded-[30px] border border-slate-800 bg-[linear-gradient(135deg,rgba(15,23,42,0.98),rgba(15,23,42,0.92),rgba(22,78,99,0.78))] p-6 shadow-2xl shadow-slate-950/30">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(56,189,248,0.16),_transparent_28%),radial-gradient(circle_at_bottom_left,_rgba(16,185,129,0.12),_transparent_24%)]" />
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
              <ShieldCheck className="h-4 w-4" />
              Stripe payment monitor
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-4xl">
              Confirmed boost payments will appear here for admin review
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 md:text-base">
              This page is prepared for the Stripe integration so admins can quickly see the login
              name, ad, selected boost option, and amount after user payment confirmation.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Payments" value={summary.total} accent="cyan" icon={<ReceiptText className="h-5 w-5" />} />
            <StatCard label="Confirmed" value={summary.confirmed} accent="emerald" icon={<CheckCircle2 className="h-5 w-5" />} />
            <StatCard label="Pending" value={summary.pending} accent="amber" icon={<CreditCard className="h-5 w-5" />} />
            <StatCard label="Revenue" value={formatCurrency(summary.revenue)} accent="violet" icon={<BadgeDollarSign className="h-5 w-5" />} />
          </div>
        </div>
      </section>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.85fr)]">
        <div className="rounded-[28px] border border-slate-800 bg-slate-950/55 shadow-xl shadow-slate-950/20 backdrop-blur">
          <div className="border-b border-slate-800 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">Payment activity</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Review confirmed and pending boost payments before we connect live Stripe events.
                </p>
              </div>

              <div className="relative w-full max-w-sm">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by login, ad, boost option or payment id"
                  className="w-full rounded-2xl border border-slate-700/70 bg-slate-900/90 py-3 pl-11 pr-4 text-sm text-white outline-none transition hover:border-slate-500/80 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-500/20"
                />
              </div>
            </div>
          </div>

          <div className="divide-y divide-slate-800">
            {filteredPayments.length === 0 ? (
              <div className="flex min-h-[280px] flex-col items-center justify-center px-6 py-12 text-center">
                <ReceiptText className="h-12 w-12 text-slate-700" />
                <h3 className="mt-4 text-lg font-semibold text-white">No payments match this search</h3>
                <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
                  Once Stripe confirmations are flowing in, matching payment records will appear in
                  this queue.
                </p>
              </div>
            ) : (
              filteredPayments.map((payment) => (
                <button
                  key={payment.id}
                  type="button"
                  onClick={() => setSelectedId(payment.id)}
                  className={`flex w-full flex-col gap-4 p-5 text-left transition hover:bg-white/[0.03] lg:flex-row lg:items-center ${
                    selectedPayment?.id === payment.id ? 'bg-cyan-500/[0.06]' : ''
                  }`}
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-500/15 bg-cyan-500/10 text-cyan-200">
                    <CreditCard className="h-6 w-6" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-white">{payment.ad_title || 'Untitled ad'}</h3>
                      <StatusBadge status={payment.payment_status} />
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-400">
                      <span>@{payment.login_name || 'unknown'}</span>
                      <span>{payment.boost_option || 'No boost option'}</span>
                      <span>{formatCurrency(payment.amount, payment.currency)}</span>
                    </div>

                    <p className="mt-2 text-xs text-slate-500">
                      {payment.confirmed_at ? formatDateTime(payment.confirmed_at) : 'Awaiting Stripe confirmation'}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <aside className="rounded-[28px] border border-slate-800 bg-slate-950/55 p-5 shadow-xl shadow-slate-950/20 backdrop-blur">
          {selectedPayment ? (
            <PaymentDetail payment={selectedPayment} />
          ) : (
            <div className="flex min-h-[320px] flex-col items-center justify-center text-center">
              <UserRound className="h-12 w-12 text-slate-700" />
              <h3 className="mt-4 text-lg font-semibold text-white">Select a payment</h3>
              <p className="mt-2 max-w-xs text-sm leading-6 text-slate-400">
                Pick a record from the list to inspect the payment details that admins will use.
              </p>
            </div>
          )}
        </aside>
      </section>
    </div>
  );
}

function PaymentDetail({ payment }) {
  return (
    <div>
      <div className="rounded-[24px] border border-slate-800 bg-[linear-gradient(135deg,rgba(30,41,59,0.95),rgba(8,47,73,0.82))] p-5">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
          <ReceiptText className="h-3.5 w-3.5" />
          Payment snapshot
        </div>
        <h2 className="mt-4 text-2xl font-semibold text-white">{payment.ad_title || 'Untitled ad'}</h2>
        <p className="mt-2 text-sm text-slate-300">
          Stripe transaction <span className="font-medium text-white">{payment.id}</span>
        </p>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
        <DetailCard label="Login Name" value={payment.login_name ? `@${payment.login_name}` : '-'} />
        <DetailCard label="Customer Name" value={payment.payer_name || '-'} />
        <DetailCard label="Ad Reference" value={payment.ad_reference || '-'} />
        <DetailCard label="Amount" value={formatCurrency(payment.amount, payment.currency)} />
        <DetailCard label="Stripe Status" value={payment.stripe_status || '-'} />
        <DetailCard label="Confirmed At" value={formatDateTime(payment.confirmed_at)} />
      </div>

      <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Chosen Boost Option</p>
        <div className="mt-3">
          <BoostBadge option={payment.boost_option} />
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Payment Method</p>
        <p className="mt-3 text-sm leading-7 text-slate-300">
          {payment.payment_method || 'Card details will be shown here once payment metadata is available.'}
        </p>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Admin Note</p>
        <p className="mt-3 text-sm leading-7 text-slate-300">
          {payment.notes || 'This section can later show webhook notes, receipt info, or operator comments.'}
        </p>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent, icon }) {
  const styles = {
    cyan: 'border-cyan-500/20 bg-cyan-500/10 text-cyan-200',
    emerald: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200',
    amber: 'border-amber-500/20 bg-amber-500/10 text-amber-200',
    violet: 'border-violet-500/20 bg-violet-500/10 text-violet-200',
  };

  return (
    <div className="rounded-2xl border border-slate-700/60 bg-slate-900/70 px-4 py-4 backdrop-blur">
      <div className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl border ${styles[accent]}`}>
        {icon}
      </div>
      <p className="mt-4 text-xs uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

function DetailCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-medium text-white">{value}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const normalizedStatus = statusStyles[status] ? status : 'pending';

  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${statusStyles[normalizedStatus]}`}>
      <CheckCircle2 className="h-3.5 w-3.5" />
      {normalizedStatus === 'confirmed' ? 'Confirmed' : normalizedStatus === 'pending' ? 'Pending' : 'Failed'}
    </span>
  );
}

function BoostBadge({ option }) {
  const meta = boostStyles[option] || {
    icon: Sparkles,
    className: 'border-slate-600/70 bg-slate-800/80 text-slate-200',
  };
  const Icon = meta.icon;

  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${meta.className}`}>
      <Icon className="h-3.5 w-3.5" />
      {option || 'Not selected'}
    </span>
  );
}

export default Payments;
