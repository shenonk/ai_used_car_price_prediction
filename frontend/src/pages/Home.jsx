import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import {
  Activity,
  ArrowRight,
  BarChart2,
  Calculator,
  Car,
  CheckCircle,
  Clock,
  Cpu,
  List,
  MapPin,
  MessageCircle,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Star,
  TrendingUp,
  Zap,
} from "lucide-react";
import logo from "../assets/logo/autovaluelk-logo.png";

const navLinks = [
  { label: "Home", path: "/" },
  { label: "Price Check", path: "/price-check" },
  { label: "Marketplace", path: "/marketplace" },
  { label: "Analytics", path: "/analytics" },
  { label: "Financing", path: "/financing" },
];

const brands = ["KIA", "BMW", "Mercedes", "Audi", "Toyota", "Honda", "Nissan", "Suzuki", "Mitsubishi", "Hyundai"];

const stats = [
  { target: 15000, suffix: "+", label: "Predictions Made" },
  { target: 98, suffix: "%", label: "Accuracy Rate" },
  { target: 5000, suffix: "+", label: "Active Users" },
  { target: 2500, suffix: "+", label: "Cars Listed" },
];

const features = [
  { icon: Cpu, bg: "#0c2a4a", color: "#58a6ff", title: "AI Price Prediction", body: "Get accurate vehicle valuations powered by machine learning trained on Sri Lankan market data." },
  { icon: SlidersHorizontal, bg: "#0c2a4a", color: "#58a6ff", title: "Smart Vehicle Input", body: "Guided brand and model selection keeps inputs clean and predictions more precise." },
  { icon: BarChart2, bg: "#052e16", color: "#3fb950", title: "Market Analytics", body: "Track price trends and compare your vehicle against real market movement." },
  { icon: ShoppingBag, bg: "#2d1b00", color: "#d29922", title: "Vehicle Marketplace", body: "Buy and sell vehicles with admin moderation, listing boosts, and status tracking." },
  { icon: Calculator, bg: "#1a0a28", color: "#a78bfa", title: "Loan Calculator", body: "Plan financing with repayment estimates, tenure comparisons, and reports." },
  { icon: MessageCircle, bg: "#0c1929", color: "#58a6ff", title: "AI Chatbot Support", body: "Get instant guidance on predictions, listings, financing, and account questions." },
];

const steps = [
  { icon: Car, bg: "#0c2a4a", color: "#58a6ff", title: "Enter Vehicle Details", body: "Add brand, model, year, mileage, fuel type, and condition." },
  { icon: Cpu, bg: "#052e16", color: "#3fb950", title: "AI Predicts Value", body: "Our ML model analyzes your inputs against market data instantly." },
  { icon: TrendingUp, bg: "#2d1b00", color: "#d29922", title: "View Analytics", body: "Explore the estimate with trend charts and market comparisons." },
  { icon: Zap, bg: "#1a0a28", color: "#a78bfa", title: "Take Action", body: "Sell, compare marketplace options, or plan your financing." },
];

const districtActivity = [
  ["Colombo", "38%"],
  ["Gampaha", "24%"],
  ["Kandy", "16%"],
  ["Kalutara", "11%"],
  ["Galle", "7%"],
];

const testimonials = [
  { initials: "KP", name: "Kasun Perera", role: "Car Dealer, Colombo", text: "AutoValueLK transformed how I price my inventory. The predictions are remarkably close to actual market values." },
  { initials: "NS", name: "Nadeesha Silva", role: "First-time Buyer", text: "I saved over LKR 500K on my first car purchase by knowing the true market value before negotiating." },
  { initials: "RF", name: "Ruwan Fernando", role: "Fleet Manager", text: "The analytics dashboard gives us insights we never had before. Essential for fleet valuation." },
];

function IconBlock({ icon: Icon, bg, color, className = "" }) {
  return (
    <span className={`home-ds-icon-block ${className}`} style={{ background: bg, color }}>
      <Icon />
    </span>
  );
}

function CounterStat({ target, suffix, label }) {
  const [value, setValue] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;

    let frameId = 0;
    let started = false;
    const duration = 1400;

    const runCounter = () => {
      const startedAt = performance.now();

      const tick = (now) => {
        const progress = Math.min((now - startedAt) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(target * eased));

        if (progress < 1) {
          frameId = requestAnimationFrame(tick);
        }
      };

      frameId = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          started = true;
          runCounter();
          observer.disconnect();
        }
      },
      { threshold: 0.25 }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frameId);
    };
  }, [target]);

  return (
    <article ref={ref} className="observe">
      <strong>{value.toLocaleString("en-LK")}{suffix}</strong>
      <span>{label}</span>
    </article>
  );
}

