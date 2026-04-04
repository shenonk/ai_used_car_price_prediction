import { useEffect, useMemo, useState } from "react";
import { CalendarRange, ChevronDown, Fuel, Gauge, ShieldCheck, Sparkles } from "lucide-react";

import { supabase } from "../utils/supabaseClient";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const priceRanges = [
  "All Prices",
  "Under 3M",
  "3M - 6M",
  "6M - 10M",
  "Above 10M",
];

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

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

function Marketplace() {
  const [cars, setCars] = useState([]);
  const [filters, setFilters] = useState({
    brand: "All Brands",
    model: "All Models",
    priceRange: "All Prices",
    fuelType: "All Fuel Types",
  });
  const [loadError, setLoadError] = useState("");
  const [form, setForm] = useState(initialForm);
  const [selectedImages, setSelectedImages] = useState([]);
  const [submitState, setSubmitState] = useState({ saving: false, error: "", success: "" });
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState(null);
  const [selectedCarImage, setSelectedCarImage] = useState("");
  const [lightboxImage, setLightboxImage] = useState("");

  const fetchListings = async () => {
    try {
      setLoadError("");

      const response = await fetch(`${API_BASE_URL}/api/marketplace/listings`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to load marketplace listings.");
      }

      setCars(result.listings || []);
    } catch (error) {
      setLoadError(error.message || "Failed to load marketplace listings.");
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const approvedCars = useMemo(() => cars.filter((car) => car.status === "approved"), [cars]);

  const brandOptions = useMemo(
    () => ["All Brands", ...new Set(approvedCars.map((car) => car.brand).filter(Boolean))],
    [approvedCars]
  );

  const modelOptions = useMemo(
    () => [
      "All Models",
      ...new Set(
        approvedCars
          .filter((car) => filters.brand === "All Brands" || car.brand === filters.brand)
          .map((car) => car.model)
          .filter(Boolean)
      ),
    ],
    [approvedCars, filters.brand]
  );

  const fuelOptions = useMemo(
    () => ["All Fuel Types", ...new Set(approvedCars.map((car) => car.fuel_type).filter(Boolean))],
    [approvedCars]
  );

  const filteredCars = useMemo(() => {
    return approvedCars.filter((car) => {
      const matchesBrand =
        filters.brand === "All Brands" || car.brand === filters.brand;
      const matchesModel =
        filters.model === "All Models" || car.model === filters.model;
      const matchesFuel =
        filters.fuelType === "All Fuel Types" || car.fuel_type === filters.fuelType;

      const price = Number(car.price || 0);
      const matchesPriceRange =
        filters.priceRange === "All Prices" ||
        (filters.priceRange === "Under 3M" && price < 3000000) ||
        (filters.priceRange === "3M - 6M" && price >= 3000000 && price <= 6000000) ||
        (filters.priceRange === "6M - 10M" && price > 6000000 && price <= 10000000) ||
        (filters.priceRange === "Above 10M" && price > 10000000);

      return matchesBrand && matchesModel && matchesFuel && matchesPriceRange;
    });
  }, [approvedCars, filters]);

  const handleFilterChange = (key, value) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
      ...(key === "brand" ? { model: "All Models" } : {}),
    }));
  };

  const handleInputChange = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
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
        throw new Error(result.error || "Failed to submit listing.");
      }

      setSubmitState({
        saving: false,
        error: "",
        success: "Your car was submitted successfully and is now pending admin review.",
      });
      setForm(initialForm);
      setSelectedImages([]);
      setIsPublishModalOpen(false);
      event.target.reset();
      fetchListings();
    } catch (error) {
      setSubmitState({
        saving: false,
        error: error.message || "Failed to submit listing.",
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
    <div className="min-h-screen bg-[#0f172a] px-6 py-8 md:px-8">
      <section className="relative overflow-hidden rounded-[28px] border border-slate-700/60 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800/95 p-8 shadow-2xl shadow-slate-950/30 animate-fade-in">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.12),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(16,185,129,0.1),_transparent_28%)]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-sm font-medium text-emerald-300">
              <ShieldCheck className="h-4 w-4" />
              Live Supabase marketplace
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
              Browse Verified Vehicles
            </h1>
            <p className="mt-3 max-w-xl text-base leading-7 text-slate-300 md:text-lg">
              Approved listings are loaded from your Supabase `listings` table, and new cars can
              be submitted directly from this page.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-700/60 bg-slate-900/70 px-4 py-3 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Approved Listings</p>
              <p className="mt-2 text-2xl font-semibold text-white">{approvedCars.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-700/60 bg-slate-900/70 px-4 py-3 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Storage Bucket</p>
              <p className="mt-2 text-2xl font-semibold text-white">car_images</p>
            </div>
            <div className="rounded-2xl border border-slate-700/60 bg-slate-900/70 px-4 py-3 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Review Status</p>
              <p className="mt-2 text-2xl font-semibold text-white">Pending by default</p>
            </div>
          </div>
        </div>
      </section>

      <section className="card mt-8 animate-fade-in animate-delay-200 overflow-hidden">
        <div className="relative p-6 md:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.14),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(16,185,129,0.12),_transparent_28%)]" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-xl font-semibold text-white">List your car</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Open a quick publish flow to upload your car details and send the ad for review.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setSubmitState((current) => ({ ...current, error: "", success: "" }));
                setIsPublishModalOpen(true);
              }}
              className="inline-flex items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-6 py-3 text-sm font-semibold text-cyan-100 transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-300/40 hover:bg-cyan-400/15 hover:shadow-[0_0_30px_rgba(34,211,238,0.18)]"
            >
              Publish Ad
            </button>
          </div>

          {submitState.success && (
            <div className="relative mt-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              {submitState.success}
            </div>
          )}
        </div>
      </section>

      <section className="card mt-8 p-4 md:p-5 animate-fade-in animate-delay-100">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Marketplace inventory</h2>
            <p className="mt-1 text-sm text-slate-400">
              Public buyers only see listings whose status is `approved`.
            </p>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-slate-700/60 bg-slate-900/70 px-4 py-2 text-sm text-slate-300 md:flex">
            <Sparkles className="h-4 w-4 text-cyan-300" />
            Synced with Flask API
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <FilterSelect
            label="Brand"
            value={filters.brand}
            options={brandOptions}
            onChange={(value) => handleFilterChange("brand", value)}
          />
          <FilterSelect
            label="Model"
            value={filters.model}
            options={modelOptions}
            onChange={(value) => handleFilterChange("model", value)}
          />
          <FilterSelect
            label="Price Range (LKR)"
            value={filters.priceRange}
            options={priceRanges}
            onChange={(value) => handleFilterChange("priceRange", value)}
          />
          <FilterSelect
            label="Fuel Type"
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

      <section className="mt-8 animate-fade-in animate-delay-200">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-white">Approved cars for buyers</h2>
            <p className="mt-1 text-sm text-slate-400">
              Listings only appear here after admin approval.
            </p>
          </div>
          <div className="rounded-full border border-slate-700/60 bg-slate-900/70 px-4 py-2 text-sm text-slate-300">
            Showing {filteredCars.length} of {approvedCars.length} approved listings
          </div>
        </div>

        {filteredCars.length === 0 ? (
          <div className="card flex min-h-[260px] flex-col items-center justify-center p-8 text-center">
            <div className="rounded-full border border-slate-700/70 bg-slate-900/80 p-4">
              <Sparkles className="h-7 w-7 text-cyan-300" />
            </div>
            <h3 className="mt-5 text-xl font-semibold text-white">No approved cars match these filters</h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
              Try adjusting the filters, or wait for an admin to approve new seller submissions.
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
                className="group overflow-hidden rounded-[24px] border border-slate-700/60 bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(15,23,42,0.88))] shadow-xl shadow-slate-950/20 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/30 hover:shadow-[0_18px_45px_rgba(8,145,178,0.18)]"
              >
                <div className="relative h-44 overflow-hidden border-b border-slate-800/80 bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.18),_transparent_28%),linear-gradient(135deg,rgba(30,41,59,0.95),rgba(15,23,42,0.98))]">
                  {getListingImages(car)[0] ? (
                    <img
                      src={getListingImages(car)[0]}
                      alt={`${car.brand} ${car.model}`}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-500">
                      <ShieldCheck className="h-10 w-10 text-cyan-300/70" />
                      <span className="text-sm text-slate-400">Approved listing</span>
                    </div>
                  )}

                  <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Approved
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {car.brand} {car.model}
                      </h3>
                      <p className="mt-1 text-xs text-slate-400">{car.condition || "Used vehicle"}</p>
                      <p className="mt-2 text-xs text-slate-500">
                        {car.seller_name || "Private seller"} • {car.vehicle_location || "Location not listed"}
                      </p>
                    </div>
                    <p className="text-right text-base font-bold text-cyan-300">
                      {formatCurrency(car.price)}
                    </p>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2.5">
                    <MarketplaceMeta
                      icon={<CalendarRange className="h-4 w-4" />}
                      label="Year"
                      value={car.year || "-"}
                    />
                    <MarketplaceMeta
                      icon={<Gauge className="h-4 w-4" />}
                      label="Mileage"
                      value={`${Number(car.mileage || 0).toLocaleString()} km`}
                    />
                    <MarketplaceMeta
                      icon={<Fuel className="h-4 w-4" />}
                      label="Fuel"
                      value={car.fuel_type || "-"}
                    />
                    <MarketplaceMeta
                      icon={
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8.25 18.75h7.5m-7.5-13.5h7.5M9 7.5h6a2.25 2.25 0 012.25 2.25v4.5A2.25 2.25 0 0115 16.5H9a2.25 2.25 0 01-2.25-2.25v-4.5A2.25 2.25 0 019 7.5z" />
                        </svg>
                      }
                      label="Gearbox"
                      value={car.transmission || "-"}
                    />
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-800/80 pt-3">
                    <p className="text-xs text-slate-400">Tap to expand</p>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedCar(car);
                        setSelectedCarImage(getListingImages(car)[0] || "");
                      }}
                      className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-100 transition hover:bg-cyan-500/15"
                    >
                      View details
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

          <section className="relative z-10 max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-[30px] border border-slate-700/60 bg-[linear-gradient(135deg,rgba(15,23,42,0.98),rgba(15,23,42,0.94),rgba(30,41,59,0.96))] shadow-2xl shadow-slate-950/50">
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
                    <p className="text-sm text-slate-300">Approved marketplace listing</p>
                  </div>
                )}

                <div className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
                  <ShieldCheck className="h-4 w-4" />
                  Approved by admin
                </div>
              </div>

              <div className="p-6 md:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Marketplace listing</p>
                    <h2 className="mt-2 text-3xl font-semibold text-white">
                      {selectedCar.brand} {selectedCar.model}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      Explore the full vehicle details with a larger image preview before contacting the seller.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedCar(null)}
                    className="rounded-full border border-slate-700/70 bg-slate-900/80 px-3 py-2 text-sm text-slate-300 transition hover:border-slate-500/80 hover:text-white"
                  >
                    Close
                  </button>
                </div>

                <div className="mt-6 rounded-[24px] border border-cyan-500/15 bg-cyan-500/10 p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/80">Price</p>
                  <p className="mt-2 text-3xl font-bold text-cyan-100">
                    {formatCurrency(selectedCar.price)}
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
                    label="Seller"
                    value={selectedCar.seller_name || "-"}
                  />
                  <MarketplaceMeta
                    icon={
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.25 6.75c0 7.318 5.932 13.25 13.25 13.25h.75a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.965-.852-1.089l-4.423-1.106a1.125 1.125 0 00-1.173.417l-.97 1.293a1.125 1.125 0 01-1.21.38 10.502 10.502 0 01-6.273-6.273 1.125 1.125 0 01.38-1.21l1.293-.97c.328-.246.5-.652.417-1.173L4.96 3.602A1.125 1.125 0 003.872 2.75H2.5A2.25 2.25 0 00.25 5v1.75z" />
                      </svg>
                    }
                    label="Phone"
                    value={selectedCar.phone_number || "-"}
                  />
                  <MarketplaceMeta
                    icon={
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 21a8.967 8.967 0 005.002-1.516A8.967 8.967 0 0021 12c0-4.971-4.029-9-9-9s-9 4.029-9 9a8.967 8.967 0 003.998 7.484A8.967 8.967 0 0012 21zm0-13.5a2.25 2.25 0 110 4.5 2.25 2.25 0 010-4.5z" />
                      </svg>
                    }
                    label="Location"
                    value={selectedCar.vehicle_location || "-"}
                  />
                  <MarketplaceMeta
                    icon={<CalendarRange className="h-4 w-4" />}
                    label="Year"
                    value={selectedCar.year || "-"}
                  />
                  <MarketplaceMeta
                    icon={<Gauge className="h-4 w-4" />}
                    label="Mileage"
                    value={`${Number(selectedCar.mileage || 0).toLocaleString()} km`}
                  />
                  <MarketplaceMeta
                    icon={<Fuel className="h-4 w-4" />}
                    label="Fuel"
                    value={selectedCar.fuel_type || "-"}
                  />
                  <MarketplaceMeta
                    icon={
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8.25 18.75h7.5m-7.5-13.5h7.5M9 7.5h6a2.25 2.25 0 012.25 2.25v4.5A2.25 2.25 0 0115 16.5H9a2.25 2.25 0 01-2.25-2.25v-4.5A2.25 2.25 0 019 7.5z" />
                      </svg>
                    }
                    label="Gearbox"
                    value={selectedCar.transmission || "-"}
                  />
                  <MarketplaceMeta
                    icon={<ShieldCheck className="h-4 w-4" />}
                    label="Condition"
                    value={selectedCar.condition || "-"}
                  />
                  <MarketplaceMeta
                    icon={<Sparkles className="h-4 w-4" />}
                    label="Status"
                    value="Approved and visible"
                  />
                </div>

                <div className="mt-6 rounded-[24px] border border-slate-800/80 bg-slate-900/70 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Description
                  </p>
                  <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-300">
                    {selectedCar.vehicle_description || "No description provided for this vehicle."}
                  </p>
                </div>

                <div className="mt-6 rounded-[24px] border border-slate-800/80 bg-slate-900/70 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Listing summary
                  </p>
                  <p className="mt-3 text-sm leading-7 text-slate-300">
                    {selectedCar.brand} {selectedCar.model} is a {selectedCar.condition || "vehicle"} from{" "}
                    {selectedCar.year || "an unspecified year"} with{" "}
                    {Number(selectedCar.mileage || 0).toLocaleString()} km on the odometer, powered by{" "}
                    {selectedCar.fuel_type || "an unspecified fuel type"} and paired with a{" "}
                    {selectedCar.transmission || "standard"} transmission.
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
            aria-label="Close full image view"
          />

          <div className="relative z-10 flex h-full w-full max-w-7xl items-center justify-center">
            {selectedCarImages.length > 1 && (
              <button
                type="button"
                onClick={showPreviousLightboxImage}
                className="absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded-full border border-slate-700/70 bg-slate-900/90 p-3 text-slate-200 transition hover:border-slate-500/80 hover:text-white md:left-6"
                aria-label="Previous image"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>
            )}

            <img
              src={lightboxImage}
              alt="Full vehicle view"
              className="max-h-full max-w-full object-contain"
            />

            {selectedCarImages.length > 1 && (
              <button
                type="button"
                onClick={showNextLightboxImage}
                className="absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-full border border-slate-700/70 bg-slate-900/90 p-3 text-slate-200 transition hover:border-slate-500/80 hover:text-white md:right-6"
                aria-label="Next image"
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
                <span className="text-slate-500">Use ← → keys</span>
              </div>
            )}

            <button
              type="button"
              onClick={() => setLightboxImage("")}
              className="absolute right-0 top-0 rounded-full border border-slate-700/70 bg-slate-900/90 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500/80 hover:text-white"
            >
              Close
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
          <section className="relative z-10 max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[28px] border border-slate-700/60 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-6 shadow-2xl shadow-slate-950/50 md:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-white">Publish Ad</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                  Fill in your car details below. Your ad will be submitted to the backend,
                  stored in Supabase, and marked as pending until reviewed.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPublishModalOpen(false)}
                disabled={submitState.saving}
                className="rounded-full border border-slate-700/70 bg-slate-900/80 px-3 py-2 text-sm text-slate-300 transition hover:border-slate-500/80 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                Close
              </button>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <InputField
                  label="Brand"
                  value={form.brand}
                  onChange={(value) => handleInputChange("brand", value)}
                  placeholder="Toyota"
                />
                <InputField
                  label="Model"
                  value={form.model}
                  onChange={(value) => handleInputChange("model", value)}
                  placeholder="Corolla"
                />
                <InputField
                  label="Your Name"
                  value={form.seller_name}
                  onChange={(value) => handleInputChange("seller_name", value)}
                  placeholder="Kasun Perera"
                />
                <InputField
                  label="Phone Number"
                  value={form.phone_number}
                  onChange={(value) => handleInputChange("phone_number", value)}
                  placeholder="0771234567"
                />
                <InputField
                  label="Year"
                  type="number"
                  value={form.year}
                  onChange={(value) => handleInputChange("year", value)}
                  placeholder="2020"
                />
                <InputField
                  label="Mileage (km)"
                  type="number"
                  value={form.mileage}
                  onChange={(value) => handleInputChange("mileage", value)}
                  placeholder="45000"
                />
                <SelectField
                  label="Fuel Type"
                  value={form.fuel_type}
                  options={["Petrol", "Diesel", "Hybrid", "Electric"]}
                  onChange={(value) => handleInputChange("fuel_type", value)}
                />
                <SelectField
                  label="Transmission"
                  value={form.transmission}
                  options={["Automatic", "Manual", "CVT"]}
                  onChange={(value) => handleInputChange("transmission", value)}
                />
                <SelectField
                  label="Condition"
                  value={form.condition}
                  options={["Used", "Reconditioned", "Brand New"]}
                  onChange={(value) => handleInputChange("condition", value)}
                />
                <InputField
                  label="Price (LKR)"
                  type="number"
                  value={form.price}
                  onChange={(value) => handleInputChange("price", value)}
                  placeholder="7200000"
                />
              </div>

              <div className="grid gap-4">
                <InputField
                  label="Vehicle Location"
                  value={form.vehicle_location}
                  onChange={(value) => handleInputChange("vehicle_location", value)}
                  placeholder="Maharagama, Colombo"
                />
                <TextareaField
                  label="Vehicle Description"
                  value={form.vehicle_description}
                  onChange={(value) => handleInputChange("vehicle_description", value)}
                  placeholder="Share the vehicle condition, service history, special features, and anything buyers should know."
                />
              </div>

              <div>
                <span className="mb-2 block text-sm font-medium text-slate-300">Vehicle Images</span>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                  {Array.from({ length: 5 }, (_, index) => (
                    <ImageUploadSlot
                      key={index}
                      slotIndex={index}
                      file={selectedImages[index] || null}
                      onChange={handleImageChange}
                      onRemove={handleRemoveImage}
                    />
                  ))}
                </div>
                <p className="mt-3 text-xs text-slate-500">
                  Optional. Add up to 5 JPG, PNG, or WEBP images. You can publish with none, one, or several photos.
                </p>
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
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitState.saving}
                  className="rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 text-sm font-semibold text-cyan-100 transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-300/40 hover:bg-cyan-400/15 hover:shadow-[0_0_30px_rgba(34,211,238,0.18)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitState.saving ? "Submitting listing..." : "Submit Listing"}
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
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-300">{label}</span>
      <div className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full appearance-none rounded-2xl border border-slate-700/70 bg-slate-900/90 px-4 py-3 pr-11 text-sm text-white outline-none transition duration-200 hover:border-slate-500/80 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-500/20"
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
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
    <label className="block">
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
    <label className="block">
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

