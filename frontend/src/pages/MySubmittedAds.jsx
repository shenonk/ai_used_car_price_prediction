import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BarChart3, CheckCircle2, Clock3, Eye, Store, Trash2, TrendingUp, XCircle } from "lucide-react";

import { supabase } from "../utils/supabaseClient";
import AppModal from "../components/AppModal";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const localeMap = {
  en: "en-LK",
  si: "si-LK",
  ta: "ta-LK",
};

const submissionStatusMeta = {
  pending: {
    icon: Clock3,
    badgeClass: "border-amber-500/20 bg-amber-500/10 text-amber-200",
    cardClass: "border-amber-500/20 bg-amber-500/6",
  },
  approved: {
    icon: CheckCircle2,
    badgeClass: "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
    cardClass: "border-emerald-500/20 bg-emerald-500/6",
  },
  rejected: {
    icon: XCircle,
    badgeClass: "border-rose-500/20 bg-rose-500/10 text-rose-200",
    cardClass: "border-rose-500/20 bg-rose-500/6",
  },
  sold: {
    icon: CheckCircle2,
    badgeClass: "border-cyan-500/20 bg-cyan-500/10 text-cyan-200",
    cardClass: "border-cyan-500/20 bg-cyan-500/6",
  },
};

const getLocale = (language) => localeMap[language] || "en-LK";

const formatCurrency = (value, locale) =>
  new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const normalizeImageCollection = (value) => {
  if (Array.isArray(value)) {
    return value.filter((item) => typeof item === "string" && item.trim());
  }

  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter((item) => typeof item === "string" && item.trim());
      }
    } catch {
      return [value];
    }
  }

  return [];
};

