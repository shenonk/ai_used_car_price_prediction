import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Search,
  BookOpen,
  CreditCard,
  ShieldCheck,
  PlayCircle,
  ChevronDown,
  ChevronUp,
  Mail,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabaseClient";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const HelpCenter = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const faqSectionRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [openFaq, setOpenFaq] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [submitError, setSubmitError] = useState("");

  const categories = [
    {
      id: "financing",
      title: t("help_center_page.categories.financing.title"),
      icon: <BookOpen className="w-8 h-8" />,
      description: t("help_center_page.categories.financing.description"),
      keywords: ["loan", "leasing", "finance", "credit", "interest"],
      route: "/financing",
    },
    {
      id: "payments",
      title: t("help_center_page.categories.payments.title"),
      icon: <CreditCard className="w-8 h-8" />,
      description: t("help_center_page.categories.payments.description"),
      keywords: ["payment", "bank", "schedule", "installment", "details"],
      route: "/settings",
    },
    {
      id: "security",
      title: t("help_center_page.categories.security.title"),
      icon: <ShieldCheck className="w-8 h-8" />,
      description: t("help_center_page.categories.security.description"),
      keywords: ["password", "security", "account", "login", "safe"],
      route: "/settings",
    },
    {
      id: "tutorials",
      title: t("help_center_page.categories.tutorials.title"),
      icon: <PlayCircle className="w-8 h-8" />,
      description: t("help_center_page.categories.tutorials.description"),
      keywords: ["guide", "tutorial", "results", "price", "dashboard"],
      route: "/price-check",
    },
  ];

  const faqs = [
    {
      id: 1,
      category: "financing",
      question: t("help_center_page.faqs.0.question"),
      answer: t("help_center_page.faqs.0.answer"),
    },
    {
      id: 2,
      category: "financing",
      question: t("help_center_page.faqs.1.question"),
      answer: t("help_center_page.faqs.1.answer"),
    },
    {
      id: 3,
      category: "payments",
      question: t("help_center_page.faqs.2.question"),
      answer: t("help_center_page.faqs.2.answer"),
    },
    {
      id: 4,
      category: "security",
      question: t("help_center_page.faqs.3.question"),
      answer: t("help_center_page.faqs.3.answer"),
    },
    {
      id: 5,
      category: "tutorials",
      question: t("help_center_page.faqs.4.question"),
      answer: t("help_center_page.faqs.4.answer"),
    },
  ];

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredCategories = categories.filter((cat) => {
    if (!normalizedQuery) return true;

    const haystack = `${cat.title} ${cat.description} ${cat.keywords.join(" ")}`.toLowerCase();
    return haystack.includes(normalizedQuery);
  });

  const filteredFaqs = faqs.filter((faq) => {
    const matchesCategory = selectedCategory === "all" || faq.category === selectedCategory;
    const haystack = `${faq.question} ${faq.answer}`.toLowerCase();
    const matchesSearch = !normalizedQuery || haystack.includes(normalizedQuery);
    return matchesCategory && matchesSearch;
  });

  const handleCategoryClick = (category) => {
    setSelectedCategory(category.id);
    setOpenFaq(null);
    faqSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleCategoryOpen = (event, route) => {
    event.stopPropagation();
    navigate(route);
  };

  const toggleFaq = (id) => {
    setOpenFaq(openFaq === id ? null : id);
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitSuccess("");
    setSubmitError("");
    setIsSubmitting(true);

    const payload = {
      user_name: formData.full_name.trim(),
      user_email: formData.email.trim(),
      message: formData.message.trim(),
      status: "open",
    };

    try {
      try {
        const response = await fetch(`${API_BASE_URL}/api/support-ticket`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || t("help_center_page.errors.submit_failed"));
        }
      } catch {
        const { error } = await supabase.from("support_tickets").insert({
          user_name: payload.user_name,
          user_email: payload.user_email,
          message: payload.message,
          status: payload.status,
        });

        if (error) {
          throw new Error(error.message || t("help_center_page.errors.submit_failed"));
        }
      }
    } catch (error) {
      setSubmitError(error.message || t("help_center_page.errors.submit_retry"));
      setIsSubmitting(false);
      return;
    }

    setFormData({
      full_name: "",
      email: "",
      message: "",
    });
    setSubmitSuccess(t("help_center_page.success"));
    setIsSubmitting(false);
    window.setTimeout(() => {
      setSubmitSuccess("");
    }, 4000);
  };

  const isFormValid =
    formData.full_name.trim() &&
    formData.email.trim() &&
    formData.message.trim();

  return (
    <div className="theme-app-bg min-h-screen p-8 animate-fade-in">
      <div className="max-w-6xl mx-auto space-y-16">
        <div className="text-center space-y-8 py-10">
          <h1 className="text-5xl font-bold tracking-tight">
            {t("help_center_page.title_prefix")} <span className="gradient-text">{t("help_center_page.title_highlight")}</span>
          </h1>

          <div className="max-w-2xl mx-auto relative group">
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#3B82F6] transition-colors">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              placeholder={t("help_center_page.search_placeholder")}
              className="w-full bg-[#1e293b]/50 border border-slate-700/50 py-4 pl-14 pr-6 rounded-full outline-none transition-all duration-300 focus:border-[#3B82F6] focus:ring-4 focus:ring-[#3B82F6]/20 backdrop-blur-md theme-text-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {selectedCategory !== "all" && (
            <div className="flex items-center justify-center gap-3 text-sm">
              <span className="theme-text-secondary">
                {t("help_center_page.filtering_by")} {categories.find((cat) => cat.id === selectedCategory)?.title}
              </span>
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className="text-[#3B82F6] hover:text-blue-300 transition-colors"
              >
                {t("help_center_page.clear_filter")}
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredCategories.map((cat) => (
            <div
              key={cat.id}
              role="button"
              tabIndex={0}
              onClick={() => handleCategoryClick(cat)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  handleCategoryClick(cat);
                }
              }}
              className={`group p-8 rounded-2xl border backdrop-blur-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] text-left ${
                selectedCategory === cat.id
                  ? "border-[#3B82F6]/60 bg-[#1e293b]/70"
                  : "border-slate-700/50 bg-[#1e293b]/40 hover:border-[#3B82F6]/50"
              } cursor-pointer`}
            >
              <div className="w-16 h-16 rounded-xl bg-blue-500/10 flex items-center justify-center text-[#3B82F6] mb-6 group-hover:scale-110 transition-transform">
                {cat.icon}
              </div>
              <h3 className="theme-text-primary text-xl font-semibold mb-3">{cat.title}</h3>
              <p className="theme-text-secondary text-sm leading-relaxed">{cat.description}</p>
              <div className="mt-5 flex items-center justify-between gap-3">
                <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  {t("help_center_page.filter_faqs")}
                </span>
                <button
                  type="button"
                  onClick={(event) => handleCategoryOpen(event, cat.route)}
                  className="rounded-full border border-[#3B82F6]/30 bg-[#3B82F6]/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#7dd3fc] transition hover:border-[#3B82F6]/50 hover:bg-[#3B82F6]/15"
                >
                  {t("help_center_page.open_page")}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div ref={faqSectionRef} className="space-y-8 glass p-8 md:p-12 rounded-3xl">
          <div className="text-center md:text-left">
            <h2 className="theme-text-primary text-3xl font-bold mb-2">{t("help_center_page.faq_title")}</h2>
            <p className="theme-text-secondary">{t("help_center_page.faq_subtitle")}</p>
          </div>

          <div className="grid gap-4">
            {filteredFaqs.length === 0 ? (
              <div className="theme-surface-soft rounded-2xl p-6 text-center">
                <p className="theme-text-primary text-lg font-medium">{t("help_center_page.no_matches_title")}</p>
                <p className="theme-text-secondary mt-2">{t("help_center_page.no_matches_subtitle")}</p>
              </div>
            ) : (
              filteredFaqs.map((faq) => (
                <div
                  key={faq.id}
                  className={`rounded-2xl overflow-hidden transition-all duration-300 ${
                    openFaq === faq.id ? "theme-surface border border-slate-600/50" : "theme-surface-soft"
                  }`}
                >
                  <button
                    onClick={() => toggleFaq(faq.id)}
                    className="w-full p-6 flex items-center justify-between text-left transition-colors hover:bg-slate-800/30"
                  >
                    <span className="theme-text-primary text-lg font-medium">{faq.question}</span>
                    {openFaq === faq.id ? (
                      <ChevronUp className="w-5 h-5 text-[#3B82F6]" />
                    ) : (
                      <ChevronDown className="theme-text-muted w-5 h-5" />
                    )}
                  </button>

                  <div
                    className={`overflow-hidden transition-all duration-500 ease-in-out ${
                      openFaq === faq.id ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="theme-text-secondary theme-divider mt-2 border-t p-6 pt-0 leading-relaxed">
                      {faq.answer}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div
          id="contact-us-section"
          className="flex flex-col items-center justify-center space-y-8 py-12 border-t border-slate-800/50 scroll-mt-24"
        >
          <div className="text-center">
            <h2 className="theme-text-primary text-2xl font-bold mb-2">{t("help_center_page.contact_title")}</h2>
            <p className="theme-text-secondary">{t("help_center_page.contact_subtitle")}</p>
          </div>

          <form onSubmit={handleSubmit} className="w-full max-w-2xl space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                placeholder={t("help_center_page.full_name")}
                required
                className="w-full bg-[#1e293b]/50 border border-slate-700/50 py-4 px-5 rounded-xl outline-none transition-all duration-300 focus:border-[#3B82F6] focus:ring-4 focus:ring-[#3B82F6]/20 backdrop-blur-md"
              />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder={t("help_center_page.email")}
                required
                className="w-full bg-[#1e293b]/50 border border-slate-700/50 py-4 px-5 rounded-xl outline-none transition-all duration-300 focus:border-[#3B82F6] focus:ring-4 focus:ring-[#3B82F6]/20 backdrop-blur-md"
              />
            </div>

            <textarea
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              placeholder={t("help_center_page.message")}
              required
              rows="6"
              className="w-full bg-[#1e293b]/50 border border-slate-700/50 py-4 px-5 rounded-2xl outline-none transition-all duration-300 focus:border-[#3B82F6] focus:ring-4 focus:ring-[#3B82F6]/20 backdrop-blur-md resize-none"
            />

            <div className="flex flex-col items-center gap-3">
              <button
                type="submit"
                disabled={isSubmitting || !isFormValid}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl px-8 py-4 font-semibold text-white transition-all duration-300 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  background: isSubmitting || !isFormValid
                    ? "linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%)"
                    : "linear-gradient(135deg, #2563eb 0%, #0891b2 100%)",
                  boxShadow: isSubmitting || !isFormValid
                    ? "none"
                    : "0 14px 30px rgba(37, 99, 235, 0.22)",
                }}
              >
                <Mail className="w-5 h-5" />
                {isSubmitting ? t("help_center_page.sending") : t("help_center_page.send")}
              </button>

              {submitSuccess && <p className="text-emerald-400 text-sm text-center">{submitSuccess}</p>}
              {submitError && <p className="text-rose-400 text-sm text-center">{submitError}</p>}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default HelpCenter;
