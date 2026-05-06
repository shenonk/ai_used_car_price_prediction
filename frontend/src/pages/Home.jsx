import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  Bot,
  BrainCircuit,
  Car,
  CheckCircle2,
  Gauge,
  HandCoins,
  LineChart,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import logo from "../assets/logo/autovaluelk-logo.png";

const navLinks = [
  { label: "Home", path: "/" },
  { label: "Price Check", path: "/price-check" },
  { label: "Marketplace", path: "/marketplace" },
  { label: "Analytics", path: "/analytics" },
  { label: "Financing", path: "/financing" },
];

const features = [
  {
    title: "AI Price Prediction",
    description: "Estimate vehicle market value using a trained machine learning workflow built for practical decision support.",
    icon: BrainCircuit,
    tone: "text-blue-300 bg-blue-500/10 border-blue-400/20",
  },
  {
    title: "Brand & Model Assisted Input",
    description: "Guide users through cleaner vehicle details with brand and model assistance for more consistent predictions.",
    icon: SlidersHorizontal,
    tone: "text-cyan-300 bg-cyan-500/10 border-cyan-400/20",
  },
  {
    title: "Market Analytics",
    description: "Review estimated value trends and compare the selected vehicle against market-informed movement.",
    icon: BarChart3,
    tone: "text-emerald-300 bg-emerald-500/10 border-emerald-400/20",
  },
  {
    title: "Vehicle Marketplace",
    description: "Publish and explore vehicle listings with admin moderation, listing status, and promotional boost support.",
    icon: ShoppingBag,
    tone: "text-amber-300 bg-amber-500/10 border-amber-400/20",
  },
  {
    title: "Loan Cost Estimation",
    description: "Plan financing with loan and leasing cost estimates, tenure comparison, and downloadable reports.",
    icon: HandCoins,
    tone: "text-teal-300 bg-teal-500/10 border-teal-400/20",
  },
  {
    title: "Smart Chatbot Support",
    description: "Get quick guidance for predictions, marketplace actions, financing, account help, and admin contact.",
    icon: Bot,
    tone: "text-violet-300 bg-violet-500/10 border-violet-400/20",
  },
];

const steps = [
  {
    title: "Enter vehicle details",
    description: "Add brand, model, year, mileage, fuel type, gearbox, condition, town, and market timing.",
  },
  {
    title: "AI predicts market value",
    description: "The prediction workflow normalizes inputs and estimates a practical current vehicle value.",
  },
  {
    title: "View results and analytics",
    description: "Understand the estimate, inspect warnings, and compare value movement in Analytics.",
  },
  {
    title: "Sell, compare, or plan financing",
    description: "Use the result to publish a listing, compare marketplace options, or estimate loan costs.",
  },
];

const proofPoints = [
  "Localized Sri Lankan automotive market focus",
  "Machine learning based vehicle valuation workflow",
  "Data preprocessing and label normalization for cleaner inputs",
  "Decision support across prediction, marketplace, analytics, and financing",
];

const aboutCards = [
  {
    title: "Purpose-built valuation",
    description: "AutoValueLK helps users estimate vehicle prices and make better selling, buying, and financing decisions.",
    icon: Gauge,
  },
  {
    title: "AI and analytics support",
    description: "The platform combines prediction workflows, trend views, and result interpretation for clearer market understanding.",
    icon: LineChart,
  },
  {
    title: "Sri Lankan market focus",
    description: "Features are shaped around local vehicle brands, marketplace behavior, and practical user workflows in Sri Lanka.",
    icon: ShieldCheck,
  },
];

