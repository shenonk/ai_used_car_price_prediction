import { Link } from "react-router-dom";
import { useEffect, useRef, useState, useCallback } from "react";
import {
  ArrowRight, BarChart3, Bot, BrainCircuit, Car, CheckCircle2,
  Gauge, HandCoins, LineChart, ShieldCheck, ShoppingBag,
  SlidersHorizontal, Sparkles, Star, Users, TrendingUp, Zap,
} from "lucide-react";
import logo from "../assets/logo/autovaluelk-logo.png";
import heroCar from "../assets/home/hero-car.png";
import carsShowcase from "../assets/home/cars-showcase.png";

const navLinks = [
  { label: "Home", path: "/" },
  { label: "Price Check", path: "/price-check" },
  { label: "Marketplace", path: "/marketplace" },
  { label: "Analytics", path: "/analytics" },
  { label: "Financing", path: "/financing" },
];

const features = [
  { title: "AI Price Prediction", description: "Get accurate vehicle valuations powered by machine learning trained on Sri Lankan market data.", icon: BrainCircuit, tone: "text-blue-300 bg-blue-500/10 border-blue-400/20" },
  { title: "Smart Vehicle Input", description: "Guided brand & model selection ensures cleaner data and more precise predictions.", icon: SlidersHorizontal, tone: "text-cyan-300 bg-cyan-500/10 border-cyan-400/20" },
  { title: "Market Analytics", description: "Track price trends and compare your vehicle against real-time market movements.", icon: BarChart3, tone: "text-emerald-300 bg-emerald-500/10 border-emerald-400/20" },
  { title: "Vehicle Marketplace", description: "Buy and sell vehicles with admin moderation, listing boosts, and status tracking.", icon: ShoppingBag, tone: "text-amber-300 bg-amber-500/10 border-amber-400/20" },
  { title: "Loan Calculator", description: "Plan financing with loan estimates, tenure comparison, and downloadable reports.", icon: HandCoins, tone: "text-teal-300 bg-teal-500/10 border-teal-400/20" },
  { title: "AI Chatbot Support", description: "Get instant guidance on predictions, listings, financing, and account management.", icon: Bot, tone: "text-violet-300 bg-violet-500/10 border-violet-400/20" },
];

const steps = [
  { title: "Enter Vehicle Details", description: "Add brand, model, year, mileage, fuel type, and condition.", icon: Car },
  { title: "AI Predicts Value", description: "Our ML model analyzes your inputs against market data instantly.", icon: BrainCircuit },
  { title: "View Analytics", description: "Explore the estimate with trend charts and market comparisons.", icon: TrendingUp },
  { title: "Take Action", description: "Sell, compare marketplace options, or plan your financing.", icon: Zap },
];

const stats = [
  { value: 15000, suffix: "+", label: "Predictions Made" },
  { value: 98, suffix: "%", label: "Accuracy Rate" },
  { value: 5000, suffix: "+", label: "Active Users" },
  { value: 2500, suffix: "+", label: "Cars Listed" },
];

const testimonials = [
  { name: "Kasun Perera", role: "Car Dealer, Colombo", text: "AutoValueLK transformed how I price my inventory. The AI predictions are remarkably close to actual market values.", rating: 5 },
  { name: "Nadeesha Silva", role: "First-time Buyer", text: "I saved over LKR 500K on my first car purchase by knowing the true market value before negotiating.", rating: 5 },
  { name: "Ruwan Fernando", role: "Fleet Manager", text: "The analytics dashboard gives us insights we never had before. Essential tool for fleet valuation.", rating: 5 },
];

const brands = ["Toyota", "Honda", "Nissan", "Suzuki", "Mitsubishi", "Hyundai", "KIA", "BMW", "Mercedes", "Audi"];

/* ---- Animated counter hook ---- */
function useCounter(target, duration = 2000) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setStarted(true); obs.disconnect(); } }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    let start = 0;
    const step = target / (duration / 16);
    const id = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(id); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(id);
  }, [started, target, duration]);

  return [ref, count];
}

function StatCard({ value, suffix, label }) {
  const [ref, count] = useCounter(value);
  return (
    <div ref={ref} className="text-center p-6">
      <p className="text-4xl sm:text-5xl font-bold home-gradient-text home-counter">
        {count.toLocaleString()}{suffix}
      </p>
      <p className="mt-2 text-sm text-slate-400 font-medium">{label}</p>
    </div>
  );
}

/* ---- Scroll reveal hook ---- */
function useScrollReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("visible"); }),
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    el.querySelectorAll(".home-sr").forEach((c) => obs.observe(c));
    return () => obs.disconnect();
  }, []);
  return ref;
}

/* ---- Particles ---- */
function Particles() {
  const particles = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    size: Math.random() * 4 + 2,
    left: Math.random() * 100,
    delay: Math.random() * 12,
    duration: Math.random() * 10 + 14,
    color: i % 3 === 0 ? "rgba(96,165,250,0.4)" : i % 3 === 1 ? "rgba(6,182,212,0.35)" : "rgba(16,185,129,0.3)",
  }));
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {particles.map((p) => (
        <div key={p.id} className="home-particle" style={{ width: p.size, height: p.size, left: `${p.left}%`, background: p.color, animationDelay: `${p.delay}s`, animationDuration: `${p.duration}s` }} />
      ))}
    </div>
  );
}

