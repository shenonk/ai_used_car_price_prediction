import { useMemo, useState } from "react";
import { CarFront, ChevronDown, Gauge, ShieldCheck, Sparkles } from "lucide-react";

const mockCars = [
  {
    id: 1,
    brand: "Toyota",
    model: "Corolla Cross",
    year: 2021,
    mileage: "28,000 km",
    transmission: "Automatic",
    fuelType: "Hybrid",
    price: 13800000,
    status: "approved",
    accent: "from-cyan-500/20 via-slate-800 to-slate-900",
  },
  {
    id: 2,
    brand: "Honda",
    model: "Vezel",
    year: 2019,
    mileage: "41,500 km",
    transmission: "Automatic",
    fuelType: "Petrol",
    price: 11250000,
    status: "approved",
    accent: "from-blue-500/20 via-slate-800 to-slate-900",
  },
  {
    id: 3,
    brand: "Suzuki",
    model: "Swift RS",
    year: 2020,
    mileage: "34,200 km",
    transmission: "Automatic",
    fuelType: "Petrol",
    price: 7450000,
    status: "approved",
    accent: "from-emerald-500/20 via-slate-800 to-slate-900",
  },
  {
    id: 4,
    brand: "Nissan",
    model: "X-Trail",
    year: 2018,
    mileage: "57,000 km",
    transmission: "CVT",
    fuelType: "Hybrid",
    price: 9850000,
    status: "approved",
    accent: "from-amber-500/20 via-slate-800 to-slate-900",
  },
  {
    id: 5,
    brand: "BMW",
    model: "320d M Sport",
    year: 2017,
    mileage: "62,000 km",
    transmission: "Automatic",
    fuelType: "Diesel",
    price: 15900000,
    status: "approved",
    accent: "from-violet-500/20 via-slate-800 to-slate-900",
  },
  {
    id: 6,
    brand: "Kia",
    model: "Sportage",
    year: 2022,
    mileage: "19,300 km",
    transmission: "Automatic",
    fuelType: "Diesel",
    price: 17200000,
    status: "approved",
    accent: "from-rose-500/20 via-slate-800 to-slate-900",
  },
];

const priceRanges = [
  "All Prices",
  "Under 8M",
  "8M - 12M",
  "12M - 16M",
  "Above 16M",
];

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 0,
  }).format(value);

function Marketplace() {
  const approvedCars = useMemo(
    () => mockCars.filter((car) => car.status === "approved"),
    []
  );

  const [filters, setFilters] = useState({
    brand: "All Brands",
    model: "All Models",
    priceRange: "All Prices",
    fuelType: "All Fuel Types",
  });

  const brandOptions = ["All Brands", ...new Set(approvedCars.map((car) => car.brand))];
  const modelOptions = [
    "All Models",
    ...new Set(
      approvedCars
        .filter((car) => filters.brand === "All Brands" || car.brand === filters.brand)
        .map((car) => car.model)
    ),
  ];
  const fuelOptions = ["All Fuel Types", ...new Set(approvedCars.map((car) => car.fuelType))];

  const filteredCars = approvedCars.filter((car) => {
    const matchesBrand = filters.brand === "All Brands" || car.brand === filters.brand;
    const matchesModel = filters.model === "All Models" || car.model === filters.model;
    const matchesFuel = filters.fuelType === "All Fuel Types" || car.fuelType === filters.fuelType;

    const matchesPrice =
      filters.priceRange === "All Prices" ||
      (filters.priceRange === "Under 8M" && car.price < 8000000) ||
      (filters.priceRange === "8M - 12M" && car.price >= 8000000 && car.price <= 12000000) ||
      (filters.priceRange === "12M - 16M" && car.price > 12000000 && car.price <= 16000000) ||
      (filters.priceRange === "Above 16M" && car.price > 16000000);

    return matchesBrand && matchesModel && matchesFuel && matchesPrice;
  });

  const handleFilterChange = (key, value) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
      ...(key === "brand" ? { model: "All Models" } : {}),
    }));
  };

  return (
    <div className="min-h-screen bg-[#0f172a] px-6 py-8 md:px-8">
      <section className="relative overflow-hidden rounded-[28px] border border-slate-700/60 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800/95 p-8 shadow-2xl shadow-slate-950/30 animate-fade-in">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.12),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(16,185,129,0.1),_transparent_28%)]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-sm font-medium text-emerald-300">
              <ShieldCheck className="h-4 w-4" />
              Verified marketplace inventory
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
              Browse Verified Vehicles
            </h1>
            <p className="mt-3 max-w-xl text-base leading-7 text-slate-300 md:text-lg">
              Find your next car at a fair market price, evaluated by AI.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-700/60 bg-slate-900/70 px-4 py-3 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Live Listings</p>
              <p className="mt-2 text-2xl font-semibold text-white">{approvedCars.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-700/60 bg-slate-900/70 px-4 py-3 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">AI Confidence</p>
              <p className="mt-2 text-2xl font-semibold text-white">High</p>
            </div>
            <div className="rounded-2xl border border-slate-700/60 bg-slate-900/70 px-4 py-3 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Fair Price View</p>
              <p className="mt-2 text-2xl font-semibold text-white">Enabled</p>
            </div>
          </div>
        </div>
      </section>

      <section className="card mt-8 p-4 md:p-5 animate-fade-in animate-delay-100">
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
      </section>

      <section className="mt-8">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Curated marketplace picks</h2>
            <p className="mt-1 text-sm text-slate-400">
              Showing {filteredCars.length} approved vehicles ready for the demo.
            </p>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-slate-700/60 bg-slate-900/70 px-4 py-2 text-sm text-slate-300 md:flex">
            <Sparkles className="h-4 w-4 text-cyan-300" />
            AI-ranked for market fairness
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {filteredCars.map((car, index) => (
            <article
              key={car.id}
              className="card group overflow-hidden p-0 animate-fade-in"
              style={{ animationDelay: `${index * 90}ms` }}
            >
              <div className={`relative h-52 overflow-hidden rounded-t-2xl bg-gradient-to-br ${car.accent}`}>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.14),_transparent_32%)]" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5">
                  <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-3 backdrop-blur-sm">
                    <CarFront className="h-10 w-10 text-white/90" />
                  </div>
                  <div className="rounded-full border border-white/10 bg-slate-950/50 px-3 py-1 text-xs font-medium text-slate-100 backdrop-blur-sm">
                    Demo image placeholder
                  </div>
                </div>
              </div>

              <div className="space-y-5 p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="badge border-emerald-500/20 bg-emerald-500/10 text-emerald-300">
                    AI-Verified
                  </span>
                  <span className="badge border-slate-600/70 bg-slate-800/70 text-slate-300">
                    {car.year} / {car.mileage}
                  </span>
                </div>

                <div>
                  <p className="text-3xl font-bold tracking-tight text-white">
                    {formatCurrency(car.price)}
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-slate-400">
                    <Gauge className="h-4 w-4 text-cyan-300" />
                    <span className="text-sm">Fair-price aligned by AI valuation</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white">
                    {car.brand} {car.model}
                  </h3>
                  <p className="mt-2 text-sm text-slate-400">
                    {car.transmission} transmission
                  </p>
                </div>

                <button className="w-full rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 text-sm font-semibold text-cyan-100 transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-300/40 hover:bg-cyan-400/15 hover:shadow-[0_0_30px_rgba(34,211,238,0.18)]">
                  View Details
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
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

export default Marketplace;