function Home() {
  return (
    <main className="home-landing min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <header className="home-nav sticky top-0 z-20 border-b border-slate-800/70 bg-slate-950/82 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3" aria-label="AutoValueLK home">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-700/70 bg-slate-900/80">
              <img src={logo} alt="" className="h-8 w-8 object-contain" />
            </span>
            <span>
              <span className="block text-base font-bold text-white">AutoValueLK</span>
              <span className="block text-xs font-medium text-slate-500">Sri Lankan vehicle intelligence</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Home page navigation">
            {navLinks.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="rounded-xl px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800/70 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="hidden rounded-xl border border-slate-700/80 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-slate-800 sm:inline-flex"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="inline-flex rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-blue-100"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      <section className="home-hero relative overflow-hidden border-b border-slate-800/70">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(37,99,235,0.18),rgba(6,182,212,0.08)_42%,rgba(15,23,42,0)_70%)]" aria-hidden="true" />
        <div className="home-grid absolute inset-0 opacity-35" aria-hidden="true" />
        <div className="home-scanline absolute inset-x-0 top-0 h-24" aria-hidden="true" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(180deg,rgba(15,23,42,0),var(--bg-primary))]" aria-hidden="true" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:px-8 lg:py-24">
          <div className="home-reveal max-w-3xl">
            <div className="home-badge mb-6 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1.5 text-sm font-semibold text-blue-200">
              <Sparkles className="h-4 w-4 animate-pulse-glow" />
              AI vehicle valuation for Sri Lanka
            </div>
            <h1 className="home-title text-4xl font-bold leading-[1.08] text-white sm:text-5xl lg:text-6xl">
              AI-Powered Vehicle Price Intelligence for Sri Lanka
            </h1>
            <p className="home-reveal home-delay-100 mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              Estimate vehicle prices, compare market insights, explore financing, and manage marketplace listings from one polished decision support platform.
            </p>

            <div className="home-reveal home-delay-200 mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/price-check"
                className="home-cta-pulse marketplace-primary-button inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-bold transition hover:-translate-y-0.5"
              >
                Check Vehicle Price
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/marketplace"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/70 px-6 py-3.5 text-sm font-bold text-slate-100 transition hover:-translate-y-0.5 hover:border-cyan-400/40 hover:bg-slate-800"
              >
                Explore Marketplace
                <ShoppingBag className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-10 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                ["ML-based", "prediction engine"],
                ["Analytics", "trend support"],
                ["Marketplace", "listing workflow"],
              ].map(([value, label], index) => (
                <div
                  key={value}
                  className="home-metric rounded-2xl border border-slate-800 bg-slate-950/45 p-4"
                  style={{ animationDelay: `${350 + index * 120}ms` }}
                >
                  <p className="text-lg font-bold text-white">{value}</p>
                  <p className="mt-1 text-sm text-slate-500">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="home-preview relative" aria-label="AutoValueLK product preview">
            <div className="home-preview-shell rounded-[2rem] border border-slate-700/80 bg-slate-950/80 p-4 shadow-[0_30px_90px_rgba(2,6,23,0.55)]">
              <div className="rounded-[1.5rem] border border-slate-800 bg-slate-900/80 p-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-200">
                      <Car className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">Toyota Aqua 2018</p>
                      <p className="text-sm text-slate-500">Hybrid, automatic, Colombo</p>
                    </div>
                  </div>
                  <span className="home-status-pill rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                    Ready
                  </span>
                </div>

                <div className="grid gap-4 py-5 sm:grid-cols-2">
                  <div className="home-value-card rounded-2xl border border-slate-800 bg-slate-950/55 p-4">
                    <p className="text-xs font-semibold uppercase text-slate-500">Predicted value</p>
                    <p className="mt-2 text-3xl font-bold text-white">LKR 8.4M</p>
                    <p className="mt-2 text-sm text-emerald-300">Market aligned estimate</p>
                  </div>
                  <div className="home-value-card home-delay-100 rounded-2xl border border-slate-800 bg-slate-950/55 p-4">
                    <p className="text-xs font-semibold uppercase text-slate-500">Financing preview</p>
                    <p className="mt-2 text-3xl font-bold text-white">12.5%</p>
                    <p className="mt-2 text-sm text-cyan-300">Loan rate scenario</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/55 p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm font-semibold text-white">Estimated value trend</p>
                    <LineChart className="h-5 w-5 text-blue-300" />
                  </div>
                  <svg viewBox="0 0 420 150" className="home-chart h-40 w-full" role="img" aria-label="Vehicle value trend preview">
                    <line x1="22" y1="122" x2="398" y2="122" stroke="#334155" strokeWidth="2" />
                    <line x1="22" y1="32" x2="398" y2="32" stroke="#1e293b" strokeWidth="2" strokeDasharray="7 9" />
                    <path className="home-chart-line" d="M24 108 C84 96 92 74 146 78 C206 84 212 42 272 52 C328 62 350 38 396 32" fill="none" stroke="#60a5fa" strokeWidth="5" strokeLinecap="round" />
                    <path d="M24 108 C84 96 92 74 146 78 C206 84 212 42 272 52 C328 62 350 38 396 32 L396 122 L24 122 Z" fill="rgba(96,165,250,0.16)" />
                    {[24, 146, 272, 396].map((x, index) => (
                      <circle className="home-chart-dot" key={x} cx={x} cy={[108, 78, 52, 32][index]} r="6" fill="#0f172a" stroke="#93c5fd" strokeWidth="3" style={{ animationDelay: `${900 + index * 140}ms` }} />
                    ))}
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8" aria-labelledby="features-title">
        <div className="max-w-2xl">
          <p className="text-sm font-bold uppercase text-blue-300">Platform highlights</p>
          <h2 id="features-title" className="mt-3 text-3xl font-bold text-white sm:text-4xl">
            Built for price checks, market decisions, and final year project demonstration.
          </h2>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <article key={feature.title} className="home-feature-card card p-6">
                <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border ${feature.tone}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-white">{feature.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-400">{feature.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8" aria-labelledby="about-title">
        <div className="grid gap-8 rounded-[2rem] border border-slate-800 bg-slate-950/45 p-6 shadow-[0_20px_60px_rgba(2,6,23,0.22)] sm:p-8 lg:grid-cols-[0.9fr_1.1fr] lg:p-10">
          <div className="home-reveal">
            <p className="text-sm font-bold uppercase text-cyan-300">About AutoValueLK</p>
            <h2 id="about-title" className="mt-3 text-3xl font-bold text-white sm:text-4xl">
              A smarter decision layer for Sri Lankan vehicle pricing.
            </h2>
            <p className="mt-5 text-sm leading-7 text-slate-400">
              AutoValueLK is an AI-powered vehicle valuation and marketplace platform designed to support Sri Lankan users with price prediction, market analytics, listing workflows, and financing insight in one connected experience.
            </p>
          </div>

          <div className="grid gap-4">
            {aboutCards.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="home-feature-card flex gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-400/10 text-blue-200">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{item.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-400">{item.description}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-800/70 bg-slate-950/45">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <p className="text-sm font-bold uppercase text-cyan-300">How it works</p>
              <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
                A simple workflow from vehicle details to confident next steps.
              </h2>
              <p className="mt-5 text-sm leading-7 text-slate-400">
                AutoValueLK keeps the user experience focused while supporting prediction, interpretation, analytics, listing, and financing workflows.
              </p>
            </div>

            <div className="grid gap-4">
              {steps.map((step, index) => (
                <article key={step.title} className="home-step-card flex gap-4 rounded-2xl border border-slate-800 bg-slate-900/55 p-5">
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-white text-sm font-bold text-slate-950">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{step.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-400">{step.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_1fr] lg:px-8">
        <div>
          <p className="text-sm font-bold uppercase text-emerald-300">Why AutoValueLK</p>
          <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
            Localized vehicle intelligence, not a generic pricing template.
          </h2>
          <p className="mt-5 text-sm leading-7 text-slate-400">
            The platform is designed around Sri Lankan automotive workflows: cleaned vehicle labels, guided user inputs, marketplace context, and financing support.
          </p>
        </div>

        <div className="grid gap-4">
          {proofPoints.map((point) => (
            <div key={point} className="home-proof-card flex items-start gap-3 rounded-2xl border border-slate-800 bg-slate-900/55 p-5">
              <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-300" />
              <p className="text-sm leading-7 text-slate-300">{point}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="home-final-cta overflow-hidden rounded-[2rem] border border-blue-400/20 bg-[linear-gradient(135deg,rgba(30,64,175,0.35),rgba(8,145,178,0.18),rgba(15,23,42,0.92))] p-8 shadow-[0_24px_70px_rgba(2,6,23,0.35)] sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase text-blue-100">Start with a prediction</p>
              <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
                Turn vehicle details into an actionable market estimate.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-blue-100/80">
                Run a price check, review the result, then use AutoValueLK to compare trends, publish listings, or plan financing.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link to="/price-check" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-blue-100">
                Check Vehicle Price
                <Gauge className="h-4 w-4" />
              </Link>
              <Link to="/register" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-white/15">
                Create Account
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-800/70 bg-slate-950/70">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_auto] lg:px-8">
          <div className="max-w-md">
            <div className="flex items-center gap-3">
              <img src={logo} alt="" className="h-9 w-9 object-contain" />
              <p className="text-lg font-bold text-white">AutoValueLK</p>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-500">
              AI-powered vehicle price prediction, marketplace, analytics, and financing support for the Sri Lankan automotive market.
            </p>
            <p className="mt-4 text-xs text-slate-600">
              Final year project demo interface. Estimates are decision-support outputs, not guaranteed selling prices.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-10 gap-y-3 text-sm sm:grid-cols-3">
            {navLinks.slice(1).map((item) => (
              <Link key={item.path} to={item.path} className="text-slate-400 transition hover:text-white">
                {item.label}
              </Link>
            ))}
            <Link to="/login" className="text-slate-400 transition hover:text-white">Login</Link>
            <Link to="/register" className="text-slate-400 transition hover:text-white">Sign Up</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

export default Home;