function Home() {
  const mainRef = useScrollReveal();
  const [navScrolled, setNavScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setNavScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <main ref={mainRef} className="home-landing min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* ===== NAVBAR ===== */}
      <header className={`home-nav sticky top-0 z-20 border-b border-slate-800/70 bg-slate-950/82 backdrop-blur-xl ${navScrolled ? "scrolled" : ""}`}>
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
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Navigation">
            {navLinks.map((item) => (
              <Link key={item.path} to={item.path} className="rounded-xl px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800/70 hover:text-white">{item.label}</Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login" className="hidden rounded-xl border border-slate-700/80 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-slate-800 sm:inline-flex">Login</Link>
            <Link to="/register" className="inline-flex rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-blue-100">Sign Up</Link>
          </div>
        </div>
      </header>

      {/* ===== HERO ===== */}
      <section className="home-hero relative overflow-hidden border-b border-slate-800/70">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(37,99,235,0.18),rgba(6,182,212,0.08)_42%,rgba(15,23,42,0)_70%)]" aria-hidden="true" />
        <div className="home-grid absolute inset-0 opacity-35" aria-hidden="true" />
        <div className="home-scanline absolute inset-x-0 top-0 h-24" aria-hidden="true" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(180deg,rgba(15,23,42,0),var(--bg-primary))]" aria-hidden="true" />
        <Particles />
        {/* Glow orbs */}
        <div className="home-hero-glow-orb absolute top-20 left-1/4 w-72 h-72 rounded-full bg-blue-500/10 blur-[100px] pointer-events-none" aria-hidden="true" />
        <div className="home-hero-glow-orb absolute bottom-10 right-1/4 w-56 h-56 rounded-full bg-cyan-500/8 blur-[80px] pointer-events-none" style={{ animationDelay: "2.5s" }} aria-hidden="true" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-28">
          <div className="home-reveal max-w-3xl">
            <div className="home-badge mb-6 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/10 px-4 py-1.5 text-sm font-semibold text-blue-200">
              <Sparkles className="h-4 w-4 animate-pulse" />
              #1 AI Vehicle Valuation Platform in Sri Lanka
            </div>
            <h1 className="home-title text-4xl font-bold leading-[1.08] sm:text-5xl lg:text-6xl">
              Know Your Car's <span className="home-gradient-text">True Value</span> Before You Trade
            </h1>
            <p className="home-reveal home-delay-100 mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              Powered by machine learning trained on thousands of Sri Lankan vehicle transactions. Get instant, accurate price predictions and make confident decisions.
            </p>
            <div className="home-reveal home-delay-200 mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/price-check" className="home-cta-pulse marketplace-primary-button inline-flex items-center justify-center gap-2 rounded-2xl px-7 py-4 text-sm font-bold transition hover:-translate-y-0.5">
                Get Free Price Estimate <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/marketplace" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/70 px-7 py-4 text-sm font-bold text-slate-100 transition hover:-translate-y-0.5 hover:border-cyan-400/40 hover:bg-slate-800">
                Browse Marketplace <ShoppingBag className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-10 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
              {[["ML-Powered", "Prediction Engine"], ["Real-Time", "Market Analytics"], ["Verified", "Marketplace"]].map(([value, label], i) => (
                <div key={value} className="home-metric rounded-2xl border border-slate-800 bg-slate-950/45 p-4" style={{ animationDelay: `${350 + i * 120}ms` }}>
                  <p className="text-lg font-bold text-white">{value}</p>
                  <p className="mt-1 text-sm text-slate-500">{label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="home-preview relative flex items-center justify-center" aria-label="Hero preview">
            <img src={heroCar} alt="Premium car" className="home-hero-car w-full max-w-lg rounded-3xl" />
          </div>
        </div>
      </section>

      {/* ===== BRAND MARQUEE ===== */}
      <section className="border-b border-slate-800/50 bg-slate-950/60 py-8 overflow-hidden">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-slate-500 mb-6">Trusted for valuations across major brands</p>
        <div className="relative overflow-hidden">
          <div className="home-marquee-track">
            {[...brands, ...brands].map((b, i) => (
              <span key={i} className="text-lg font-bold text-slate-600 whitespace-nowrap hover:text-slate-300 transition-colors cursor-default">{b}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ===== STATS ===== */}
      <section className="home-section-glow border-b border-slate-800/50">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="home-sr grid grid-cols-2 gap-6 lg:grid-cols-4">
            {stats.map((s) => <StatCard key={s.label} {...s} />)}
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8" aria-labelledby="features-title">
        <div className="home-sr max-w-2xl">
          <p className="text-sm font-bold uppercase text-blue-300 tracking-wider">Platform Features</p>
          <h2 id="features-title" className="mt-3 text-3xl font-bold text-white sm:text-4xl">
            Everything you need for <span className="home-gradient-text">smarter vehicle decisions</span>
          </h2>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <article key={f.title} className={`home-sr home-sr-delay-${Math.min(i + 1, 4)} home-feature-card card p-6`}>
                <div className={`home-feature-icon mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border transition-all duration-300 ${f.tone}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-white">{f.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-400">{f.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="home-section-glow border-y border-slate-800/70 bg-slate-950/45">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="home-sr text-center max-w-2xl mx-auto mb-14">
            <p className="text-sm font-bold uppercase text-cyan-300 tracking-wider">How It Works</p>
            <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">Get your vehicle's value in <span className="home-gradient-text">4 simple steps</span></h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <article key={step.title} className={`home-sr home-sr-delay-${i + 1} home-step-card relative rounded-2xl border border-slate-800 bg-slate-900/55 p-6 text-center`}>
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-400/20">
                    <Icon className="h-6 w-6 text-blue-300" />
                  </div>
                  <span className="inline-block mb-3 text-xs font-bold text-slate-500 bg-slate-800/60 px-3 py-1 rounded-full">Step {i + 1}</span>
                  <h3 className="font-bold text-white">{step.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-400">{step.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== SHOWCASE IMAGE ===== */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="home-sr grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase text-emerald-300 tracking-wider">About AutoValueLK</p>
            <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
              Built for the <span className="home-gradient-text">Sri Lankan market</span>
            </h2>
            <p className="mt-5 text-sm leading-7 text-slate-400">
              AutoValueLK is the first AI-powered vehicle valuation platform designed specifically for Sri Lanka. Our ML models are trained on local market data, ensuring predictions that reflect real conditions.
            </p>
            <div className="mt-8 grid gap-3">
              {["Localized Sri Lankan automotive market focus", "ML model trained on real transaction data", "Integrated marketplace with admin moderation", "Comprehensive financing & loan calculators"].map((p) => (
                <div key={p} className="home-proof-card flex items-start gap-3 rounded-2xl border border-slate-800 bg-slate-900/55 p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-300" />
                  <p className="text-sm leading-7 text-slate-300">{p}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="home-sr home-sr-delay-2 rounded-3xl overflow-hidden border border-slate-800 shadow-[0_30px_80px_rgba(2,6,23,0.5)]">
            <img src={carsShowcase} alt="Cars showcase" className="w-full h-auto object-cover" />
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="home-section-glow border-y border-slate-800/70 bg-slate-950/45">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="home-sr text-center max-w-2xl mx-auto mb-14">
            <p className="text-sm font-bold uppercase text-amber-300 tracking-wider">Testimonials</p>
            <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">Loved by <span className="home-gradient-text">thousands</span> of users</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <article key={t.name} className={`home-sr home-sr-delay-${i + 1} home-testimonial rounded-2xl border border-slate-800 bg-slate-900/60 p-6`}>
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }, (_, j) => <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-sm leading-7 text-slate-300 italic">"{t.text}"</p>
                <div className="mt-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-sm font-bold text-white">{t.name[0]}</div>
                  <div>
                    <p className="text-sm font-bold text-white">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.role}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="home-sr home-final-cta overflow-hidden rounded-[2rem] border border-blue-400/20 bg-[linear-gradient(135deg,rgba(30,64,175,0.35),rgba(8,145,178,0.18),rgba(15,23,42,0.92))] p-8 sm:p-12">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase text-blue-100 tracking-wider">Ready to get started?</p>
              <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
                Discover your vehicle's <span className="home-gradient-text">true market value</span> today.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-blue-100/80">
                Join thousands of Sri Lankan users making smarter vehicle decisions with AI-powered insights.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link to="/price-check" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-7 py-4 text-sm font-bold text-slate-950 transition hover:bg-blue-100 hover:-translate-y-0.5">
                Check Vehicle Price <Gauge className="h-4 w-4" />
              </Link>
              <Link to="/register" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-7 py-4 text-sm font-bold text-white transition hover:bg-white/15 hover:-translate-y-0.5">
                Create Free Account <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-slate-800/70 bg-slate-950/70">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_auto] lg:px-8">
          <div className="max-w-md">
            <div className="flex items-center gap-3">
              <img src={logo} alt="" className="h-9 w-9 object-contain" />
              <p className="text-lg font-bold text-white">AutoValueLK</p>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-500">
              AI-powered vehicle price prediction, marketplace, analytics, and financing support for the Sri Lankan automotive market.
            </p>
            <p className="mt-4 text-xs text-slate-600">© 2025 AutoValueLK. All rights reserved.</p>
          </div>
          <div className="grid grid-cols-2 gap-x-10 gap-y-3 text-sm sm:grid-cols-3">
            {navLinks.slice(1).map((item) => (
              <Link key={item.path} to={item.path} className="text-slate-400 transition hover:text-white">{item.label}</Link>
            ))}
            <Link to="/login" className="text-slate-400 transition hover:text-white">Login</Link>
            <Link to="/register" className="text-slate-400 transition hover:text-white">Sign Up</Link>
            <Link to="/help" className="text-slate-400 transition hover:text-white">Help Center</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

export default Home;