function MySubmittedAds() {
  const { t, i18n } = useTranslation();
  const locale = getLocale(i18n.resolvedLanguage);
  const [myListings, setMyListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [isLightTheme, setIsLightTheme] = useState(
    typeof document !== "undefined" && document.documentElement.dataset.theme === "light"
  );
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletingListingId, setDeletingListingId] = useState("");

  const fetchMyListings = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError("");

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setMyListings([]);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/marketplace/my-listings`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || t("marketplace.errors.load_my_ads_failed"));
      }

      setMyListings(result.listings || []);
    } catch (error) {
      setMyListings([]);
      setLoadError(error.message || t("marketplace.errors.load_my_ads_failed"));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchMyListings();

    const handleVisibilityRefresh = () => {
      if (document.visibilityState === "visible") {
        fetchMyListings();
      }
    };

    const handleWindowFocus = () => {
      fetchMyListings();
    };

    const intervalId = window.setInterval(fetchMyListings, 20000);

    window.addEventListener("focus", handleWindowFocus);
    document.addEventListener("visibilitychange", handleVisibilityRefresh);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleWindowFocus);
      document.removeEventListener("visibilitychange", handleVisibilityRefresh);
    };
  }, [fetchMyListings]);

  useEffect(() => {
    if (typeof document === "undefined") return undefined;

    const syncTheme = () => {
      setIsLightTheme(document.documentElement.dataset.theme === "light");
    };

    syncTheme();

    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    window.addEventListener("carpriceai-theme-change", syncTheme);

    return () => {
      observer.disconnect();
      window.removeEventListener("carpriceai-theme-change", syncTheme);
    };
  }, []);

  const summary = useMemo(() => {
    const statusCounts = myListings.reduce(
      (acc, listing) => {
        const status = String(listing.status || "pending").toLowerCase();
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      },
      { pending: 0, approved: 0, rejected: 0, sold: 0 }
    );
    const totalViews = myListings.reduce((sum, listing) => sum + getListingViews(listing), 0);
    const topViewedAd = [...myListings].sort((a, b) => getListingViews(b) - getListingViews(a))[0] || null;
    const maxViews = Math.max(...myListings.map(getListingViews), 1);
    const leaderboard = [...myListings]
      .sort((a, b) => getListingViews(b) - getListingViews(a))
      .slice(0, 4)
      .map((listing) => ({
        ...listing,
        viewWidth: `${Math.max(8, (getListingViews(listing) / maxViews) * 100)}%`,
      }));

    return {
      ...statusCounts,
      totalViews,
      topViewedAd,
      leaderboard,
      totalAds: myListings.length,
    };
  }, [myListings]);

  const requestDeleteListing = (listing) => {
    setActionError("");
    setActionSuccess("");
    setDeleteTarget(listing);
  };

  const confirmDeleteListing = async () => {
    if (!deleteTarget?.id) return;

    try {
      setDeletingListingId(String(deleteTarget.id));
      setActionError("");
      setActionSuccess("");

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Please sign in before deleting your listing.");
      }

      const response = await fetch(`${API_BASE_URL}/api/marketplace/my-listings/${encodeURIComponent(deleteTarget.id)}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to delete this listing right now.");
      }

      setMyListings((current) => current.filter((listing) => String(listing.id) !== String(deleteTarget.id)));
      setActionSuccess(result.message || "Listing deleted successfully.");
      setDeleteTarget(null);
    } catch (error) {
      setActionError(error.message || "Unable to delete this listing right now.");
    } finally {
      setDeletingListingId("");
    }
  };

  return (
    <div className="marketplace-page marketplace-my-ads-page theme-app-bg min-h-screen px-6 py-8 md:px-8">
      <section className="marketplace-panel card animate-fade-in overflow-hidden">
        <div className="relative p-6 md:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.12),_transparent_28%),radial-gradient(circle_at_bottom_left,_rgba(16,185,129,0.08),_transparent_24%)]" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
                {t("marketplace.my_ads.title")}
              </h1>
              <p className="mt-3 text-sm leading-7 text-slate-300 md:text-base">
                {t("marketplace.my_ads.description")}
              </p>
            </div>

            <Link
              to="/marketplace"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-700/70 bg-slate-900/80 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-500/80 hover:text-white"
            >
              {t("marketplace.inventory.title")}
            </Link>
          </div>

          <div className="relative mt-6 grid gap-3 sm:grid-cols-3">
            <StatCard label={t("marketplace.my_ads.stats.pending")} value={summary.pending} />
            <StatCard label={t("marketplace.my_ads.stats.approved")} value={summary.approved} />
            <StatCard label={t("marketplace.my_ads.stats.rejected")} value={summary.rejected} />
          </div>
        </div>
      </section>

      <section className="marketplace-panel card mt-6 animate-fade-in overflow-hidden">
        <div className="relative p-5 md:p-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(20,184,166,0.12),_transparent_30%)]" />
          <div className="relative">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">{t("marketplace.my_ads.performance", { defaultValue: "Ad performance" })}</p>
                <h2 className="mt-2 text-2xl font-bold text-white">{t("marketplace.my_ads.insights_title", { defaultValue: "Your listing insights" })}</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                  Track buyer views, review status, and which ads are getting the most attention.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-700/70 bg-slate-950/40 px-4 py-2 text-sm text-slate-300">
                <BarChart3 className="h-4 w-4 text-cyan-300" />
                {summary.totalAds} submitted ads
              </div>
            </div>

            <div className="my-ads-performance-grid mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <PerformanceCard
                icon={<Store className="h-5 w-5" />}
                label="Approved ads"
                value={summary.approved}
                meta="Visible in the public marketplace"
                tone="text-emerald-300 bg-emerald-500/10"
                isLightTheme={isLightTheme}
              />
              <PerformanceCard
                icon={<Eye className="h-5 w-5" />}
                label="Total views"
                value={summary.totalViews.toLocaleString("en-LK")}
                meta="Buyer opens across your ads"
                tone="text-cyan-300 bg-cyan-500/10"
                isLightTheme={isLightTheme}
              />
              <PerformanceCard
                icon={<Clock3 className="h-5 w-5" />}
                label="Pending review"
                value={summary.pending}
                meta="Waiting for admin approval"
                tone="text-amber-300 bg-amber-500/10"
                isLightTheme={isLightTheme}
              />
              <PerformanceCard
                icon={<TrendingUp className="h-5 w-5" />}
                label="Top viewed"
                value={summary.topViewedAd ? `${summary.topViewedAd.brand} ${summary.topViewedAd.model}` : "No data"}
                meta={summary.topViewedAd ? `${getListingViews(summary.topViewedAd).toLocaleString("en-LK")} views` : "Views appear after buyers open ads"}
                tone="text-blue-300 bg-blue-500/10"
                isLightTheme={isLightTheme}
              />
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
              <div
                className={`my-ads-detail-panel rounded-[24px] border p-5 ${
                  isLightTheme
                    ? "border-slate-200 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.06)]"
                    : "border-slate-800/80 bg-slate-950/35"
                }`}
              >
                <h3 className="text-lg font-semibold text-white">{t("marketplace.my_ads.views_leaderboard", { defaultValue: "Views leaderboard" })}</h3>
                <p className="mt-1 text-sm text-slate-500">{t("marketplace.my_ads.views_leaderboard_subtitle", { defaultValue: "Your strongest ads by buyer interest." })}</p>
                <div className="mt-5 space-y-3">
                  {summary.leaderboard.length > 0 ? (
                    summary.leaderboard.map((listing) => (
                      <div
                        key={listing.id}
                        className={`my-ads-leaderboard-card rounded-2xl border p-4 ${
                          isLightTheme
                            ? "border-slate-200 bg-slate-50"
                            : "border-slate-800/80 bg-slate-900/45"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-white">
                              {listing.brand} {listing.model}
                            </p>
                            <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">{listing.status || "pending"}</p>
                          </div>
                          <p className="shrink-0 text-sm font-semibold text-cyan-300">
                            {getListingViews(listing).toLocaleString("en-LK")} views
                          </p>
                        </div>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
                          <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-300" style={{ width: listing.viewWidth }} />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-700/80 px-5 py-8 text-center text-sm text-slate-400">
                      Publish an ad to start tracking buyer views.
                    </div>
                  )}
                </div>
              </div>

              <div
                className={`my-ads-detail-panel rounded-[24px] border p-5 ${
                  isLightTheme
                    ? "border-slate-200 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.06)]"
                    : "border-slate-800/80 bg-slate-950/35"
                }`}
              >
                <h3 className="text-lg font-semibold text-white">{t("marketplace.my_ads.review_label")}</h3>
                <p className="mt-1 text-sm text-slate-500">{t("marketplace.my_ads.review_subtitle", { defaultValue: "Submitted ads by current stage." })}</p>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  {[
                    ["Approved", summary.approved, "text-emerald-300"],
                    ["Pending", summary.pending, "text-amber-300"],
                    ["Rejected", summary.rejected, "text-rose-300"],
                    ["Sold", summary.sold || 0, "text-blue-300"],
                  ].map(([label, value, tone]) => (
                    <div
                      key={label}
                      className={`my-ads-status-card rounded-2xl border p-4 ${
                        isLightTheme
                          ? "border-slate-200 bg-slate-50"
                          : "border-slate-800/80 bg-slate-900/45"
                      }`}
                    >
                      <p className={`text-2xl font-bold ${tone}`}>{value}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {loadError && (
        <div className="mt-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {loadError}
        </div>
      )}

      {actionError && (
        <div className="mt-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {actionError}
        </div>
      )}

      {actionSuccess && (
        <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {actionSuccess}
        </div>
      )}

      {isLoading ? (
        <section className="marketplace-panel card mt-8 p-8 animate-fade-in">
          <div className="flex min-h-[220px] items-center justify-center text-slate-300">
            Loading your submitted ads...
          </div>
        </section>
      ) : myListings.length === 0 ? (
        <section className="marketplace-panel card mt-8 p-8 animate-fade-in">
          <div className="flex min-h-[220px] flex-col items-center justify-center text-center">
            <div className="rounded-2xl border border-slate-700/60 bg-slate-900/90 p-4 text-slate-400">
              <Store className="h-6 w-6" />
            </div>
            <h2 className="mt-5 text-xl font-semibold text-white">{t("marketplace.my_ads.empty_title")}</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
              {t("marketplace.my_ads.empty_description")}
            </p>
          </div>
        </section>
      ) : (
        <section className="mt-8 grid grid-cols-1 gap-4 xl:grid-cols-2 animate-fade-in">
          {myListings.map((listing) => (
            <MyListingCard
              key={listing.id}
              listing={listing}
              locale={locale}
              t={t}
              onDelete={requestDeleteListing}
              isDeleting={deletingListingId === String(listing.id)}
            />
          ))}
        </section>
      )}

      <AppModal
        isOpen={Boolean(deleteTarget)}
        tone="danger"
        eyebrow="My Ads"
        title="Delete listing"
        message={`Remove ${deleteTarget?.brand || "this"} ${deleteTarget?.model || "listing"} from your submitted ads? This cannot be undone.`}
        confirmLabel={deletingListingId ? "Deleting..." : "Delete"}
        cancelLabel="Cancel"
        showCancel
        isBusy={Boolean(deletingListingId)}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteListing}
      />
    </div>
  );
}

function MyListingCard({ listing, locale, t, onDelete, isDeleting }) {
  const normalizedStatus = submissionStatusMeta[listing.status] ? listing.status : "pending";
  const statusMeta = submissionStatusMeta[normalizedStatus];
  const StatusIcon = statusMeta.icon;
  const listingImages = getListingImagesForCard(listing);

  return (
    <article className={`overflow-hidden rounded-[24px] border p-5 ${statusMeta.cardClass}`}>
      <div className="flex gap-4">
        <div className="flex h-24 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-800/80 bg-[linear-gradient(135deg,rgba(30,41,59,0.95),rgba(15,23,42,0.95))] text-slate-500">
          {listingImages[0] ? (
            <img
              src={listingImages[0]}
              alt={`${listing.brand} ${listing.model}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <Store className="h-7 w-7" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-white">
              {listing.brand} {listing.model}
            </h3>
            <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${statusMeta.badgeClass}`}>
              <StatusIcon className="h-3.5 w-3.5" />
              {t(`marketplace.my_ads.status.${normalizedStatus}`)}
            </span>
          </div>

          <p className="mt-2 text-sm text-slate-400">
            {listing.year || "-"} • {listing.vehicle_location || t("marketplace.fallbacks.location_not_listed")}
          </p>
          <p className="mt-3 text-xl font-semibold text-white">{formatCurrency(listing.price, locale)}</p>
          <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-slate-400">
            <Eye className="h-4 w-4 text-emerald-400" />
            {getListingViews(listing).toLocaleString("en-LK")} views
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-800/80 bg-slate-900/70 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          {t("marketplace.my_ads.review_label")}
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          {t(`marketplace.my_ads.messages.${normalizedStatus}`)}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
        <span>{t("marketplace.my_ads.submitted_on", { date: formatSubmissionDate(listing.created_at, locale) })}</span>
        <span>{t("marketplace.my_ads.photos_count", { count: listingImages.length })}</span>
      </div>

      <div className="mt-4">
        <button
          type="button"
          onClick={() => onDelete(listing)}
          disabled={isDeleting}
          className="inline-flex items-center gap-2 rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-2.5 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/15 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Trash2 className="h-4 w-4" />
          {isDeleting ? "Deleting..." : "Delete ad"}
        </button>
      </div>
    </article>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-700/60 bg-slate-900/70 px-4 py-3 backdrop-blur">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

function PerformanceCard({ icon, label, value, meta, tone, isLightTheme }) {
  return (
    <div
      className={`my-ads-performance-card rounded-[24px] border p-5 ${
        isLightTheme
          ? "border-slate-200 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.06)]"
          : "border-slate-800/80 bg-slate-950/35"
      }`}
    >
      <div className={`inline-flex rounded-2xl p-3 ${tone}`}>{icon}</div>
      <p className="mt-5 text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 truncate text-2xl font-bold text-white">{value}</p>
      <p className="mt-1 text-sm text-slate-400">{meta}</p>
    </div>
  );
}

function getListingViews(listing) {
  return Number(listing?.view_count || listing?.views || 0);
}

function getListingImagesForCard(listing) {
  const images = normalizeImageCollection(listing?.image_urls);
  if (images.length > 0) return images;
  return normalizeImageCollection(listing?.image_url);
}

function formatSubmissionDate(value, locale) {
  if (!value) return "-";

  return new Date(value).toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default MySubmittedAds;
