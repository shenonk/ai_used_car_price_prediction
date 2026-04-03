import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BadgeCheck,
  CheckCircle2,
  CircleDashed,
  Clock3,
  Eye,
  Search,
  ShieldCheck,
  Store,
  Tag,
  Trash2,
  XCircle,
} from 'lucide-react';
import api from '../services/api';

const statusTabs = ['all', 'pending', 'approved', 'rejected', 'sold'];

const fallbackListings = [
  {
    id: 'mock-1',
    brand: 'Toyota',
    model: 'Corolla Cross',
    seller_name: 'Kavindu Perera',
    phone_number: '0771234567',
    vehicle_location: 'Kandy',
    vehicle_description: 'Single-owner vehicle with full service history and a clean interior.',
    year: 2022,
    mileage: 18000,
    fuel_type: 'Hybrid',
    transmission: 'Automatic',
    condition: 'Used',
    price: 11250000,
    status: 'pending',
    image_url: '',
    created_at: '2026-03-31T08:00:00Z',
    user_id: 'user_104',
  },
  {
    id: 'mock-2',
    brand: 'Honda',
    model: 'Vezel',
    seller_name: 'Dinesh Fernando',
    phone_number: '0719988776',
    vehicle_location: 'Nugegoda',
    vehicle_description: 'Fresh import with original paint, reverse camera, and low mileage.',
    year: 2021,
    mileage: 32000,
    fuel_type: 'Hybrid',
    transmission: 'Automatic',
    condition: 'Reconditioned',
    price: 12900000,
    status: 'approved',
    image_url: '',
    created_at: '2026-03-29T10:30:00Z',
    user_id: 'user_087',
  },
  {
    id: 'mock-3',
    brand: 'Suzuki',
    model: 'Wagon R',
    seller_name: 'Supun Silva',
    phone_number: '0754443322',
    vehicle_location: 'Kurunegala',
    vehicle_description: 'Daily-driven family car. Minor cosmetic marks noted on rear bumper.',
    year: 2018,
    mileage: 54000,
    fuel_type: 'Petrol',
    transmission: 'Automatic',
    condition: 'Used',
    price: 6350000,
    status: 'rejected',
    image_url: '',
    created_at: '2026-03-28T14:15:00Z',
    user_id: 'user_055',
  },
  {
    id: 'mock-4',
    brand: 'BMW',
    model: '320d',
    seller_name: 'Ravin Jayasinghe',
    phone_number: '0765556677',
    vehicle_location: 'Colombo 05',
    vehicle_description: 'Maintained through agent records with premium features and recent servicing.',
    year: 2019,
    mileage: 47000,
    fuel_type: 'Diesel',
    transmission: 'Automatic',
    condition: 'Used',
    price: 19800000,
    status: 'sold',
    image_url: '',
    created_at: '2026-03-25T12:45:00Z',
    user_id: 'user_021',
  },
];

const statusMeta = {
  pending: {
    label: 'Pending review',
    icon: Clock3,
    badge: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  },
  approved: {
    label: 'Approved',
    icon: CheckCircle2,
    badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  },
  rejected: {
    label: 'Rejected',
    icon: XCircle,
    badge: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
  },
  sold: {
    label: 'Sold',
    icon: BadgeCheck,
    badge: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
  },
};

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatDateTime = (value) => {
  if (!value) return '-';

  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const formatRelativeTime = (value) => {
  if (!value) return 'Unknown';

  const diffMinutes = Math.floor((Date.now() - new Date(value).getTime()) / 60000);

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} min ago`;

  const hours = Math.floor(diffMinutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'} ago`;

  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
};