function ImageUploadSlot({ slotIndex, file, onChange, onRemove }) {
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    if (!file) {
      setPreviewUrl("");
      return undefined;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return (
    <div className="group relative overflow-hidden rounded-[24px] border border-dashed border-slate-600 bg-slate-900/70">
      <label className="block cursor-pointer">
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(event) => onChange(slotIndex, event)}
          className="hidden"
        />

        <div className="relative flex h-44 items-center justify-center overflow-hidden">
          {previewUrl ? (
            <>
              <img
                src={previewUrl}
                alt={`Vehicle upload ${slotIndex + 1}`}
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
                <p className="text-sm font-semibold text-slate-200">Image {slotIndex + 1}</p>
                <p className="mt-1 text-xs text-slate-500">Click to add photo</p>
              </div>
            </div>
          )}
        </div>
      </label>

      <div className="flex items-center justify-between border-t border-slate-800/80 px-4 py-3">
        <span className="text-xs uppercase tracking-[0.18em] text-slate-500">
          Slot {slotIndex + 1}
        </span>
        {file ? (
          <button
            type="button"
            onClick={() => onRemove(slotIndex)}
            className="rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/15"
          >
            Remove
          </button>
        ) : (
          <span className="text-xs text-slate-600">Optional</span>
        )}
      </div>
    </div>
  );
}

function MarketplaceMeta({ icon, label, value }) {
  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/70 p-3">
      <div className="flex items-center gap-2 text-slate-500">
        {icon}
        <span className="text-xs font-medium uppercase tracking-[0.18em]">{label}</span>
      </div>
      <p className="mt-2 text-sm font-medium text-white">{value}</p>
    </div>
  );
}

export default Marketplace;
