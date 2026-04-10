import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowUp, CalendarRange, ChevronDown, Fuel, Gauge, Search, ShieldCheck, Sparkles, Star, X, Zap } from "lucide-react";

import { supabase } from "../utils/supabaseClient";
import bumpedSticker from "../assets/marketplace-stickers/bumped.png";
import spotlightSticker from "../assets/marketplace-stickers/spotlight.png";
import urgentSticker from "../assets/marketplace-stickers/urgent.png";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const ALL_BRANDS = "__all_brands__";
const ALL_MODELS = "__all_models__";
const ALL_FUEL_TYPES = "__all_fuel_types__";

const priceRangeValues = ["all", "under_3m", "3m_6m", "6m_10m", "above_10m"];

const initialForm = {
  brand: "",
  model: "",
  seller_name: "",
  phone_number: "",
  vehicle_location: "",
  vehicle_description: "",
  year: "",
  mileage: "",
  fuel_type: "Petrol",
  transmission: "Automatic",
  condition: "Used",
  price: "",
};

const localeMap = {
  en: "en-LK",
  si: "si-LK",
  ta: "ta-LK",
};

const getLocale = (language) => localeMap[language] || "en-LK";

const formatCurrency = (value, locale) =>
  new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatNumber = (value, locale) => Number(value || 0).toLocaleString(locale);

const getBoostSticker = (listing) => {
  if (listing?.is_urgent) {
    return { src: urgentSticker, alt: "Urgent ad sticker" };
  }

  if (listing?.is_spotlight) {
    return { src: spotlightSticker, alt: "Spotlight ad sticker" };
  }

  if (listing?.is_bumped) {
    return { src: bumpedSticker, alt: "Bumped ad sticker" };
  }

  return null;
};

