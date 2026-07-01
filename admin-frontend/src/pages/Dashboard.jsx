import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Bot,
  Calculator,
  Calendar,
  Check,
  CheckCircle,
  Clock,
  Cpu,
  CreditCard,
  Database,
  Inbox,
  List,
  RefreshCw,
  Server,
  Shield,
  ShoppingBag,
  Tag,
  Target,
  Trophy,
  UserCheck,
  UserPlus,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import api from '../services/api';

const fallbackStats = {
  total_predictions: 0,
  r2_score: 0.9875,
  mae: 616608.99,
  last_training_date: '2026-02-28',
  model_status: 'ready',
};

const formatNumber = (value) => Number(value || 0).toLocaleString();

const formatCurrency = (value) =>
  `LKR ${Number(value || 0).toLocaleString('en-LK', { maximumFractionDigits: 0 })}`;

const formatDate = (value) => {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatRelativeTime = (value) => {
  if (!value) return 'Unknown';

  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return 'Unknown';

  const diffMinutes = Math.floor((Date.now() - timestamp) / 60000);
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;

  const hours = Math.floor(diffMinutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;

  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
};

const getNameFromUser = (user) =>
  user?.user_metadata?.username ||
  user?.user_metadata?.name ||
  user?.email?.split('@')[0] ||
  'User';

const getInitials = (value) => {
  const words = String(value || 'U')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('') || 'U';
};

const normalizeTrend = (payload) => (Array.isArray(payload?.trend) ? payload.trend : []);

const parseTrendDate = (value) => {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getWeekdayLabel = (value) => {
  const parsed = parseTrendDate(value);
  if (!parsed) return 'Day';
  return parsed.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
};

const buildCurrentWeekTrend = (trend) => {
  if (!trend.length) return [];

  const trendMap = new Map(
    trend.map((item) => [
      item.date,
      {
        ...item,
        count: Number(item.count || 0),
      },
    ])
  );

  const latestDate = parseTrendDate(trend[trend.length - 1]?.date);
  if (!latestDate) return trend.slice(-7);

  const monday = new Date(latestDate);
  const dayOffset = (latestDate.getUTCDay() + 6) % 7;
  monday.setUTCDate(latestDate.getUTCDate() - dayOffset);

  return Array.from({ length: 7 }, (_, index) => {
    const nextDate = new Date(monday);
    nextDate.setUTCDate(monday.getUTCDate() + index);
    const dateKey = nextDate.toISOString().slice(0, 10);
    const existingItem = trendMap.get(dateKey);

    return {
      date: dateKey,
      label: getWeekdayLabel(dateKey),
      count: existingItem?.count || 0,
    };
  });
};

const trendTotals = (trend) => {
  const current = trend.slice(-7).reduce((sum, item) => sum + Number(item.count || 0), 0);
  const previous = trend.slice(-14, -7).reduce((sum, item) => sum + Number(item.count || 0), 0);
  return { current, previous };
};

const buildTrendBadge = ({ current, previous, invert = false, fallback = 'No change' }) => {
  if (!previous && !current) return { direction: 'flat', label: fallback };
  if (!previous && current) return { direction: invert ? 'down' : 'up', label: 'New this week' };

  const change = Math.round(((current - previous) / previous) * 100);
  if (change === 0) return { direction: 'flat', label: fallback };

  const isPositive = change > 0;
  const direction = invert ? (isPositive ? 'down' : 'up') : isPositive ? 'up' : 'down';
  return { direction, label: `${isPositive ? '↑' : '↓'} ${Math.abs(change)}% this week` };
};

function TrendBadge({ badge }) {
  return (
    <div className={`admin-dashboard-trend admin-dashboard-trend--${badge.direction}`}>
      {badge.label}
    </div>
  );
}

function MetricCard({ accent, iconBg, icon: Icon, label, value, sub, trend, note }) {
  return (
    <article className="admin-dashboard-metric" style={{ '--metric-accent': accent }}>
      <div className="admin-dashboard-metric-icon" style={{ background: iconBg, color: accent }}>
        <Icon size={18} strokeWidth={1.8} />
      </div>
      <div className="admin-dashboard-metric-label">{label}</div>
      <div className="admin-dashboard-metric-value" style={{ color: accent }}>
        {value}
      </div>
      <div className="admin-dashboard-metric-sub">{sub}</div>
      {note && <div className="admin-dashboard-metric-note">{note}</div>}
      {trend && <TrendBadge badge={trend} />}
    </article>
  );
}

function PanelHeader({ icon: Icon, color, title, subtitle, right }) {
  return (
    <div className="admin-dashboard-panel-header">
      <div>
        <div className="admin-dashboard-panel-title">
          <Icon size={14} color={color} strokeWidth={1.9} />
          <span>{title}</span>
        </div>
        {subtitle && <div className="admin-dashboard-panel-subtitle">{subtitle}</div>}
      </div>
      {right}
    </div>
  );
}

function StatusDot({ color = '#3fb950' }) {
  return <span className="admin-dashboard-status-dot" style={{ background: color }} />;
}

function Dashboard() {
  const [stats, setStats] = useState(fallbackStats);
  const [dauCount, setDauCount] = useState(0);
  const [users, setUsers] = useState([]);
  const [listings, setListings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [predictionTrend, setPredictionTrend] = useState([]);
  const [dauTrend, setDauTrend] = useState([]);
  const [topBrands, setTopBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [showAllUsers, setShowAllUsers] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError('');

    const [
      statsResult,
      dauResult,
      usersResult,
      listingsResult,
      paymentsResult,
      predictionTrendResult,
      dauTrendResult,
      brandsResult,
    ] = await Promise.allSettled([
      api.get('/api/admin/stats'),
      api.get('/api/admin/dau'),
      api.get('/api/admin/users/recent?limit=100'),
      api.get('/api/admin/marketplace/listings', { params: { status: 'all' } }),
      api.get('/api/admin/payments'),
      api.get('/api/admin/prediction-trends?days=14'),
      api.get('/api/admin/dau-trends?days=14'),
      api.get('/api/dashboard/brand-activity?limit=5'),
    ]);

    if (statsResult.status === 'fulfilled') {
      setStats({ ...fallbackStats, ...statsResult.value.data });
    } else {
      setStats(fallbackStats);
      setError('Some live dashboard data could not be loaded. Showing available data.');
    }

    if (dauResult.status === 'fulfilled') {
      setDauCount(Number(dauResult.value.data?.count || 0));
    } else {
      setDauCount(0);
    }

    if (usersResult.status === 'fulfilled') {
      setUsers(usersResult.value.data?.users || []);
    } else {
      setUsers([]);
    }

    if (listingsResult.status === 'fulfilled') {
      setListings(listingsResult.value.data?.listings || []);
    } else {
      setListings([]);
    }

    if (paymentsResult.status === 'fulfilled') {
      setPayments(paymentsResult.value.data?.payments || []);
    } else {
      setPayments([]);
    }

    if (predictionTrendResult.status === 'fulfilled') {
      setPredictionTrend(normalizeTrend(predictionTrendResult.value.data));
    } else {
      setPredictionTrend([]);
    }

    if (dauTrendResult.status === 'fulfilled') {
      setDauTrend(normalizeTrend(dauTrendResult.value.data));
    } else {
      setDauTrend([]);
    }

    if (brandsResult.status === 'fulfilled') {
      setTopBrands(brandsResult.value.data?.top_brands || []);
    } else {
      setTopBrands([]);
    }

    setLastUpdated(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const listingSummary = useMemo(() => {
    const countStatus = (status) =>
      listings.filter((listing) => String(listing.status || '').toLowerCase() === status).length;

    return {
      total: listings.length,
      approved: countStatus('approved'),
      pending: countStatus('pending'),
      rejected: countStatus('rejected'),
      sold: countStatus('sold'),
    };
  }, [listings]);

  const predictionTotals = useMemo(() => trendTotals(predictionTrend), [predictionTrend]);
  const dauTotals = useMemo(() => trendTotals(dauTrend), [dauTrend]);
  const maeTrend = useMemo(() => {
    const previous = Number(stats.previous_mae || stats.previous_model_mae || 0);
    const current = Number(stats.mae || 0);
    return buildTrendBadge({ current, previous, invert: true });
  }, [stats]);

  const usersThisWeek = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return users.filter((user) => new Date(user.created_at || 0).getTime() >= weekAgo).length;
  }, [users]);

  const isTrainingOld = useMemo(() => {
    if (!stats.last_training_date) return false;
    const ageDays = (Date.now() - new Date(stats.last_training_date).getTime()) / 86400000;
    return ageDays > 30;
  }, [stats.last_training_date]);

  const metricCards = [
    {
      label: 'Total Predictions',
      value: loading ? '-' : formatNumber(stats.total_predictions),
      sub: 'All time',
      icon: Cpu,
      iconBg: '#0c2a4a',
      accent: '#58a6ff',
      trend: buildTrendBadge({ ...predictionTotals }),
    },
    {
      label: 'Daily Active Users',
      value: loading ? '-' : formatNumber(dauCount),
      sub: 'Unique logins last 24h',
      icon: Users,
      iconBg: '#052e16',
      accent: '#3fb950',
      trend: buildTrendBadge({ ...dauTotals }),
    },
    {
      label: 'Model R² Score',
      value: stats.r2_score != null ? Number(stats.r2_score).toFixed(4) : '-',
      sub: 'Prediction accuracy',
      icon: Target,
      iconBg: '#052e16',
      accent: '#3fb950',
    },
    {
      label: 'Current MAE',
      value: formatCurrency(stats.mae),
      sub: 'Mean absolute error',
      icon: Calculator,
      iconBg: '#2d1b00',
      accent: '#d29922',
      trend: maeTrend,
    },
    {
      label: 'Last Training Date',
      value: formatDate(stats.last_training_date),
      sub: 'Model last retrained',
      icon: Calendar,
      iconBg: '#1a0a28',
      accent: '#a78bfa',
      note: isTrainingOld ? 'Retrain recommended' : '',
    },
    {
      label: 'Total Registered Users',
      value: `${formatNumber(users.length)}${users.length >= 100 ? '+' : ''}`,
      sub: 'Registered accounts',
      icon: UserCheck,
      iconBg: '#0c2a4a',
      accent: '#58a6ff',
      trend: { direction: usersThisWeek > 0 ? 'up' : 'flat', label: `${usersThisWeek} new this week` },
    },
  ];

  const sevenDayTrend = useMemo(() => buildCurrentWeekTrend(predictionTrend), [predictionTrend]);
  const maxPredictions = Math.max(1, ...sevenDayTrend.map((item) => Number(item.count || 0)));
  const totalPredictionsThisWeek = sevenDayTrend.reduce((sum, item) => sum + Number(item.count || 0), 0);
  const maxBrandCount = Math.max(1, ...topBrands.map((item) => Number(item.count || 0)));
  const visibleUsers = showAllUsers ? users.slice(0, 15) : users.slice(0, 5);

  const activityItems = useMemo(() => {
    const userItems = users.slice(0, 6).map((user) => ({
      id: `user-${user.id || user.email}`,
      type: 'user',
      icon: UserPlus,
      color: '#3fb950',
      bg: '#052e16',
      text: `${getNameFromUser(user)} registered an account`,
      time: user.created_at,
    }));

    const listingItems = listings.slice(0, 8).map((listing) => {
      const status = String(listing.status || 'pending').toLowerCase();
      const approved = status === 'approved';
      const rejected = status === 'rejected';
      const sold = status === 'sold';
      return {
        id: `listing-${listing.id}`,
        type: approved ? 'approved' : rejected ? 'rejected' : 'listing',
        icon: approved ? CheckCircle : rejected ? XCircle : sold ? Tag : ShoppingBag,
        color: approved || sold ? '#3fb950' : rejected ? '#f85149' : '#d29922',
        bg: approved || sold ? '#052e16' : rejected ? '#1a0505' : '#2d1b00',
        text: `${listing.brand || 'Vehicle'} ${listing.model || ''} listing ${approved ? 'was approved' : rejected ? 'was rejected' : sold ? 'was marked sold' : 'was submitted'}`.trim(),
        time: listing.updated_at || listing.created_at,
        value: listing.price ? formatCurrency(listing.price) : '',
      };
    });

    const paymentItems = payments.slice(0, 5).map((payment) => ({
      id: `payment-${payment.id || payment.session_id}`,
      type: 'payment',
      icon: CreditCard,
      color: '#d29922',
      bg: '#2d1b00',
      text: `${payment.account_email || payment.customer_email || 'A user'} completed a marketplace boost payment`,
      time: payment.confirmed_at || payment.created_at,
      value: payment.amount ? formatCurrency(payment.amount) : '',
    }));

    const trendItems = predictionTrend
      .slice(-4)
      .filter((item) => Number(item.count || 0) > 0)
      .map((item) => ({
        id: `prediction-${item.date}`,
        type: 'prediction',
        icon: Cpu,
        color: '#58a6ff',
        bg: '#0c2a4a',
        text: `${Number(item.count || 0).toLocaleString()} price predictions recorded`,
        time: item.date,
        value: `${Number(item.count || 0).toLocaleString()} runs`,
      }));

    return [...userItems, ...listingItems, ...paymentItems, ...trendItems]
      .filter((item) => item.time)
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 10);
  }, [listings, payments, predictionTrend, users]);

  return (
    <div className="admin-dashboard-page">
      <header className="admin-dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p>System overview and model performance metrics</p>
        </div>
        <div className="admin-dashboard-header-actions">
          <button type="button" className="admin-dashboard-refresh" onClick={fetchDashboardData} disabled={loading}>
            <RefreshCw size={13} className={loading ? 'admin-dashboard-spin' : ''} />
            Refresh data
          </button>
          <span>Updated {formatRelativeTime(lastUpdated).replace(/^Just/, 'just')}</span>
        </div>
      </header>

      {error && <div className="admin-dashboard-alert">{error}</div>}

      <section className="admin-dashboard-metrics" aria-label="Dashboard metrics">
        {metricCards.map((card) => (
          <MetricCard key={card.label} {...card} />
        ))}
      </section>

      <section className="admin-dashboard-three">
        <article className="admin-dashboard-panel">
          <PanelHeader
            icon={ShoppingBag}
            color="#a78bfa"
            title="Marketplace Overview"
            subtitle="Live listing status breakdown"
          />
          <div className="admin-dashboard-stat-list">
            {[
              { label: 'Total listings', value: listingSummary.total, icon: List, color: '#e6edf3' },
              { label: 'Approved', value: listingSummary.approved, icon: Check, color: '#3fb950' },
              { label: 'Pending review', value: listingSummary.pending, icon: Clock, color: '#d29922' },
              { label: 'Rejected', value: listingSummary.rejected, icon: X, color: '#f85149' },
              { label: 'Sold', value: listingSummary.sold, icon: Tag, color: '#a78bfa' },
            ].map((row) => (
              <div className="admin-dashboard-stat-row" key={row.label}>
                <span>
                  <row.icon size={13} color={row.color} />
                  {row.label}
                </span>
                <strong style={{ color: row.color }}>{formatNumber(row.value)}</strong>
              </div>
            ))}
          </div>
          <a className="admin-dashboard-panel-link" href="/admin/marketplace">
            Manage listings →
          </a>
        </article>

        <article className="admin-dashboard-panel">
          <PanelHeader icon={Activity} color="#58a6ff" title="Prediction Activity" subtitle="Monday to Sunday" />
          <div className="admin-dashboard-bars">
            {sevenDayTrend.length ? (
              sevenDayTrend.map((item) => {
                const count = Number(item.count || 0);
                const width = `${Math.max(4, (count / maxPredictions) * 100)}%`;
                return (
                  <div className="admin-dashboard-bar-row" key={item.date}>
                    <span>{getWeekdayLabel(item.date)}</span>
                    <div>
                      <i style={{ width }} />
                    </div>
                    <strong>{count}</strong>
                  </div>
                );
              })
            ) : (
              <div className="admin-dashboard-mini-empty">No prediction activity yet</div>
            )}
          </div>
          <div className="admin-dashboard-panel-total">
            <span>Total this week</span>
            <strong>{formatNumber(totalPredictionsThisWeek)}</strong>
          </div>
        </article>

        <article className="admin-dashboard-panel">
          <PanelHeader icon={Trophy} color="#d29922" title="Top Predicted Brands" subtitle="By prediction volume" />
          <div className="admin-dashboard-brand-list">
            {topBrands.length ? (
              topBrands.slice(0, 5).map((brand, index) => (
                <div className="admin-dashboard-brand-row" key={brand.label}>
                  <span className={`admin-dashboard-rank admin-dashboard-rank--${Math.min(index + 1, 4)}`}>
                    {index + 1}
                  </span>
                  <strong>{brand.label}</strong>
                  <div>
                    <i style={{ width: `${(Number(brand.count || 0) / maxBrandCount) * 100}%` }} />
                  </div>
                  <span>{formatNumber(brand.count)}</span>
                </div>
              ))
            ) : (
              <div className="admin-dashboard-mini-empty">No brand prediction data yet</div>
            )}
          </div>
        </article>
      </section>

      <section className="admin-dashboard-two">
        <article className="admin-dashboard-panel">
          <PanelHeader
            icon={UserPlus}
            color="#3fb950"
            title="Recent Registrations"
            right={
              <button className="admin-dashboard-text-link" type="button" onClick={() => setShowAllUsers((value) => !value)}>
                {showAllUsers ? 'Show less' : 'View all →'}
              </button>
            }
          />
          <div className="admin-dashboard-user-list">
            {visibleUsers.length ? (
              visibleUsers.map((user) => (
                <div className="admin-dashboard-user-row" key={user.id || user.email}>
                  <div className="admin-dashboard-user-avatar">{getInitials(getNameFromUser(user))}</div>
                  <div className="admin-dashboard-user-main">
                    <strong>{getNameFromUser(user)}</strong>
                    <span>{user.email}</span>
                  </div>
                  <span className={`admin-dashboard-user-badge ${user.email_confirmed_at ? 'confirmed' : 'pending'}`}>
                    {user.email_confirmed_at ? 'Confirmed' : 'Pending'}
                  </span>
                  <time>{formatRelativeTime(user.created_at)}</time>
                </div>
              ))
            ) : (
              <div className="admin-dashboard-mini-empty">No recent registrations</div>
            )}
          </div>
        </article>

        <article className="admin-dashboard-panel">
          <PanelHeader
            icon={Server}
            color="#58a6ff"
            title="System Health"
            right={<span className="admin-dashboard-live-badge">LIVE</span>}
          />
          <div className="admin-dashboard-health-list">
            {[
              { label: 'Supabase DB', status: 'Connected', icon: Database },
              { label: 'ML Model', status: stats.model_status === 'unavailable' ? 'Unavailable' : 'Active (v2.1)', icon: Cpu },
              { label: 'Stripe Payments', status: 'Live mode', icon: CreditCard },
              { label: 'Gemini API', status: 'Connected', icon: Bot },
              { label: 'Auth Service', status: 'Supabase Auth', icon: Shield },
            ].map((row) => (
              <div className="admin-dashboard-health-row" key={row.label}>
                <span>
                  <row.icon size={13} />
                  {row.label}
                </span>
                <strong>
                  <StatusDot color={row.status === 'Unavailable' ? '#f85149' : '#3fb950'} />
                  {row.status}
                </strong>
              </div>
            ))}
          </div>
          <div className="admin-dashboard-model-mini">
            <div>
              <span>R² Score</span>
              <strong>{stats.r2_score != null ? Number(stats.r2_score).toFixed(4) : '-'}</strong>
            </div>
            <div>
              <span>MAE</span>
              <strong>{formatCurrency(stats.mae)}</strong>
            </div>
          </div>
        </article>
      </section>

      <section className="admin-dashboard-panel admin-dashboard-activity-panel">
        <PanelHeader icon={Clock} color="#a78bfa" title="Recent Platform Activity" subtitle="Live feed of user actions" />
        <div className="admin-dashboard-activity-list">
          {activityItems.length ? (
            activityItems.map((item) => (
              <div className="admin-dashboard-activity-row" key={item.id}>
                <div className="admin-dashboard-activity-icon" style={{ background: item.bg, color: item.color }}>
                  <item.icon size={14} strokeWidth={1.9} />
                </div>
                <div className="admin-dashboard-activity-main">
                  <strong>{item.text}</strong>
                  <time>{formatRelativeTime(item.time)}</time>
                </div>
                {item.value && <span>{item.value}</span>}
              </div>
            ))
          ) : (
            <div className="admin-dashboard-empty">
              <Inbox size={28} />
              <span>No recent activity</span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