function useHomeObservers() {
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, index) => {
          if (!entry.isIntersecting) return;
          entry.target.style.animationDelay = `${index * 0.1}s`;
          entry.target.classList.add("animate-in");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.15 }
    );

    root.querySelectorAll(".observe").forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, []);

  return rootRef;
}

function Home() {
  const homeRef = useHomeObservers();

  return (
    <main ref={homeRef} className="home-ds home-page">
      <header className="home-ds-nav">
        <Link to="/" className="home-ds-brand" aria-label="AutoValueLK home">
          <span className="home-ds-logo"><img src={logo} alt="" /></span>
          <span>
            <strong>AutoValueLK</strong>
            <small>Sri Lankan vehicle intelligence</small>
          </span>
        </Link>

        <nav className="home-ds-links" aria-label="Navigation">
          {navLinks.map((item) => (
            <Link key={item.path} to={item.path} className={item.path === "/" ? "is-active" : ""}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="home-ds-actions">
          <Link to="/login" className="home-ds-btn home-ds-btn--ghost">Login</Link>
          <Link to="/register" className="home-ds-btn home-ds-btn--primary">Sign Up</Link>
        </div>
      </header>

      <section className="home-ds-hero">
        <div className="home-ds-hero-copy">
          <div className="home-ds-eyebrow-pill">
            <Cpu />
            #1 AI Vehicle Valuation Platform in Sri Lanka
          </div>
          <h1>
            <span>Know Your Car's</span>
            <span className="home-ds-blue">True Value</span>
            <span>Before You Trade</span>
          </h1>
          <p>
            Powered by machine learning trained on thousands of Sri Lankan vehicle transactions.
            Get instant, accurate price predictions and make confident decisions.
          </p>
          <div className="home-ds-hero-buttons">
            <Link to="/price-check" className="home-ds-large-btn home-ds-large-btn--primary">
              Get Free Price Estimate <ArrowRight />
            </Link>
            <Link to="/marketplace" className="home-ds-large-btn home-ds-large-btn--ghost">
              <ShoppingBag /> Browse Marketplace
            </Link>
          </div>
          <div className="home-ds-trust-pills">
            <span><ShieldCheck style={{ color: "#3fb950" }} />ML-Powered Engine</span>
            <span><Activity style={{ color: "#58a6ff" }} />Real-Time Analytics</span>
            <span><CheckCircle style={{ color: "#a78bfa" }} />Verified Marketplace</span>
          </div>
        </div>

        <aside className="home-ds-live-panel">
          <div className="home-ds-panel-head">
            <span><Activity />Live Market Pulse</span>
            <strong>LIVE</strong>
          </div>
          <div className="home-ds-stat-list">
            <div><span><List />Active listings</span><strong>2,847</strong></div>
            <div><span><TrendingUp />Avg price this week</span><strong style={{ color: "#58a6ff" }}>LKR 8.4M</strong></div>
            <div><span><Zap />Most searched brand</span><strong style={{ color: "#3fb950" }}>Toyota</strong></div>
            <div><span><Clock />Avg days to sell</span><strong style={{ color: "#d29922" }}>14 days</strong></div>
          </div>

          <div className="home-ds-panel-divider" />

          <div className="home-ds-estimate-card">
            <span className="home-ds-mini-label">Sample estimate</span>
            <div className="home-ds-estimate-row">
              <strong>Toyota Aqua 2019</strong>
              <b>LKR 7,200,000</b>
            </div>
            <div className="home-ds-meta-pills">
              <span>Hybrid</span>
              <span>62,000 km</span>
              <span>Colombo</span>
            </div>
            <div className="home-ds-confidence">
              <div><span>Prediction confidence</span><strong>98%</strong></div>
              <i><em /></i>
            </div>
          </div>

          <Link to="/price-check" className="home-ds-panel-cta">Try it free <ArrowRight /></Link>
        </aside>
      </section>

      <section className="home-ds-ticker-section">
        <p>TRUSTED FOR VALUATIONS ACROSS MAJOR BRANDS</p>
        <div className="home-ds-ticker">
          <div className="home-ds-ticker-track">
            {[0, 1].map((group) => (
              <div className="home-ds-ticker-group" key={group} aria-hidden={group === 1}>
                {brands.map((brand) => (
                  <span key={`${brand}-${group}`}>{brand}</span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="home-ds-stats">
        {stats.map((stat) => <CounterStat key={stat.label} {...stat} />)}
      </section>

      <section className="home-ds-section home-ds-features">
        <div className="home-ds-section-head">
          <span>PLATFORM FEATURES</span>
          <h2>Everything you need for <b>smarter vehicle decisions</b></h2>
        </div>
        <div className="home-ds-feature-grid">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <article key={feature.title} className="observe">
                <IconBlock icon={Icon} bg={feature.bg} color={feature.color} />
                <h3>{feature.title}</h3>
                <p>{feature.body}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="home-ds-steps-band">
        <div className="home-ds-steps-inner">
          <div className="home-ds-section-head home-ds-section-head--center">
            <span>HOW IT WORKS</span>
            <h2>Get your vehicle's value in <b>4 simple steps</b></h2>
          </div>
          <div className="home-ds-steps-grid">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <article key={step.title} className="observe">
                  <span className="home-ds-step-badge">Step {index + 1}</span>
                  <IconBlock icon={Icon} bg={step.bg} color={step.color} className="home-ds-step-icon" />
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="home-ds-about">
        <div>
          <span className="home-ds-about-eyebrow">ABOUT AUTOVALUELK</span>
          <h2>Built for the <b>Sri Lankan market</b></h2>
          <p>
            AutoValueLK is an AI-powered vehicle valuation platform designed specifically for Sri Lanka.
            Our models are tuned around local market behavior, district-level demand, and real buyer activity.
          </p>
          <div className="home-ds-proof-list">
            {[
              "Localized Sri Lankan automotive market focus",
              "ML model trained on real transaction data",
              "Integrated marketplace with admin moderation",
              "Comprehensive financing and loan calculators",
            ].map((item) => (
              <div key={item} className="observe"><CheckCircle />{item}</div>
            ))}
          </div>
        </div>

        <aside className="home-ds-market-card observe">
          <h3><MapPin />Sri Lankan Market Data</h3>
          <div className="home-ds-district-list">
            {districtActivity.map(([district, pct]) => (
              <div key={district}>
                <div><span>{district}</span><small>{pct}</small></div>
                <i><em style={{ "--bar-width": pct }} /></i>
              </div>
            ))}
          </div>
          <div className="home-ds-panel-divider" />
          <div className="home-ds-mini-stats">
            <div>
              <span>Districts covered</span>
              <strong>25</strong>
              <small>All of Sri Lanka</small>
            </div>
            <div>
              <span>Data points</span>
              <strong style={{ color: "#3fb950" }}>10K+</strong>
              <small>Real transactions</small>
            </div>
          </div>
        </aside>
      </section>

      <section className="home-ds-testimonials-band">
        <div className="home-ds-testimonials-inner">
          <div className="home-ds-section-head home-ds-section-head--center home-ds-section-head--amber">
            <span>TESTIMONIALS</span>
            <h2>Loved by <b>thousands</b> of users</h2>
          </div>
          <div className="home-ds-testimonial-grid">
            {testimonials.map((item) => (
              <article key={item.name} className="observe">
                <div className="home-ds-stars">
                  {Array.from({ length: 5 }, (_, index) => <Star key={index} />)}
                </div>
                <p>"{item.text}"</p>
                <div className="home-ds-author">
                  <span>{item.initials}</span>
                  <div>
                    <strong>{item.name}</strong>
                    <small>{item.role}</small>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="home-ds-cta-wrap">
        <div className="home-ds-cta observe">
          <div>
            <span>READY TO GET STARTED?</span>
            <h2>Discover your vehicle's <b>true market value</b> today.</h2>
            <p>Join Sri Lankan users making smarter decisions with AI-powered vehicle intelligence.</p>
          </div>
          <div>
            <Link to="/price-check" className="home-ds-large-btn home-ds-large-btn--primary"><Cpu />Check Vehicle Price <ArrowRight /></Link>
            <Link to="/register" className="home-ds-large-btn home-ds-large-btn--ghost">Create Free Account <ArrowRight /></Link>
          </div>
        </div>
      </section>

      <footer className="home-ds-footer">
        <div className="home-ds-footer-top">
          <div className="home-ds-footer-brand">
            <div><span className="home-ds-logo"><img src={logo} alt="" /></span><strong>AutoValueLK</strong></div>
            <p>AI-powered vehicle price prediction, marketplace, analytics, and financing support for Sri Lanka.</p>
          </div>
          <div className="home-ds-footer-links">
            <div>
              <h4>Product</h4>
              <Link to="/price-check">Price Check</Link>
              <Link to="/marketplace">Marketplace</Link>
              <Link to="/analytics">Analytics</Link>
              <Link to="/financing">Financing</Link>
            </div>
            <div>
              <h4>Account</h4>
              <Link to="/login">Login</Link>
              <Link to="/register">Sign Up</Link>
              <Link to="/help">Help Center</Link>
            </div>
            <div>
              <h4>Company</h4>
            </div>
          </div>
        </div>
        <div className="home-ds-footer-bottom">
          <span>© 2026 AutoValueLK. All rights reserved.</span>
          <span>Built for Sri Lanka</span>
        </div>
      </footer>
    </main>
  );
}

export default Home;
