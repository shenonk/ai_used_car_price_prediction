import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ShieldCheck, Sparkles } from "lucide-react";

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
  const [selectedImage, setSelectedImage] = useState(null);
  const [submitState, setSubmitState] = useState({ saving: false, error: "", success: "" });
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);

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

  const handleImageChange = (event) => {
    const file = event.target.files?.[0] || null;
    setSelectedImage(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitState({ saving: true, error: "", success: "" });

    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => formData.append(key, value));
      if (selectedImage) {
        formData.append("image", selectedImage);
      }

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
      setSelectedImage(null);
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

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-300">Image</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleImageChange}
                  className="w-full rounded-2xl border border-dashed border-slate-600 bg-slate-900/70 px-4 py-3 text-sm text-slate-300 file:mr-4 file:rounded-xl file:border-0 file:bg-cyan-500/20 file:px-3 file:py-2 file:text-sm file:font-medium file:text-cyan-100"
                />
                <p className="mt-2 text-xs text-slate-500">
                  Optional. JPG, PNG, and WEBP are supported.
                </p>
              </label>

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

export default Marketplace;