function Marketplace() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState('');

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/api/admin/marketplace/listings', {
        params: { status: 'all' },
      });
      const nextListings = response.data?.listings || [];
      setListings(nextListings);
      setSelectedId((current) => current || nextListings[0]?.id || '');
    } catch {
      setError('Unable to load live marketplace submissions right now. Showing preview data.');
      setListings(fallbackListings);
      setSelectedId((current) => current || fallbackListings[0]?.id || '');
    } finally {
      setLoading(false);
    }
  };

  const filteredListings = useMemo(() => {
    const query = search.trim().toLowerCase();

    return listings.filter((listing) => {
      const matchesTab = activeTab === 'all' || listing.status === activeTab;
      const haystack = [
        listing.brand,
        listing.model,
        listing.seller_name,
        listing.phone_number,
        listing.vehicle_location,
        listing.vehicle_description,
        listing.year,
        listing.fuel_type,
        listing.transmission,
        listing.condition,
        listing.user_id,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesSearch = !query || haystack.includes(query);
      return matchesTab && matchesSearch;
    });
  }, [activeTab, listings, search]);

  const selectedListing = useMemo(
    () => filteredListings.find((listing) => listing.id === selectedId) || filteredListings[0] || null,
    [filteredListings, selectedId]
  );

  useEffect(() => {
    if (!selectedListing && filteredListings.length > 0) {
      setSelectedId(filteredListings[0].id);
    }
  }, [filteredListings, selectedListing]);

  const summary = useMemo(
    () => ({
      total: listings.length,
      pending: listings.filter((listing) => listing.status === 'pending').length,
      approved: listings.filter((listing) => listing.status === 'approved').length,
      rejected: listings.filter((listing) => listing.status === 'rejected').length,
      sold: listings.filter((listing) => listing.status === 'sold').length,
    }),
    [listings]
  );

  const updateStatus = async (listingId, status) => {
    try {
      setBusyId(listingId);
      setError('');
      setNotice('');

      const response = await api.put(`/api/admin/marketplace/listings/${listingId}/status`, { status });
      const updatedListing = response.data?.listing;

      setListings((current) =>
        current.map((listing) => (listing.id === listingId ? { ...listing, ...updatedListing } : listing))
      );
      setNotice(`Listing moved to ${status}.`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update listing status.');
    } finally {
      setBusyId('');
    }
  };

  const deleteListing = async (listingId) => {
    if (!window.confirm('Remove this marketplace listing from the admin queue?')) return;

    try {
      setBusyId(listingId);
      setError('');
      setNotice('');
      await api.delete(`/api/admin/marketplace/listings/${listingId}`);
      setListings((current) => current.filter((listing) => listing.id !== listingId));
      setSelectedId((current) => (current === listingId ? '' : current));
      setNotice('Listing deleted from the marketplace queue.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete listing.');
    } finally {
      setBusyId('');
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl border border-cyan-500/15 bg-slate-900/70 px-5 py-4 text-sm text-slate-300">
          <CircleDashed className="h-4 w-4 animate-spin text-cyan-300" />
          Loading marketplace queue...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-[fade-in_0.45s_ease-out]">
      <section className="relative overflow-hidden rounded-[30px] border border-slate-800 bg-[linear-gradient(135deg,rgba(15,23,42,0.98),rgba(15,23,42,0.9),rgba(8,47,73,0.82))] p-6 shadow-2xl shadow-slate-950/30">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.16),_transparent_28%),radial-gradient(circle_at_bottom_left,_rgba(16,185,129,0.12),_transparent_24%)]" />
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
              <ShieldCheck className="h-4 w-4" />
              Admin marketplace review
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-4xl">
              Review ads before they go live in the user marketplace
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 md:text-base">
              Every new submission lands here first. Admin approval is the gate that decides what
              shows up publicly for buyers.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total ads" value={summary.total} accent="cyan" icon={<Store className="h-5 w-5" />} />
            <StatCard label="Pending" value={summary.pending} accent="amber" icon={<Clock3 className="h-5 w-5" />} />
            <StatCard label="Approved" value={summary.approved} accent="emerald" icon={<CheckCircle2 className="h-5 w-5" />} />
            <StatCard label="Rejected" value={summary.rejected} accent="rose" icon={<XCircle className="h-5 w-5" />} />
          </div>
        </div>
      </section>

      {(error || notice) && (
        <div className="space-y-3">
          {error && (
            <div className="flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {notice && (
            <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{notice}</span>
            </div>
          )}
        </div>
      )}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.9fr)]">
        <div className="rounded-[28px] border border-slate-800 bg-slate-950/55 shadow-xl shadow-slate-950/20 backdrop-blur">
          <div className="border-b border-slate-800 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">Submission queue</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Browse all ads, then approve the ones ready for the public marketplace.
                </p>
              </div>

              <div className="relative w-full max-w-sm">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by brand, model, year or seller"
                  className="w-full rounded-2xl border border-slate-700/70 bg-slate-900/90 py-3 pl-11 pr-4 text-sm text-white outline-none transition hover:border-slate-500/80 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-500/20"
                />
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {statusTabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium capitalize transition ${
                    activeTab === tab
                      ? 'border-cyan-400/40 bg-cyan-500/10 text-cyan-100 shadow-[0_0_25px_rgba(34,211,238,0.12)]'
                      : 'border-slate-700/70 bg-slate-900/70 text-slate-400 hover:border-slate-500/80 hover:text-white'
                  }`}
                >
                  {tab === 'all' ? 'All ads' : tab}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-slate-800">
            {filteredListings.length === 0 ? (
              <div className="flex min-h-[280px] flex-col items-center justify-center px-6 py-12 text-center">
                <Eye className="h-12 w-12 text-slate-700" />
                <h3 className="mt-4 text-lg font-semibold text-white">No submissions match this view</h3>
                <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
                  Try a different filter or search term. New user ads submitted for approval will
                  appear here.
                </p>
              </div>
            ) : (
              filteredListings.map((listing) => (
                <button
                  key={listing.id}
                  type="button"
                  onClick={() => setSelectedId(listing.id)}
                  className={`flex w-full flex-col gap-4 p-5 text-left transition hover:bg-white/[0.03] lg:flex-row lg:items-center ${
                    selectedListing?.id === listing.id ? 'bg-cyan-500/[0.06]' : ''
                  }`}
                >
                  <div className="flex h-24 w-full items-center justify-center rounded-2xl border border-slate-800 bg-[linear-gradient(135deg,rgba(30,41,59,0.95),rgba(15,23,42,0.95))] text-slate-500 lg:w-36">
                    {listing.image_url ? (
                      <img
                        src={listing.image_url}
                        alt={`${listing.brand} ${listing.model}`}
                        className="h-full w-full rounded-2xl object-cover"
                      />
                    ) : (
                      <Store className="h-8 w-8" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-white">
                        {listing.brand} {listing.model}
                      </h3>
                      <StatusBadge status={listing.status} />
                    </div>
                    <p className="mt-2 text-sm text-slate-400">
                      {listing.year || 'Year N/A'} • {listing.fuel_type || 'Fuel N/A'} •{' '}
                      {listing.transmission || 'Transmission N/A'} • {listing.condition || 'Condition N/A'}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
                      <span>{formatCurrency(listing.price)}</span>
                      <span>{Number(listing.mileage || 0).toLocaleString()} km</span>
                      <span>{formatRelativeTime(listing.created_at)}</span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <aside className="rounded-[28px] border border-slate-800 bg-slate-950/55 p-5 shadow-xl shadow-slate-950/20 backdrop-blur">
          {selectedListing ? (
            <ListingDetail
              listing={selectedListing}
              busy={busyId === selectedListing.id}
              onStatusChange={updateStatus}
              onDelete={deleteListing}
            />
          ) : (
            <div className="flex min-h-[320px] flex-col items-center justify-center text-center">
              <Tag className="h-12 w-12 text-slate-700" />
              <h3 className="mt-4 text-lg font-semibold text-white">Select a listing</h3>
              <p className="mt-2 max-w-xs text-sm leading-6 text-slate-400">
                Choose a submission from the queue to preview the ad details and take action.
              </p>
            </div>
          )}
        </aside>
      </section>
    </div>
  );
}

function ListingDetail({ listing, busy, onStatusChange, onDelete }) {
  const actions = getActionsForStatus(listing.status);

  return (
    <div>
      <div className="overflow-hidden rounded-[24px] border border-slate-800">
        <div className="flex h-56 items-center justify-center bg-[linear-gradient(135deg,rgba(30,41,59,0.95),rgba(8,47,73,0.85))] text-slate-500">
          {listing.image_url ? (
            <img
              src={listing.image_url}
              alt={`${listing.brand} ${listing.model}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center gap-3">
              <Store className="h-10 w-10" />
              <span className="text-sm text-slate-400">Awaiting seller photo preview</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-white">
            {listing.brand} {listing.model}
          </h2>
          <p className="mt-1 text-sm text-slate-400">Submitted {formatDateTime(listing.created_at)}</p>
        </div>
        <StatusBadge status={listing.status} />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <DetailCard label="Price" value={formatCurrency(listing.price)} />
        <DetailCard label="Mileage" value={`${Number(listing.mileage || 0).toLocaleString()} km`} />
        <DetailCard label="Fuel" value={listing.fuel_type || '-'} />
        <DetailCard label="Gearbox" value={listing.transmission || '-'} />
        <DetailCard label="Condition" value={listing.condition || '-'} />
        <DetailCard label="Seller ID" value={listing.user_id || 'Anonymous'} />
        <DetailCard label="Seller Name" value={listing.seller_name || '-'} />
        <DetailCard label="Phone Number" value={listing.phone_number || '-'} />
        <DetailCard label="Location" value={listing.vehicle_location || '-'} />
      </div>

      <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Seller Description</p>
        <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-300">
          {listing.vehicle_description || 'No description was included with this listing.'}
        </p>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Workflow</p>
        <p className="mt-3 text-sm leading-7 text-slate-300">
          Ads stay hidden from the public marketplace while they are <span className="font-semibold text-amber-300">pending</span>.
          Once approved here, they become visible on the user-facing marketplace automatically.
        </p>
      </div>

      <div className="mt-5 space-y-3">
        {actions.map((action) => (
          <button
            key={action.status}
            type="button"
            disabled={busy}
            onClick={() => onStatusChange(listing.id, action.status)}
            className={`flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${action.className}`}
          >
            <action.icon className="h-4 w-4" />
            {busy ? 'Updating...' : action.label}
          </button>
        ))}

        <button
          type="button"
          disabled={busy}
          onClick={() => onDelete(listing.id)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/15 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Trash2 className="h-4 w-4" />
          Delete listing
        </button>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent, icon }) {
  const styles = {
    cyan: 'border-cyan-500/20 bg-cyan-500/10 text-cyan-200',
    amber: 'border-amber-500/20 bg-amber-500/10 text-amber-200',
    emerald: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200',
    rose: 'border-rose-500/20 bg-rose-500/10 text-rose-200',
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
  const normalizedStatus = statusMeta[status] ? status : 'pending';
  const meta = statusMeta[normalizedStatus];
  const Icon = meta.icon;

  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${meta.badge}`}>
      <Icon className="h-3.5 w-3.5" />
      {meta.label}
    </span>
  );
}

function getActionsForStatus(status) {
  const shared = {
    approve: {
      status: 'approved',
      label: 'Approve and publish',
      icon: CheckCircle2,
      className:
        'border-emerald-500/20 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/15',
    },
    reject: {
      status: 'rejected',
      label: 'Reject listing',
      icon: XCircle,
      className: 'border-rose-500/20 bg-rose-500/10 text-rose-100 hover:bg-rose-500/15',
    },
    pending: {
      status: 'pending',
      label: 'Move back to pending',
      icon: Clock3,
      className: 'border-amber-500/20 bg-amber-500/10 text-amber-100 hover:bg-amber-500/15',
    },
    sold: {
      status: 'sold',
      label: 'Mark as sold',
      icon: BadgeCheck,
      className: 'border-cyan-500/20 bg-cyan-500/10 text-cyan-100 hover:bg-cyan-500/15',
    },
  };

  if (status === 'pending') return [shared.approve, shared.reject];
  if (status === 'approved') return [shared.sold, shared.reject, shared.pending];
  if (status === 'rejected') return [shared.pending, shared.approve];
  if (status === 'sold') return [shared.approve, shared.pending];
  return [shared.approve, shared.reject];
}

export default Marketplace;