function Marketplace() {
  const { t, i18n } = useTranslation();
  const locale = getLocale(i18n.resolvedLanguage);
  const [cars, setCars] = useState([]);
  const [filters, setFilters] = useState({
    brand: ALL_BRANDS,
    model: ALL_MODELS,
    priceRange: "all",
    fuelType: ALL_FUEL_TYPES,
  });
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [loadError, setLoadError] = useState("");
  const [form, setForm] = useState(initialForm);
  const [selectedImages, setSelectedImages] = useState([]);
  const [submitState, setSubmitState] = useState({ saving: false, error: "", success: "" });
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);
  const [isSpotlight, setIsSpotlight] = useState(false);
  const [isBumped, setIsBumped] = useState(false);
  const [selectedCar, setSelectedCar] = useState(null);
  const [selectedCarImage, setSelectedCarImage] = useState("");
  const [lightboxImage, setLightboxImage] = useState("");

  const priceRanges = useMemo(
    () =>
      priceRangeValues.map((value) => ({
        value,
        label: t(`marketplace.price_ranges.${value}`),
      })),
    [t]
  );

  const translatedFuelLabels = useMemo(
    () => ({
      Petrol: t("marketplace.fuel_values.petrol"),
      Diesel: t("marketplace.fuel_values.diesel"),
      Hybrid: t("marketplace.fuel_values.hybrid"),
      Electric: t("marketplace.fuel_values.electric"),
    }),
    [t]
  );

  const translatedTransmissionLabels = useMemo(
    () => ({
      Automatic: t("marketplace.transmission_values.automatic"),
      Manual: t("marketplace.transmission_values.manual"),
      CVT: t("marketplace.transmission_values.cvt"),
    }),
    [t]
  );

  const translatedConditionLabels = useMemo(
    () => ({
      Used: t("marketplace.condition_values.used"),
      Reconditioned: t("marketplace.condition_values.reconditioned"),
      "Brand New": t("marketplace.condition_values.brand_new"),
    }),
    [t]
  );

  const boostOptions = useMemo(
    () => [
      {
        key: "urgent",
        selected: isUrgent,
        toggle: () => setIsUrgent((current) => !current),
        icon: Zap,
        title: t("marketplace.boost.urgent.title", { defaultValue: "Urgent Ad" }),
        description: t("marketplace.boost.urgent.description", { defaultValue: "Sell 2x faster with urgent visibility." }),
        price: 500,
        accentClassName: "marketplace-boost-card-urgent",
      },
      {
        key: "spotlight",
        selected: isSpotlight,
        toggle: () => setIsSpotlight((current) => !current),
        icon: Star,
        title: t("marketplace.boost.spotlight.title", { defaultValue: "Spotlight" }),
        description: t("marketplace.boost.spotlight.description", { defaultValue: "Stay featured in the premium spotlight area." }),
        price: 750,
        accentClassName: "marketplace-boost-card-spotlight",
      },
      {
        key: "bumped",
        selected: isBumped,
        toggle: () => setIsBumped((current) => !current),
        icon: ArrowUp,
        title: t("marketplace.boost.bumped.title", { defaultValue: "Bump Up" }),
        description: t("marketplace.boost.bumped.description", { defaultValue: "Push your listing higher in recent results." }),
        price: 300,
        accentClassName: "marketplace-boost-card-bumped",
      },
    ],
    [isBumped, isSpotlight, isUrgent, t]
  );

  const totalBoostPrice = useMemo(
    () => boostOptions.reduce((sum, option) => sum + (option.selected ? option.price : 0), 0),
    [boostOptions]
  );

  const hasPremiumSelection = totalBoostPrice > 0;

  const fetchListings = async () => {
    try {
      setLoadError("");

      const response = await fetch(`${API_BASE_URL}/api/marketplace/listings`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || t("marketplace.errors.load_failed"));
      }

      setCars(result.listings || []);
    } catch (error) {
      setLoadError(error.message || t("marketplace.errors.load_failed"));
    }
  };

  useEffect(() => {
    fetchListings();
  }, [t]);

  const approvedCars = useMemo(() => cars.filter((car) => car.status === "approved"), [cars]);

  const brandOptions = useMemo(
    () => [
      { value: ALL_BRANDS, label: t("marketplace.filters.all_brands") },
      ...Array.from(new Set(approvedCars.map((car) => car.brand).filter(Boolean))).map((brand) => ({
        value: brand,
        label: brand,
      })),
    ],
    [approvedCars, t]
  );

  const modelOptions = useMemo(
    () => [
      { value: ALL_MODELS, label: t("marketplace.filters.all_models") },
      ...Array.from(
        new Set(
        approvedCars
          .filter((car) => filters.brand === ALL_BRANDS || car.brand === filters.brand)
          .map((car) => car.model)
          .filter(Boolean)
        )
      ).map((model) => ({
        value: model,
        label: model,
      })),
    ],
    [approvedCars, filters.brand, t]
  );

  const fuelOptions = useMemo(
    () => [
      { value: ALL_FUEL_TYPES, label: t("marketplace.filters.all_fuel_types") },
      ...Array.from(new Set(approvedCars.map((car) => car.fuel_type).filter(Boolean))).map((fuel) => ({
        value: fuel,
        label: translatedFuelLabels[fuel] || fuel,
      })),
    ],
    [approvedCars, t, translatedFuelLabels]
  );

  const filteredCars = useMemo(() => {
    return approvedCars.filter((car) => {
      const normalizedSearch = appliedSearch.trim().toLowerCase();
      const vehicleName = [car.brand, car.model].filter(Boolean).join(" ").toLowerCase();
      const matchesSearch = !normalizedSearch || vehicleName.includes(normalizedSearch);
      const matchesBrand =
        filters.brand === ALL_BRANDS || car.brand === filters.brand;
      const matchesModel =
        filters.model === ALL_MODELS || car.model === filters.model;
      const matchesFuel =
        filters.fuelType === ALL_FUEL_TYPES || car.fuel_type === filters.fuelType;

      const price = Number(car.price || 0);
      const matchesPriceRange =
        filters.priceRange === "all" ||
        (filters.priceRange === "under_3m" && price < 3000000) ||
        (filters.priceRange === "3m_6m" && price >= 3000000 && price <= 6000000) ||
        (filters.priceRange === "6m_10m" && price > 6000000 && price <= 10000000) ||
        (filters.priceRange === "above_10m" && price > 10000000);

      return matchesSearch && matchesBrand && matchesModel && matchesFuel && matchesPriceRange;
    });
  }, [appliedSearch, approvedCars, filters]);

  const handleFilterChange = (key, value) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
      ...(key === "brand" ? { model: ALL_MODELS } : {}),
    }));
  };

  const handleInputChange = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setAppliedSearch(searchInput.trim());
  };

  const handleSearchReset = () => {
    setSearchInput("");
    setAppliedSearch("");
  };

  const handleImageChange = (slotIndex, event) => {
    const file = event.target.files?.[0] || null;
    setSelectedImages((current) => {
      const next = [...current];
      next[slotIndex] = file;
      return next.slice(0, 5);
    });
  };

  const handleRemoveImage = (slotIndex) => {
    setSelectedImages((current) => {
      const next = [...current];
      next[slotIndex] = null;
      return next;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitState({ saving: true, error: "", success: "" });

    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => formData.append(key, value));
      formData.append("is_urgent", String(isUrgent));
      formData.append("is_spotlight", String(isSpotlight));
      formData.append("is_bumped", String(isBumped));
      selectedImages.filter(Boolean).forEach((file) => formData.append("images", file));

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await fetch(`${API_BASE_URL}/api/marketplace/listings`, {
        method: "POST",
        headers: session?.access_token
          ? {
              Authorization: `Bearer ${session.access_token}`,
            }
          : undefined,
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || t("marketplace.errors.submit_failed"));
      }

      setSubmitState({
        saving: false,
        error: "",
        success: t("marketplace.success.submitted"),
      });
      setForm(initialForm);
      setSelectedImages([]);
      setIsUrgent(false);
      setIsSpotlight(false);
      setIsBumped(false);
      setIsPublishModalOpen(false);
      event.target.reset();
      fetchListings();
    } catch (error) {
      setSubmitState({
        saving: false,
        error: error.message || t("marketplace.errors.submit_failed"),
        success: "",
      });
    }
  };

  const getListingImages = (car) => {
    const images = Array.isArray(car?.image_urls) ? car.image_urls.filter(Boolean) : [];
    if (images.length > 0) return images;
    return car?.image_url ? [car.image_url] : [];
  };

  const selectedCarImages = useMemo(() => getListingImages(selectedCar), [selectedCar]);

  const lightboxIndex = useMemo(
    () => selectedCarImages.findIndex((imageUrl) => imageUrl === lightboxImage),
    [lightboxImage, selectedCarImages]
  );

  const showPreviousLightboxImage = () => {
    if (selectedCarImages.length <= 1) return;
    const currentIndex = lightboxIndex >= 0 ? lightboxIndex : 0;
    const nextIndex = (currentIndex - 1 + selectedCarImages.length) % selectedCarImages.length;
    setLightboxImage(selectedCarImages[nextIndex]);
    setSelectedCarImage(selectedCarImages[nextIndex]);
  };

  const showNextLightboxImage = () => {
    if (selectedCarImages.length <= 1) return;
    const currentIndex = lightboxIndex >= 0 ? lightboxIndex : 0;
    const nextIndex = (currentIndex + 1) % selectedCarImages.length;
    setLightboxImage(selectedCarImages[nextIndex]);
    setSelectedCarImage(selectedCarImages[nextIndex]);
  };

  useEffect(() => {
    if (!lightboxImage) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setLightboxImage("");
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        showPreviousLightboxImage();
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        showNextLightboxImage();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxImage, lightboxIndex, selectedCarImages]);

  return (
    <div className="marketplace-page theme-app-bg min-h-screen px-6 py-8 md:px-8">
      <section className="marketplace-panel card relative mb-4 overflow-hidden animate-fade-in">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(34,211,238,0.12),_transparent_28%)]" />
        <div className="relative p-4 md:p-5">
          <form onSubmit={handleSearchSubmit}>
            <div className="marketplace-search-shell flex flex-col gap-3 rounded-[28px] border border-slate-700/70 bg-slate-950/60 p-3 shadow-[0_24px_60px_rgba(2,6,23,0.28)] backdrop-blur-xl md:flex-row md:items-center">
              <div className="marketplace-search-input-group flex min-w-0 flex-1 items-center gap-3 rounded-[22px] border border-slate-800/80 bg-slate-900/80 px-4 py-3.5 transition duration-300">
                <div className="marketplace-search-icon flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] text-cyan-100">
                  <Search className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <label htmlFor="marketplace-vehicle-search" className="block text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                    {t("marketplace.search.input_label", { defaultValue: "Vehicle name" })}
                  </label>
                  <input
                    id="marketplace-vehicle-search"
                    type="text"
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder={t("marketplace.search.placeholder", {
                      defaultValue: "Try Toyota Corolla, Honda Vezel, Prius...",
                    })}
                    className="mt-1 w-full bg-transparent text-base text-white outline-none placeholder:text-slate-500 md:text-lg"
                  />
                </div>
                {searchInput && (
                  <button
                    type="button"
                    onClick={handleSearchReset}
                    className="marketplace-search-clear inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] border border-slate-700/70 bg-slate-900/80 text-slate-300 transition"
                    aria-label={t("marketplace.search.clear", { defaultValue: "Clear search" })}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <button
                type="submit"
                className="marketplace-search-submit marketplace-primary-button inline-flex items-center justify-center gap-2 rounded-[22px] border px-6 py-4 text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5 md:min-w-[182px]"
              >
                <Search className="h-4 w-4" />
                {t("marketplace.search.submit", { defaultValue: "Search ads" })}
              </button>
            </div>
          </form>
        </div>
      </section>

      {!appliedSearch && (
      <section className="marketplace-panel card mt-4 animate-fade-in animate-delay-200 overflow-hidden">
        <div className="relative p-3.5 md:p-4">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.14),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(16,185,129,0.12),_transparent_28%)]" />
          <div className="relative flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-lg">
              <h2 className="text-base font-semibold text-white md:text-lg">{t("marketplace.publish.title")}</h2>
              <p className="mt-0.5 text-xs leading-4.5 text-slate-400">
                {t("marketplace.publish.description")}
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                to="/marketplace/my-ads"
                className="inline-flex items-center justify-center rounded-xl border border-slate-700/70 bg-slate-900/80 px-3.5 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500/80 hover:text-white"
              >
                {t("marketplace.my_ads.title")}
              </Link>

              <button
                type="button"
                onClick={() => {
                  setSubmitState((current) => ({ ...current, error: "", success: "" }));
                  setIsPublishModalOpen(true);
                }}
                className="marketplace-primary-button marketplace-primary-cta group inline-flex items-center justify-center gap-2.5 rounded-xl border px-4 py-2 text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5"
                style={{
                  background: "linear-gradient(135deg, #1d4ed8 0%, #0284c7 55%, #0f766e 100%)",
                  color: "#ffffff",
                  borderColor: "rgba(29, 78, 216, 0.42)",
                  boxShadow:
                    "0 18px 34px rgba(29, 78, 216, 0.24), inset 0 1px 0 rgba(255, 255, 255, 0.16)",
                }}
              >
                <span className="marketplace-primary-cta__glow" aria-hidden="true" />
                <span className="marketplace-primary-cta__icon" aria-hidden="true">
                  <Sparkles className="h-4 w-4" />
                </span>
                <span className="relative z-10 flex flex-col items-start leading-tight">
                  <span>{t("marketplace.publish.button")}</span>
                  <span className="marketplace-primary-cta__hint text-[10px] font-medium uppercase tracking-[0.18em]">
                    Sell your vehicle
                  </span>
                </span>
                <span className="marketplace-primary-cta__arrow relative z-10" aria-hidden="true">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14m-6-6 6 6-6 6" />
                  </svg>
                </span>
              </button>
            </div>
          </div>

          {submitState.success && (
            <div className="relative mt-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              {submitState.success}
            </div>
          )}
        </div>
      </section>
      )}

      <section className="marketplace-panel card mt-4 p-4 md:p-5 animate-fade-in animate-delay-100">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">{t("marketplace.inventory.title")}</h2>
            <p className="mt-1 text-sm text-slate-400">
              {t("marketplace.inventory.description")}
            </p>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-slate-700/60 bg-slate-900/70 px-4 py-2 text-sm text-slate-300 md:flex">
            <Sparkles className="h-4 w-4 text-cyan-300" />
            {t("marketplace.inventory.synced")}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <FilterSelect
            label={t("marketplace.labels.brand")}
            value={filters.brand}
            options={brandOptions}
            onChange={(value) => handleFilterChange("brand", value)}
          />
          <FilterSelect
            label={t("marketplace.labels.model")}
            value={filters.model}
            options={modelOptions}
            onChange={(value) => handleFilterChange("model", value)}
          />
          <FilterSelect
            label={t("marketplace.labels.price_range")}
            value={filters.priceRange}
            options={priceRanges}
            onChange={(value) => handleFilterChange("priceRange", value)}
          />
          <FilterSelect
            label={t("marketplace.labels.fuel_type")}
            value={filters.fuelType}
            options={fuelOptions}
            onChange={(value) => handleFilterChange("fuelType", value)}
          />
        </div>

        {loadError && (
          <div className="mt-5 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {loadError}
          </div>
        )}
      </section>

      <section className="mt-5 animate-fade-in animate-delay-200">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-white">{t("marketplace.listings.title")}</h2>
            <p className="mt-1 text-sm text-slate-400">
              {t("marketplace.listings.description")}
            </p>
          </div>
          <div className="rounded-full border border-slate-700/60 bg-slate-900/70 px-4 py-2 text-sm text-slate-300">
            {t("marketplace.listings.showing", { filtered: filteredCars.length, total: approvedCars.length })}
          </div>
        </div>

        {filteredCars.length === 0 ? (
          <div className="card flex min-h-[260px] flex-col items-center justify-center p-8 text-center">
            <div className="rounded-full border border-slate-700/70 bg-slate-900/80 p-4">
              <Sparkles className="h-7 w-7 text-cyan-300" />
            </div>
            <h3 className="mt-5 text-xl font-semibold text-white">{t("marketplace.empty.title")}</h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
              {t("marketplace.empty.description")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredCars.map((car) => (
              <article
                key={car.id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  setSelectedCar(car);
                  setSelectedCarImage(getListingImages(car)[0] || "");
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelectedCar(car);
                    setSelectedCarImage(getListingImages(car)[0] || "");
                  }
                }}
                className="marketplace-listing-card group overflow-hidden rounded-[24px] border border-slate-700/60 bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(15,23,42,0.88))] shadow-xl shadow-slate-950/20 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/30 hover:shadow-[0_18px_45px_rgba(8,145,178,0.18)]"
              >
                <div className="marketplace-listing-media relative h-44 overflow-hidden border-b border-slate-800/80 bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.18),_transparent_28%),linear-gradient(135deg,rgba(30,41,59,0.95),rgba(15,23,42,0.98))]">
                  {getListingImages(car)[0] ? (
                    <img
                      src={getListingImages(car)[0]}
                      alt={`${car.brand} ${car.model}`}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-500">
                      <ShieldCheck className="h-10 w-10 text-cyan-300/70" />
                      <span className="text-sm text-slate-400">{t("marketplace.card.approved_listing")}</span>
                    </div>
                  )}

                  <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {t("marketplace.card.approved")}
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {car.brand} {car.model}
                      </h3>
                      <p className="mt-1 text-xs text-slate-400">
                        {(car.condition && translatedConditionLabels[car.condition]) ||
                          car.condition ||
                          t("marketplace.fallbacks.used_vehicle")}
                      </p>
                      <p className="mt-2 text-xs text-slate-500">
                        {car.seller_name || t("marketplace.fallbacks.private_seller")} {" • "} {car.vehicle_location || t("marketplace.fallbacks.location_not_listed")}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-3">
                      <p className="marketplace-price text-right text-base font-bold text-cyan-300">
                        {formatCurrency(car.price, locale)}
                      </p>
                      {getBoostSticker(car) && (
                        <img
                          src={getBoostSticker(car).src}
                          alt={getBoostSticker(car).alt}
                          className="marketplace-boost-sticker h-16 w-auto object-contain"
                        />
                      )}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2.5">
                    <MarketplaceMeta
                      icon={<CalendarRange className="h-4 w-4" />}
                      label={t("marketplace.labels.year")}
                      value={car.year || "-"}
                    />
                    <MarketplaceMeta
                      icon={<Gauge className="h-4 w-4" />}
                      label={t("marketplace.labels.mileage")}
                      value={t("marketplace.values.km", { value: formatNumber(car.mileage, locale) })}
                    />
                    <MarketplaceMeta
                      icon={<Fuel className="h-4 w-4" />}
                      label={t("marketplace.labels.fuel")}
                      value={translatedFuelLabels[car.fuel_type] || car.fuel_type || "-"}
                    />
                    <MarketplaceMeta
                      icon={
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8.25 18.75h7.5m-7.5-13.5h7.5M9 7.5h6a2.25 2.25 0 012.25 2.25v4.5A2.25 2.25 0 0115 16.5H9a2.25 2.25 0 01-2.25-2.25v-4.5A2.25 2.25 0 019 7.5z" />
                        </svg>
                      }
                      label={t("marketplace.labels.gearbox")}
                      value={translatedTransmissionLabels[car.transmission] || car.transmission || "-"}
                    />
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-800/80 pt-3">
                    <p className="text-xs text-slate-400">{t("marketplace.card.tap_to_expand")}</p>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedCar(car);
                        setSelectedCarImage(getListingImages(car)[0] || "");
                      }}
                      className="marketplace-secondary-button rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-100 transition hover:bg-cyan-500/15"
                    >
                      {t("marketplace.card.view_details")}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {selectedCar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm"
            onClick={() => setSelectedCar(null)}
          />

          <section className="marketplace-detail-modal relative z-10 max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-[30px] border border-slate-700/60 bg-[linear-gradient(135deg,rgba(15,23,42,0.98),rgba(15,23,42,0.94),rgba(30,41,59,0.96))] shadow-2xl shadow-slate-950/50">
            <div className="grid lg:grid-cols-[1.2fr_0.9fr]">
              <div className="relative min-h-[320px] border-b border-slate-800 lg:min-h-[620px] lg:border-b-0 lg:border-r">
                {selectedCarImage ? (
                  <button
                    type="button"
                    onClick={() => setLightboxImage(selectedCarImage)}
                    className="block h-full w-full"
                  >
                    <img
                      src={selectedCarImage}
                      alt={`${selectedCar.brand} ${selectedCar.model}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ) : (
                  <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-4 bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.16),_transparent_28%),linear-gradient(135deg,rgba(30,41,59,0.95),rgba(15,23,42,0.98))] text-slate-500">
                    <ShieldCheck className="h-14 w-14 text-cyan-300/70" />
                    <p className="text-sm text-slate-300">{t("marketplace.detail.approved_listing")}</p>
                  </div>
                )}

                <div className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
                  <ShieldCheck className="h-4 w-4" />
                  {t("marketplace.detail.approved_by_admin")}
                </div>
              </div>

              <div className="p-6 md:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.24em] text-slate-500">{t("marketplace.detail.listing")}</p>
                    <h2 className="mt-2 text-3xl font-semibold text-white">
                      {selectedCar.brand} {selectedCar.model}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      {t("marketplace.detail.description")}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedCar(null)}
                    className="rounded-full border border-slate-700/70 bg-slate-900/80 px-3 py-2 text-sm text-slate-300 transition hover:border-slate-500/80 hover:text-white"
                  >
                    {t("marketplace.common.close")}
                  </button>
                </div>

                <div className="mt-6 rounded-[24px] border border-cyan-500/15 bg-cyan-500/10 p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/80">{t("marketplace.labels.price")}</p>
                  <p className="marketplace-price mt-2 text-3xl font-bold text-cyan-100">
                    {formatCurrency(selectedCar.price, locale)}
                  </p>
                </div>

                {getListingImages(selectedCar).length > 1 && (
                  <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
                    {getListingImages(selectedCar).map((imageUrl, index) => (
                      <button
                        key={`${selectedCar.id}-image-${index}`}
                        type="button"
                        onClick={() => {
                          setSelectedCarImage(imageUrl);
                          setLightboxImage(imageUrl);
                        }}
                        className={`h-20 w-24 shrink-0 overflow-hidden rounded-2xl border transition ${
                          selectedCarImage === imageUrl
                            ? "border-cyan-400/60 shadow-[0_0_0_1px_rgba(34,211,238,0.3)]"
                            : "border-slate-700/70 hover:border-slate-500/80"
                        }`}
                      >
                        <img src={imageUrl} alt={`${selectedCar.brand} ${selectedCar.model} view ${index + 1}`} className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}

                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <MarketplaceMeta
                    icon={
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15.75 6.75a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.118a7.5 7.5 0 1115 0A17.933 17.933 0 0112 21.75a17.933 17.933 0 01-7.5-1.632z" />
                      </svg>
                    }
                    label={t("marketplace.labels.seller")}
                    value={selectedCar.seller_name || "-"}
                  />
                  <MarketplaceMeta
                    icon={
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.25 6.75c0 7.318 5.932 13.25 13.25 13.25h.75a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.965-.852-1.089l-4.423-1.106a1.125 1.125 0 00-1.173.417l-.97 1.293a1.125 1.125 0 01-1.21.38 10.502 10.502 0 01-6.273-6.273 1.125 1.125 0 01.38-1.21l1.293-.97c.328-.246.5-.652.417-1.173L4.96 3.602A1.125 1.125 0 003.872 2.75H2.5A2.25 2.25 0 00.25 5v1.75z" />
                      </svg>
                    }
                    label={t("marketplace.labels.phone")}
                    value={selectedCar.phone_number || "-"}
                  />
                  <MarketplaceMeta
                    icon={
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 21a8.967 8.967 0 005.002-1.516A8.967 8.967 0 0021 12c0-4.971-4.029-9-9-9s-9 4.029-9 9a8.967 8.967 0 003.998 7.484A8.967 8.967 0 0012 21zm0-13.5a2.25 2.25 0 110 4.5 2.25 2.25 0 010-4.5z" />
                      </svg>
                    }
                    label={t("marketplace.labels.location")}
                    value={selectedCar.vehicle_location || "-"}
                  />
                  <MarketplaceMeta
                    icon={<CalendarRange className="h-4 w-4" />}
                    label={t("marketplace.labels.year")}
                    value={selectedCar.year || "-"}
                  />
                  <MarketplaceMeta
                    icon={<Gauge className="h-4 w-4" />}
                    label={t("marketplace.labels.mileage")}
                    value={t("marketplace.values.km", { value: formatNumber(selectedCar.mileage, locale) })}
                  />
                  <MarketplaceMeta
                    icon={<Fuel className="h-4 w-4" />}
                    label={t("marketplace.labels.fuel")}
                    value={translatedFuelLabels[selectedCar.fuel_type] || selectedCar.fuel_type || "-"}
                  />
                  <MarketplaceMeta
                    icon={
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8.25 18.75h7.5m-7.5-13.5h7.5M9 7.5h6a2.25 2.25 0 012.25 2.25v4.5A2.25 2.25 0 0115 16.5H9a2.25 2.25 0 01-2.25-2.25v-4.5A2.25 2.25 0 019 7.5z" />
                      </svg>
                    }
                    label={t("marketplace.labels.gearbox")}
                    value={translatedTransmissionLabels[selectedCar.transmission] || selectedCar.transmission || "-"}
                  />
                  <MarketplaceMeta
                    icon={<ShieldCheck className="h-4 w-4" />}
                    label={t("marketplace.labels.condition")}
                    value={translatedConditionLabels[selectedCar.condition] || selectedCar.condition || "-"}
                  />
                  <MarketplaceMeta
                    icon={<Sparkles className="h-4 w-4" />}
                    label={t("marketplace.labels.status")}
                    value={t("marketplace.detail.approved_visible")}
                  />
                </div>

                <div className="mt-6 rounded-[24px] border border-slate-800/80 bg-slate-900/70 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    {t("marketplace.detail.section_description")}
                  </p>
                  <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-300">
                    {selectedCar.vehicle_description || t("marketplace.fallbacks.no_description")}
                  </p>
                </div>

                <div className="mt-6 rounded-[24px] border border-slate-800/80 bg-slate-900/70 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    {t("marketplace.detail.section_summary")}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-slate-300">
                    {t("marketplace.detail.summary_text", {
                      brand: selectedCar.brand,
                      model: selectedCar.model,
                      condition:
                        translatedConditionLabels[selectedCar.condition] ||
                        selectedCar.condition ||
                        t("marketplace.fallbacks.vehicle"),
                      year: selectedCar.year || t("marketplace.fallbacks.unspecified_year"),
                      mileage: formatNumber(selectedCar.mileage, locale),
                      fuel:
                        translatedFuelLabels[selectedCar.fuel_type] ||
                        selectedCar.fuel_type ||
                        t("marketplace.fallbacks.unspecified_fuel"),
                      transmission:
                        translatedTransmissionLabels[selectedCar.transmission] ||
                        selectedCar.transmission ||
                        t("marketplace.fallbacks.standard_transmission"),
                    })}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {lightboxImage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/95 p-4">
          <button
            type="button"
            onClick={() => setLightboxImage("")}
            className="absolute inset-0 cursor-default"
            aria-label={t("marketplace.lightbox.close_full_view")}
          />

          <div className="relative z-10 flex h-full w-full max-w-7xl items-center justify-center">
            {selectedCarImages.length > 1 && (
              <button
                type="button"
                onClick={showPreviousLightboxImage}
                className="absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded-full border border-slate-700/70 bg-slate-900/90 p-3 text-slate-200 transition hover:border-slate-500/80 hover:text-white md:left-6"
                aria-label={t("marketplace.lightbox.previous_image")}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>
            )}

            <img
              src={lightboxImage}
              alt={t("marketplace.lightbox.full_vehicle_view")}
              className="max-h-full max-w-full object-contain"
            />

            {selectedCarImages.length > 1 && (
              <button
                type="button"
                onClick={showNextLightboxImage}
                className="absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-full border border-slate-700/70 bg-slate-900/90 p-3 text-slate-200 transition hover:border-slate-500/80 hover:text-white md:right-6"
                aria-label={t("marketplace.lightbox.next_image")}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            )}

            {selectedCarImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full border border-slate-700/70 bg-slate-900/85 px-4 py-2 text-xs text-slate-200">
                <span>
                  {lightboxIndex + 1} / {selectedCarImages.length}
                </span>
                <span className="text-slate-500">{t("marketplace.lightbox.keyboard_hint")}</span>
              </div>
            )}

            <button
              type="button"
              onClick={() => setLightboxImage("")}
              className="absolute right-0 top-0 rounded-full border border-slate-700/70 bg-slate-900/90 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500/80 hover:text-white"
            >
              {t("marketplace.common.close")}
            </button>
          </div>
        </div>
      )}

      {isPublishModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => !submitState.saving && setIsPublishModalOpen(false)}
          />
          <section
            className="marketplace-publish-modal relative z-10 max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[28px] border border-slate-700/60 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-6 shadow-2xl shadow-slate-950/50 md:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-white">{t("marketplace.publish.modal_title")}</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                  {t("marketplace.publish.modal_description")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPublishModalOpen(false)}
                disabled={submitState.saving}
                className="rounded-full border border-slate-700/70 bg-slate-900/80 px-3 py-2 text-sm text-slate-300 transition hover:border-slate-500/80 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {t("marketplace.common.close")}
              </button>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <InputField
                  label={t("marketplace.labels.brand")}
                  value={form.brand}
                  onChange={(value) => handleInputChange("brand", value)}
                  placeholder="Toyota"
                />
                <InputField
                  label={t("marketplace.labels.model")}
                  value={form.model}
                  onChange={(value) => handleInputChange("model", value)}
                  placeholder="Corolla"
                />
                <InputField
                  label={t("marketplace.labels.your_name")}
                  value={form.seller_name}
                  onChange={(value) => handleInputChange("seller_name", value)}
                  placeholder="Kasun Perera"
                />
                <InputField
                  label={t("marketplace.labels.phone_number")}
                  value={form.phone_number}
                  onChange={(value) => handleInputChange("phone_number", value)}
                  placeholder="0771234567"
                />
                <InputField
                  label={t("marketplace.labels.year")}
                  type="number"
                  value={form.year}
                  onChange={(value) => handleInputChange("year", value)}
                  placeholder="2020"
                />
                <InputField
                  label={t("marketplace.labels.mileage_km")}
                  type="number"
                  value={form.mileage}
                  onChange={(value) => handleInputChange("mileage", value)}
                  placeholder="45000"
                />
                <SelectField
                  label={t("marketplace.labels.fuel_type")}
                  value={form.fuel_type}
                  options={[
                    { value: "Petrol", label: t("marketplace.fuel_values.petrol") },
                    { value: "Diesel", label: t("marketplace.fuel_values.diesel") },
                    { value: "Hybrid", label: t("marketplace.fuel_values.hybrid") },
                    { value: "Electric", label: t("marketplace.fuel_values.electric") },
                  ]}
                  onChange={(value) => handleInputChange("fuel_type", value)}
                />
                <SelectField
                  label={t("marketplace.labels.transmission")}
                  value={form.transmission}
                  options={[
                    { value: "Automatic", label: t("marketplace.transmission_values.automatic") },
                    { value: "Manual", label: t("marketplace.transmission_values.manual") },
                    { value: "CVT", label: t("marketplace.transmission_values.cvt") },
                  ]}
                  onChange={(value) => handleInputChange("transmission", value)}
                />
                <SelectField
                  label={t("marketplace.labels.condition")}
                  value={form.condition}
                  options={[
                    { value: "Used", label: t("marketplace.condition_values.used") },
                    { value: "Reconditioned", label: t("marketplace.condition_values.reconditioned") },
                    { value: "Brand New", label: t("marketplace.condition_values.brand_new") },
                  ]}
                  onChange={(value) => handleInputChange("condition", value)}
                />
                <InputField
                  label={t("marketplace.labels.price_lkr")}
                  type="number"
                  value={form.price}
                  onChange={(value) => handleInputChange("price", value)}
                  placeholder="7200000"
                />
              </div>

              <div className="grid gap-4">
                <InputField
                  label={t("marketplace.labels.vehicle_location")}
                  value={form.vehicle_location}
                  onChange={(value) => handleInputChange("vehicle_location", value)}
                  placeholder="Maharagama, Colombo"
                />
                <TextareaField
                  label={t("marketplace.labels.vehicle_description")}
                  value={form.vehicle_description}
                  onChange={(value) => handleInputChange("vehicle_description", value)}
                  placeholder={t("marketplace.placeholders.vehicle_description")}
                />
              </div>

              <div>
                <span className="mb-2 block text-sm font-medium text-slate-300">{t("marketplace.labels.vehicle_images")}</span>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                  {Array.from({ length: 5 }, (_, index) => (
                    <ImageUploadSlot
                      key={index}
                      slotIndex={index}
                      file={selectedImages[index] || null}
                      onChange={handleImageChange}
                      onRemove={handleRemoveImage}
                      t={t}
                    />
                  ))}
                </div>
                <p className="mt-3 text-xs text-slate-500">
                  {t("marketplace.publish.image_help")}
                </p>
              </div>

              <div className="rounded-[26px] border border-slate-700/60 bg-slate-950/50 p-4 md:p-5">
                <div className="flex flex-col gap-2">
                  <h3 className="text-lg font-semibold text-white">
                    {t("marketplace.boost.title", { defaultValue: "Boost Your Ad" })}
                  </h3>
                  <p className="text-sm text-slate-400">
                    {t("marketplace.boost.description", {
                      defaultValue: "Choose premium placement options to help your vehicle get more attention.",
                    })}
                  </p>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
                  {boostOptions.map((option) => {
                    const Icon = option.icon;

                    return (
                      <button
                        key={option.key}
                        type="button"
                        onClick={option.toggle}
                        className={`marketplace-boost-card ${option.accentClassName} ${
                          option.selected ? "marketplace-boost-card-active" : ""
                        }`}
                        aria-pressed={option.selected}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="marketplace-boost-card__icon">
                            <Icon className="h-5 w-5" />
                          </div>
                          <span className="rounded-full border border-slate-700/70 bg-slate-900/80 px-3 py-1 text-xs font-semibold text-slate-200">
                            {formatCurrency(option.price, locale)}
                          </span>
                        </div>
                        <div className="mt-4 text-left">
                          <h4 className="text-base font-semibold text-white">{option.title}</h4>
                          <p className="mt-1 text-sm leading-6 text-slate-400">{option.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 flex items-center justify-between rounded-2xl border border-slate-700/70 bg-slate-900/70 px-4 py-3">
                  <span className="text-sm font-medium text-slate-300">
                    {t("marketplace.boost.total", { defaultValue: "Total to Pay" })}
                  </span>
                  <span className="text-lg font-semibold text-white">{formatCurrency(totalBoostPrice, locale)}</span>
                </div>
              </div>

              {submitState.error && (
                <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  {submitState.error}
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setIsPublishModalOpen(false)}
                  disabled={submitState.saving}
                  className="rounded-xl border border-slate-700/70 bg-slate-900/80 px-4 py-3 text-sm font-medium text-slate-300 transition hover:border-slate-500/80 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {t("marketplace.common.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={submitState.saving}
                  className="marketplace-primary-button rounded-xl border px-4 py-3 text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                  style={{
                    background: "linear-gradient(135deg, #1d4ed8 0%, #0284c7 55%, #0f766e 100%)",
                    color: "#ffffff",
                    borderColor: "rgba(29, 78, 216, 0.42)",
                    boxShadow:
                      "0 18px 34px rgba(29, 78, 216, 0.24), inset 0 1px 0 rgba(255, 255, 255, 0.16)",
                  }}
                >
                  {submitState.saving
                    ? t("marketplace.publish.submitting")
                    : hasPremiumSelection
                      ? t("marketplace.publish.pay_and_submit", { defaultValue: "Pay & Publish" })
                      : t("marketplace.publish.submit")}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

    </div>
  );
}

function FilterSelect({ label, value, options, onChange }) {
  return (
    <label className="marketplace-field block">
      <span className="mb-2 block text-sm font-medium text-slate-300">{label}</span>
      <div className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full appearance-none rounded-2xl border border-slate-700/70 bg-slate-900/90 px-4 py-3 pr-11 text-sm text-white outline-none transition duration-200 hover:border-slate-500/80 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-500/20"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
      </div>
    </label>
  );
}

function SelectField({ label, value, options, onChange }) {
  return <FilterSelect label={label} value={value} options={options} onChange={onChange} />;
}

function InputField({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <label className="marketplace-field block">
      <span className="mb-2 block text-sm font-medium text-slate-300">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required
        className="w-full rounded-2xl border border-slate-700/70 bg-slate-900/90 px-4 py-3 text-sm text-white outline-none transition duration-200 hover:border-slate-500/80 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-500/20"
      />
    </label>
  );
}

function TextareaField({ label, value, onChange, placeholder }) {
  return (
    <label className="marketplace-field block">
      <span className="mb-2 block text-sm font-medium text-slate-300">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={5}
        required
        className="w-full resize-none rounded-2xl border border-slate-700/70 bg-slate-900/90 px-4 py-3 text-sm text-white outline-none transition duration-200 hover:border-slate-500/80 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-500/20"
      />
    </label>
  );
}

function ImageUploadSlot({ slotIndex, file, onChange, onRemove, t }) {
  const [previewUrl, setPreviewUrl] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl("");
      return undefined;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const handleRemoveClick = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (inputRef.current) {
      inputRef.current.value = "";
    }

    onRemove(slotIndex);
  };

  const handleOpenFilePicker = (event) => {
    event.preventDefault();
    event.stopPropagation();
    inputRef.current?.click();
  };

  return (
    <div className="marketplace-upload-slot group relative overflow-hidden rounded-[24px] border border-dashed border-slate-600 bg-slate-900/70">
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={(event) => onChange(slotIndex, event)}
        className="hidden"
      />

      <button
        type="button"
        onClick={handleOpenFilePicker}
        className="block w-full cursor-pointer text-left"
      >
        <div className="relative flex h-44 items-center justify-center overflow-hidden">
          {file && previewUrl ? (
            <>
              <img
                src={previewUrl}
                alt={t("marketplace.upload.preview_alt", { index: slotIndex + 1 })}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 via-slate-950/35 to-transparent px-4 pb-3 pt-8">
                <p className="truncate text-xs font-medium text-white">{file.name}</p>
              </div>
            </>
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-3 px-4 text-center text-slate-500 transition group-hover:bg-white/[0.02]">
              <div className="rounded-full border border-cyan-400/20 bg-cyan-500/10 p-3 text-cyan-200">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 16.5V7.5m0 0l-3.75 3.75M12 7.5l3.75 3.75M3.75 15v2.25A2.25 2.25 0 006 19.5h12a2.25 2.25 0 002.25-2.25V15" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-200">{t("marketplace.upload.image_label", { index: slotIndex + 1 })}</p>
                <p className="mt-1 text-xs text-slate-500">{t("marketplace.upload.click_to_add")}</p>
              </div>
            </div>
          )}
        </div>
      </button>

      <div className="flex items-center justify-between border-t border-slate-800/80 px-4 py-3">
        <span className="text-xs uppercase tracking-[0.18em] text-slate-500">
          {t("marketplace.upload.slot_label", { index: slotIndex + 1 })}
        </span>
        {file ? (
          <button
            type="button"
            onMouseDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
            onClick={handleRemoveClick}
            className="rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/15"
          >
            {t("marketplace.common.remove")}
          </button>
        ) : (
          <span className="text-xs text-slate-600">{t("marketplace.common.optional")}</span>
        )}
      </div>
    </div>
  );
}

function MarketplaceMeta({ icon, label, value }) {
  return (
    <div className="marketplace-meta rounded-2xl border border-slate-800/80 bg-slate-900/70 p-3">
      <div className="flex items-center gap-2 text-slate-500">
        {icon}
        <span className="text-xs font-medium uppercase tracking-[0.18em]">{label}</span>
      </div>
      <p className="mt-2 text-sm font-medium text-white">{value}</p>
    </div>
  );
}

export default Marketplace;
