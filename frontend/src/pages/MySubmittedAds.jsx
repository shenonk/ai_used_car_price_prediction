import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CheckCircle2, Clock3, Store, XCircle } from "lucide-react";

import { supabase } from "../utils/supabaseClient";

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

  useEffect(() => {
    let isActive = true;

    const fetchMyListings = async () => {
      try {
        setIsLoading(true);
        setLoadError("");

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          if (isActive) {
            setMyListings([]);
          }
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

        if (isActive) {
          setMyListings(result.listings || []);
        }
      } catch (error) {
        if (isActive) {
          setMyListings([]);
          setLoadError(error.message || t("marketplace.errors.load_my_ads_failed"));
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

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
      isActive = false;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleWindowFocus);
      document.removeEventListener("visibilitychange", handleVisibilityRefresh);
    };
  }, [t]);

  const summary = useMemo(
    () => ({
      pending: myListings.filter((listing) => listing.status === "pending").length,
      approved: myListings.filter((listing) => listing.status === "approved").length,
      rejected: myListings.filter((listing) => listing.status === "rejected").length,
    }),
    [myListings]
  );

  return (
    <div className="marketplace-page theme-app-bg min-h-screen px-6 py-8 md:px-8">
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

      {loadError && (
        <div className="mt-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {loadError}
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
            />
          ))}
        </section>
      )}
    </div>
  );
}

function MyListingCard({ listing, locale, t }) {
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
